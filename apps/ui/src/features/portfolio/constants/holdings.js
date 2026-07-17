export const HOLDING_TYPES = Object.freeze({
  MUTUAL: 'mutual',
  STOCK: 'stock',
});

export const HOLDING_TABS = Object.freeze([
  { key: HOLDING_TYPES.STOCK, label: 'Stocks' },
  { key: HOLDING_TYPES.MUTUAL, label: 'Mutual Funds' },
]);

export const HOLDING_TYPE_LABELS = Object.freeze({
  [HOLDING_TYPES.STOCK]: 'Stock',
  [HOLDING_TYPES.MUTUAL]: 'Mutual Fund',
});

export const HOLDING_TYPE_BADGE_LABELS = Object.freeze({
  [HOLDING_TYPES.STOCK]: 'STOCK',
  [HOLDING_TYPES.MUTUAL]: 'MF',
});

export default HOLDING_TYPES;
