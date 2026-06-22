/**
 * Market API — RTK Query endpoints for /api/v1/market/*.
 *
 * Endpoints:
 *   listAssets       — POST /api/v1/market/assets/list  (paginated, filtered)
 *   getAssets        — GET  /api/v1/market/assets       (legacy)
 *   getAssetByTicker — GET  /api/v1/market/assets/:ticker
 *   searchMarket     — GET  /api/v1/market/search?q=
 *   getStockQuote    — GET  /api/v1/market/quote/:symbol
 *   getMutualQuote   — GET  /api/v1/market/quote/:schemeCode
 *   getTickerQuotes  — GET  /api/v1/market/ticker
 *   getChart         — GET  /api/v1/market/chart/:ticker?range=1D|1W|1M|3M|1Y
 */
import { apiSlice } from '@/shared/api/apiSlice';
import {
  toAssetListDTO,
  toAssetDTO,
  toSearchResultDTO,
  toQuoteDTO,
  toTickerDTO,
  toChartDTO,
} from '../dto/market.dto';

export const marketApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * POST /api/v1/market/assets/list
     * Server-side paginated, filtered assets list.
     *
     * @param {object} payload
     * @param {object} payload.pagination - { page, limit }
     * @param {object} [payload.filters] - { assetType?, sector? }
     * @param {string} [payload.search] - text search term (ticker/name/sector)
     * @param {object} [payload.sort] - { field, order }
     */
    listAssets: builder.query({
      query: (payload) => ({
        url: '/api/v1/market/assets/list',
        method: 'POST',
        body: payload,
      }),
      transformResponse: (res) => ({
        items: toAssetListDTO(res?.data?.items ?? []),
        pagination: res?.data?.pagination ?? { page: 1, limit: 5, total: 0, totalPages: 1 },
      }),
    }),

    /** Legacy GET endpoint — kept for backward compatibility */
    getAssets: builder.query({
      query: ({ type } = {}) => ({
        url: '/api/v1/market/assets',
        params: type ? { type } : undefined,
      }),
      transformResponse: (res) => toAssetListDTO(res?.data?.assets ?? res?.data),
    }),

    getAssetByTicker: builder.query({
      query: (ticker) => `/api/v1/market/assets/${encodeURIComponent(ticker)}`,
      transformResponse: (res) => toAssetDTO(res?.data?.asset ?? res?.data),
    }),
    searchMarket: builder.query({
      query: (q) => ({ url: '/api/v1/market/search', params: { q } }),
      transformResponse: (res) => toSearchResultDTO(res?.data?.results ?? res?.data),
    }),
    getStockQuote: builder.query({
      query: (symbol) => `/api/v1/market/quote/${encodeURIComponent(symbol)}`,
      transformResponse: (res) => toQuoteDTO(res?.data),
    }),
    getMutualQuote: builder.query({
      query: (schemeCode) => `/api/v1/market/quote/${encodeURIComponent(schemeCode)}`,
      transformResponse: (res) => toQuoteDTO(res?.data),
    }),
    getTickerQuotes: builder.query({
      query: () => '/api/v1/market/ticker',
      transformResponse: (res) => toTickerDTO(res?.data),
    }),
    getChart: builder.query({
      query: ({ ticker, range = '1D' }) =>
        `/api/v1/market/chart/${encodeURIComponent(ticker)}?range=${range}`,
      transformResponse: (res) => toChartDTO(res?.data),
    }),
  }),
  overrideExisting: false,
});

export const {
  useListAssetsQuery,
  useGetAssetsQuery,
  useGetAssetByTickerQuery,
  useLazySearchMarketQuery,
  useGetStockQuoteQuery,
  useGetMutualQuoteQuery,
  useGetTickerQuotesQuery,
  useGetChartQuery,
} = marketApi;
