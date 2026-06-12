/**
 * Market Data Config
 * External API settings for stock and mutual fund lookups
 */
const MARKET_ASSET_TYPES = Object.freeze({
  STOCK: 'stock',
  MUTUAL: 'mutual',
});

const MFAPI_BASE_URL = 'https://api.mfapi.in/mf';

const SEARCH_MIN_LENGTH = 2;
const SEARCH_RESULT_LIMIT = 8;

module.exports = {
  MARKET_ASSET_TYPES,
  MFAPI_BASE_URL,
  SEARCH_MIN_LENGTH,
  SEARCH_RESULT_LIMIT,
};
