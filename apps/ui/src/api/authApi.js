/**
 * Auth API — RTK Query endpoints injected into apiSlice.
 * Provides v1 cookie-based auth mutations and the getMe hydration query.
 */
import { apiSlice } from './apiSlice';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query({
      query: () => '/api/v1/auth/me',
      transformResponse: (res) => res?.data?.user ?? res?.data ?? null,
    }),
    loginV1: builder.mutation({
      query: (credentials) => ({
        url: '/api/v1/auth/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (res) => res?.data?.user ?? res?.data ?? null,
    }),
    registerV1: builder.mutation({
      query: (userData) => ({
        url: '/api/v1/auth/register',
        method: 'POST',
        body: userData,
      }),
      transformResponse: (res) => res?.data?.user ?? res?.data ?? null,
    }),
    logoutV1: builder.mutation({
      query: () => ({ url: '/api/v1/auth/logout', method: 'POST' }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMeQuery,
  useLoginV1Mutation,
  useRegisterV1Mutation,
  useLogoutV1Mutation,
} = authApi;
