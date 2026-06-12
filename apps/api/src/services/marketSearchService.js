/**
 * Market Search Service (legacy facade)
 *
 * This module used to proxy Alpha Vantage / MFAPI. Search is now served
 * from the internal Asset catalog and Redis price cache via the
 * modules/market service. Keep this small facade so legacy routes keep working.
 */
const { searchAssets } = require('../modules/market/market.service');

const searchMarket = async (query) => {
  // Delegate to new catalog-backed search
  return searchAssets(query);
};

module.exports = {
  searchMarket,
};
