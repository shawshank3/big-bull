// Time-related Constants

// JWT Token Expiry Times
const JWT_EXPIRY = {
  ACCESS_TOKEN: '30s',
  REFRESH_TOKEN: '2h',
  RESET_TOKEN: '15m',
};

// Cache TTL (Time To Live) in seconds
const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
};

// Intervals in milliseconds
const INTERVALS = {
  HEARTBEAT: 30000, // 30 seconds
  PRICE_UPDATE: 5000, // 5 seconds
  MARKET_DATA_REFRESH: 60000, // 1 minute
  HEALTH_CHECK: 30000, // 30 seconds
  SESSION_CLEANUP: 3600000, // 1 hour
};

// Time periods in milliseconds
const TIME_PERIODS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,
};

// Timeout values in milliseconds
const TIMEOUTS = {
  API_REQUEST: 30000, // 30 seconds
  DATABASE_QUERY: 10000, // 10 seconds
  FILE_UPLOAD: 60000, // 1 minute
  EXTERNAL_API: 15000, // 15 seconds
};

module.exports = {
  JWT_EXPIRY,
  CACHE_TTL,
  INTERVALS,
  TIME_PERIODS,
  TIMEOUTS,
};
