/**
 * seedHistoricalData.js
 *
 * Populates MongoDB with synthetic historical price data so the chart UI has
 * something to render immediately after a fresh install.
 *
 * ─── Collections written ────────────────────────────────────────────────────
 *   dailyprices         — one document per (ticker, date) for all N days
 *   stockpricehistories — 30-second intraday ticks for TODAY only (stocks)
 *   marketstates        — latest price per ticker (Tier 2 runtime recovery)
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
 *   Uses the same MSE formula as the live worker (via shared priceSimulation
 *   utilities):
 *     Price_t = Price_{t-1} × (1 + V_a × N)
 *   where N ~ N(0,1) and V_a is the asset's volatility.
 *   The simulation produces realistic random-walk price series.
 *
 * ─── Asset universe ─────────────────────────────────────────────────────────
 *   Reads all assets from DB (seeded by seed.js). Currently supports:
 *     100 NSE stocks + 15 mutual funds = 115 instruments
 *
 * ─── Usage ──────────────────────────────────────────────────────────────────
 *   pnpm seed:history                             # requires empty collections
 *   pnpm seed:history-force                       # drops & re-seeds
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
const { gaussianNoise, nextDayPrice, todayIST } = require('../src/utils/priceSimulation');

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const daysArg = args.find((a) => a.startsWith('--days'));
const DAYS = daysArg ? parseInt(daysArg.split('=')[1] ?? args[args.indexOf(daysArg) + 1], 10) : 30;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** YYYY-MM-DD string N days before today in IST (UTC+5:30) */
const dateIST = (daysBack) => {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000 - daysBack * 86400 * 1000);
  return ist.toISOString().slice(0, 10);
};

/** IST midnight as UTC Date for a given YYYY-MM-DD string */
const istMidnightUTC = (dateStr) => {
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
    console.error('✗ No assets found. Run `pnpm seed` first.');
    process.exit(1);
  }
  console.log(`✓ Found ${assets.length} assets\n`);

  await guardEmpty();

  // Build date list: [oldest … yesterday] — today is excluded as per DailyPrice design
  // (writeTodayClose() owns today on shutdown)
  const dates = Array.from({ length: DAYS }, (_, i) => dateIST(DAYS - i));
  const today = todayIST();

  // ── Phase 1: simulate daily prices for all DAYS ──────────────────────────

  console.log(`Simulating ${DAYS} days of daily closes…`);
  const dailyOps = [];
  const finalPrices = {}; // ticker → last simulated price (used for MarketState + intraday)

  for (const asset of assets) {
    let price = asset.basePrice;

    for (const date of dates) {
      // One random-walk step per day using shared utility
      price = nextDayPrice(price, asset.volatility);

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

  const bulkResult = await DailyPrice.bulkWrite(dailyOps, { ordered: false });
  const dailyWritten = (bulkResult.upsertedCount || 0) + (bulkResult.modifiedCount || 0);
  console.log(`✓ DailyPrice: ${dailyWritten} / ${dailyOps.length} records written`);

  // ── Phase 2: simulate today's 30-second intraday ticks (stocks only) ────

  console.log(`\nSimulating today's intraday 30s ticks for stocks…`);
  const intradayDocs = [];
  const dayStartUTC = istMidnightUTC(today);

  // 24-hour market: generate ticks from 00:00 IST up to current IST time
  const MARKET_OPEN_OFFSET_S = 0; // 00:00 IST
  const TICK_INTERVAL_S = 30;

  // Current IST time in seconds from midnight
  const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const nowSecondsIST =
    nowIST.getUTCHours() * 3600 + nowIST.getUTCMinutes() * 60 + nowIST.getUTCSeconds();
  const tickCount = Math.floor((nowSecondsIST - MARKET_OPEN_OFFSET_S) / TICK_INTERVAL_S);

  const stocks = assets.filter((a) => a.assetType === ASSET_TYPES.STOCK);

  for (const asset of stocks) {
    // Start intraday from the last simulated daily price
    let price = finalPrices[asset.ticker] ?? asset.basePrice;
    let prevPrice = price;

    for (let i = 0; i < tickCount; i++) {
      // Smaller intraday volatility (same 0.25× scaling as dailyPriceService)
      const delta = asset.volatility * 0.25 * gaussianNoise();
      price = Math.max(1, parseFloat((price * (1 + delta)).toFixed(2)));

      const change = parseFloat((price - prevPrice).toFixed(2));
      const pct = prevPrice > 0 ? (change / prevPrice) * 100 : 0;
      const sign = pct >= 0 ? '+' : '';
      const changePercent = `${sign}${pct.toFixed(2)}%`;

      // Compute UTC timestamp: IST midnight (UTC) + market open offset + tick offset
      const timestamp = new Date(
        dayStartUTC.getTime() + (MARKET_OPEN_OFFSET_S + i * TICK_INTERVAL_S) * 1000
      );

      intradayDocs.push({
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

  if (intradayDocs.length) {
    await StockPriceHistory.insertMany(intradayDocs, { ordered: false });
    console.log(`✓ StockPriceHistory: ${intradayDocs.length} intraday ticks inserted`);
  } else {
    console.log('  (no intraday ticks — no stock assets found)');
  }

  // ── Phase 3: upsert MarketState for all assets ───────────────────────────

  console.log('\nWriting MarketState (Tier 2 runtime recovery)…');
  const now = new Date();
  const stateOps = assets.map((asset) => {
    const updateFields = {
      lastPrice: finalPrices[asset.ticker] ?? asset.basePrice,
      lastUpdatedAt: now,
    };

    // For mutual funds, set lastNavDate to today so the mseWorker does not
    // re-roll the NAV on its first tick after seeding.
    if (asset.assetType === ASSET_TYPES.MUTUAL_FUND) {
      updateFields.lastNavDate = today;
    }

    return {
      updateOne: {
        filter: { ticker: asset.ticker },
        update: { $set: updateFields },
        upsert: true,
      },
    };
  });
  await MarketState.bulkWrite(stateOps, { ordered: false });
  console.log(`✓ MarketState: ${stateOps.length} records upserted`);

  // ── Summary ──────────────────────────────────────────────────────────────

  console.log(`
✅  Seed complete!
    Days seeded:       ${DAYS}  (${dates[0]} → ${dates[dates.length - 1]})
    Assets:            ${assets.length}  (${stocks.length} stocks + ${assets.length - stocks.length} mutual funds)
    DailyPrice docs:   ${dailyOps.length}
    Intraday ticks:    ${intradayDocs.length}
    MarketState docs:  ${stateOps.length}
`);
};

seed()
  .catch((err) => {
    console.error('\n✗ Seed failed:', err.message);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
