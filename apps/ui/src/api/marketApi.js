/**
 * Market API — RTK Query endpoints for /api/v1/market/*.
 *
 * All market endpoints are public (no auth required) except the SSE stream.
 *
 * Endpoints:
 *   getAssets        — GET /api/v1/market/assets            (full catalog)
 *   getAssetByTicker — GET /api/v1/market/assets/:ticker    (single asset)
 *   searchMarket     — GET /api/v1/market/search?q=         (text search)
 *   getStockQuote    — GET /api/v1/market/quote/:symbol     (live price)
 *   getMutualQuote   — GET /api/v1/market/quote/:schemeCode (live price)
 *   getTickerQuotes  — GET /api/v1/market/ticker            (ticker strip)
 */
import { apiSlice } from './apiSlice';

export const marketApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAssets: builder.query({
      query: ({ type } = {}) => ({
        url: '/api/v1/market/assets',
        params: type ? { type } : undefined,
      }),
      transformResponse: (res) => res?.data?.assets ?? res?.data ?? [],
    }),
    getAssetByTicker: builder.query({
      query: (ticker) => `/api/v1/market/assets/${encodeURIComponent(ticker)}`,
      transformResponse: (res) => res?.data?.asset ?? res?.data ?? null,
    }),
    searchMarket: builder.query({
      query: (q) => ({ url: '/api/v1/market/search', params: { q } }),
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
    getTickerQuotes: builder.query({
      query: () => '/api/v1/market/ticker',
      transformResponse: (res) => res?.data ?? res,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAssetsQuery,
  useGetAssetByTickerQuery,
  useLazySearchMarketQuery,
  useGetStockQuoteQuery,
  useGetMutualQuoteQuery,
  useGetTickerQuotesQuery,
} = marketApi;
