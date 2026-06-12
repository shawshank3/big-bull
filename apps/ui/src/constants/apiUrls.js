/**
 * API URLs Constants
 * v1 routes use /api/v1/* (cookie-based auth, rate limited)
 * Legacy routes use /api/* (Bearer token, backward compat during Phase 1)
 */

export const API_URLS = {
  AUTH: {
    REGISTER: '/api/v1/auth/register',
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    REFRESH: '/api/v1/auth/refresh',
    ME: '/api/v1/auth/me',
    PROFILE: '/api/auth/profile',              // legacy — still active
    PROFILE_AVATAR: '/api/auth/profile/avatar', // legacy — still active
  },
  PORTFOLIO: {
    SUMMARY: '/api/v1/portfolio/summary',
    HOLDINGS: '/api/v1/portfolio/holdings',
  },
  WALLET: {
    BASE: '/api/v1/wallet',
  },
  TRANSACTIONS: {
    BASE: '/api/v1/transactions',
    ORDER: '/api/v1/transactions/order',
  },
  CHAT: {
    BASE: '/api/chat',
  },
  MARKET: {
    SEARCH: '/api/v1/market/search',
    TICKER: '/api/market/ticker',               // legacy ticker still works
    STOCK: (symbol) => `/api/v1/market/quote/${encodeURIComponent(symbol)}`,
    MUTUAL: (schemeCode) => `/api/v1/market/quote/${encodeURIComponent(schemeCode)}`,
    STREAM: '/api/v1/market/stream',
  },
};

export default API_URLS;
