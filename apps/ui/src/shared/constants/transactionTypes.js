// Transaction Type Constants - UI Version (mirrors API constants)
export const TRANSACTION_TYPES = {
  BUY: 'BUY',
  SELL: 'SELL',
};

export const TRANSACTION_TYPE_VALUES = Object.values(TRANSACTION_TYPES);

// Display labels for transaction types
export const TRANSACTION_TYPE_LABELS = {
  [TRANSACTION_TYPES.BUY]: 'Buy',
  [TRANSACTION_TYPES.SELL]: 'Sell',
};

// Colors for transaction types in UI
export const TRANSACTION_TYPE_COLORS = {
  [TRANSACTION_TYPES.BUY]: '#10b981', // green
  [TRANSACTION_TYPES.SELL]: '#ef4444', // red
};

// Icons for transaction types
export const TRANSACTION_TYPE_ICONS = {
  [TRANSACTION_TYPES.BUY]: 'trend-up',
  [TRANSACTION_TYPES.SELL]: 'trend-down',
};

// Wallet transaction types
export const WALLET_TRANSACTION_TYPES = {
  DEBIT: 'DEBIT',
  CREDIT: 'CREDIT',
};

export const WALLET_TRANSACTION_TYPE_VALUES = Object.values(WALLET_TRANSACTION_TYPES);

export const WALLET_TRANSACTION_TYPE_COLORS = {
  [WALLET_TRANSACTION_TYPES.DEBIT]: '#ef4444', // red
  [WALLET_TRANSACTION_TYPES.CREDIT]: '#10b981', // green
};

export default TRANSACTION_TYPES;
