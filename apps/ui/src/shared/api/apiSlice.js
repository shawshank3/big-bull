/**
 * RTK Query base API slice.
 * Domain endpoints are injected via their own *Api.js files.
 */
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';

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
        result = await rawBaseQuery(args, api, extraOptions);
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
  tagTypes: ['Profile', 'Portfolio', 'Holdings', 'Wallet', 'Transactions', 'Tax'],
  endpoints: () => ({}),
});
