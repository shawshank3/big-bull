/**
 * Transaction API — RTK Query endpoints for /api/v1/transactions/*.
 *
 * Endpoints:
 *   listTransactions — POST /api/v1/transactions/list  (paginated, filtered)
 *   getTransactions  — GET  /api/v1/transactions       (legacy)
 *   executeOrder     — POST /api/v1/transactions/order (BUY / SELL)
 */
import { apiSlice } from '@/shared/api/apiSlice';
import { toTransactionHistoryDTO, toOrderResultDTO } from '../dto/transaction.dto';

export const transactionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * POST /api/v1/transactions/list
     * Server-side paginated, filtered transaction list.
     *
     * @param {object} payload
     * @param {object} payload.pagination - { page, limit }
     * @param {object} [payload.filters] - { assetId?, transactionType? }
     * @param {string} [payload.search] - text search term
     * @param {object} [payload.sort] - { field, order }
     */
    listTransactions: builder.query({
      query: (payload) => ({
        url: '/api/v1/transactions/list',
        method: 'POST',
        body: payload,
      }),
      transformResponse: (res) => ({
        items: res?.data?.items ?? [],
        pagination: res?.data?.pagination ?? { page: 1, limit: 5, total: 0, totalPages: 1 },
      }),
      providesTags: ['Transactions'],
    }),

    /** Legacy GET endpoint — kept for backward compatibility */
    getTransactions: builder.query({
      query: ({ page = 1, limit = 20, assetId } = {}) => ({
        url: '/api/v1/transactions',
        params: { page, limit, ...(assetId ? { assetId } : {}) },
      }),
      transformResponse: (res) => toTransactionHistoryDTO(res?.data),
      providesTags: ['Transactions'],
    }),

    executeOrder: builder.mutation({
      query: (orderData) => ({
        url: '/api/v1/transactions/order',
        method: 'POST',
        body: orderData,
      }),
      transformResponse: (res) => toOrderResultDTO(res?.data),
      invalidatesTags: ['Wallet', 'Transactions', 'Holdings', 'Portfolio', 'Tax'],
    }),
  }),
  overrideExisting: false,
});

export const { useListTransactionsQuery, useGetTransactionsQuery, useExecuteOrderMutation } =
  transactionApi;
