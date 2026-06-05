/**
 * Market Controller
 * Search and quote endpoints for stocks and mutual funds
 */
const { sendSuccess, sendError } = require('../utils/response');
const { searchMarket } = require('../services/marketSearchService');
const { getStockQuote } = require('../services/alphaVantageService');
const { getMutualFundQuote } = require('../services/mfapiService');
const { SEARCH_MIN_LENGTH } = require('../config/market');

/** Famous BSE large-cap stocks for the ticker strip */
const TICKER_SYMBOLS = [
  'RELIANCE.BSE',
  'TCS.BSE',
  'HDFCBANK.BSE',
  'INFY.BSE',
  'ICICIBANK.BSE',
  'WIPRO.BSE',
  'BAJFINANCE.BSE',
  'MARUTI.BSE',
  'HINDUNILVR.BSE',
  'SBIN.BSE',
];

/**
 * In-memory ticker cache.
 * Alpha Vantage free tier: ~25 req/day, 5 req/min.
 * 10 symbols fetched sequentially (15s apart) = ~2.5 min to fill.
 * Cache TTL of 5 min means at most ~2 full refreshes/day — safe for free tier.
 */
let tickerCache = null;
const TICKER_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** Guard so only one background refresh runs at a time */
let refreshInFlight = false;

// ─── Helpers ────────────────────────────────────────────────────────────────

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normaliseQuote = (q) => {
  const label = q.symbol.replace(/\.(BSE|NSE|BOM)$/i, '');
  const rawPct = typeof q.changePercent === 'string'
    ? q.changePercent.replace('%', '').trim()
    : String(q.changePercent ?? '0');
  const numericChange = parseFloat(rawPct);
  return {
    symbol: q.symbol,
    label,
    price: q.price,
    currency: q.currency,
    change: q.change,
    changePercent: `${numericChange >= 0 ? '+' : ''}${numericChange.toFixed(2)}%`,
    up: numericChange >= 0,
    asOf: q.asOf,
  };
};

/**
 * Fetch all TICKER_SYMBOLS one-by-one with a 15s gap between each call
 * to stay under the 5 req/min Alpha Vantage limit.
 * Failed symbols are skipped so a single bad quote doesn't abort the batch.
 */
const fetchTickerData = async () => {
  const DELAY_MS = 15_000;
  const data = [];
  for (let i = 0; i < TICKER_SYMBOLS.length; i++) {
    const symbol = TICKER_SYMBOLS[i];
    try {
      const q = await getStockQuote(symbol);
      data.push(normaliseQuote(q));
      console.log(`Ticker: fetched ${symbol}`);
    } catch (err) {
      console.warn(`Ticker: skipping ${symbol} — ${err.message}`);
    }
    if (i < TICKER_SYMBOLS.length - 1) {
      await delay(DELAY_MS);
    }
  }
  return data;
};

/**
 * Kick off a background refresh — never blocks the HTTP response.
 * If a refresh is already in flight this is a no-op.
 */
const refreshTickerInBackground = () => {
  if (refreshInFlight) return;
  refreshInFlight = true;
  fetchTickerData()
    .then((data) => {
      tickerCache = { data, expiresAt: Date.now() + TICKER_CACHE_TTL_MS };
      console.log(`Ticker: cache ready — ${data.length}/${TICKER_SYMBOLS.length} symbols`);
    })
    .catch((err) => console.error('Ticker refresh failed:', err))
    .finally(() => { refreshInFlight = false; });
};

// Warm the cache immediately when the module loads (server start).
// The server starts instantly; the cache fills in the background over ~2.5 min.
console.log('Ticker: starting background cache warm...');
refreshTickerInBackground();

// ─── Route Handlers ──────────────────────────────────────────────────────────

const search = async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    if (query.length < SEARCH_MIN_LENGTH) {
      return sendError(res, `Search query must be at least ${SEARCH_MIN_LENGTH} characters`, 400);
    }
    const data = await searchMarket(query);
    return sendSuccess(res, data, 'Market search completed');
  } catch (error) {
    console.error('Market search error:', error);
    return sendError(res, error.message || 'Market search failed', error.status || 500);
  }
};

const getStock = async (req, res) => {
  try {
    const symbol = String(req.params.symbol || '').trim().toUpperCase();
    if (!symbol) return sendError(res, 'Stock symbol is required', 400);
    const data = await getStockQuote(symbol);
    return sendSuccess(res, data, 'Stock quote retrieved');
  } catch (error) {
    console.error('Stock quote error:', error);
    return sendError(res, error.message || 'Failed to get stock quote', error.status || 500);
  }
};

const getMutual = async (req, res) => {
  try {
    const schemeCode = String(req.params.schemeCode || '').trim();
    if (!schemeCode) return sendError(res, 'Scheme code is required', 400);
    const data = await getMutualFundQuote(schemeCode);
    return sendSuccess(res, data, 'Mutual fund quote retrieved');
  } catch (error) {
    console.error('Mutual fund quote error:', error);
    return sendError(res, error.message || 'Failed to get mutual fund quote', error.status || 500);
  }
};

/**
 * GET /api/market/ticker
 *
 * Always responds instantly:
 *  - Cache is fresh  → return cached data
 *  - Cache is stale  → return stale data + trigger background refresh
 *  - Cache is empty  → return [] (UI falls back to static data while warming up)
 */
const getTicker = (req, res) => {
  try {
    if (tickerCache?.data?.length) {
      if (tickerCache.expiresAt <= Date.now()) {
        // Stale-while-revalidate: serve old data, refresh behind the scenes
        refreshTickerInBackground();
      }
      return sendSuccess(res, tickerCache.data, 'Ticker quotes retrieved');
    }
    // Still warming up on first server start
    return sendSuccess(res, [], 'Ticker warming up');
  } catch (error) {
    console.error('Ticker quotes error:', error);
    return sendError(res, error.message || 'Failed to get ticker quotes', error.status || 500);
  }
};

module.exports = {
  search,
  getStock,
  getMutual,
  getTicker,
};
