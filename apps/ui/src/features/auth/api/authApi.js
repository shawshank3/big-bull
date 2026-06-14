/**
 * Auth API — RTK Query endpoints for /api/v1/auth/* routes.
 *
 * Endpoints:
 *   getMe      — GET  /api/v1/auth/me        (app-load session hydration)
 *   login      — POST /api/v1/auth/login
 *   register   — POST /api/v1/auth/register
 *   logout     — POST /api/v1/auth/logout
 */
import { apiSlice } from '@/shared/api/apiSlice';
import { toAuthUserDTO } from '../dto/auth.dto';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query({
      query: () => '/api/v1/auth/me',
      transformResponse: (res) => toAuthUserDTO(res?.data?.user ?? res?.data),
    }),
    login: builder.mutation({
      query: (credentials) => ({
        url: '/api/v1/auth/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (res) => toAuthUserDTO(res?.data?.user ?? res?.data),
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/api/v1/auth/register',
        method: 'POST',
        body: userData,
      }),
      transformResponse: (res) => toAuthUserDTO(res?.data?.user ?? res?.data),
    }),
    logout: builder.mutation({
      query: () => ({ url: '/api/v1/auth/logout', method: 'POST' }),
    }),
  }),
  overrideExisting: false,
});

export const { useGetMeQuery, useLoginMutation, useRegisterMutation, useLogoutMutation } = authApi;
