/**
 * Wallet API — RTK Query endpoints for /api/v1/wallet.
 *
 * Endpoints:
 *   getWallet                — GET  /api/v1/wallet                    (current ₹ balance)
 *   listWalletTransactions   — POST /api/v1/wallet/transactions/list  (paginated, filtered)
 *   getWalletTransactions    — GET  /api/v1/wallet/transactions       (legacy)
 */
import { apiSlice } from '@/shared/api/apiSlice';
import { toWalletDTO } from '../dto/wallet.dto';
import { toWalletTransactionHistoryDTO } from '../dto/walletTransaction.dto';

export const walletApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getWallet: builder.query({
      query: () => '/api/v1/wallet',
      transformResponse: (res) => toWalletDTO(res?.data),
      providesTags: ['Wallet'],
    }),

    /**
     * POST /api/v1/wallet/transactions/list
     * Server-side paginated, filtered wallet transaction list.
     *
     * @param {object} payload
     * @param {object} payload.pagination - { page, limit }
     * @param {object} [payload.filters] - { type?: 'DEBIT' | 'CREDIT' }
     * @param {string} [payload.search] - text search term (ticker/name)
     * @param {object} [payload.sort] - { field, order }
     */
    listWalletTransactions: builder.query({
      query: (payload) => ({
        url: '/api/v1/wallet/transactions/list',
        method: 'POST',
        body: payload,
      }),
      transformResponse: (res) => ({
        items: res?.data?.items ?? [],
        pagination: res?.data?.pagination ?? { page: 1, limit: 5, total: 0, totalPages: 1 },
      }),
      providesTags: ['Wallet', 'Transactions'],
    }),

    /** Legacy GET endpoint — kept for backward compatibility */
    getWalletTransactions: builder.query({
      query: ({ page = 1, limit = 20 } = {}) => ({
        url: '/api/v1/wallet/transactions',
        params: { page, limit },
      }),
      transformResponse: (res) => toWalletTransactionHistoryDTO(res?.data),
      providesTags: ['Wallet', 'Transactions'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetWalletQuery, useListWalletTransactionsQuery, useGetWalletTransactionsQuery } =
  walletApi;
