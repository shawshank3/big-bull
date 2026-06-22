// Time-related Constants - UI Version
export const TIME_PERIODS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,
};

// UI refresh intervals
export const REFRESH_INTERVALS = {
  REAL_TIME: 1000, // 1 second - for real-time price updates
  FAST: 5000, // 5 seconds - for portfolio updates
  MEDIUM: 30000, // 30 seconds - for market data
  SLOW: 60000, // 1 minute - for news/notifications
  BACKGROUND: 300000, // 5 minutes - for background data
};

// Animation and transition durations (in milliseconds)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  EXTRA_SLOW: 1000,
};

// Notification display durations (in milliseconds)
export const NOTIFICATION_DURATION = {
  SHORT: 3000, // 3 seconds
  MEDIUM: 5000, // 5 seconds
  LONG: 8000, // 8 seconds
  PERSISTENT: 0, // Don't auto-hide
};

// Cache durations for UI data (in milliseconds)
export const CACHE_DURATION = {
  SHORT: 30000, // 30 seconds
  MEDIUM: 300000, // 5 minutes
  LONG: 3600000, // 1 hour
  SESSION: 0, // Until session ends
};

// Debounce and throttle delays (in milliseconds)
export const DELAY = {
  SEARCH: 300, // Search input debounce
  RESIZE: 100, // Window resize throttle
  SCROLL: 50, // Scroll event throttle
  INPUT: 500, // General input debounce
  API_RETRY: 1000, // API retry delay
};

// Date and time formatting
export const DATE_FORMATS = {
  SHORT_DATE: 'MMM DD',
  LONG_DATE: 'MMMM DD, YYYY',
  TIME: 'HH:mm',
  DATETIME: 'MMM DD, YYYY HH:mm',
  ISO: 'YYYY-MM-DDTHH:mm:ssZ',
};

export default {
  TIME_PERIODS,
  REFRESH_INTERVALS,
  ANIMATION_DURATION,
  NOTIFICATION_DURATION,
  CACHE_DURATION,
  DELAY,
  DATE_FORMATS,
};
