/**
 * Portfolio API — RTK Query endpoints for /api/v1/portfolio/*.
 *
 * Endpoints:
 *   getPortfolioHoldings — GET /api/v1/portfolio/holdings
 *   getPortfolioSummary  — GET /api/v1/portfolio/summary
 */
import { apiSlice } from '@/shared/api/apiSlice';
import { toHoldingListDTO, toSummaryDTO } from '../dto/portfolio.dto';

export const portfolioApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPortfolioHoldings: builder.query({
      query: () => '/api/v1/portfolio/holdings',
      transformResponse: (res) => toHoldingListDTO(res?.data?.holdings),
      providesTags: ['Holdings'],
      keepUnusedDataFor: 0,
    }),
    getPortfolioSummary: builder.query({
      query: () => '/api/v1/portfolio/summary',
      transformResponse: (res) => toSummaryDTO(res?.data),
      providesTags: ['Portfolio'],
      keepUnusedDataFor: 0,
    }),
  }),
  overrideExisting: false,
});

export const { useGetPortfolioHoldingsQuery, useGetPortfolioSummaryQuery } = portfolioApi;
