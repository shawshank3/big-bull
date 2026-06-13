/**
 * Portfolio API — RTK Query endpoints for /api/v1/portfolio/*.
 *
 * All endpoints require authentication (cookie sent automatically).
 * Holdings and summary are computed server-side from the Transaction ledger
 * and enriched with live prices from the Redis price cache.
 *
 * Endpoints:
 *   getPortfolioHoldings — GET /api/v1/portfolio/holdings
 *   getPortfolioSummary  — GET /api/v1/portfolio/summary
 */
import { apiSlice } from './apiSlice';

export const portfolioApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPortfolioHoldings: builder.query({
      query: () => '/api/v1/portfolio/holdings',
      transformResponse: (res) => {
        const holdings = res?.data?.holdings ?? [];
        return holdings.map((h) => ({
          _id: h.assetId,
          name: h.asset?.name || '',
          symbol: h.asset?.ticker || '',
          type: h.asset?.assetType === 'MUTUAL_FUND' ? 'mutual' : 'stock',
          qty: h.netQuantity,
          avgPrice: h.avgCostBasis,
          currentPrice: h.currentPrice,
          ...h,
        }));
      },
      providesTags: ['Portfolio', 'Holdings'],
    }),
    getPortfolioSummary: builder.query({
      query: () => '/api/v1/portfolio/summary',
      transformResponse: (res) => res?.data ?? res,
      providesTags: ['Portfolio'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPortfolioHoldingsQuery,
  useGetPortfolioSummaryQuery,
} = portfolioApi;
