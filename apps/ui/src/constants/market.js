export const MARKET_ASSET_TYPES = Object.freeze({
  STOCK: 'stock',
  MUTUAL: 'mutual',
});

export const MARKET_ASSET_LABELS = Object.freeze({
  [MARKET_ASSET_TYPES.STOCK]: 'Stock',
  [MARKET_ASSET_TYPES.MUTUAL]: 'Mutual Fund',
});

export const MARKET_ASSET_BADGE_LABELS = Object.freeze({
  [MARKET_ASSET_TYPES.STOCK]: 'STK',
  [MARKET_ASSET_TYPES.MUTUAL]: 'MF',
});

export const MARKET_SEARCH = Object.freeze({
  MIN_LENGTH: 2,
  DEBOUNCE_MS: 350,
  PLACEHOLDER: 'Search stocks and mutual funds…',
});

export const buildStockDetailPath = (symbol) => {
  // Strip exchange suffix (e.g. RELIANCE.BSE → RELIANCE) for clean NSE ticker paths
  const nse = symbol.replace(/\.(BSE|NSE|BOM)$/i, '');
  return `/market/stocks/${encodeURIComponent(nse)}`;
};

export const buildMutualDetailPath = (schemeCode) =>
  `/market/mutuals/${encodeURIComponent(schemeCode)}`;

export default MARKET_ASSET_TYPES;
