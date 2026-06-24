/**
 * MSE Worker  (Market Simulation Engine — 30-second authoritative tick)
 *
 * Owns the simulation of STOCK prices.  Mutual funds are NOT simulated here —
 * they have a single NAV per IST day, owned by `dailyPriceService.ensureMfDailyPrices()`.
 * On IST day rollover this worker calls `ensureMfDailyPrices()` so today's MF
 * NAV is generated immediately at midnight without requiring a server restart.
 *
 * Responsibilities per tick (stocks only):
 *   1. Read all STOCK assets from MongoDB.
 *   2. Resolve previous price via three-tier chain:
 *        Redis `price:<ticker>`  →  MarketState.lastPrice  →  Asset.basePrice
 *   3. Compute new price using the MSE formula.
 *   4. Write updated price to Redis (TTL 60s).
 *   5. Broadcast SSE price_update / volatility_alert events.
 *   6. Seed the 1s live-ticker in-memory cache (mseLiveTicker.seedPriceCache).
 *   7. Persist the new price to MarketState (upsert) — Phase 2 recovery.
 *   8. Append a StockPriceHistory document — intraday charting.
 *   9. Upsert today's DailyPrice (continuous live snapshot — last tick before
 *      IST midnight becomes the day's official close).
 *  10. Decay MarketSentiment and SectorTrends toward 0.
 *
 * Architectural constraints (do not break):
 *   - Mutual funds are NEVER touched here.  Their source of truth is DailyPrice.
 *   - No writes to Asset.basePrice — it is pure reference/seed data.
 *   - StockPriceHistory is written here and nowhere else.
 *   - MarketState (stocks) is written here and (on backfill) by dailyPriceService.
 *   - Today's DailyPrice (stocks) is written here on every tick; the same
 *     collection is also written by writeTodayClose (shutdown safety net) and
 *     backfillMissingDays (downtime gap recovery for past days only).
 */

const { Worker } = require('bullmq');
const redis = require('../shared/redis');
const Asset = require('../modules/asset/asset.model');
const MarketState = require('../modules/market/marketState.model');
const StockPriceHistory = require('../modules/market/stockPriceHistory.model');
const DailyPrice = require('../modules/market/dailyPrice.model');
const { makeBullMQConnection, isRedisConfigured } = require('../shared/redisBullMQ');
const { ASSET_TYPES } = require('../shared/constants');
const { gaussianNoise, todayIST } = require('../utils/priceSimulation');

// Lazy-require to avoid circular dependency issues at startup
const getBroadcast = () => require('../modules/market/market.controller').broadcastPriceUpdate;
const getSeedCache = () => require('./mseLiveTicker').seedPriceCache;
const getEnsureMfDailyPrices = () => require('./dailyPriceService').ensureMfDailyPrices;

const isRedisAvailable = isRedisConfigured;

// ─── Day-transition tracking ──────────────────────────────────────────────────
// Tracks the last IST date seen by the worker so we can detect midnight
// crossings and persist yesterday's stock close + roll today's MF NAVs.
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
 * Resolve the previous STOCK price using the three-tier chain:
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
 * Bulk-upsert MarketState records for all stocks processed in this tick.
 * Uses bulkWrite for efficiency — one round-trip for all stocks.
 *
 * @param {Array<{ ticker: string, price: number, updatedAt: Date }>} updates
 */
const persistMarketState = async (updates) => {
  if (!updates.length) return;
  try {
    const ops = updates.map(({ ticker, price, updatedAt }) => ({
      updateOne: {
        filter: { ticker },
        update: { $set: { lastPrice: price, lastUpdatedAt: updatedAt } },
        upsert: true,
      },
    }));
    await MarketState.bulkWrite(ops, { ordered: false });
  } catch (err) {
    // Non-fatal: MarketState write failure degrades Phase 2 recovery but does
    // not affect the live simulation.
    console.error('[MSE] MarketState persist error:', err.message);
  }
};

/**
 * Bulk-insert StockPriceHistory records for this tick.
 * ordered:false lets Mongo insert as many as possible even if one fails.
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
 * Bulk-upsert today's DailyPrice records for all stocks ticked this round.
 *
 * Each 30s tick rewrites today's `DailyPrice.closePrice` with the latest
 * computed value — the last tick before IST midnight is the day's official
 * close.  This keeps the multi-day chart (1W / 1M / 3M / 1Y) always ending
 * on today's current price (matching the quote API), instead of yesterday's
 * close.
 *
 * Idempotent: upsert on (ticker, date).  Non-fatal: errors are logged.
 */
const persistStockDailyPrice = async (today, points) => {
  if (!points.length) return;
  try {
    const ops = points.map((p) => ({
      updateOne: {
        filter: { ticker: p.ticker, date: today },
        update: {
          $set: {
            ticker: p.ticker,
            assetType: ASSET_TYPES.STOCK,
            date: today,
            closePrice: p.price,
          },
        },
        upsert: true,
      },
    }));
    await DailyPrice.bulkWrite(ops, { ordered: false });
  } catch (err) {
    // Non-fatal: chart staleness is the only consequence; live simulation is unaffected.
    console.error('[MSE] Stock DailyPrice today-snapshot error:', err.message);
  }
};

/**
 * Detects an IST day transition (midnight crossing) and triggers the per-day
 * actions for assets that don't have continuous tick coverage:
 *
 *   - STOCKS: nothing extra needed — the last 30s tick before midnight
 *     already wrote yesterday's `DailyPrice` via `persistStockDailyPrice()`,
 *     and the first tick after midnight will overwrite today's record.
 *
 *   - MUTUAL FUNDS: trigger `ensureMfDailyPrices()` so today's NAV is
 *     generated immediately at midnight rather than waiting for some other
 *     event.  Idempotent — safe even if called again on a later tick.
 *
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

  const previousDay = lastSeenDay;
  lastSeenDay = currentDay;

  console.log(`[MSE] Day transition: ${previousDay} → ${currentDay}`);

  // Mutual funds: roll today's NAV via the dedicated MF service
  try {
    await getEnsureMfDailyPrices()();
  } catch (err) {
    console.error('[MSE] MF NAV rollover failed:', err.message);
  }
};

// ─── Worker ──────────────────────────────────────────────────────────────────

let mseWorker = null;

if (isRedisAvailable) {
  mseWorker = new Worker(
    'mse-price-tick',
    async (job) => {
      console.log(`[MSE] Price tick job #${job.id} — processing`);

      // 1. Fetch all STOCK assets — mutual funds are not simulated here
      const stocks = await Asset.find({ assetType: ASSET_TYPES.STOCK }).lean();

      // 2. Day-transition check runs regardless of stock count so MF NAVs roll
      const istToday = todayIST();
      await handleDayTransition(istToday);

      if (!stocks.length) {
        console.warn('[MSE] No stock assets — skipping price computation');
        return;
      }

      // 3. Read global MarketSentiment
      const sentiment = await getFloat(SENTIMENT_KEY, 0);

      // 4. Collect unique sectors for batch Redis reads
      const sectors = [...new Set(stocks.map((a) => a.sector).filter(Boolean))];
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

      for (const asset of stocks) {
        const priceKey = `price:${asset.ticker}`;

        // ── Resolve previous price (three-tier chain) ──────────────────────
        const prevPrice = await resolvePrevPrice(asset.ticker, asset.basePrice);

        // ── Compute new price ──────────────────────────────────────────────
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

        // Phase 2: queue MarketState upsert
        marketStateUpdates.push({ ticker: asset.ticker, price: newPrice, updatedAt: tickTime });

        // Phase 1: queue StockPriceHistory insert
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

      // 12. Upsert today's DailyPrice — keeps multi-day stock charts ending
      //     on today's current price (matching the quote API).  The last tick
      //     before IST midnight becomes the day's official close.
      await persistStockDailyPrice(istToday, stockHistoryPoints);

      console.log(
        `[MSE] Tick complete — ${stocks.length} stocks updated` +
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
