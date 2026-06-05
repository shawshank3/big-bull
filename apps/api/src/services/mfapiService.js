/**
 * MFapi Service
 * Indian mutual fund search and NAV data via mfapi.in
 */
const { fetchJson } = require('../utils/http');
const {
  MFAPI_BASE_URL,
  MARKET_ASSET_TYPES,
  SEARCH_RESULT_LIMIT,
} = require('../config/market');

const searchMutualFunds = async (query, limit = SEARCH_RESULT_LIMIT) => {
  const url = `${MFAPI_BASE_URL}/search?q=${encodeURIComponent(query)}`;
  const results = await fetchJson(url);

  if (!Array.isArray(results)) {
    return [];
  }

  return results.slice(0, limit).map((item) => ({
    type: MARKET_ASSET_TYPES.MUTUAL,
    id: String(item.schemeCode),
    schemeCode: item.schemeCode,
    name: item.schemeName,
  }));
};

const getMutualFundQuote = async (schemeCode) => {
  const url = `${MFAPI_BASE_URL}/${encodeURIComponent(schemeCode)}`;
  const payload = await fetchJson(url);
  const latestNav = payload.data?.[0];

  if (!latestNav) {
    const error = new Error('NAV data not available for this scheme');
    error.status = 404;
    throw error;
  }

  return {
    type: MARKET_ASSET_TYPES.MUTUAL,
    schemeCode: payload.meta?.scheme_code ?? Number(schemeCode),
    name: payload.meta?.scheme_name,
    fundHouse: payload.meta?.fund_house,
    schemeCategory: payload.meta?.scheme_category,
    schemeType: payload.meta?.scheme_type,
    price: Number.parseFloat(latestNav.nav),
    priceLabel: 'NAV',
    currency: 'INR',
    asOf: latestNav.date,
  };
};

module.exports = {
  searchMutualFunds,
  getMutualFundQuote,
};
