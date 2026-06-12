/**
 * RTK Query base API slice.
 *
 * Cookie-based auth — the browser sends the HTTP-Only access_token cookie
 * automatically on every request via `credentials: 'include'`.
 * No Bearer tokens, no localStorage reads.
 *
 * Base URL is '/' so each endpoint specifies its full path.
 * This lets us mix /api/v1/* (new) and /api/* (legacy) endpoints in one slice.
 */
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: '/',
  credentials: 'include',
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Holdings', 'Profile', 'Portfolio', 'Transactions', 'Wallet'],
  endpoints: (builder) => ({
    // ── Auth (legacy endpoints — kept for existing UI components) ──────────
    login: builder.mutation({
      query: (credentials) => ({
        url: '/api/v1/auth/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (res) => res?.data ?? res,
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/api/v1/auth/register',
        method: 'POST',
        body: userData,
      }),
      transformResponse: (res) => res?.data ?? res,
    }),
    logout: builder.mutation({
      query: () => ({ url: '/api/v1/auth/logout', method: 'POST' }),
    }),
    getMe: builder.query({
      query: () => '/api/v1/auth/me',
      transformResponse: (res) => res?.data?.user ?? res?.data ?? null,
    }),

    // ── Profile (legacy routes) ────────────────────────────────────────────
    getProfile: builder.query({
      query: () => '/api/auth/profile',
      transformResponse: (res) => res?.data ?? res,
      providesTags: ['Profile'],
    }),
    updateProfile: builder.mutation({
      query: (profileData) => ({
        url: '/api/auth/profile',
        method: 'PATCH',
        body: profileData,
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: ['Profile'],
    }),
    uploadAvatar: builder.mutation({
      query: (body) => ({
        url: '/api/auth/profile/avatar',
        method: 'POST',
        body,
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: ['Profile'],
    }),
    removeAvatar: builder.mutation({
      query: () => ({ url: '/api/auth/profile/avatar', method: 'DELETE' }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: ['Profile'],
    }),

    // ── Portfolio v1 (transaction-derived) ────────────────────────────────
    getPortfolioHoldings: builder.query({
      query: () => '/api/v1/portfolio/holdings',
      transformResponse: (res) => {
        const holdings = res?.data?.holdings ?? [];
        // Transform v1 format to UI format
        return holdings.map((h) => ({
          _id: h.assetId,
          name: h.asset?.name || '',
          symbol: h.asset?.ticker || '',
          type: h.asset?.assetType === 'MUTUAL_FUND' ? 'mutual' : 'stock',
          qty: h.netQuantity,
          avgPrice: h.avgCostBasis,
          currentPrice: h.currentPrice,
          // Keep v1 fields for reference
          ...h,
        }));
      },
      providesTags: ['Portfolio'],
    }),
    getPortfolioSummary: builder.query({
      query: () => '/api/v1/portfolio/summary',
      transformResponse: (res) => res?.data ?? res,
      providesTags: ['Portfolio'],
    }),

    // ── Wallet v1 ──────────────────────────────────────────────────────────
    getWallet: builder.query({
      query: () => '/api/v1/wallet',
      transformResponse: (res) => res?.data ?? res,
      providesTags: ['Wallet'],
    }),

    // ── Transactions v1 ────────────────────────────────────────────────────
    getTransactions: builder.query({
      query: ({ page = 1, limit = 20 } = {}) => ({
        url: '/api/v1/transactions',
        params: { page, limit },
      }),
      transformResponse: (res) => res?.data ?? res,
      providesTags: ['Transactions'],
    }),
    executeOrder: builder.mutation({
      query: (orderData) => ({
        url: '/api/v1/transactions/order',
        method: 'POST',
        body: orderData,
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: ['Portfolio', 'Holdings', 'Wallet', 'Transactions'],
    }),

    // ── Chat (legacy) ──────────────────────────────────────────────────────
    sendChatMessage: builder.mutation({
      query: (message) => ({
        url: '/api/chat',
        method: 'POST',
        body: { message },
      }),
      transformResponse: (res) => res?.data ?? res,
    }),

    // ── Market ─────────────────────────────────────────────────────────────
    // List all seeded tradeable assets
    getAssets: builder.query({
      query: ({ type } = {}) => ({
        url: '/api/v1/market/assets',
        params: type ? { type } : undefined,
      }),
      transformResponse: (res) => res?.data?.assets ?? res?.data ?? [],
    }),
    // Get single asset by ticker (used by detail pages to resolve _id for order form)
    getAssetByTicker: builder.query({
      query: (ticker) => `/api/v1/market/assets/${encodeURIComponent(ticker)}`,
      transformResponse: (res) => res?.data?.asset ?? res?.data ?? null,
    }),
    searchMarket: builder.query({
      query: (q) => ({ url: '/api/v1/market/search', params: { q } }),
      transformResponse: (res) => res?.data ?? res,
    }),
    getTickerQuotes: builder.query({
      query: () => '/api/market/ticker',   // legacy ticker still works
      transformResponse: (res) => res?.data ?? res,
    }),
    getStockQuote: builder.query({
      query: (symbol) => `/api/v1/market/quote/${encodeURIComponent(symbol)}`,
      transformResponse: (res) => res?.data ?? res,
    }),
    getMutualQuote: builder.query({
      query: (schemeCode) => `/api/v1/market/quote/${encodeURIComponent(schemeCode)}`,
      transformResponse: (res) => res?.data ?? res,
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetMeQuery,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useRemoveAvatarMutation,
  useGetPortfolioHoldingsQuery,
  useGetPortfolioSummaryQuery,
  useGetWalletQuery,
  useGetTransactionsQuery,
  useExecuteOrderMutation,
  useSendChatMessageMutation,
  useLazySearchMarketQuery,
  useGetTickerQuotesQuery,
  useGetStockQuoteQuery,
  useGetMutualQuoteQuery,
  useGetAssetsQuery,
  useGetAssetByTickerQuery,
} = apiSlice;
