/**
 * seedHistoricalData.js
 *
 * ⚠️  DO NOT COMMIT — local development utility only.
 *
 * Populates MongoDB with 30 days of synthetic historical price data so the
 * chart UI has something to render immediately after a fresh install.
 *
 * ─── Collections written ────────────────────────────────────────────────────
 *   dailyprices        — one document per (ticker, date) for all 30 days
 *   stockpricehistories — 30-second intraday ticks for TODAY only (stocks)
 *   marketstates        — latest price per ticker (Phase 2 runtime recovery)
 *
 * ─── Collections you MUST clear before running ──────────────────────────────
 *   The script will print a warning and exit if the target collections are
 *   non-empty, unless you pass --force.
 *
 *   Run once to clear then seed:
 *     node scripts/seedHistoricalData.js --force
 *
 *   Or manually in Mongo shell / Compass before running the script:
 *     db.dailyprices.deleteMany({})
 *     db.stockpricehistories.deleteMany({})
 *     db.marketstates.deleteMany({})
 *
 * ─── Price simulation ───────────────────────────────────────────────────────
 *   Uses the same MSE formula as the live worker:
 *     Price_t = Price_{t-1} × (1 + V_a × N)
 *   where N ~ N(0,1) and V_a is the asset's volatility.
 *   The simulation produces realistic random-walk price series.
 *
 * ─── Usage ──────────────────────────────────────────────────────────────────
 *   node scripts/seedHistoricalData.js
 *   node scripts/seedHistoricalData.js --force    # skip non-empty guard
 *   node scripts/seedHistoricalData.js --days 60  # seed more days
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Asset = require('../src/modules/asset/asset.model');
const DailyPrice = require('../src/modules/market/dailyPrice.model');
const StockPriceHistory = require('../src/modules/market/stockPriceHistory.model');
const MarketState = require('../src/modules/market/marketState.model');
const { ASSET_TYPES } = require('../src/shared/constants');

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const daysArg = args.find((a) => a.startsWith('--days'));
const DAYS = daysArg ? parseInt(daysArg.split('=')[1] ?? args[args.indexOf(daysArg) + 1], 10) : 30;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Box-Muller Gaussian sample (μ=0, σ=1) */
const gaussian = () => {
  const u1 = 1 - Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
};

/** Advance price one step using the MSE formula */
const nextPrice = (prev, volatility) => {
  const delta = volatility * gaussian();
  return Math.max(1, parseFloat((prev * (1 + delta)).toFixed(2)));
};

/** YYYY-MM-DD string N days before today in IST (UTC+5:30) */
const dateIST = (daysBack) => {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000 - daysBack * 86400 * 1000);
  return ist.toISOString().slice(0, 10);
};

/** IST start-of-day as UTC Date for a YYYY-MM-DD string */
const istDayStartUTC = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - 5.5 * 60 * 60 * 1000);
};

// ─── Guard: check collections are empty ──────────────────────────────────────

const guardEmpty = async () => {
  const [dp, sp, ms] = await Promise.all([
    DailyPrice.estimatedDocumentCount(),
    StockPriceHistory.estimatedDocumentCount(),
    MarketState.estimatedDocumentCount(),
  ]);
  const total = dp + sp + ms;
  if (total > 0 && !FORCE) {
    console.error(
      `\n✗ Collections are not empty:\n` +
        `    dailyprices:          ${dp} docs\n` +
        `    stockpricehistories:  ${sp} docs\n` +
        `    marketstates:         ${ms} docs\n\n` +
        `  Clear them first (see script header), then re-run.\n` +
        `  Or run with --force to skip this check.\n`
    );
    process.exit(1);
  }
  if (FORCE && total > 0) {
    console.log(`⚠️  --force: dropping ${total} existing documents from target collections…`);
    await Promise.all([
      DailyPrice.deleteMany({}),
      StockPriceHistory.deleteMany({}),
      MarketState.deleteMany({}),
    ]);
    console.log('✓ Collections cleared\n');
  }
};

// ─── Main seed ────────────────────────────────────────────────────────────────

const seed = async () => {
  const MONGO_URI = process.env.MONGODB_URI;
  if (!MONGO_URI) {
    console.error('✗ MONGODB_URI is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected to MongoDB');

  const assets = await Asset.find({}).lean();
  if (!assets.length) {
    console.error('✗ No assets found. Run `npm run seed` first.');
    process.exit(1);
  }
  console.log(`✓ Found ${assets.length} assets\n`);

  await guardEmpty();

  // Build date list: [oldest … today]
  const dates = Array.from({ length: DAYS }, (_, i) => dateIST(DAYS - 1 - i));
  const today = dateIST(0);

  // ── Phase 1: simulate daily prices for all DAYS ──────────────────────────

  console.log(`Simulating ${DAYS} days of daily closes…`);
  const dailyOps = [];
  const finalPrices = {}; // ticker → last simulated price (used for MarketState + intraday)

  for (const asset of assets) {
    let price = asset.basePrice;

    for (const date of dates) {
      // One random-walk step per day
      price = nextPrice(price, asset.volatility);

      dailyOps.push({
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
    }

    finalPrices[asset.ticker] = price;
  }

  const { upsertedCount: dailyUpserted, modifiedCount: dailyModified } = await DailyPrice.bulkWrite(
    dailyOps,
    { ordered: false }
  );
  console.log(
    `✓ DailyPrice: ${dailyOpsCount(dailyUpserted, dailyModified, dailyOps.length)} records written`
  );

  // ── Phase 2: simulate today's 30-second intraday ticks (stocks only) ────

  console.log(`\nSimulating today's intraday 30s ticks for stocks…`);
  const intradayOps = [];
  const dayStart = istDayStartUTC(today);

  // IST market session: 09:15 → 15:30 = 375 min = 750 thirty-second ticks
  // In the simulation (no real market hours) we use 09:00–15:30 IST = 780 ticks
  const MARKET_OPEN_OFFSET_S = 9 * 3600; // 09:00 IST in seconds from midnight
  const MARKET_CLOSE_OFFSET_S = 15.5 * 3600; // 15:30 IST
  const TICK_INTERVAL_S = 30;
  const tickCount = Math.floor((MARKET_CLOSE_OFFSET_S - MARKET_OPEN_OFFSET_S) / TICK_INTERVAL_S);

  const stocks = assets.filter((a) => a.assetType === ASSET_TYPES.STOCK);

  for (const asset of stocks) {
    // Start intraday from yesterday's close (the last simulated daily price)
    let price = finalPrices[asset.ticker] ?? asset.basePrice;
    let prevPrice = price;

    for (let i = 0; i < tickCount; i++) {
      price = nextPrice(price, asset.volatility * 0.25); // smaller intraday volatility
      const change = parseFloat((price - prevPrice).toFixed(2));
      const pct = prevPrice > 0 ? (change / prevPrice) * 100 : 0;
      const sign = pct >= 0 ? '+' : '';
      const changePercent = `${sign}${pct.toFixed(2)}%`;
      const timestamp = new Date(
        dayStart.getTime() + (MARKET_OPEN_OFFSET_S + i * TICK_INTERVAL_S) * 1000 + 5.5 * 3600 * 1000 // back to UTC from IST offset
      );

      intradayOps.push({
        ticker: asset.ticker,
        price,
        change,
        changePercent,
        timestamp,
      });

      prevPrice = price;

      // Update the "end of day" price for MarketState to today's last intraday tick
      finalPrices[asset.ticker] = price;
    }
  }

  if (intradayOps.length) {
    await StockPriceHistory.insertMany(intradayOps, { ordered: false });
    console.log(`✓ StockPriceHistory: ${intradayOps.length} intraday ticks inserted`);
  } else {
    console.log('  (no intraday ticks — no stock assets found)');
  }

  // ── Phase 3: upsert MarketState for all assets ───────────────────────────

  console.log('\nWriting MarketState (runtime recovery)…');
  const now = new Date();
  const stateOps = assets.map((asset) => ({
    updateOne: {
      filter: { ticker: asset.ticker },
      update: {
        $set: {
          lastPrice: finalPrices[asset.ticker] ?? asset.basePrice,
          lastUpdatedAt: now,
        },
      },
      upsert: true,
    },
  }));
  await MarketState.bulkWrite(stateOps, { ordered: false });
  console.log(`✓ MarketState: ${stateOps.length} records upserted`);

  // ── Summary ──────────────────────────────────────────────────────────────

  console.log(`
✅  Seed complete!
    Days seeded:       ${DAYS}  (${dates[0]} → ${dates[dates.length - 1]})
    Assets:            ${assets.length}  (${stocks.length} stocks + ${assets.length - stocks.length} mutual funds)
    DailyPrice docs:   ${dailyOps.length}
    Intraday ticks:    ${intradayOps.length}
    MarketState docs:  ${stateOps.length}
`);
};

/** Small helper to report bulk write counts consistently */
const dailyOpsCount = (upserted, modified, total) => `${upserted + modified} / ${total}`;

seed()
  .catch((err) => {
    console.error('\n✗ Seed failed:', err.message);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
