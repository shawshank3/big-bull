/**
 * Insights API — RTK Query endpoint for /api/v1/insights.
 *
 * Endpoints:
 *   getPlatformInsights — GET /api/v1/insights (public)
 */
import { apiSlice } from '@/shared/api/apiSlice';

export const insightsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPlatformInsights: builder.query({
      query: () => '/api/v1/insights',
      transformResponse: (res) => ({
        stockCount: res?.data?.stockCount ?? 0,
        mutualFundCount: res?.data?.mutualFundCount ?? 0,
        userCount: res?.data?.userCount ?? 0,
        totalTrades: res?.data?.totalTrades ?? 0,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useGetPlatformInsightsQuery } = insightsApi;
