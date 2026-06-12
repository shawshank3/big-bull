/**
 * Legacy Market Controller  (/api/market/*)
 *
 * These routes are kept for backward compatibility only.
 * All new code should use /api/v1/market/* instead.
 *
 * Alpha Vantage has been fully removed. All search, quotes, and ticker data
 * now come from the internal Asset catalog + Redis price cache.
 */
const { sendSuccess, sendError } = require('../utils/response');
const { searchAssets, getQuote, getTicker } = require('../modules/market/market.service');
const { SEARCH_MIN_LENGTH } = require('../config/market');

const search = async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    if (query.length < SEARCH_MIN_LENGTH) {
      return sendError(res, `Search query must be at least ${SEARCH_MIN_LENGTH} characters`, 400);
    }
    const data = await searchAssets(query);
    return sendSuccess(res, data, 'Market search completed');
  } catch (error) {
    return sendError(res, error.message || 'Market search failed', error.status || 500);
  }
};

const getStock = async (req, res) => {
  try {
    const symbol = String(req.params.symbol || '').trim().toUpperCase().replace(/\.(BSE|NSE|BOM)$/i, '');
    if (!symbol) return sendError(res, 'Stock symbol is required', 400);
    const data = await getQuote(symbol);
    return sendSuccess(res, data, 'Stock quote retrieved');
  } catch (error) {
    return sendError(res, error.message || 'Failed to get stock quote', error.status || 500);
  }
};

const getMutual = async (req, res) => {
  try {
    const schemeCode = String(req.params.schemeCode || '').trim();
    if (!schemeCode) return sendError(res, 'Scheme code is required', 400);
    const data = await getQuote(schemeCode);
    return sendSuccess(res, data, 'Mutual fund quote retrieved');
  } catch (error) {
    return sendError(res, error.message || 'Failed to get mutual fund quote', error.status || 500);
  }
};

const getTickerHandler = async (req, res) => {
  try {
    const data = await getTicker();
    return sendSuccess(res, data, 'Ticker quotes retrieved');
  } catch (error) {
    return sendError(res, error.message || 'Failed to get ticker quotes', error.status || 500);
  }
};

module.exports = {
  search,
  getStock,
  getMutual,
  getTicker: getTickerHandler,
};
