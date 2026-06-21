/**
 * Market Service
 *
 * All prices and search results come from the internal Asset catalog and Redis
 * price cache (populated by the MSE BullMQ worker).
 *
 * No external API calls (Alpha Vantage / MFAPI) exist in this module.
 * All monetary values are in ₹ (Indian Rupees).
 *
 * Phase 2: price resolution uses a three-tier chain:
 *   1. Redis `price:<ticker>` (TTL 60s — live MSE tick)
 *   2. MarketState.lastPrice  (durable MongoDB record)
 *   3. Asset.basePrice        (seed value — last resort)
 */
const redis = require('../../shared/redis');
const Asset = require('../asset/asset.model');
const MarketState = require('./marketState.model');

/**
 * resolvePrice(ticker, basePrice)
 *
 * Three-tier price resolution used consistently across all market queries.
 * Mirrors the same chain used in mseWorker, transaction.service, and portfolio.service.
 *
 * @param {string} ticker
 * @param {number} basePrice
 * @returns {Promise<number>}
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

  // Tier 3 — seed price
  return basePrice;
};

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
      const livePrice = await resolvePrice(asset.ticker, asset.basePrice).catch(() => null);
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

  // Load asset metadata from catalog
  const asset = await Asset.findOne({ ticker: ticker.toUpperCase() }).lean();

  if (!asset) {
    const err = new Error(`Asset not found: ${ticker}`);
    err.status = 404;
    throw err;
  }

  // Resolve price via three-tier chain (Redis → MarketState → basePrice)
  const price = await resolvePrice(asset.ticker, asset.basePrice);

  // Attempt to read change metadata from Redis (best-effort; may not exist)
  let change = 0;
  let changePercent = '+0.00%';
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (typeof parsed.change === 'number') change = parsed.change;
      if (typeof parsed.changePercent === 'string') changePercent = parsed.changePercent;
    }
  } catch (_) {
    /* non-fatal */
  }

  const quote = {
    type: asset.assetType,
    ticker: asset.ticker,
    symbol: asset.ticker,
    name: asset.name,
    assetType: asset.assetType,
    price,
    priceLabel: asset.assetType === 'MUTUAL_FUND' ? 'NAV' : 'Price',
    currency: 'INR',
    change,
    changePercent,
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

  // Cache the response for 60s
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
      // Resolve price via three-tier chain
      const price = await resolvePrice(asset.ticker, asset.basePrice);

      // Read change metadata from Redis (best-effort)
      let change = 0;
      let changePercent = '+0.00%';
      let up = true;

      try {
        const cached = await redis.get(`price:${asset.ticker}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (typeof parsed.change === 'number') change = parsed.change;
          if (typeof parsed.changePercent === 'string') changePercent = parsed.changePercent;
          if (typeof parsed.up === 'boolean') up = parsed.up;
        }
      } catch (_) {
        /* use defaults */
      }

      return {
        symbol: asset.ticker,
        label: asset.ticker,
        name: asset.name,
        price,
        currency: 'INR',
        change,
        changePercent,
        up,
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
  currentPrice: livePrice ?? asset.basePrice,
  currency: 'INR',
});

module.exports = { searchAssets, getQuote, getTicker, resolvePrice };
