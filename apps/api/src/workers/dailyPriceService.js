/**
 * Daily Price Service
 *
 * Handles DailyPrice writes without BullMQ or a fixed cron schedule.
 * Two entry points:
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
 * Design rules:
 *   - Only writes to DailyPrice and MarketState. Never touches Asset.
 *   - Asset.basePrice is the seed / last-resort fallback — never written here.
 *   - Backfill uses only MarketState for the starting price (no Redis — on boot
 *     Redis may be empty).
 *   - All writes are bulk upserts — safe to re-run, no duplicates.
 *   - All errors are logged and swallowed — neither function should crash the
 *     server on failure.
 */

const Asset = require('../modules/asset/asset.model');
const MarketState = require('../modules/market/marketState.model');
const DailyPrice = require('../modules/market/dailyPrice.model');
const redis = require('../shared/redis');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Box-Muller Gaussian sample (μ=0, σ=1) */
const gaussian = () => {
  const u1 = 1 - Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
};

/** Advance price one day using the simplified MSE random-walk (no Sm/Ts). */
const nextDayPrice = (prev, volatility) =>
  Math.max(1, parseFloat((prev * (1 + volatility * gaussian())).toFixed(2)));

/**
 * Returns a date N calendar days offset from now as YYYY-MM-DD in IST (UTC+5:30).
 * offset = 0 → today, offset = -1 → yesterday, offset = -7 → 7 days ago.
 */
const dateIST = (offset = 0) => {
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
        const closePrice = await resolvePrice(asset.ticker, asset.basePrice);
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

module.exports = { writeTodayClose, backfillMissingDays };
