/**
 * RTK Query base API slice.
 *
 * This file owns ONLY the base slice definition and the baseQueryWithReauth
 * wrapper. All domain endpoints are injected via their own *Api.js files:
 *
 *   features/auth/api/authApi.js        → /api/v1/auth/*
 *   features/user/api/userApi.js        → /api/v1/users/*
 *   features/market/api/marketApi.js    → /api/v1/market/*
 *   features/portfolio/api/portfolioApi.js → /api/v1/portfolio/*
 *   features/wallet/api/walletApi.js    → /api/v1/wallet
 *   features/transaction/api/transactionApi.js → /api/v1/transactions/*
 *   features/chat/api/chatApi.js        → /api/v1/chat
 *
 * Cookie-based auth — the browser sends the HTTP-Only access_token cookie
 * automatically on every request via `credentials: 'include'`.
 */
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';
import { tokenRefreshed, clearUser } from '@/features/auth/store/authSlice';

const mutex = new Mutex();

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/',
  credentials: 'include',
});

export const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status !== 401) {
    return result;
  }

  if (!mutex.isLocked()) {
    const release = await mutex.acquire();
    try {
      const refreshResult = await rawBaseQuery(
        { url: '/api/v1/auth/refresh', method: 'POST' },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        api.dispatch(tokenRefreshed());
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        api.dispatch(clearUser());
      }
    } finally {
      release();
    }
  } else {
    await mutex.waitForUnlock();
    result = await rawBaseQuery(args, api, extraOptions);
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Profile', 'Portfolio', 'Holdings', 'Wallet', 'Transactions'],
  endpoints: () => ({}),
});
