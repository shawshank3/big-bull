/**
 * Seed Script — Indian Assets + Demo User
 *
 * Populates the Assets collection with 100 NSE-listed stocks and 15 Indian mutual
 * funds. These serve as the tradeable universe for the BigBull simulation.
 * Prices are realistic INR base prices as of mid-2025.
 *
 * Also creates a demo user with a funded wallet for quick testing.
 *
 * ─── Collections written ────────────────────────────────────────────────────
 *   assets          — 115 investable instruments (upserted, idempotent)
 *   users           — demo user (created only if missing)
 *   virtualwallets  — demo wallet (created only if missing)
 *
 * ─── Usage ──────────────────────────────────────────────────────────────────
 *   pnpm seed              # upsert assets, skip existing demo user
 *   pnpm seed:force        # drop all assets first, then re-seed fresh
 *   # or: node scripts/seed.js [--force]
 *
 * Safe to run multiple times — upserts assets and skips existing demo user.
 * Use --force to wipe assets and re-seed from scratch.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/modules/user/user.model');
const Asset = require('../src/modules/asset/asset.model');
const VirtualWallet = require('../src/modules/wallet/wallet.model');
const AppInsights = require('../src/modules/insights/insights.model');
const {
  ASSET_TYPES,
  EXCHANGE_TYPES,
  USER_DEFAULTS,
  USER_ROLES,
} = require('../src/shared/constants');

// ─── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const FORCE = args.includes('--force');

// ── Indian Stocks (NSE) — 100 stocks ───────────────────────────────────────────
const STOCKS = [
  // ── Large Cap — IT ────────────────────────────────────────────────────────
  {
    ticker: 'TCS',
    name: 'Tata Consultancy Services Ltd',
    sector: 'IT',
    basePrice: 3780,
    volatility: 0.014,
  },
  { ticker: 'INFY', name: 'Infosys Ltd', sector: 'IT', basePrice: 1590, volatility: 0.015 },
  { ticker: 'WIPRO', name: 'Wipro Ltd', sector: 'IT', basePrice: 460, volatility: 0.016 },
  {
    ticker: 'HCLTECH',
    name: 'HCL Technologies Ltd',
    sector: 'IT',
    basePrice: 1520,
    volatility: 0.015,
  },
  { ticker: 'TECHM', name: 'Tech Mahindra Ltd', sector: 'IT', basePrice: 1380, volatility: 0.018 },
  { ticker: 'LTIM', name: 'LTIMindtree Ltd', sector: 'IT', basePrice: 5400, volatility: 0.018 },
  {
    ticker: 'PERSISTENT',
    name: 'Persistent Systems Ltd',
    sector: 'IT',
    basePrice: 4800,
    volatility: 0.02,
  },
  { ticker: 'COFORGE', name: 'Coforge Ltd', sector: 'IT', basePrice: 5600, volatility: 0.019 },

  // ── Large Cap — Banking & Finance ─────────────────────────────────────────
  {
    ticker: 'HDFCBANK',
    name: 'HDFC Bank Ltd',
    sector: 'BANKING',
    basePrice: 1680,
    volatility: 0.016,
  },
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
  {
    ticker: 'AXISBANK',
    name: 'Axis Bank Ltd',
    sector: 'BANKING',
    basePrice: 1150,
    volatility: 0.018,
  },
  {
    ticker: 'KOTAKBANK',
    name: 'Kotak Mahindra Bank Ltd',
    sector: 'BANKING',
    basePrice: 1780,
    volatility: 0.016,
  },
  {
    ticker: 'INDUSINDBK',
    name: 'IndusInd Bank Ltd',
    sector: 'BANKING',
    basePrice: 1480,
    volatility: 0.022,
  },
  {
    ticker: 'BANKBARODA',
    name: 'Bank of Baroda',
    sector: 'BANKING',
    basePrice: 260,
    volatility: 0.022,
  },
  {
    ticker: 'PNB',
    name: 'Punjab National Bank',
    sector: 'BANKING',
    basePrice: 105,
    volatility: 0.025,
  },
  { ticker: 'CANBK', name: 'Canara Bank', sector: 'BANKING', basePrice: 108, volatility: 0.024 },
  {
    ticker: 'IDFCFIRSTB',
    name: 'IDFC First Bank Ltd',
    sector: 'BANKING',
    basePrice: 72,
    volatility: 0.026,
  },
  {
    ticker: 'BAJFINANCE',
    name: 'Bajaj Finance Ltd',
    sector: 'FINANCE',
    basePrice: 7100,
    volatility: 0.022,
  },
  {
    ticker: 'BAJAJFINSV',
    name: 'Bajaj Finserv Ltd',
    sector: 'FINANCE',
    basePrice: 1680,
    volatility: 0.02,
  },
  {
    ticker: 'HDFCLIFE',
    name: 'HDFC Life Insurance Co',
    sector: 'FINANCE',
    basePrice: 680,
    volatility: 0.016,
  },
  {
    ticker: 'SBILIFE',
    name: 'SBI Life Insurance Co',
    sector: 'FINANCE',
    basePrice: 1580,
    volatility: 0.015,
  },
  {
    ticker: 'CHOLAFIN',
    name: 'Cholamandalam Investment & Finance',
    sector: 'FINANCE',
    basePrice: 1420,
    volatility: 0.02,
  },

  // ── Large Cap — Oil & Gas / Energy ────────────────────────────────────────
  {
    ticker: 'RELIANCE',
    name: 'Reliance Industries Ltd',
    sector: 'OIL_GAS',
    basePrice: 2950,
    volatility: 0.018,
  },
  {
    ticker: 'ONGC',
    name: 'Oil & Natural Gas Corporation',
    sector: 'OIL_GAS',
    basePrice: 285,
    volatility: 0.02,
  },
  {
    ticker: 'IOC',
    name: 'Indian Oil Corporation Ltd',
    sector: 'OIL_GAS',
    basePrice: 168,
    volatility: 0.019,
  },
  {
    ticker: 'BPCL',
    name: 'Bharat Petroleum Corp Ltd',
    sector: 'OIL_GAS',
    basePrice: 340,
    volatility: 0.021,
  },
  {
    ticker: 'GAIL',
    name: 'GAIL (India) Ltd',
    sector: 'OIL_GAS',
    basePrice: 195,
    volatility: 0.019,
  },
  {
    ticker: 'ADANIENT',
    name: 'Adani Enterprises Ltd',
    sector: 'OIL_GAS',
    basePrice: 3200,
    volatility: 0.03,
  },
  {
    ticker: 'ADANIGREEN',
    name: 'Adani Green Energy Ltd',
    sector: 'OIL_GAS',
    basePrice: 1750,
    volatility: 0.032,
  },
  {
    ticker: 'ADANIPORTS',
    name: 'Adani Ports & SEZ Ltd',
    sector: 'OIL_GAS',
    basePrice: 1350,
    volatility: 0.024,
  },

  // ── Large Cap — Auto ──────────────────────────────────────────────────────
  {
    ticker: 'MARUTI',
    name: 'Maruti Suzuki India Ltd',
    sector: 'AUTO',
    basePrice: 12400,
    volatility: 0.019,
  },
  {
    ticker: 'TATAMOTORS',
    name: 'Tata Motors Ltd',
    sector: 'AUTO',
    basePrice: 950,
    volatility: 0.025,
  },
  {
    ticker: 'M&M',
    name: 'Mahindra & Mahindra Ltd',
    sector: 'AUTO',
    basePrice: 2680,
    volatility: 0.02,
  },
  {
    ticker: 'BAJAJ-AUTO',
    name: 'Bajaj Auto Ltd',
    sector: 'AUTO',
    basePrice: 9200,
    volatility: 0.018,
  },
  {
    ticker: 'HEROMOTOCO',
    name: 'Hero MotoCorp Ltd',
    sector: 'AUTO',
    basePrice: 4800,
    volatility: 0.017,
  },
  {
    ticker: 'EICHERMOT',
    name: 'Eicher Motors Ltd',
    sector: 'AUTO',
    basePrice: 4600,
    volatility: 0.019,
  },
  {
    ticker: 'TVSMOTOR',
    name: 'TVS Motor Company Ltd',
    sector: 'AUTO',
    basePrice: 2450,
    volatility: 0.021,
  },

  // ── Large Cap — Pharma & Healthcare ───────────────────────────────────────
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
  { ticker: 'CIPLA', name: 'Cipla Ltd', sector: 'PHARMA', basePrice: 1520, volatility: 0.016 },
  {
    ticker: 'DIVISLAB',
    name: "Divi's Laboratories Ltd",
    sector: 'PHARMA',
    basePrice: 4800,
    volatility: 0.018,
  },
  {
    ticker: 'APOLLOHOSP',
    name: 'Apollo Hospitals Enterprise',
    sector: 'PHARMA',
    basePrice: 6400,
    volatility: 0.019,
  },
  {
    ticker: 'MANKIND',
    name: 'Mankind Pharma Ltd',
    sector: 'PHARMA',
    basePrice: 2100,
    volatility: 0.018,
  },
  { ticker: 'BIOCON', name: 'Biocon Ltd', sector: 'PHARMA', basePrice: 340, volatility: 0.022 },

  // ── Large Cap — FMCG ──────────────────────────────────────────────────────
  {
    ticker: 'HINDUNILVR',
    name: 'Hindustan Unilever Ltd',
    sector: 'FMCG',
    basePrice: 2450,
    volatility: 0.013,
  },
  { ticker: 'ITC', name: 'ITC Ltd', sector: 'FMCG', basePrice: 465, volatility: 0.014 },
  {
    ticker: 'NESTLEIND',
    name: 'Nestle India Ltd',
    sector: 'FMCG',
    basePrice: 2350,
    volatility: 0.012,
  },
  {
    ticker: 'BRITANNIA',
    name: 'Britannia Industries Ltd',
    sector: 'FMCG',
    basePrice: 5400,
    volatility: 0.014,
  },
  { ticker: 'DABUR', name: 'Dabur India Ltd', sector: 'FMCG', basePrice: 560, volatility: 0.014 },
  { ticker: 'MARICO', name: 'Marico Ltd', sector: 'FMCG', basePrice: 620, volatility: 0.013 },
  {
    ticker: 'GODREJCP',
    name: 'Godrej Consumer Products Ltd',
    sector: 'FMCG',
    basePrice: 1350,
    volatility: 0.015,
  },
  {
    ticker: 'COLPAL',
    name: 'Colgate-Palmolive India Ltd',
    sector: 'FMCG',
    basePrice: 2800,
    volatility: 0.012,
  },
  {
    ticker: 'TATACONSUM',
    name: 'Tata Consumer Products Ltd',
    sector: 'FMCG',
    basePrice: 1120,
    volatility: 0.016,
  },

  // ── Large Cap — Consumer / Retail ─────────────────────────────────────────
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
    ticker: 'PIDILITIND',
    name: 'Pidilite Industries Ltd',
    sector: 'CONSUMER',
    basePrice: 2950,
    volatility: 0.014,
  },
  {
    ticker: 'PAGEIND',
    name: 'Page Industries Ltd',
    sector: 'CONSUMER',
    basePrice: 42000,
    volatility: 0.018,
  },
  { ticker: 'TRENT', name: 'Trent Ltd', sector: 'CONSUMER', basePrice: 5800, volatility: 0.024 },
  {
    ticker: 'DMART',
    name: 'Avenue Supermarts Ltd',
    sector: 'CONSUMER',
    basePrice: 3900,
    volatility: 0.017,
  },

  // ── Large Cap — Metals & Mining ───────────────────────────────────────────
  {
    ticker: 'TATASTEEL',
    name: 'Tata Steel Ltd',
    sector: 'METALS',
    basePrice: 155,
    volatility: 0.024,
  },
  {
    ticker: 'JSWSTEEL',
    name: 'JSW Steel Ltd',
    sector: 'METALS',
    basePrice: 920,
    volatility: 0.023,
  },
  {
    ticker: 'HINDALCO',
    name: 'Hindalco Industries Ltd',
    sector: 'METALS',
    basePrice: 620,
    volatility: 0.022,
  },
  {
    ticker: 'COALINDIA',
    name: 'Coal India Ltd',
    sector: 'METALS',
    basePrice: 470,
    volatility: 0.019,
  },
  { ticker: 'VEDL', name: 'Vedanta Ltd', sector: 'METALS', basePrice: 440, volatility: 0.026 },
  { ticker: 'NMDC', name: 'NMDC Ltd', sector: 'METALS', basePrice: 240, volatility: 0.021 },

  // ── Large Cap — Utilities / Power ─────────────────────────────────────────
  {
    ticker: 'POWERGRID',
    name: 'Power Grid Corporation',
    sector: 'UTILITIES',
    basePrice: 330,
    volatility: 0.014,
  },
  { ticker: 'NTPC', name: 'NTPC Ltd', sector: 'UTILITIES', basePrice: 380, volatility: 0.016 },
  {
    ticker: 'TATAPOWER',
    name: 'Tata Power Company Ltd',
    sector: 'UTILITIES',
    basePrice: 430,
    volatility: 0.022,
  },
  { ticker: 'NHPC', name: 'NHPC Ltd', sector: 'UTILITIES', basePrice: 92, volatility: 0.02 },
  {
    ticker: 'IREDA',
    name: 'Indian Renewable Energy Dev Agency',
    sector: 'UTILITIES',
    basePrice: 210,
    volatility: 0.028,
  },

  // ── Large Cap — Telecom & Media ───────────────────────────────────────────
  {
    ticker: 'BHARTIARTL',
    name: 'Bharti Airtel Ltd',
    sector: 'TELECOM',
    basePrice: 1650,
    volatility: 0.016,
  },
  {
    ticker: 'JIOFIN',
    name: 'Jio Financial Services Ltd',
    sector: 'TELECOM',
    basePrice: 340,
    volatility: 0.025,
  },

  // ── Large Cap — Cement & Construction ─────────────────────────────────────
  {
    ticker: 'ULTRACEMCO',
    name: 'UltraTech Cement Ltd',
    sector: 'CEMENT',
    basePrice: 11200,
    volatility: 0.017,
  },
  {
    ticker: 'SHREECEM',
    name: 'Shree Cement Ltd',
    sector: 'CEMENT',
    basePrice: 26500,
    volatility: 0.016,
  },
  {
    ticker: 'AMBUJACEM',
    name: 'Ambuja Cements Ltd',
    sector: 'CEMENT',
    basePrice: 640,
    volatility: 0.019,
  },
  { ticker: 'ACC', name: 'ACC Ltd', sector: 'CEMENT', basePrice: 2500, volatility: 0.019 },
  {
    ticker: 'GRASIM',
    name: 'Grasim Industries Ltd',
    sector: 'CEMENT',
    basePrice: 2600,
    volatility: 0.018,
  },
  {
    ticker: 'LT',
    name: 'Larsen & Toubro Ltd',
    sector: 'CEMENT',
    basePrice: 3650,
    volatility: 0.017,
  },

  // ── Large Cap — Industrials / Capital Goods ───────────────────────────────
  {
    ticker: 'HAL',
    name: 'Hindustan Aeronautics Ltd',
    sector: 'INDUSTRIALS',
    basePrice: 4400,
    volatility: 0.024,
  },
  {
    ticker: 'BEL',
    name: 'Bharat Electronics Ltd',
    sector: 'INDUSTRIALS',
    basePrice: 290,
    volatility: 0.022,
  },
  {
    ticker: 'SIEMENS',
    name: 'Siemens Ltd',
    sector: 'INDUSTRIALS',
    basePrice: 6800,
    volatility: 0.018,
  },
  {
    ticker: 'ABB',
    name: 'ABB India Ltd',
    sector: 'INDUSTRIALS',
    basePrice: 7200,
    volatility: 0.02,
  },
  {
    ticker: 'HAVELLS',
    name: 'Havells India Ltd',
    sector: 'INDUSTRIALS',
    basePrice: 1700,
    volatility: 0.017,
  },
  {
    ticker: 'VOLTAS',
    name: 'Voltas Ltd',
    sector: 'INDUSTRIALS',
    basePrice: 1650,
    volatility: 0.019,
  },

  // ── Mid Cap — Diversified ─────────────────────────────────────────────────
  { ticker: 'ZOMATO', name: 'Zomato Ltd', sector: 'CONSUMER', basePrice: 240, volatility: 0.028 },
  {
    ticker: 'PAYTM',
    name: 'One 97 Communications Ltd',
    sector: 'FINANCE',
    basePrice: 680,
    volatility: 0.032,
  },
  {
    ticker: 'NYKAA',
    name: 'FSN E-Commerce Ventures Ltd',
    sector: 'CONSUMER',
    basePrice: 175,
    volatility: 0.026,
  },
  {
    ticker: 'POLICYBZR',
    name: 'PB Fintech Ltd',
    sector: 'FINANCE',
    basePrice: 1650,
    volatility: 0.028,
  },
  {
    ticker: 'INDIGO',
    name: 'InterGlobe Aviation Ltd',
    sector: 'AUTO',
    basePrice: 4500,
    volatility: 0.022,
  },
  {
    ticker: 'IRCTC',
    name: 'Indian Railway Catering & Tourism',
    sector: 'CONSUMER',
    basePrice: 900,
    volatility: 0.022,
  },
  {
    ticker: 'LODHA',
    name: 'Macrotech Developers Ltd',
    sector: 'CEMENT',
    basePrice: 1350,
    volatility: 0.024,
  },
  {
    ticker: 'OBEROIRLTY',
    name: 'Oberoi Realty Ltd',
    sector: 'CEMENT',
    basePrice: 1850,
    volatility: 0.022,
  },
  { ticker: 'DLF', name: 'DLF Ltd', sector: 'CEMENT', basePrice: 850, volatility: 0.023 },
  {
    ticker: 'DIXON',
    name: 'Dixon Technologies India Ltd',
    sector: 'INDUSTRIALS',
    basePrice: 12500,
    volatility: 0.026,
  },
  {
    ticker: 'POLYCAB',
    name: 'Polycab India Ltd',
    sector: 'INDUSTRIALS',
    basePrice: 6500,
    volatility: 0.021,
  },
  {
    ticker: 'SOLARINDS',
    name: 'Solar Industries India Ltd',
    sector: 'INDUSTRIALS',
    basePrice: 9800,
    volatility: 0.022,
  },
  {
    ticker: 'LICI',
    name: 'Life Insurance Corp of India',
    sector: 'FINANCE',
    basePrice: 950,
    volatility: 0.018,
  },
  {
    ticker: 'MCDOWELL-N',
    name: 'United Spirits Ltd',
    sector: 'FMCG',
    basePrice: 1450,
    volatility: 0.019,
  },
  {
    ticker: 'MUTHOOTFIN',
    name: 'Muthoot Finance Ltd',
    sector: 'FINANCE',
    basePrice: 1900,
    volatility: 0.018,
  },
];

// ── Indian Mutual Funds (MFAPI scheme codes as ticker) — 15 funds ─────────────
const MUTUAL_FUNDS = [
  // ── Large Cap ─────────────────────────────────────────────────────────────
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
    ticker: '120505',
    name: 'ICICI Prudential Bluechip Fund - Direct Growth',
    sector: 'LARGE_CAP',
    basePrice: 95.2,
    volatility: 0.01,
  },

  // ── Flexi Cap ─────────────────────────────────────────────────────────────
  {
    ticker: '125494',
    name: 'Parag Parikh Flexi Cap Fund - Direct Growth',
    sector: 'FLEXI_CAP',
    basePrice: 75.2,
    volatility: 0.011,
  },
  {
    ticker: '118834',
    name: 'Kotak Flexicap Fund - Direct Growth',
    sector: 'FLEXI_CAP',
    basePrice: 68.4,
    volatility: 0.011,
  },
  {
    ticker: '119364',
    name: 'HDFC Flexi Cap Fund - Direct Growth',
    sector: 'FLEXI_CAP',
    basePrice: 45.6,
    volatility: 0.012,
  },

  // ── Mid Cap ───────────────────────────────────────────────────────────────
  {
    ticker: '118989',
    name: 'HDFC Mid-Cap Opportunities Fund - Direct Growth',
    sector: 'MID_CAP',
    basePrice: 115.4,
    volatility: 0.014,
  },
  {
    ticker: '125497',
    name: 'Kotak Emerging Equity Fund - Direct Growth',
    sector: 'MID_CAP',
    basePrice: 102.3,
    volatility: 0.014,
  },
  {
    ticker: '119775',
    name: 'Axis Midcap Fund - Direct Growth',
    sector: 'MID_CAP',
    basePrice: 88.6,
    volatility: 0.013,
  },

  // ── Small Cap ─────────────────────────────────────────────────────────────
  {
    ticker: '120586',
    name: 'SBI Small Cap Fund - Direct Growth',
    sector: 'SMALL_CAP',
    basePrice: 148.6,
    volatility: 0.018,
  },
  {
    ticker: '125354',
    name: 'Nippon India Small Cap Fund - Direct Growth',
    sector: 'SMALL_CAP',
    basePrice: 142.8,
    volatility: 0.019,
  },
  {
    ticker: '119243',
    name: 'Axis Small Cap Fund - Direct Growth',
    sector: 'SMALL_CAP',
    basePrice: 85.4,
    volatility: 0.017,
  },

  // ── Index Funds ───────────────────────────────────────────────────────────
  {
    ticker: '120716',
    name: 'UTI Nifty 50 Index Fund - Direct Growth',
    sector: 'INDEX',
    basePrice: 155.2,
    volatility: 0.009,
  },
  {
    ticker: '120684',
    name: 'HDFC Index Fund - Nifty 50 Plan - Direct Growth',
    sector: 'INDEX',
    basePrice: 195.8,
    volatility: 0.009,
  },

  // ── Sectoral / Thematic ───────────────────────────────────────────────────
  {
    ticker: '120847',
    name: 'ICICI Prudential Technology Fund - Direct Growth',
    sector: 'SECTOR',
    basePrice: 168.4,
    volatility: 0.016,
  },
];

// ─── Main Seed Logic ──────────────────────────────────────────────────────────

const seedDatabase = async () => {
  const MONGO_URI = process.env.MONGODB_URI;
  if (!MONGO_URI) {
    console.error('✗ MONGODB_URI is not set in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // ── Force mode: drop all existing assets first ───────────────────────────
    if (FORCE) {
      const deletedCount = await Asset.deleteMany({});
      console.log(`⚠️  --force: deleted ${deletedCount.deletedCount} existing assets`);
    }

    // ── Clear cached insights to ensure fresh stats are computed ──────────────
    const insightsDeleted = await AppInsights.deleteMany({});
    console.log(`✓ Cleared cached insights (${insightsDeleted.deletedCount} document(s) deleted)`);

    // ── Upsert Assets (idempotent — never destroys user data) ───────────────
    let upserted = 0;
    for (const stock of STOCKS) {
      await Asset.findOneAndUpdate(
        { ticker: stock.ticker },
        {
          ...stock,
          assetType: ASSET_TYPES.STOCK,
          exchange: EXCHANGE_TYPES.NSE,
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
          assetType: ASSET_TYPES.MUTUAL_FUND,
          lastUpdated: new Date(),
        },
        { upsert: true, new: true }
      );
      upserted++;
    }

    console.log(
      `✓ Upserted ${upserted} assets (${STOCKS.length} stocks + ${MUTUAL_FUNDS.length} mutual funds)`
    );

    // ── Demo user (idempotent — skips if exists) ─────────────────────────────
    let demoUser = await User.findOne({ email: 'demo@bigbull.com' });
    if (!demoUser) {
      demoUser = await User.create({
        name: 'Demo Investor',
        email: 'demo@bigbull.com',
        password: 'Demo@1234',
        role: USER_ROLES.CLIENT,
      });
      await VirtualWallet.create({
        userId: demoUser._id,
        balance: USER_DEFAULTS.INITIAL_BALANCE,
      });
      console.log('✓ Created demo user: demo@bigbull.com / Demo@1234');
    } else {
      console.log('✓ Demo user already exists — skipped');
    }

    console.log(`
✅  Seed complete!
    Assets tradeable:  ${STOCKS.length} NSE stocks + ${MUTUAL_FUNDS.length} mutual funds
    Demo login:        demo@bigbull.com / Demo@1234
    Starting wallet:   ₹${USER_DEFAULTS.INITIAL_BALANCE.toLocaleString('en-IN')}
`);
  } catch (err) {
    console.error('✗ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

seedDatabase();
