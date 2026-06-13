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
import { toHoldingListDTO, toSummaryDTO } from './dto';

export const portfolioApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPortfolioHoldings: builder.query({
      query: () => '/api/v1/portfolio/holdings',
      transformResponse: (res) => toHoldingListDTO(res?.data?.holdings),
      providesTags: ['Portfolio', 'Holdings'],
    }),
    getPortfolioSummary: builder.query({
      query: () => '/api/v1/portfolio/summary',
      transformResponse: (res) => toSummaryDTO(res?.data),
      providesTags: ['Portfolio'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetPortfolioHoldingsQuery, useGetPortfolioSummaryQuery } = portfolioApi;
