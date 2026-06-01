/**
 * API URLs Constants
 * Defines all backend API endpoints for the application
 */

export const API_URLS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
    PROFILE_AVATAR: '/auth/profile/avatar',
  },
  HOLDINGS: {
    BASE: '/holdings',
    MUTUALS: '/holdings/mutuals',
    STOCKS: '/holdings/stocks',
    BY_ID: (id) => `/holdings/${id}`,
  },
  PORTFOLIO: {
    SUMMARY: '/holdings/summary',
    STATS: '/portfolio/stats',
  },
  CHAT: {
    BASE: '/chat',
  },
};

export default API_URLS;