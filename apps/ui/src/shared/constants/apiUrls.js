/**
 * API URLs Constants — all paths use /api/v1/*
 */

export const API_URLS = {
  AUTH: {
    REGISTER: '/api/v1/auth/register',
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    REFRESH: '/api/v1/auth/refresh',
    ME: '/api/v1/auth/me',
    PROFILE: '/api/v1/users/profile',
    PROFILE_AVATAR: '/api/v1/users/profile/avatar',
  },
  PORTFOLIO: {
    SUMMARY: '/api/v1/portfolio/summary',
    HOLDINGS: '/api/v1/portfolio/holdings',
  },
  WALLET: {
    BASE: '/api/v1/wallet',
    TRANSACTIONS_LIST: '/api/v1/wallet/transactions/list',
  },
  TRANSACTIONS: {
    BASE: '/api/v1/transactions',
    LIST: '/api/v1/transactions/list',
    ORDER: '/api/v1/transactions/order',
  },
  CHAT: {
    BASE: '/api/v1/chat',
  },
  MARKET: {
    SEARCH: '/api/v1/market/search',
    TICKER: '/api/v1/market/ticker',
    ASSETS_LIST: '/api/v1/market/assets/list',
    STOCK: (symbol) => `/api/v1/market/quote/${encodeURIComponent(symbol)}`,
    MUTUAL: (schemeCode) => `/api/v1/market/quote/${encodeURIComponent(schemeCode)}`,
    STREAM: '/api/v1/market/stream',
  },
};

export default API_URLS;
