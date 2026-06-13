/**
 * Seed Script — Indian Assets + Demo User
 *
 * Populates the Assets collection with 20 NSE-listed stocks and 5 Indian mutual funds.
 * These serve as the tradeable universe for the BigBull simulation.
 * Prices are realistic INR base prices as of mid-2025.
 *
 * Run: node scripts/seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Asset = require('../src/modules/asset/asset.model');
const VirtualWallet = require('../src/modules/wallet/wallet.model');

// ── Indian Stocks (NSE) ────────────────────────────────────────────────────────
const STOCKS = [
  {
    ticker: 'RELIANCE',
    name: 'Reliance Industries Ltd',
    sector: 'OIL_GAS',
    basePrice: 2950,
    volatility: 0.018,
  },
  {
    ticker: 'TCS',
    name: 'Tata Consultancy Services Ltd',
    sector: 'IT',
    basePrice: 3780,
    volatility: 0.014,
  },
  {
    ticker: 'HDFCBANK',
    name: 'HDFC Bank Ltd',
    sector: 'BANKING',
    basePrice: 1680,
    volatility: 0.016,
  },
  { ticker: 'INFY', name: 'Infosys Ltd', sector: 'IT', basePrice: 1590, volatility: 0.015 },
  {
    ticker: 'ICICIBANK',
    name: 'ICICI Bank Ltd',
    sector: 'BANKING',
    basePrice: 1250,
    volatility: 0.017,
  },
  {
    ticker: 'SBIN',
    name: 'State Bank of India',
    sector: 'BANKING',
    basePrice: 820,
    volatility: 0.02,
  },
  { ticker: 'WIPRO', name: 'Wipro Ltd', sector: 'IT', basePrice: 460, volatility: 0.016 },
  {
    ticker: 'BAJFINANCE',
    name: 'Bajaj Finance Ltd',
    sector: 'FINANCE',
    basePrice: 7100,
    volatility: 0.022,
  },
  {
    ticker: 'MARUTI',
    name: 'Maruti Suzuki India Ltd',
    sector: 'AUTO',
    basePrice: 12400,
    volatility: 0.019,
  },
  {
    ticker: 'HINDUNILVR',
    name: 'Hindustan Unilever Ltd',
    sector: 'FMCG',
    basePrice: 2450,
    volatility: 0.013,
  },
  { ticker: 'LTIM', name: 'LTIMindtree Ltd', sector: 'IT', basePrice: 5400, volatility: 0.018 },
  {
    ticker: 'TITAN',
    name: 'Titan Company Ltd',
    sector: 'CONSUMER',
    basePrice: 3600,
    volatility: 0.021,
  },
  {
    ticker: 'ASIANPAINT',
    name: 'Asian Paints Ltd',
    sector: 'CONSUMER',
    basePrice: 2900,
    volatility: 0.015,
  },
  {
    ticker: 'AXISBANK',
    name: 'Axis Bank Ltd',
    sector: 'BANKING',
    basePrice: 1150,
    volatility: 0.018,
  },
  {
    ticker: 'SUNPHARMA',
    name: 'Sun Pharmaceutical Industries',
    sector: 'PHARMA',
    basePrice: 1680,
    volatility: 0.017,
  },
  {
    ticker: 'DRREDDY',
    name: "Dr. Reddy's Laboratories",
    sector: 'PHARMA',
    basePrice: 6300,
    volatility: 0.016,
  },
  {
    ticker: 'NESTLEIND',
    name: 'Nestle India Ltd',
    sector: 'FMCG',
    basePrice: 2350,
    volatility: 0.012,
  },
  {
    ticker: 'POWERGRID',
    name: 'Power Grid Corporation',
    sector: 'UTILITIES',
    basePrice: 330,
    volatility: 0.014,
  },
  {
    ticker: 'TATAMOTORS',
    name: 'Tata Motors Ltd',
    sector: 'AUTO',
    basePrice: 950,
    volatility: 0.025,
  },
  {
    ticker: 'ONGC',
    name: 'Oil & Natural Gas Corporation',
    sector: 'OIL_GAS',
    basePrice: 285,
    volatility: 0.02,
  },
];

// ── Indian Mutual Funds (MFAPI scheme codes as ticker) ────────────────────────
const MUTUAL_FUNDS = [
  {
    ticker: '120503',
    name: 'Mirae Asset Large Cap Fund - Direct Growth',
    sector: 'LARGE_CAP',
    basePrice: 98.5,
    volatility: 0.01,
  },
  {
    ticker: '119598',
    name: 'Axis Bluechip Fund - Direct Growth',
    sector: 'LARGE_CAP',
    basePrice: 62.8,
    volatility: 0.009,
  },
  {
    ticker: '125494',
    name: 'Parag Parikh Flexi Cap Fund - Direct Growth',
    sector: 'FLEXI_CAP',
    basePrice: 75.2,
    volatility: 0.011,
  },
  {
    ticker: '120586',
    name: 'SBI Small Cap Fund - Direct Growth',
    sector: 'SMALL_CAP',
    basePrice: 148.6,
    volatility: 0.018,
  },
  {
    ticker: '118989',
    name: 'HDFC Mid-Cap Opportunities Fund - Direct Growth',
    sector: 'MID_CAP',
    basePrice: 115.4,
    volatility: 0.014,
  },
];

const seedDatabase = async () => {
  const MONGO_URI =
    process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bigbull';

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // ── Upsert Assets (don't wipe user data) ────────────────────────────────
    let upserted = 0;
    for (const stock of STOCKS) {
      await Asset.findOneAndUpdate(
        { ticker: stock.ticker },
        {
          ...stock,
          assetType: 'STOCK',
          exchange: 'NSE',
          lastUpdated: new Date(),
        },
        { upsert: true, new: true }
      );
      upserted++;
    }

    for (const mf of MUTUAL_FUNDS) {
      await Asset.findOneAndUpdate(
        { ticker: mf.ticker },
        {
          ...mf,
          assetType: 'MUTUAL_FUND',
          lastUpdated: new Date(),
        },
        { upsert: true, new: true }
      );
      upserted++;
    }

    console.log(
      `✓ Upserted ${upserted} assets (${STOCKS.length} stocks + ${MUTUAL_FUNDS.length} mutual funds)`
    );

    // ── Demo user (idempotent) ───────────────────────────────────────────────
    let demoUser = await User.findOne({ email: 'demo@bigbull.com' });
    if (!demoUser) {
      demoUser = await User.create({
        name: 'Demo Investor',
        email: 'demo@bigbull.com',
        password: 'Demo@1234',
        role: 'CLIENT',
      });
      await VirtualWallet.create({ userId: demoUser._id, balance: 1000000 });
      console.log('✓ Created demo user: demo@bigbull.com / Demo@1234');
    } else {
      console.log('✓ Demo user already exists — skipped');
    }

    console.log('\n✅ Seed complete!');
    console.log('   Assets tradeable: 20 NSE stocks + 5 mutual funds');
    console.log('   Demo login: demo@bigbull.com / Demo@1234');
    console.log('   Starting wallet: ₹10,00,000');
  } catch (err) {
    console.error('✗ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

seedDatabase();
