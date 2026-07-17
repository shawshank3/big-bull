/**
 * Market API — RTK Query endpoints for /api/v1/market/*.
 *
 * Endpoints:
 *   listAssets       — POST /api/v1/market/assets/list  (infiniteQuery — generates useListAssetsInfiniteQuery)
 *   listAssetsPage   — POST /api/v1/market/assets/list  (regular query — generates useListAssetsPageQuery)
 *   getAssets        — GET  /api/v1/market/assets       (legacy)
 *   getAssetByTicker — GET  /api/v1/market/assets/:ticker
 *   searchMarket     — GET  /api/v1/market/search?q=
 *   getStockQuote    — GET  /api/v1/market/quote/:symbol
 *   getMutualQuote   — GET  /api/v1/market/quote/:schemeCode
 *   getTickerQuotes  — GET  /api/v1/market/ticker
 *   getChart         — GET  /api/v1/market/chart/:ticker?range=1D|1W|1M|3M|1Y
 *   getMarketMovers  — GET  /api/v1/market/movers?limit=N
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
import { MARKET_MOVERS_LIMIT } from '../constants/market';

export const marketApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * POST /api/v1/market/assets/list — infinite-scroll variant.
     *
     * Endpoint name `listAssets` → RTK generates `useListAssetsInfiniteQuery`.
     * RTK owns the pages array and `fetchNextPage` trigger natively.
     *
     * QueryArg: { filters?, search?, sort?, limit? }
     * PageParam: number (1-indexed page number)
     */
    listAssets: builder.infiniteQuery({
      query: ({ queryArg, pageParam }) => ({
        url: '/api/v1/market/assets/list',
        method: 'POST',
        body: {
          pagination: { page: pageParam, limit: queryArg.limit },
          filters: queryArg.filters ?? {},
          search: queryArg.search ?? '',
          sort: queryArg.sort,
        },
      }),
      transformResponse: (res) => ({
        items: toAssetListDTO(res?.data?.items ?? []),
        pagination: res?.data?.pagination ?? {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      }),
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
          lastPage.pagination?.hasNextPage ? (lastPage.pagination.page ?? 1) + 1 : undefined,
      },
    }),

    /**
     * POST /api/v1/market/assets/list — standard paginated variant.
     * Retained for non-scroll consumers (e.g. order forms, search dropdowns).
     */
    listAssetsPage: builder.query({
      query: (payload) => ({
        url: '/api/v1/market/assets/list',
        method: 'POST',
        body: payload,
      }),
      transformResponse: (res) => ({
        items: toAssetListDTO(res?.data?.items ?? []),
        pagination: res?.data?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 1 },
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
    /**
     * GET /api/v1/market/movers?limit=N
     * Returns top N gainers and losers sorted by 1D changePercent.
     */
    getMarketMovers: builder.query({
      query: ({ limit = MARKET_MOVERS_LIMIT } = {}) => `/api/v1/market/movers?limit=${limit}`,
      transformResponse: (res) => ({
        gainers: toAssetListDTO(res?.data?.gainers ?? []),
        losers: toAssetListDTO(res?.data?.losers ?? []),
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useListAssetsInfiniteQuery, // from listAssets infiniteQuery endpoint
  useListAssetsPageQuery, // from listAssetsPage regular query endpoint
  useGetAssetsQuery,
  useGetAssetByTickerQuery,
  useLazySearchMarketQuery,
  useGetStockQuoteQuery,
  useGetMutualQuoteQuery,
  useGetTickerQuotesQuery,
  useGetChartQuery,
  useGetMarketMoversQuery,
} = marketApi;
