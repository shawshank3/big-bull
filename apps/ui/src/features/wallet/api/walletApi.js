/**
 * Wallet API — RTK Query endpoints for /api/v1/wallet.
 *
 * Endpoints:
 *   getWallet — GET /api/v1/wallet  (current ₹ balance)
 */
import { apiSlice } from '@/shared/api/apiSlice';
import { toWalletDTO } from '../dto/wallet.dto';

export const walletApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getWallet: builder.query({
      query: () => '/api/v1/wallet',
      transformResponse: (res) => toWalletDTO(res?.data),
      providesTags: ['Wallet'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetWalletQuery } = walletApi;
