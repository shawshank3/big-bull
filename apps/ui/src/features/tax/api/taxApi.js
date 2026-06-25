/**
 * Tax API — RTK Query endpoints for /api/v1/tax/*.
 *
 * Endpoints:
 *   getTaxGains      — GET /api/v1/tax/gains
 *   getTaxSummary    — GET /api/v1/tax/summary
 *   getTaxHarvesting — GET /api/v1/tax/harvesting
 */
import { apiSlice } from '@/shared/api/apiSlice';
import { toGainsDTO, toSummaryDTO, toHarvestingDTO } from '../dto/tax.dto';

export const taxApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTaxGains: builder.query({
      query: ({ taxYear, page, limit } = {}) => {
        const params = new URLSearchParams();
        if (taxYear) params.set('taxYear', taxYear);
        if (page) params.set('page', page);
        if (limit) params.set('limit', limit);
        return `/api/v1/tax/gains?${params.toString()}`;
      },
      transformResponse: (res) => toGainsDTO(res?.data),
      providesTags: ['Tax'],
    }),
    getTaxSummary: builder.query({
      query: ({ taxYear } = {}) => {
        const params = new URLSearchParams();
        if (taxYear) params.set('taxYear', taxYear);
        return `/api/v1/tax/summary?${params.toString()}`;
      },
      transformResponse: (res) => toSummaryDTO(res?.data),
      providesTags: ['Tax'],
      keepUnusedDataFor: 0,
    }),
    getTaxHarvesting: builder.query({
      query: ({ taxYear, minLoss } = {}) => {
        const params = new URLSearchParams();
        if (taxYear) params.set('taxYear', taxYear);
        if (minLoss != null) params.set('minLoss', minLoss);
        return `/api/v1/tax/harvesting?${params.toString()}`;
      },
      transformResponse: (res) => toHarvestingDTO(res?.data),
      providesTags: ['Tax'],
      keepUnusedDataFor: 0,
    }),
  }),
  overrideExisting: false,
});

export const { useGetTaxGainsQuery, useGetTaxSummaryQuery, useGetTaxHarvestingQuery } = taxApi;
