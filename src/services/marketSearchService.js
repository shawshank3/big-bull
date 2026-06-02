/**
 * Market Search Service
 * Combines stock and mutual fund search results
 */
const { searchMutualFunds } = require('./mfapiService');
const { searchStocks } = require('./alphaVantageService');

const searchMarket = async (query) => {
  const [stocks, mutuals] = await Promise.all([
    searchStocks(query).catch((error) => {
      console.error('Stock search error:', error.message);
      return [];
    }),
    searchMutualFunds(query).catch((error) => {
      console.error('Mutual fund search error:', error.message);
      return [];
    }),
  ]);

  return {
    query,
    stocks,
    mutuals,
    results: [...stocks, ...mutuals],
  };
};

module.exports = {
  searchMarket,
};
