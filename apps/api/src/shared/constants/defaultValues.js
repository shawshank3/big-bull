// Default Values Constants

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
};

// Sort order defaults
const SORT_ORDER = {
  ASC: 'asc',
  DESC: 'desc',
};

const SORT_ORDER_VALUES = Object.values(SORT_ORDER);

// Server defaults
const SERVER_DEFAULTS = {
  PORT: 4000,
  HOST: '0.0.0.0',
  NODE_ENV: 'development',
};

// Price simulation defaults
const PRICE_SIMULATION = {
  MIN_VOLATILITY: 0.01,
  MAX_VOLATILITY: 0.18,
  UPDATE_INTERVAL: 5000,
  PRICE_CHANGE_FACTOR: 0.02,
};

// Minimum values for validation
const MIN_VALUES = {
  PRICE: 0.01,
  QUANTITY: 1,
  AMOUNT: 0.01,
  BALANCE: 0,
  PERCENTAGE: 0,
  USER_AGE: 18,
};

// Maximum values for validation
const MAX_VALUES = {
  QUANTITY: 1000000,
  AMOUNT: 10000000,
  PERCENTAGE: 100,
  PASSWORD_LENGTH: 128,
  USERNAME_LENGTH: 50,
  EMAIL_LENGTH: 100,
};

// Default user settings
const USER_DEFAULTS = {
  INITIAL_BALANCE: 1000000, // ₹10,00,000 — matches VirtualWallet model default
  CURRENCY: 'INR',
  LANGUAGE: 'en',
  TIMEZONE: 'Asia/Kolkata',
};

module.exports = {
  PAGINATION,
  SORT_ORDER,
  SORT_ORDER_VALUES,
  SERVER_DEFAULTS,
  PRICE_SIMULATION,
  MIN_VALUES,
  MAX_VALUES,
  USER_DEFAULTS,
};
