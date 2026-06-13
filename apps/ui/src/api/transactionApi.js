/**
 * Transaction API — RTK Query endpoints for /api/v1/transactions/*.
 *
 * Endpoints:
 *   getTransactions — GET  /api/v1/transactions        (paginated history)
 *   executeOrder    — POST /api/v1/transactions/order  (BUY / SELL)
 *
 * executeOrder invalidates Portfolio, Holdings, Wallet, and Transactions
 * caches so the UI reflects the new state immediately after an order.
 */
import { apiSlice } from './apiSlice';

export const transactionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
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
  }),
  overrideExisting: false,
});

export const {
  useGetTransactionsQuery,
  useExecuteOrderMutation,
} = transactionApi;
