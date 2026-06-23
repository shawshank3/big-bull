/**
 * Auth API — RTK Query endpoints for /api/v1/auth/*
 *
 *   getMe      — GET  /api/v1/auth/me
 *   login      — POST /api/v1/auth/login
 *   register   — POST /api/v1/auth/register
 *   logout     — POST /api/v1/auth/logout
 */
import { apiSlice } from '@/shared/api/apiSlice';
import { authResponseToUser } from '../dto/auth.dto';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query({
      query: () => '/api/v1/auth/me',
      transformResponse: authResponseToUser,
    }),
    login: builder.mutation({
      query: (credentials) => ({
        url: '/api/v1/auth/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: authResponseToUser,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data: user } = await queryFulfilled;
          dispatch(authApi.util.upsertQueryData('getMe', undefined, user));
        } catch {
          // noop
        }
      },
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/api/v1/auth/register',
        method: 'POST',
        body: userData,
      }),
      transformResponse: authResponseToUser,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data: user } = await queryFulfilled;
          dispatch(authApi.util.upsertQueryData('getMe', undefined, user));
        } catch {
          // noop
        }
      },
    }),
    logout: builder.mutation({
      query: () => ({ url: '/api/v1/auth/logout', method: 'POST' }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          // non-fatal
        } finally {
          dispatch(authApi.util.upsertQueryData('getMe', undefined, null));
          dispatch(
            apiSlice.util.invalidateTags([
              'Profile',
              'Portfolio',
              'Holdings',
              'Wallet',
              'Transactions',
            ])
          );
        }
      },
    }),
  }),
  overrideExisting: false,
});

export const { useGetMeQuery, useLoginMutation, useRegisterMutation, useLogoutMutation } = authApi;
