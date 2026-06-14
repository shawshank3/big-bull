const { Worker } = require('bullmq');
const redis = require('../shared/redis');
const Asset = require('../modules/asset/asset.model');
const { makeBullMQConnection, isRedisConfigured } = require('../shared/redisBullMQ');

// Lazy-require to avoid circular dependency issues at startup
const getBroadcast = () => require('../modules/market/market.controller').broadcastPriceUpdate;
const getSeedCache = () => require('./mseLiveTicker').seedPriceCache;

// Cache redis still used for price reads/writes (maxRetriesPerRequest: 3 is fine there)
const isRedisAvailable = isRedisConfigured;

// ─── Redis keys ───────────────────────────────────────────────────────────────
const SENTIMENT_KEY = 'mse:marketSentiment';
const sectorTrendKey = (sector) => `mse:sectorTrend:${sector}`;

/**
 * Read a float from Redis. Returns `fallback` when the key is missing or
 * Redis is unavailable.
 */
const getFloat = async (key, fallback = 0) => {
  try {
    const val = await redis.get(key);
    return val !== null ? parseFloat(val) : fallback;
  } catch (_) {
    return fallback;
  }
};

/**
 * Box-Muller transform — returns a single standard-normal sample (μ=0, σ=1).
 */
const gaussianNoise = () => {
  const u1 = 1 - Math.random(); // (0, 1]
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
};

/**
 * Compute new price using the MSE formula from the plan:
 *   Price_t = Price_{t-1} × (1 + Sm + Ts + Va × N)
 * Clamped to a ₹1 floor.
 */
const computeNewPrice = (prevPrice, sentiment, sectorTrend, volatility) => {
  const noise = gaussianNoise();
  const delta = sentiment + sectorTrend + volatility * noise;
  const newPrice = prevPrice * (1 + delta);
  return Math.max(1, parseFloat(newPrice.toFixed(2)));
};

/** Format a signed percent string, e.g. "+1.23%" or "-0.45%" */
const formatChangePercent = (change, prevPrice) => {
  const pct = prevPrice > 0 ? (change / prevPrice) * 100 : 0;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
};

// ─── Worker ──────────────────────────────────────────────────────────────────

let mseWorker = null;

if (isRedisAvailable) {
  mseWorker = new Worker(
    'mse-price-tick',
    async (job) => {
      console.log(`[MSE] Price tick job #${job.id} — processing`);

      // 1. Fetch all active assets
      const assets = await Asset.find({}).lean();
      if (!assets.length) {
        console.warn('[MSE] No assets found — skipping tick');
        return;
      }

      // 2. Read global MarketSentiment
      const sentiment = await getFloat(SENTIMENT_KEY, 0);

      // 3. Collect unique sectors for batch Redis reads
      const sectors = [...new Set(assets.map((a) => a.sector).filter(Boolean))];
      const sectorTrends = {};
      for (const sector of sectors) {
        sectorTrends[sector] = await getFloat(sectorTrendKey(sector), 0);
      }

      const broadcast = getBroadcast();
      const timestamp = new Date().toISOString();

      // 4. Process each asset — collect results for seeding the live ticker
      const tickResults = [];

      for (const asset of assets) {
        const priceKey = `price:${asset.ticker}`;

        // Read previous price from Redis, fall back to basePrice
        let prevPrice = asset.basePrice;
        try {
          const cached = await redis.get(priceKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            prevPrice = parsed.price ?? parsed ?? prevPrice;
          }
        } catch (_) {
          /* use basePrice */
        }

        // ── Mutual funds: NAV is fixed for the day — no intra-day simulation ──
        // Only write to Redis on first encounter (price key missing / TTL expired).
        // The live ticker also skips MUTUAL_FUND entries, so the NAV stays stable
        // until the daily net-worth snapshot job updates it.
        if (asset.assetType === 'MUTUAL_FUND') {
          // Ensure the stable NAV is in Redis so quote lookups return a value
          try {
            const existing = await redis.get(priceKey);
            if (!existing) {
              await redis.set(
                priceKey,
                JSON.stringify({
                  ticker: asset.ticker,
                  price: prevPrice,
                  change: 0,
                  changePercent: '+0.00%',
                  up: true,
                  timestamp,
                })
              );
            }
          } catch (_) {
            /* non-fatal */
          }

          tickResults.push({
            ticker: asset.ticker,
            price: prevPrice,
            volatility: asset.volatility,
            assetType: asset.assetType,
          });
          continue; // skip price simulation for mutual funds
        }

        const sectorTrend = asset.sector ? (sectorTrends[asset.sector] ?? 0) : 0;
        const newPrice = computeNewPrice(prevPrice, sentiment, sectorTrend, asset.volatility);
        const change = parseFloat((newPrice - prevPrice).toFixed(2));
        const changePercent = formatChangePercent(change, prevPrice);
        const up = change >= 0;

        const pricePayload = {
          ticker: asset.ticker,
          price: newPrice,
          change,
          changePercent,
          up,
          timestamp,
        };

        // 5. Write updated price to Redis (TTL 60s)
        try {
          await redis.setex(priceKey, 60, JSON.stringify(pricePayload));
        } catch (_) {
          /* non-fatal — price will fall back to basePrice on next read */
        }

        // 6. Broadcast SSE price_update to all connected clients
        try {
          broadcast(pricePayload);
        } catch (_) {
          /* SSE map may be empty */
        }

        // 7. Emit volatility_alert if single-tick swing > 3%
        const swingPct = prevPrice > 0 ? Math.abs(change / prevPrice) : 0;
        if (swingPct > 0.03) {
          try {
            const { broadcastVolatilityAlert } = require('../modules/market/market.controller');
            if (broadcastVolatilityAlert) {
              broadcastVolatilityAlert({
                ticker: asset.ticker,
                price: newPrice,
                swingPercent: parseFloat((swingPct * 100).toFixed(2)),
                direction: up ? 'up' : 'down',
                timestamp,
              });
            }
          } catch (_) {
            /* non-fatal */
          }
        }

        tickResults.push({
          ticker: asset.ticker,
          price: newPrice,
          volatility: asset.volatility,
          assetType: asset.assetType,
        });
      }

      // 8. Seed the live ticker cache with authoritative post-tick prices
      try {
        getSeedCache()(tickResults);
      } catch (_) {
        /* non-fatal */
      }

      // 9. Decay MarketSentiment and SectorTrends toward 0 by 10%
      try {
        const decayedSentiment = parseFloat((sentiment * 0.9).toFixed(6));
        await redis.set(SENTIMENT_KEY, decayedSentiment);

        for (const sector of sectors) {
          const decayed = parseFloat(((sectorTrends[sector] ?? 0) * 0.9).toFixed(6));
          await redis.set(sectorTrendKey(sector), decayed);
        }
      } catch (_) {
        /* non-fatal */
      }

      console.log(`[MSE] Tick complete — ${assets.length} assets updated`);
    },
    { connection: makeBullMQConnection() }
  );

  mseWorker.on('completed', (job) => console.log(`[MSE] Job ${job.id} completed`));
  mseWorker.on('failed', (job, err) => console.error(`[MSE] Job ${job?.id} failed:`, err.message));

  console.log('✓ MSE price-tick worker started');
} else {
  console.warn('⚠️  MSE worker: Redis not configured — worker disabled');
}

// ─── Scheduler ───────────────────────────────────────────────────────────────

const { msePriceTickQueue } = require('../config/bullmq');

const scheduleMseTick = async () => {
  if (!msePriceTickQueue) return;
  // Remove existing repeatable jobs to avoid duplicates on restart
  const existing = await msePriceTickQueue.getRepeatableJobs();
  for (const job of existing) {
    await msePriceTickQueue.removeRepeatableByKey(job.key);
  }
  await msePriceTickQueue.add(
    'tick',
    {},
    { repeat: { every: 30000 } } // every 30 seconds
  );
  console.log('✓ MSE price-tick job scheduled (every 30s)');
};

module.exports = { mseWorker, scheduleMseTick };
