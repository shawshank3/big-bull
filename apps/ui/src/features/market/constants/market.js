export const MARKET_ASSET_TYPES = Object.freeze({
  STOCK: 'stock',
  MUTUAL: 'mutual',
});

export const MARKET_ASSET_LABELS = Object.freeze({
  stock: 'Stock',
  mutual: 'Mutual Fund',
});

export const MARKET_ASSET_BADGE_LABELS = Object.freeze({
  stock: 'STK',
  mutual: 'MF',
});

export const MARKET_SEARCH = Object.freeze({
  MIN_LENGTH: 2,
  DEBOUNCE_MS: 350,
  PLACEHOLDER: 'Search stocks and mutual funds…',
});

export const buildStockDetailPath = (symbol) => {
  const nse = symbol.replace(/\.(BSE|NSE|BOM)$/i, '');
  return `/market/stocks/${encodeURIComponent(nse)}`;
};

export const buildMutualDetailPath = (schemeCode) =>
  `/market/mutuals/${encodeURIComponent(schemeCode)}`;

export default MARKET_ASSET_TYPES;
