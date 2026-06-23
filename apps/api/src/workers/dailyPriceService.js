/**
 * Daily Price Service
 *
 * Handles DailyPrice writes without BullMQ or a fixed cron schedule.
 * Three entry points:
 *
 *   writeTodayClose()
 *     Called on graceful shutdown (SIGTERM / SIGINT).
 *     Upserts one DailyPrice record per asset for today using the current
 *     MarketState price (three-tier chain).  This captures "last known price
 *     before the server went down" as the day's closing value.
 *     Safe to call multiple times — upsert is idempotent.
 *
 *   backfillMissingDays()
 *     Called once on startup after connectDB() resolves.
 *     Finds the most recent DailyPrice date across all assets, then fills
 *     every calendar day between that date and yesterday by chaining a
 *     random-walk price simulation (same Va × N formula as mseWorker).
 *     Today is NOT backfilled here — writeTodayClose() owns today on shutdown.
 *
 *   backfillIntradayToday()
 *     Called once on startup after connectDB() resolves.
 *     Generates synthetic 30-second StockPriceHistory ticks from market open
 *     (09:00 IST) to min(now, 15:30 IST) so the 1D chart is not empty while
 *     the MSE worker starts accumulating real ticks. Skips if today already
 *     has sufficient data.
 *
 * Design rules:
 *   - Only writes to DailyPrice, StockPriceHistory, and MarketState.
 *     Never touches Asset.
 *   - Asset.basePrice is the seed / last-resort fallback — never written here.
 *   - Backfill uses only MarketState for the starting price (no Redis — on boot
 *     Redis may be empty).
 *   - All writes are bulk upserts/inserts — safe to re-run, no duplicates.
 *   - All errors are logged and swallowed — no function should crash the
 *     server on failure.
 */

const Asset = require('../modules/asset/asset.model');
const MarketState = require('../modules/market/marketState.model');
const DailyPrice = require('../modules/market/dailyPrice.model');
const StockPriceHistory = require('../modules/market/stockPriceHistory.model');
const { ASSET_TYPES } = require('../shared/constants');
const redis = require('../shared/redis');
const { gaussianNoise, nextDayPrice, todayIST } = require('../utils/priceSimulation');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Local alias retained for readability — same function as `gaussianNoise`. */
const gaussian = gaussianNoise;

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
 * Resolve the current price for an asset.
 * On shutdown: Redis may still be warm → check Redis first.
 * On startup:  Redis is likely empty → falls straight through to MarketState.
 */
const resolvePrice = async (ticker, basePrice) => {
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

/**
 * Resolve a mutual fund's NAV for "today's close".
 *
 * If MarketState already records a roll for today (`lastNavDate === today`),
 * returns that NAV unchanged. Otherwise advances the previous NAV by one
 * random-walk step, persists the new value + rollover marker, and returns it.
 *
 * Idempotent within a single IST day. Used by writeTodayClose() so that a
 * boot-then-shutdown with no mseWorker ticks still produces a fresh NAV
 * rather than copying yesterday's value forward.
 */
const resolveMutualFundClose = async (asset, today) => {
  let state = null;
  try {
    state = await MarketState.findOne({ ticker: asset.ticker })
      .select('lastPrice lastNavDate')
      .lean();
  } catch (_) {
    /* fall through with state=null */
  }

  const prevNav =
    state && typeof state.lastPrice === 'number' && state.lastPrice > 0
      ? state.lastPrice
      : await resolvePrice(asset.ticker, asset.basePrice);

  if (state?.lastNavDate === today) {
    // Already rolled today — return the recorded NAV without re-walking.
    return prevNav;
  }

  // Apply the once-per-day random-walk step and persist the marker so we
  // do not roll again today. Best-effort: NAV is still returned even if the
  // persistence write fails.
  const navPrice = nextDayPrice(prevNav, asset.volatility);
  try {
    await MarketState.updateOne(
      { ticker: asset.ticker },
      { $set: { lastPrice: navPrice, lastUpdatedAt: new Date(), lastNavDate: today } },
      { upsert: true }
    );
  } catch (_) {
    /* non-fatal */
  }

  // Refresh Redis so live quotes reflect the new NAV immediately.
  try {
    await redis.set(
      `price:${asset.ticker}`,
      JSON.stringify({
        ticker: asset.ticker,
        price: navPrice,
        change: parseFloat((navPrice - prevNav).toFixed(2)),
        changePercent: '+0.00%',
        up: navPrice >= prevNav,
        timestamp: new Date().toISOString(),
      })
    );
  } catch (_) {
    /* non-fatal */
  }

  return navPrice;
};

// ─── writeTodayClose ──────────────────────────────────────────────────────────

/**
 * Upserts one DailyPrice record per asset for today (IST).
 * Intended to be called on graceful shutdown so every day the server ran
 * has at least one DailyPrice record — the last price before shutdown.
 *
 * Non-fatal: logs errors but does not throw.
 */
const writeTodayClose = async () => {
  const today = dateIST(0);
  console.log(`[DailyPrice] Writing today's close (${today})…`);

  try {
    const assets = await Asset.find({}).lean();
    if (!assets.length) {
      console.warn('[DailyPrice] No assets found — skipping writeTodayClose');
      return;
    }

    const ops = await Promise.all(
      assets.map(async (asset) => {
        // For mutual funds, ensure today's NAV has been rolled exactly once
        // before snapshotting. This protects the boot-then-shutdown case where
        // mseWorker never had a chance to tick today.
        const closePrice =
          asset.assetType === ASSET_TYPES.MUTUAL_FUND
            ? await resolveMutualFundClose(asset, today)
            : await resolvePrice(asset.ticker, asset.basePrice);
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
    console.log(`[DailyPrice] ✓ ${ops.length} closing prices written for ${today}`);
  } catch (err) {
    console.error('[DailyPrice] writeTodayClose failed:', err.message);
  }
};

// ─── backfillMissingDays ──────────────────────────────────────────────────────

/**
 * Fills any DailyPrice gap between the last recorded date and yesterday.
 *
 * Algorithm per asset:
 *   1. Find the most recent DailyPrice for this ticker.
 *   2. If it exists and is already yesterday → nothing to do.
 *   3. If it exists and is older than yesterday → simulate the gap days by
 *      chaining the random-walk from that last known close price.
 *   4. If no DailyPrice exists at all → use MarketState.lastPrice as the
 *      starting price and fill from 30 days ago up to yesterday.
 *
 * Today is deliberately excluded — writeTodayClose() handles today on shutdown.
 *
 * Non-fatal: logs errors but does not throw.
 */
const backfillMissingDays = async () => {
  const yesterday = dateIST(-1);
  console.log(`[DailyPrice] Running startup backfill (target: up to ${yesterday})…`);

  try {
    const assets = await Asset.find({}).lean();
    if (!assets.length) {
      console.warn('[DailyPrice] No assets found — skipping backfill');
      return;
    }

    let totalFilled = 0;
    const ops = [];

    for (const asset of assets) {
      // Find the most recent DailyPrice for this asset
      const latest = await DailyPrice.findOne({ ticker: asset.ticker }).sort({ date: -1 }).lean();

      let startDate;
      let startPrice;

      if (latest) {
        // Already up to date — nothing to fill
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

      // Build the list of dates to fill: (startDate, yesterday]
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

      // Update MarketState with the last simulated price so it reflects
      // the end of the gap rather than the potentially stale pre-downtime value.
      // Only update if we actually simulated something.
      if (datesToFill.length > 0) {
        try {
          await MarketState.updateOne(
            { ticker: asset.ticker },
            { $set: { lastPrice: price, lastUpdatedAt: new Date() } },
            { upsert: true }
          );
        } catch (_) {
          /* non-fatal */
        }
      }
    }

    if (ops.length) {
      await DailyPrice.bulkWrite(ops, { ordered: false });
    }

    console.log(
      totalFilled > 0
        ? `[DailyPrice] ✓ Backfill complete — ${totalFilled} missing daily records written`
        : `[DailyPrice] ✓ No backfill needed — DailyPrice is up to date`
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
 * accumulating real ticks. Only runs if there are fewer than 10 existing
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

    // Current IST time in seconds from midnight
    const nowUTC = Date.now();
    const nowIST = new Date(nowUTC + 5.5 * 60 * 60 * 1000);
    const nowSecondsIST =
      nowIST.getUTCHours() * 3600 + nowIST.getUTCMinutes() * 60 + nowIST.getUTCSeconds();

    // End time is current IST time (market never closes)
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
      // Resolve starting price: MarketState → basePrice
      let price = asset.basePrice;
      try {
        const state = await MarketState.findOne({ ticker: asset.ticker }).lean();
        if (state && state.lastPrice > 0) price = state.lastPrice;
      } catch (_) {
        /* use basePrice */
      }

      let prevPrice = price;

      for (let i = 0; i < tickCount; i++) {
        // Reduced intraday volatility (same as seed script)
        const delta = asset.volatility * 0.25 * gaussian();
        price = Math.max(1, parseFloat((price * (1 + delta)).toFixed(2)));

        const change = parseFloat((price - prevPrice).toFixed(2));
        const pct = prevPrice > 0 ? (change / prevPrice) * 100 : 0;
        const sign = pct >= 0 ? '+' : '';
        const changePercent = `${sign}${pct.toFixed(2)}%`;

        // Compute UTC timestamp for this tick
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
    }
  } catch (err) {
    console.error('[Intraday] backfillIntradayToday failed:', err.message);
  }
};

module.exports = { writeTodayClose, backfillMissingDays, backfillIntradayToday };
