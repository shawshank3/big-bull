/**
 * Market Service
 *
 * All prices and search results come from the internal Asset catalog.
 * No external API calls (Alpha Vantage / MFAPI) exist in this module.
 * All monetary values are in ₹ (Indian Rupees).
 *
 * ─── Asset-aware price resolution ───────────────────────────────────────────
 *
 * STOCKS — three-tier chain (intraday simulation):
 *   1. Redis `price:<ticker>` (TTL 60s — live MSE tick)
 *   2. MarketState.lastPrice  (durable MongoDB record)
 *   3. Asset.basePrice        (seed value — last resort)
 *
 * MUTUAL FUNDS — single source of truth (one NAV per IST day):
 *   1. DailyPrice for today (this IS the current NAV)
 *   2. Most recent DailyPrice (graceful degradation if today is missing)
 *   3. Asset.basePrice        (last resort, only on a brand-new install)
 *
 * Use `resolveAssetPrice(asset)` for any code path that needs the current
 * price of an arbitrary asset.  The legacy `resolvePrice(ticker, basePrice)`
 * helper is retained for stock-only call sites.
 */
const redis = require('../../shared/redis');
const Asset = require('../asset/asset.model');
const MarketState = require('./marketState.model');
const DailyPrice = require('./dailyPrice.model');
const { ASSET_TYPES, PRICE_LABELS } = require('../../shared/constants');
const { todayIST } = require('../../utils/priceSimulation');

/**
 * resolveStockPrice(ticker, basePrice)
 *
 * Three-tier price resolution for STOCKS only.  Mutual funds must use
 * `resolveMfPrice()` instead — DailyPrice is their source of truth.
 *
 * @param {string} ticker
 * @param {number} basePrice
 * @returns {Promise<number>}
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

  // Tier 3 — seed price
  return basePrice;
};

/**
 * resolveMfPrice(ticker, basePrice)
 *
 * Returns the current NAV for a mutual fund:
 *   1. Today's DailyPrice (the chart's last point — same record)
 *   2. Most recent DailyPrice (gracefully degrades if today is briefly missing)
 *   3. Asset.basePrice (only on a brand-new install before the first ensureMf run)
 *
 * @param {string} ticker
 * @param {number} basePrice
 * @returns {Promise<number>}
 */
const resolveMfPrice = async (ticker, basePrice) => {
  const today = todayIST();
  try {
    const todayDoc = await DailyPrice.findOne({ ticker, date: today }).lean();
    if (todayDoc && todayDoc.closePrice > 0) return todayDoc.closePrice;

    const latest = await DailyPrice.findOne({ ticker }).sort({ date: -1 }).lean();
    if (latest && latest.closePrice > 0) return latest.closePrice;
  } catch (_) {
    /* fall through to basePrice */
  }
  return basePrice;
};

/**
 * resolveAssetPrice(asset)
 *
 * Asset-type-aware price resolution.  Use this in any code path that needs
 * a current price without caring about the asset type.
 *
 * @param {{ ticker: string, basePrice: number, assetType: string }} asset
 * @returns {Promise<number>}
 */
const resolveAssetPrice = async (asset) => {
  if (asset.assetType === ASSET_TYPES.MUTUAL_FUND) {
    return resolveMfPrice(asset.ticker, asset.basePrice);
  }
  return resolveStockPrice(asset.ticker, asset.basePrice);
};

/**
 * resolvePrice(ticker, basePrice)  [DEPRECATED — stocks-only chain]
 *
 * Retained for backwards compatibility with existing call sites that already
 * know the asset is a stock (e.g. tickers list).  New code should prefer
 * `resolveAssetPrice(asset)`.
 */
const resolvePrice = resolveStockPrice;

/**
 * Returns yesterday's IST date as YYYY-MM-DD.
 */
const yesterdayIST = () => {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000 - 86400 * 1000);
  return ist.toISOString().slice(0, 10);
};

/**
 * Compute day-over-day change for a mutual fund from yesterday's vs today's
 * DailyPrice.  Returns `{ change, changePercent }`.  Falls back to zero deltas
 * when yesterday's record is missing (cold-start).
 */
const computeMfDayDelta = async (ticker, currentPrice) => {
  try {
    const yesterday = yesterdayIST();
    const yDoc = await DailyPrice.findOne({
      ticker,
      date: { $lte: yesterday },
    })
      .sort({ date: -1 })
      .lean();

    if (yDoc && yDoc.closePrice > 0) {
      const change = parseFloat((currentPrice - yDoc.closePrice).toFixed(2));
      const pct = (change / yDoc.closePrice) * 100;
      const sign = pct >= 0 ? '+' : '';
      return { change, changePercent: `${sign}${pct.toFixed(2)}%` };
    }
  } catch (_) {
    /* fall through */
  }
  return { change: 0, changePercent: '+0.00%' };
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
      const livePrice = await resolveAssetPrice(asset).catch(() => null);
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
 *
 * STOCK: resolved via three-tier chain. change/changePercent are read from
 * the Redis payload (set by mseWorker on each tick).
 *
 * MUTUAL_FUND: resolved from today's DailyPrice. change/changePercent are
 * computed day-over-day from yesterday's vs today's DailyPrice.  This guarantees
 * the chart's last point and the quote price are the same value (both come
 * from today's DailyPrice record).
 *
 * @param {string} ticker - NSE ticker or MF scheme code
 */
const getQuote = async (ticker) => {
  const upperTicker = ticker.toUpperCase();
  const asset = await Asset.findOne({ ticker: upperTicker }).lean();
  if (!asset) {
    const err = new Error(`Asset not found: ${ticker}`);
    err.status = 404;
    throw err;
  }

  const price = await resolveAssetPrice(asset);

  let change = 0;
  let changePercent = '+0.00%';

  if (asset.assetType === ASSET_TYPES.MUTUAL_FUND) {
    const delta = await computeMfDayDelta(asset.ticker, price);
    change = delta.change;
    changePercent = delta.changePercent;
  } else {
    // Stocks — read change metadata from the Redis payload set by mseWorker
    try {
      const cached = await redis.get(`price:${asset.ticker}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (typeof parsed.change === 'number') change = parsed.change;
        if (typeof parsed.changePercent === 'string') changePercent = parsed.changePercent;
      }
    } catch (_) {
      /* non-fatal */
    }
  }

  const quote = {
    type: asset.assetType,
    ticker: asset.ticker,
    symbol: asset.ticker,
    name: asset.name,
    assetType: asset.assetType,
    price,
    priceLabel: PRICE_LABELS[asset.assetType] || 'Price',
    currency: 'INR',
    change,
    changePercent,
    sector: asset.sector,
    // MF metadata (present only for MUTUAL_FUND)
    ...(asset.assetType === ASSET_TYPES.MUTUAL_FUND && {
      schemeCode: asset.ticker,
      fundHouse: null,
      schemeCategory: asset.sector,
      schemeType: ASSET_TYPES.MUTUAL_FUND,
    }),
    asOf: todayIST(),
  };

  return quote;
};

/**
 * getTicker()
 *
 * Returns live prices for a curated list of top NSE stocks from the catalog.
 * Used by the UI ticker strip (stocks only — MFs do not appear in the strip).
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
      const price = await resolveAssetPrice(asset);

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
  type: asset.assetType === ASSET_TYPES.STOCK ? 'stock' : 'mutual',
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

module.exports = {
  searchAssets,
  getQuote,
  getTicker,
  resolvePrice,
  resolveAssetPrice,
  resolveStockPrice,
  resolveMfPrice,
};
