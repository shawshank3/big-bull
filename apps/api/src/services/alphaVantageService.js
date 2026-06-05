/**
 * Alpha Vantage Service
 * Stock symbol search and global quote data
 */
const { fetchJson } = require('../utils/http');
const {
  ALPHA_VANTAGE_BASE_URL,
  MARKET_ASSET_TYPES,
  SEARCH_RESULT_LIMIT,
} = require('../config/market');

const getApiKey = () => process.env.ALPHA_VANTAGE_API_KEY || 'demo';

const assertAlphaVantagePayload = (payload) => {
  if (payload?.Note || payload?.Information) {
    const error = new Error(payload.Note || payload.Information);
    error.status = 503;
    throw error;
  }
};

const inferStockCurrency = (symbol = '') => {
  if (/\.(BSE|NSE|BOM)$/i.test(symbol)) {
    return 'INR';
  }

  if (/\.LON$/i.test(symbol)) {
    return 'GBP';
  }

  if (/\.(TRT|TRV|DEX)$/i.test(symbol)) {
    return 'EUR';
  }

  return 'USD';
};

const buildAlphaVantageUrl = (params) => {
  const searchParams = new URLSearchParams({
    ...params,
    apikey: getApiKey(),
  });

  return `${ALPHA_VANTAGE_BASE_URL}?${searchParams.toString()}`;
};

const searchStocks = async (keywords, limit = SEARCH_RESULT_LIMIT) => {
  const url = buildAlphaVantageUrl({
    function: 'SYMBOL_SEARCH',
    keywords,
  });
  const payload = await fetchJson(url);
  assertAlphaVantagePayload(payload);

  const matches = payload.bestMatches ?? [];

  return matches.slice(0, limit).map((match) => ({
    type: MARKET_ASSET_TYPES.STOCK,
    id: match['1. symbol'],
    symbol: match['1. symbol'],
    name: match['2. name'],
    region: match['4. region'],
    currency: match['8. currency'] || inferStockCurrency(match['1. symbol']),
  }));
};

const getStockQuote = async (symbol) => {
  const url = buildAlphaVantageUrl({
    function: 'GLOBAL_QUOTE',
    symbol,
  });
  const payload = await fetchJson(url);
  assertAlphaVantagePayload(payload);

  const quote = payload['Global Quote'];

  if (!quote?.['05. price']) {
    const error = new Error('Quote not found for this symbol');
    error.status = 404;
    throw error;
  }

  const normalizedSymbol = quote['01. symbol'] || symbol;

  return {
    type: MARKET_ASSET_TYPES.STOCK,
    symbol: normalizedSymbol,
    name: normalizedSymbol,
    price: Number.parseFloat(quote['05. price']),
    priceLabel: 'Price',
    currency: inferStockCurrency(normalizedSymbol),
    asOf: quote['07. latest trading day'],
    change: Number.parseFloat(quote['09. change']),
    changePercent: quote['10. change percent'],
    open: Number.parseFloat(quote['02. open']),
    high: Number.parseFloat(quote['03. high']),
    low: Number.parseFloat(quote['04. low']),
    previousClose: Number.parseFloat(quote['08. previous close']),
  };
};

module.exports = {
  searchStocks,
  getStockQuote,
};
