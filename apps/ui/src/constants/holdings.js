export const HOLDING_TYPES = Object.freeze({
  MUTUAL: 'mutual',
  STOCK: 'stock',
});

export const HOLDING_TABS = Object.freeze([
  { key: HOLDING_TYPES.MUTUAL, label: 'Mutual Funds' },
  { key: HOLDING_TYPES.STOCK, label: 'Stocks' },
]);

export const HOLDING_TYPE_LABELS = Object.freeze({
  [HOLDING_TYPES.MUTUAL]: 'Mutual Fund',
  [HOLDING_TYPES.STOCK]: 'Stock',
});

export const HOLDING_TYPE_BADGE_LABELS = Object.freeze({
  [HOLDING_TYPES.MUTUAL]: 'MF',
  [HOLDING_TYPES.STOCK]: 'STK',
});

export default HOLDING_TYPES;
