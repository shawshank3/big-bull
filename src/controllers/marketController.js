/**
 * Market Controller
 * Search and quote endpoints for stocks and mutual funds
 */
const { sendSuccess, sendError } = require('../utils/response');
const { searchMarket } = require('../services/marketSearchService');
const { getStockQuote } = require('../services/alphaVantageService');
const { getMutualFundQuote } = require('../services/mfapiService');
const { SEARCH_MIN_LENGTH } = require('../config/market');

const search = async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();

    if (query.length < SEARCH_MIN_LENGTH) {
      return sendError(
        res,
        `Search query must be at least ${SEARCH_MIN_LENGTH} characters`,
        400
      );
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

    if (!symbol) {
      return sendError(res, 'Stock symbol is required', 400);
    }

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

    if (!schemeCode) {
      return sendError(res, 'Scheme code is required', 400);
    }

    const data = await getMutualFundQuote(schemeCode);
    return sendSuccess(res, data, 'Mutual fund quote retrieved');
  } catch (error) {
    console.error('Mutual fund quote error:', error);
    return sendError(res, error.message || 'Failed to get mutual fund quote', error.status || 500);
  }
};

module.exports = {
  search,
  getStock,
  getMutual,
};
