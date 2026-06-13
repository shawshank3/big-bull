/**
 * Market Service
 *
 * All prices and search results come from the internal Asset catalog and Redis
 * price cache (populated by the MSE BullMQ worker).
 *
 * No external API calls (Alpha Vantage / MFAPI) exist in this module.
 * All monetary values are in ₹ (Indian Rupees).
 */
const redis = require('../../shared/redis');
const Asset = require('../asset/asset.model');

/**
 * searchAssets(query)
 *
 * Full-text search over the Asset catalog by ticker or name.
 * Results are cached in Redis for 5 minutes.
 *
 * @param {string} query - minimum 2 characters
 * @returns {{ stocks: Array, mutuals: Array, results: Array }}
 */
const searchAssets = async (query) => {
  const cacheKey = `search:${query.toLowerCase()}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (_) {
    /* Redis unavailable — fall through */
  }

  const regex = new RegExp(query, 'i');
  const assets = await Asset.find({
    $or: [{ ticker: regex }, { name: regex }],
  })
    .limit(20)
    .lean();

  const enriched = await Promise.all(
    assets.map(async (asset) => {
      let livePrice = null;
      try {
        const cached = await redis.get(`price:${asset.ticker}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          livePrice = parsed.price ?? parsed;
        }
      } catch (_) {
        /* Redis unavailable — use basePrice */
      }
      return formatAssetResult(asset, livePrice);
    })
  );

  const stocks = enriched.filter((a) => a.type === 'stock');
  const mutuals = enriched.filter((a) => a.type === 'mutual');
  const result = { query, stocks, mutuals, results: enriched };

  try {
    await redis.setex(cacheKey, 300, JSON.stringify(result));
  } catch (_) {
    /* cache write failure is non-fatal */
  }

  return result;
};

/**
 * getQuote(ticker)
 *
 * Returns the current simulated price for an asset.
 * Priority: Redis live price (set by MSE worker) → Asset.basePrice fallback.
 * Result is cached for 60 seconds.
 *
 * @param {string} ticker - NSE ticker or MF scheme code
 */
const getQuote = async (ticker) => {
  const cacheKey = `price:${ticker}`;

  // Check Redis for a live MSE-generated price
  let livePrice = null;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      livePrice = parsed.price ?? parsed; // handle both {price:N} and bare number
    }
  } catch (_) {
    /* fall through */
  }

  // Load asset metadata from catalog
  const asset = await Asset.findOne({ ticker: ticker.toUpperCase() }).lean();

  if (!asset) {
    const err = new Error(`Asset not found: ${ticker}`);
    err.status = 404;
    throw err;
  }

  const price = livePrice ?? asset.basePrice;

  const quote = {
    type: asset.assetType,
    ticker: asset.ticker,
    symbol: asset.ticker,
    name: asset.name,
    assetType: asset.assetType,
    price,
    priceLabel: asset.assetType === 'MUTUAL_FUND' ? 'NAV' : 'Price',
    currency: 'INR',
    change: 0,
    changePercent: '0.00%',
    sector: asset.sector,
    // MF metadata (present only for MUTUAL_FUND)
    ...(asset.assetType === 'MUTUAL_FUND' && {
      schemeCode: asset.ticker,
      fundHouse: null,
      schemeCategory: asset.sector,
      schemeType: 'MUTUAL_FUND',
    }),
    asOf: new Date().toISOString().split('T')[0],
  };

  // Cache the response
  try {
    await redis.setex(cacheKey, 60, JSON.stringify(quote));
  } catch (_) {
    /* non-fatal */
  }

  return quote;
};

/**
 * getTicker()
 *
 * Returns live prices for a curated list of top NSE stocks from the catalog.
 * Used by the UI ticker strip.
 */
const TICKER_SYMBOLS = [
  'RELIANCE',
  'TCS',
  'HDFCBANK',
  'INFY',
  'ICICIBANK',
  'SBIN',
  'WIPRO',
  'BAJFINANCE',
  'MARUTI',
  'HINDUNILVR',
];

const getTicker = async () => {
  const assets = await Asset.find({ ticker: { $in: TICKER_SYMBOLS } }).lean();

  const quotes = await Promise.all(
    assets.map(async (asset) => {
      let price = asset.basePrice;
      try {
        const cached = await redis.get(`price:${asset.ticker}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          price = parsed.price ?? parsed ?? price;
        }
      } catch (_) {
        /* use basePrice */
      }

      return {
        symbol: asset.ticker,
        label: asset.ticker,
        name: asset.name,
        price,
        currency: 'INR',
        change: 0,
        changePercent: '+0.00%',
        up: true,
      };
    })
  );

  return quotes;
};

// ─── Internal helper ──────────────────────────────────────────────────────────

const formatAssetResult = (asset, livePrice) => ({
  type: asset.assetType === 'STOCK' ? 'stock' : 'mutual',
  id: asset.ticker,
  assetId: asset._id,
  ticker: asset.ticker,
  symbol: asset.ticker,
  schemeCode: asset.ticker,
  name: asset.name,
  sector: asset.sector,
  exchange: asset.exchange ?? null,
  basePrice: asset.basePrice,
  currentPrice: livePrice ?? asset.basePrice, // ← new field
  currency: 'INR',
});

module.exports = { searchAssets, getQuote, getTicker };
