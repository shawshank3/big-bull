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

/**
 * Tabs shown in the MarketContent filter bar.
 * Value '' means "all asset types" (no filter applied).
 */
export const MARKET_LIST_TABS = Object.freeze([
  { label: 'All', value: '' },
  { label: 'Stocks', value: 'STOCK' },
  { label: 'Mutual Funds', value: 'MUTUAL_FUND' },
]);

/** Default page size for the market assets list. */
export const MARKET_LIST_PAGE_SIZE = 10;

/** Top N gainers/losers shown in the TopMovers section. */
export const MARKET_MOVERS_LIMIT = 4;

export const buildStockDetailPath = (symbol) => {
  const nse = symbol.replace(/\.(BSE|NSE|BOM)$/i, '');
  return `/market/stocks/${encodeURIComponent(nse)}`;
};

export const buildMutualDetailPath = (schemeCode) =>
  `/market/mutuals/${encodeURIComponent(schemeCode)}`;

export default MARKET_ASSET_TYPES;
