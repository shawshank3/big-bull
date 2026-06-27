/**
 * Daily Price Service
 *
 * Owns writes to the DailyPrice and StockPriceHistory collections that the
 * mseWorker does not handle on each tick.
 *
 * ─── Architectural split: STOCK vs MUTUAL_FUND ──────────────────────────────
 *
 * STOCKS:
 *   The mseWorker is the primary writer.  On every 30s tick it upserts
 *   today's DailyPrice with the latest computed price; the last tick before
 *   IST midnight becomes the day's official close.  This module covers two
 *   adjacent responsibilities:
 *     - `writeTodayClose()`   — final upsert on graceful shutdown (safety net).
 *     - `backfillMissingDays()` — downtime recovery: chains a random walk
 *                                 over past days the server was offline.
 *
 * MUTUAL FUNDS:
 *   Change exactly once per IST day.  The most recent DailyPrice record IS
 *   the current NAV — there is no separate Redis/MarketState layer for MFs.
 *   The single writer of MF DailyPrice is `ensureMfDailyPrices()`.
 *
 * ─── Public entry points ────────────────────────────────────────────────────
 *
 *   ensureMfDailyPrices()
 *     STOCK:  no-op (stocks are not MFs).
 *     MF:     for every mutual fund, find the most recent DailyPrice and chain
 *             a random-walk simulation forward to TODAY (inclusive).  Idempotent
 *             — running twice the same day produces no extra records.  Called:
 *               - on startup (after connectDB)
 *               - on IST day transition from the mseWorker
 *
 *   writeTodayClose()
 *     STOCK:  upserts today's DailyPrice using the resolved live price.  This
 *             is a safety net — the mseWorker already wrote today's record on
 *             the last tick.  Useful when the server crashes between ticks
 *             then receives SIGTERM cleanly.
 *     MF:     skipped — `ensureMfDailyPrices()` already owns today's MF NAV.
 *
 *   backfillMissingDays()
 *     STOCK:  fills any gap between the last DailyPrice and yesterday by
 *             chaining a random walk from the last known close.  Called on
 *             startup.  Today is excluded — owned by the live mseWorker tick.
 *     MF:     skipped — `ensureMfDailyPrices()` handles MFs end-to-end.
 *
 *   backfillIntradayToday()
 *     STOCK:  generates synthetic 30-second StockPriceHistory ticks for today
 *             so the 1D chart is not empty on cold start.
 *     MF:     skipped (no intraday history for mutual funds).
 *
 * Design rules:
 *   - Asset.basePrice is reference data only — never written here.
 *   - All errors are logged and swallowed.  No function crashes the server.
 *   - All writes are bulk upserts/inserts — safe to re-run, no duplicates.
 */

const Asset = require('../modules/asset/asset.model');
const MarketState = require('../modules/market/marketState.model');
const DailyPrice = require('../modules/market/dailyPrice.model');
const StockPriceHistory = require('../modules/market/stockPriceHistory.model');
const { ASSET_TYPES } = require('../shared/constants');
const redis = require('../shared/redis');
const { nextDayPrice, nextIntradayPrice, todayIST } = require('../utils/priceSimulation');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Default number of days of MF history to seed when no DailyPrice exists. */
const MF_INITIAL_HISTORY_DAYS = 30;

/**
 * Returns a date N calendar days offset from now as YYYY-MM-DD in IST (UTC+5:30).
 * offset = 0 → today, offset = -1 → yesterday, offset = -7 → 7 days ago.
 */
const dateIST = (offset = 0) => {
  if (offset === 0) return todayIST();
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000 + offset * 86400 * 1000);
  return ist.toISOString().slice(0, 10);
};

/**
 * Build an ordered list of YYYY-MM-DD strings from startDate (exclusive) to
 * endDate (inclusive).  e.g. gapDates('2026-06-10', '2026-06-13') →
 * ['2026-06-11', '2026-06-12', '2026-06-13']
 */
const gapDates = (startDateStr, endDateStr) => {
  const dates = [];
  const cursor = new Date(startDateStr + 'T00:00:00Z');
  const end = new Date(endDateStr + 'T00:00:00Z');
  cursor.setUTCDate(cursor.getUTCDate() + 1); // start exclusive
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
};

/**
 * Resolve the current price for a STOCK asset using the three-tier chain.
 *  1. Redis `price:<ticker>` (TTL 60s)
 *  2. MarketState.lastPrice
 *  3. Asset.basePrice
 *
 * NOTE: do not call for mutual funds — MFs use DailyPrice as their source of
 * truth.  Use `ensureMfDailyPrices()` to read today's MF NAV.
 */
const resolveStockPrice = async (ticker, basePrice) => {
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

  // Tier 2 — MarketState
  try {
    const state = await MarketState.findOne({ ticker }).lean();
    if (state && typeof state.lastPrice === 'number' && state.lastPrice > 0) {
      return state.lastPrice;
    }
  } catch (_) {
    /* fall through */
  }

  // Tier 3 — seed
  return basePrice;
};

// ─── ensureMfDailyPrices ──────────────────────────────────────────────────────

/**
 * Single source of truth for mutual-fund NAVs.
 *
 * For each MUTUAL_FUND asset:
 *   1. Find the most recent DailyPrice record.
 *   2. If `latest.date >= today` → already up to date, skip.
 *   3. If `latest.date < today` → chain a random walk day-by-day from
 *      `latest.closePrice` up to AND INCLUDING today.
 *   4. If no DailyPrice exists at all → seed `MF_INITIAL_HISTORY_DAYS` days
 *      ending today, starting from `Asset.basePrice`.
 *
 * The most recent DailyPrice record after this function returns equals today's
 * NAV.  This is THE current price for the MF; it is what the chart's last point
 * shows, what the quote API returns, and what BUY/SELL orders execute against.
 *
 * Idempotent: safe to call multiple times the same IST day.
 * Non-fatal: logs errors but does not throw.
 */
const ensureMfDailyPrices = async () => {
  const today = dateIST(0);
  console.log(`[MF NAV] Ensuring daily NAVs are up to date for ${today}…`);

  try {
    const mfAssets = await Asset.find({ assetType: ASSET_TYPES.MUTUAL_FUND }).lean();
    if (!mfAssets.length) {
      console.log('[MF NAV] No mutual-fund assets — skipping');
      return;
    }

    const ops = [];
    let totalNew = 0;

    for (const asset of mfAssets) {
      const latest = await DailyPrice.findOne({ ticker: asset.ticker }).sort({ date: -1 }).lean();

      let startDate;
      let startPrice;

      if (latest) {
        if (latest.date >= today) continue; // already up to date
        startDate = latest.date;
        startPrice = latest.closePrice;
      } else {
        // No history at all — seed N days back through today
        startDate = dateIST(-MF_INITIAL_HISTORY_DAYS);
        startPrice = asset.basePrice;
      }

      const datesToFill = gapDates(startDate, today);
      if (!datesToFill.length) continue;

      let price = startPrice;
      for (const date of datesToFill) {
        price = nextDayPrice(price, asset.volatility);
        ops.push({
          updateOne: {
            filter: { ticker: asset.ticker, date },
            update: {
              $set: {
                ticker: asset.ticker,
                assetType: asset.assetType,
                date,
                closePrice: price,
              },
            },
            upsert: true,
          },
        });
        totalNew++;
      }
    }

    if (ops.length) {
      await DailyPrice.bulkWrite(ops, { ordered: false });
    }

    console.log(
      totalNew > 0
        ? `[MF NAV] ✓ Wrote ${totalNew} NAV records (through ${today})`
        : `[MF NAV] ✓ All MFs already current — no writes needed`
    );
  } catch (err) {
    console.error('[MF NAV] ensureMfDailyPrices failed:', err.message);
  }
};

// ─── writeTodayClose ──────────────────────────────────────────────────────────

/**
 * Final safety-net snapshot of today's STOCK closing prices on graceful shutdown.
 *
 * The mseWorker already upserts today's DailyPrice on every 30s tick, so under
 * normal operation today's record is already up-to-date when this runs.  This
 * function exists for the edge case where the server is shutting down between
 * ticks — it forces one last upsert so the most recent computed price is
 * preserved as the day's close.
 *
 * Mutual funds are skipped — `ensureMfDailyPrices()` already manages MF NAVs.
 *
 * Non-fatal: logs errors but does not throw.
 */
const writeTodayClose = async () => {
  const today = dateIST(0);
  console.log(`[DailyPrice] Writing today's stock close (${today})…`);

  try {
    const stocks = await Asset.find({ assetType: ASSET_TYPES.STOCK }).lean();
    if (!stocks.length) {
      console.warn('[DailyPrice] No stock assets — skipping writeTodayClose');
      return;
    }

    const ops = await Promise.all(
      stocks.map(async (asset) => {
        const closePrice = await resolveStockPrice(asset.ticker, asset.basePrice);
        return {
          updateOne: {
            filter: { ticker: asset.ticker, date: today },
            update: {
              $set: {
                ticker: asset.ticker,
                assetType: asset.assetType,
                date: today,
                closePrice,
              },
            },
            upsert: true,
          },
        };
      })
    );

    await DailyPrice.bulkWrite(ops, { ordered: false });
    console.log(`[DailyPrice] ✓ ${ops.length} stock closing prices written for ${today}`);
  } catch (err) {
    console.error('[DailyPrice] writeTodayClose failed:', err.message);
  }
};

// ─── backfillMissingDays ──────────────────────────────────────────────────────

/**
 * Fills any STOCK DailyPrice gap between the last recorded date and yesterday.
 *
 * Mutual funds are skipped — `ensureMfDailyPrices()` handles MFs end-to-end
 * (including today, which this function deliberately excludes for stocks).
 *
 * Today is owned by the live mseWorker tick (`persistStockDailyPrice`), so
 * this function only catches up days the server was offline.
 *
 * Per stock:
 *   1. Find the most recent DailyPrice for this ticker.
 *   2. If it exists and is already at or past yesterday → nothing to do.
 *   3. If it exists and is older than yesterday → simulate the gap days by
 *      chaining a random walk from that last known close price.
 *   4. If no DailyPrice exists at all → use `MarketState.lastPrice` as the
 *      starting price and fill from 30 days ago up to yesterday.
 *
 * After backfilling, MarketState and Redis are updated with the end-of-chain
 * price so the live simulation resumes from a consistent baseline.
 *
 * Non-fatal: logs errors but does not throw.
 */
const backfillMissingDays = async () => {
  const yesterday = dateIST(-1);
  console.log(`[DailyPrice] Running stock backfill (target: up to ${yesterday})…`);

  try {
    const stocks = await Asset.find({ assetType: ASSET_TYPES.STOCK }).lean();
    if (!stocks.length) {
      console.warn('[DailyPrice] No stock assets — skipping backfill');
      return;
    }

    let totalFilled = 0;
    const ops = [];

    for (const asset of stocks) {
      const latest = await DailyPrice.findOne({ ticker: asset.ticker }).sort({ date: -1 }).lean();

      let startDate;
      let startPrice;

      if (latest) {
        if (latest.date >= yesterday) continue;
        startDate = latest.date;
        startPrice = latest.closePrice;
      } else {
        // No history at all — seed from MarketState, go back 30 days
        startDate = dateIST(-30);
        try {
          const state = await MarketState.findOne({ ticker: asset.ticker }).lean();
          startPrice = state && state.lastPrice > 0 ? state.lastPrice : asset.basePrice;
        } catch (_) {
          startPrice = asset.basePrice;
        }
      }

      const datesToFill = gapDates(startDate, yesterday);
      if (!datesToFill.length) continue;

      // Chain random-walk from startPrice through each missing day
      let price = startPrice;
      for (const date of datesToFill) {
        price = nextDayPrice(price, asset.volatility);
        ops.push({
          updateOne: {
            filter: { ticker: asset.ticker, date },
            update: {
              $set: {
                ticker: asset.ticker,
                assetType: asset.assetType,
                date,
                closePrice: price,
              },
            },
            upsert: true,
          },
        });
        totalFilled++;
      }

      // Update MarketState with the last simulated price so the live
      // simulation resumes from this baseline rather than the pre-downtime
      // stale value.  Sync Redis so the three-tier chain returns it
      // immediately on the next quote.
      try {
        await MarketState.updateOne(
          { ticker: asset.ticker },
          { $set: { lastPrice: price, lastUpdatedAt: new Date() } },
          { upsert: true }
        );
      } catch (_) {
        /* non-fatal */
      }

      try {
        await redis.set(
          `price:${asset.ticker}`,
          JSON.stringify({
            ticker: asset.ticker,
            price,
            change: 0,
            changePercent: '+0.00%',
            up: true,
            timestamp: new Date().toISOString(),
          })
        );
      } catch (_) {
        /* non-fatal — MarketState is the durable fallback */
      }
    }

    if (ops.length) {
      await DailyPrice.bulkWrite(ops, { ordered: false });
    }

    console.log(
      totalFilled > 0
        ? `[DailyPrice] ✓ Stock backfill complete — ${totalFilled} records written`
        : `[DailyPrice] ✓ Stock backfill — no gap to fill`
    );
  } catch (err) {
    console.error('[DailyPrice] backfillMissingDays failed:', err.message);
  }
};

// ─── backfillIntradayToday ─────────────────────────────────────────────────────

/**
 * Generates synthetic 30-second intraday ticks for today (stocks only).
 *
 * Called on startup so the 1D chart is not empty while the MSE worker starts
 * accumulating real ticks.  Only runs if there are fewer than 10 existing
 * StockPriceHistory documents for today — meaning the worker hasn't had time
 * to build up meaningful data yet.
 *
 * Algorithm:
 *   1. Compute today's IST window: 00:00 → now (24-hour market, no close).
 *   2. For each stock, resolve a starting price from MarketState → basePrice.
 *   3. Chain a random-walk at 30-second intervals with reduced volatility
 *      (same 0.25× scaling the seed script uses for intraday).
 *   4. Bulk-insert into StockPriceHistory.
 *
 * Idempotent: skips if today already has sufficient ticks.
 * Non-fatal: logs errors but does not throw.
 */
const backfillIntradayToday = async () => {
  const today = dateIST(0);
  console.log(`[Intraday] Checking if 1D backfill is needed for ${today}…`);

  try {
    // IST day boundaries in UTC
    const [y, m, d] = today.split('-').map(Number);
    const istMidnightUTC = new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - 5.5 * 60 * 60 * 1000);

    // Check if we already have meaningful data for today
    const existingCount = await StockPriceHistory.countDocuments({
      timestamp: { $gte: istMidnightUTC },
    });

    if (existingCount >= 10) {
      console.log(`[Intraday] ✓ Already ${existingCount} ticks today — skipping backfill`);
      return;
    }

    const stocks = await Asset.find({ assetType: ASSET_TYPES.STOCK }).lean();
    if (!stocks.length) {
      console.log('[Intraday] No stock assets found — skipping');
      return;
    }

    // 24-hour market: generate ticks from 00:00 IST up to current time
    const MARKET_OPEN_S = 0; // 00:00 IST (market is always open)
    const TICK_INTERVAL_S = 30;

    const nowUTC = Date.now();
    const nowIST = new Date(nowUTC + 5.5 * 60 * 60 * 1000);
    const nowSecondsIST =
      nowIST.getUTCHours() * 3600 + nowIST.getUTCMinutes() * 60 + nowIST.getUTCSeconds();
    const endS = nowSecondsIST;

    if (endS <= MARKET_OPEN_S) {
      console.log('[Intraday] ✓ No ticks to generate yet — skipping backfill');
      return;
    }

    const tickCount = Math.floor((endS - MARKET_OPEN_S) / TICK_INTERVAL_S);
    if (tickCount <= 0) {
      console.log('[Intraday] ✓ No ticks to generate — skipping');
      return;
    }

    console.log(`[Intraday] Generating ~${tickCount} ticks per stock (${stocks.length} stocks)…`);

    const intradayDocs = [];

    for (const asset of stocks) {
      let price = asset.basePrice;
      try {
        const state = await MarketState.findOne({ ticker: asset.ticker }).lean();
        if (state && state.lastPrice > 0) price = state.lastPrice;
      } catch (_) {
        /* use basePrice */
      }

      let prevPrice = price;

      for (let i = 0; i < tickCount; i++) {
        price = nextIntradayPrice(price, asset.volatility);

        const change = parseFloat((price - prevPrice).toFixed(2));
        const pct = prevPrice > 0 ? (change / prevPrice) * 100 : 0;
        const sign = pct >= 0 ? '+' : '';
        const changePercent = `${sign}${pct.toFixed(2)}%`;

        const tickOffsetS = MARKET_OPEN_S + i * TICK_INTERVAL_S;
        const timestamp = new Date(istMidnightUTC.getTime() + tickOffsetS * 1000);

        intradayDocs.push({
          ticker: asset.ticker,
          price,
          change,
          changePercent,
          timestamp,
        });

        prevPrice = price;
      }
    }

    if (intradayDocs.length) {
      await StockPriceHistory.insertMany(intradayDocs, { ordered: false });
      console.log(
        `[Intraday] ✓ Backfill complete — ${intradayDocs.length} ticks inserted for ${stocks.length} stocks`
      );

      // Update MarketState and Redis with the final backfilled price for each
      // stock so the live mseWorker resumes from a consistent baseline rather
      // than jumping back to the pre-backfill price (which causes a visible
      // discontinuity in the chart at the point the live ticks start).
      for (const asset of stocks) {
        const lastDoc = intradayDocs.filter((doc) => doc.ticker === asset.ticker).pop();
        if (!lastDoc) continue;

        try {
          await MarketState.updateOne(
            { ticker: asset.ticker },
            { $set: { lastPrice: lastDoc.price, lastUpdatedAt: new Date() } },
            { upsert: true }
          );
        } catch (_) {
          /* non-fatal */
        }

        try {
          await redis.setex(
            `price:${asset.ticker}`,
            60,
            JSON.stringify({
              ticker: asset.ticker,
              price: lastDoc.price,
              change: lastDoc.change ?? 0,
              changePercent: lastDoc.changePercent ?? '+0.00%',
              up: (lastDoc.change ?? 0) >= 0,
              timestamp: new Date().toISOString(),
            })
          );
        } catch (_) {
          /* non-fatal — MarketState is the durable fallback */
        }
      }
    }
  } catch (err) {
    console.error('[Intraday] backfillIntradayToday failed:', err.message);
  }
};

module.exports = {
  ensureMfDailyPrices,
  writeTodayClose,
  backfillMissingDays,
  backfillIntradayToday,
};
