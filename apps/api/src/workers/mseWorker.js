/**
 * MSE Worker  (Market Simulation Engine — 30-second authoritative tick)
 *
 * Responsibilities per tick:
 *   1. Read all assets from MongoDB.
 *   2. Resolve previous price via three-tier chain:
 *        Redis `price:<ticker>`  →  MarketState.lastPrice  →  Asset.basePrice
 *   3. Compute new price using the MSE formula.
 *   4. Write updated price to Redis (TTL 60s).
 *   5. Broadcast SSE price_update / volatility_alert events.
 *   6. Seed the 1s live-ticker in-memory cache (mseLiveTicker.seedPriceCache).
 *   7. Persist the new price to MarketState (upsert) — Phase 2 recovery.
 *   8. Append a StockPriceHistory document for STOCK assets — Phase 1 charting.
 *   9. Decay MarketSentiment and SectorTrends toward 0.
 *
 * Architectural constraints (do not break):
 *   - Mutual fund NAVs are NOT simulated intraday; only written to Redis/MarketState
 *     once per tick if the key is absent.
 *   - No writes to Asset.basePrice — it is pure reference/seed data.
 *   - StockPriceHistory is written here and nowhere else.
 *   - MarketState is written here and nowhere else.
 *   - SSE behaviour is unchanged.
 */

const { Worker } = require('bullmq');
const redis = require('../shared/redis');
const Asset = require('../modules/asset/asset.model');
const MarketState = require('../modules/market/marketState.model');
const StockPriceHistory = require('../modules/market/stockPriceHistory.model');
const DailyPrice = require('../modules/market/dailyPrice.model');
const { makeBullMQConnection, isRedisConfigured } = require('../shared/redisBullMQ');
const { ASSET_TYPES } = require('../shared/constants');
const { gaussianNoise, nextDayPrice, todayIST } = require('../utils/priceSimulation');

// Lazy-require to avoid circular dependency issues at startup
const getBroadcast = () => require('../modules/market/market.controller').broadcastPriceUpdate;
const getSeedCache = () => require('./mseLiveTicker').seedPriceCache;

const isRedisAvailable = isRedisConfigured;

// ─── Day-transition tracking ──────────────────────────────────────────────────
// Tracks the last IST date seen by the worker so we can detect midnight
// crossings and persist yesterday's DailyPrice automatically.
let lastSeenDay = null;

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

/**
 * Resolve the previous price for an asset using the three-tier chain:
 *   1. Redis `price:<ticker>` (TTL 60s — most recent authoritative tick)
 *   2. MarketState.lastPrice  (survived across restarts and Redis flushes)
 *   3. Asset.basePrice        (seed/reference value — last resort only)
 *
 * @param {string} ticker
 * @param {number} basePrice  - the asset's seed price (Asset.basePrice)
 * @returns {Promise<number>}
 */
const resolvePrevPrice = async (ticker, basePrice) => {
  // Tier 1 — Redis
  try {
    const cached = await redis.get(`price:${ticker}`);
    if (cached !== null) {
      const parsed = JSON.parse(cached);
      const p = parsed.price ?? parsed;
      if (typeof p === 'number' && p > 0) return p;
    }
  } catch (_) {
    /* fall through */
  }

  // Tier 2 — MarketState (durable MongoDB record)
  try {
    const state = await MarketState.findOne({ ticker }).lean();
    if (state && typeof state.lastPrice === 'number' && state.lastPrice > 0) {
      return state.lastPrice;
    }
  } catch (_) {
    /* fall through */
  }

  // Tier 3 — seed price
  return basePrice;
};

/**
 * Bulk-upsert MarketState records for all assets processed in this tick.
 * Uses bulkWrite for efficiency — one round-trip for all assets.
 *
 * @param {Array<{ ticker: string, price: number, updatedAt: Date, lastNavDate?: string }>} updates
 */
const persistMarketState = async (updates) => {
  if (!updates.length) return;
  try {
    const ops = updates.map(({ ticker, price, updatedAt, lastNavDate }) => {
      const $set = { lastPrice: price, lastUpdatedAt: updatedAt };
      if (lastNavDate) $set.lastNavDate = lastNavDate;
      return {
        updateOne: {
          filter: { ticker },
          update: { $set },
          upsert: true,
        },
      };
    });
    await MarketState.bulkWrite(ops, { ordered: false });
  } catch (err) {
    // Non-fatal: MarketState write failure degrades Phase 2 recovery but does
    // not affect the live simulation.
    console.error('[MSE] MarketState persist error:', err.message);
  }
};

/**
 * Bulk-insert StockPriceHistory records for all STOCK assets in this tick.
 * ordered:false lets Mongo insert as many as possible even if one fails.
 *
 * @param {Array<{ ticker: string, price: number, change: number, changePercent: string, timestamp: Date }>} points
 */
const persistStockHistory = async (points) => {
  if (!points.length) return;
  try {
    await StockPriceHistory.insertMany(points, { ordered: false });
  } catch (err) {
    // Non-fatal: chart history write failure must not disrupt the live simulation.
    console.error('[MSE] StockPriceHistory insert error:', err.message);
  }
};

/**
 * Detects an IST day transition (midnight crossing) and snapshots the previous
 * day's closing price into DailyPrice for all assets.
 *
 * Called once per 30s tick. On the first tick after IST midnight, writes
 * yesterday's DailyPrice using the current MarketState prices (which represent
 * the last authoritative prices from the previous day).
 *
 * Idempotent: uses upsert so re-runs for the same date are safe.
 * Non-fatal: logs errors but does not throw.
 */
const handleDayTransition = async (currentDay) => {
  // First tick ever — just initialize tracking, no snapshot needed
  if (lastSeenDay === null) {
    lastSeenDay = currentDay;
    return;
  }

  // Same day — nothing to do
  if (currentDay === lastSeenDay) return;

  // Day changed! Snapshot the previous day's closing prices
  const previousDay = lastSeenDay;
  lastSeenDay = currentDay;

  console.log(`[MSE] Day transition detected: ${previousDay} → ${currentDay}. Writing DailyPrice…`);

  try {
    const assets = await Asset.find({}).lean();
    if (!assets.length) return;

    // Resolve actual closing prices from MarketState (most accurate source)
    const ops = await Promise.all(
      assets.map(async (asset) => {
        const price = await resolvePrevPrice(asset.ticker, asset.basePrice);
        return {
          updateOne: {
            filter: { ticker: asset.ticker, date: previousDay },
            update: {
              $set: {
                ticker: asset.ticker,
                assetType: asset.assetType,
                date: previousDay,
                closePrice: price,
              },
            },
            upsert: true,
          },
        };
      })
    );

    await DailyPrice.bulkWrite(ops, { ordered: false });
    console.log(`[MSE] ✓ DailyPrice: ${ops.length} closing records written for ${previousDay}`);
  } catch (err) {
    console.error('[MSE] DailyPrice day-transition write failed:', err.message);
  }
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
      const tickTime = new Date();
      const timestamp = tickTime.toISOString();

      // Accumulators for bulk writes
      const tickResults = []; // for seedPriceCache
      const marketStateUpdates = []; // Phase 2 — MarketState upserts
      const stockHistoryPoints = []; // Phase 1 — intraday chart inserts

      // 4. Process each asset
      const istToday = todayIST();

      // 4a. Detect IST day transition — snapshot yesterday's close to DailyPrice
      await handleDayTransition(istToday);

      for (const asset of assets) {
        const priceKey = `price:${asset.ticker}`;

        // ── Resolve previous price (three-tier chain) ──────────────────────
        const prevPrice = await resolvePrevPrice(asset.ticker, asset.basePrice);

        // ── Mutual funds: NAV walks once per IST day, then stable ──────────
        if (asset.assetType === ASSET_TYPES.MUTUAL_FUND) {
          // Read MarketState directly so we can gate the rollover on
          // `lastNavDate`. resolvePrevPrice may have served `prevPrice` from
          // Redis (faster, but missing the date marker we need here).
          let mfState = null;
          try {
            mfState = await MarketState.findOne({ ticker: asset.ticker })
              .select('lastPrice lastNavDate')
              .lean();
          } catch (_) {
            /* non-fatal — fall through with mfState=null */
          }

          const needsRoll = !mfState?.lastNavDate || mfState.lastNavDate < istToday;
          const navPrice = needsRoll ? nextDayPrice(prevPrice, asset.volatility) : prevPrice;
          const change = parseFloat((navPrice - prevPrice).toFixed(2));
          const changePercent = formatChangePercent(change, prevPrice);
          const up = change >= 0;

          const navPayload = {
            ticker: asset.ticker,
            price: navPrice,
            change,
            changePercent,
            up,
            timestamp,
          };

          // Always refresh Redis so quotes never fall back to the seed after
          // a flush, and so the new NAV is visible immediately on rollover.
          try {
            await redis.set(priceKey, JSON.stringify(navPayload));
          } catch (_) {
            /* non-fatal */
          }

          // On rollover, broadcast the new NAV so connected clients refresh.
          if (needsRoll) {
            try {
              broadcast(navPayload);
            } catch (_) {
              /* SSE map may be empty */
            }
          }

          // Phase 2: persist NAV + the rollover date so subsequent ticks know
          // today's roll has already happened (idempotent across restarts).
          marketStateUpdates.push({
            ticker: asset.ticker,
            price: navPrice,
            updatedAt: tickTime,
            lastNavDate: istToday,
          });

          tickResults.push({
            ticker: asset.ticker,
            price: navPrice,
            volatility: asset.volatility,
            assetType: asset.assetType,
          });
          continue; // MFs do not generate intraday history
        }

        // ── Stock: compute new price ───────────────────────────────────────
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
          /* non-fatal */
        }

        // 6. Broadcast SSE price_update to all connected clients (unchanged)
        try {
          broadcast(pricePayload);
        } catch (_) {
          /* SSE map may be empty */
        }

        // 7. Emit volatility_alert if single-tick swing > 3% (unchanged)
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

        // Phase 2: queue MarketState upsert
        marketStateUpdates.push({ ticker: asset.ticker, price: newPrice, updatedAt: tickTime });

        // Phase 1: queue StockPriceHistory insert (stocks only)
        stockHistoryPoints.push({
          ticker: asset.ticker,
          price: newPrice,
          change,
          changePercent,
          timestamp: tickTime,
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

      // 10. Persist MarketState (Phase 2) — non-blocking, non-fatal
      await persistMarketState(marketStateUpdates);

      // 11. Persist StockPriceHistory (Phase 1) — non-blocking, non-fatal
      await persistStockHistory(stockHistoryPoints);

      console.log(
        `[MSE] Tick complete — ${assets.length} assets updated` +
          ` (${stockHistoryPoints.length} history points written)`
      );
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
