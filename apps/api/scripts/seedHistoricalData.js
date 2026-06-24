/**
 * seedHistoricalData.js
 *
 * Populates MongoDB with synthetic historical price data so the chart UI has
 * something to render immediately after a fresh install.
 *
 * ─── Asset-aware seeding ────────────────────────────────────────────────────
 *
 * STOCKS:
 *   - DailyPrice: oldest day → TODAY (inclusive).  Today's record is the
 *                 last intraday tick; mseWorker overwrites it every 30s once
 *                 the server is running.
 *   - StockPriceHistory: synthetic 30s ticks for today.
 *   - MarketState: tier-2 record for stock recovery.
 *
 * MUTUAL FUNDS:
 *   - DailyPrice: oldest day → TODAY (inclusive).  The most recent DailyPrice
 *                 record IS the current NAV — it's what the chart's last point
 *                 shows and what the quote API returns.  No separate MarketState
 *                 record is needed; MF prices are not part of the three-tier chain.
 *
 * ─── Collections written ────────────────────────────────────────────────────
 *   dailyprices         — daily history for both stocks and MFs through today
 *   stockpricehistories — 30-second intraday ticks for TODAY (stocks only)
 *   marketstates        — latest price per stock (tier-2 runtime recovery)
 *
 * ─── Collections you MUST clear before running ──────────────────────────────
 *   The script will print a warning and exit if the target collections are
 *   non-empty, unless you pass --force.
 *
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
  const stocks = assets.filter((a) => a.assetType === ASSET_TYPES.STOCK);
  const mutualFunds = assets.filter((a) => a.assetType === ASSET_TYPES.MUTUAL_FUND);
  console.log(`✓ Found ${stocks.length} stocks + ${mutualFunds.length} mutual funds\n`);

  await guardEmpty();

  const today = todayIST();
  // Stock daily-close dates: [oldest … yesterday].  Today's DailyPrice is
  // written separately below using the last intraday tick price; it will be
  // overwritten by the mseWorker on every 30s tick once the server is up.
  const stockDates = Array.from({ length: DAYS }, (_, i) => dateIST(DAYS - i));
  // MF dates: [oldest … TODAY] — DailyPrice IS the source of truth for MF NAV.
  const mfDates = Array.from({ length: DAYS + 1 }, (_, i) => dateIST(DAYS - i));

  // ── Phase 1a: simulate stock daily closes ──────────────────────────────

  console.log(`Simulating ${DAYS} days of stock daily closes…`);
  const stockOps = [];
  const stockFinalPrices = {}; // ticker → last simulated daily close

  for (const asset of stocks) {
    let price = asset.basePrice;
    for (const date of stockDates) {
      price = nextDayPrice(price, asset.volatility);
      stockOps.push({
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
    stockFinalPrices[asset.ticker] = price;
  }

  if (stockOps.length) {
    const r = await DailyPrice.bulkWrite(stockOps, { ordered: false });
    const written = (r.upsertedCount || 0) + (r.modifiedCount || 0);
    console.log(`✓ DailyPrice (stocks): ${written} / ${stockOps.length} records written`);
  }

  // ── Phase 1b: simulate MF daily NAVs through TODAY ─────────────────────

  console.log(`\nSimulating ${DAYS + 1} days of MF NAVs (through today)…`);
  const mfOps = [];

  for (const asset of mutualFunds) {
    let price = asset.basePrice;
    for (const date of mfDates) {
      price = nextDayPrice(price, asset.volatility);
      mfOps.push({
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
  }

  if (mfOps.length) {
    const r = await DailyPrice.bulkWrite(mfOps, { ordered: false });
    const written = (r.upsertedCount || 0) + (r.modifiedCount || 0);
    console.log(`✓ DailyPrice (MFs):    ${written} / ${mfOps.length} records written`);
  }

  // ── Phase 2: simulate today's 30-second intraday ticks (stocks only) ────

  console.log(`\nSimulating today's intraday 30s ticks for stocks…`);
  const intradayDocs = [];
  const dayStartUTC = istMidnightUTC(today);

  // 24-hour market: generate ticks from 00:00 IST up to current IST time
  const MARKET_OPEN_OFFSET_S = 0; // 00:00 IST
  const TICK_INTERVAL_S = 30;

  const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const nowSecondsIST =
    nowIST.getUTCHours() * 3600 + nowIST.getUTCMinutes() * 60 + nowIST.getUTCSeconds();
  const tickCount = Math.floor((nowSecondsIST - MARKET_OPEN_OFFSET_S) / TICK_INTERVAL_S);

  for (const asset of stocks) {
    let price = stockFinalPrices[asset.ticker] ?? asset.basePrice;
    let prevPrice = price;

    for (let i = 0; i < tickCount; i++) {
      const delta = asset.volatility * 0.25 * gaussianNoise();
      price = Math.max(1, parseFloat((price * (1 + delta)).toFixed(2)));

      const change = parseFloat((price - prevPrice).toFixed(2));
      const pct = prevPrice > 0 ? (change / prevPrice) * 100 : 0;
      const sign = pct >= 0 ? '+' : '';
      const changePercent = `${sign}${pct.toFixed(2)}%`;

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
      stockFinalPrices[asset.ticker] = price; // update for MarketState
    }
  }

  if (intradayDocs.length) {
    await StockPriceHistory.insertMany(intradayDocs, { ordered: false });
    console.log(`✓ StockPriceHistory: ${intradayDocs.length} intraday ticks inserted`);
  } else {
    console.log('  (no intraday ticks — no stock assets found)');
  }

  // ── Phase 2b: today's DailyPrice for stocks ─────────────────────────────
  // Use the last intraday tick price as today's "live snapshot".  The mseWorker
  // will overwrite this on its first tick once the server starts.

  const stockTodayOps = stocks.map((asset) => ({
    updateOne: {
      filter: { ticker: asset.ticker, date: today },
      update: {
        $set: {
          ticker: asset.ticker,
          assetType: asset.assetType,
          date: today,
          closePrice: stockFinalPrices[asset.ticker] ?? asset.basePrice,
        },
      },
      upsert: true,
    },
  }));
  if (stockTodayOps.length) {
    await DailyPrice.bulkWrite(stockTodayOps, { ordered: false });
    console.log(
      `✓ DailyPrice (stocks today): ${stockTodayOps.length} records written for ${today}`
    );
  }

  // ── Phase 3: upsert MarketState for STOCKS only ─────────────────────────

  console.log('\nWriting MarketState for stocks (tier-2 runtime recovery)…');
  const now = new Date();
  const stateOps = stocks.map((asset) => ({
    updateOne: {
      filter: { ticker: asset.ticker },
      update: {
        $set: {
          lastPrice: stockFinalPrices[asset.ticker] ?? asset.basePrice,
          lastUpdatedAt: now,
        },
      },
      upsert: true,
    },
  }));
  if (stateOps.length) {
    await MarketState.bulkWrite(stateOps, { ordered: false });
    console.log(`✓ MarketState (stocks): ${stateOps.length} records upserted`);
  }
  console.log(`  (mutual funds intentionally skipped — DailyPrice is their source of truth)`);

  // ── Summary ──────────────────────────────────────────────────────────────

  console.log(`
✅  Seed complete!
    Stocks:          ${stocks.length}    (${stockDates[0]} → ${stockDates[stockDates.length - 1]})
    Mutual Funds:    ${mutualFunds.length}    (${mfDates[0]} → ${mfDates[mfDates.length - 1]})
    DailyPrice:      ${stockOps.length + mfOps.length}
    Intraday ticks:  ${intradayDocs.length}
    MarketState:     ${stateOps.length}  (stocks only)
`);
};

seed()
  .catch((err) => {
    console.error('\n✗ Seed failed:', err.message);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
