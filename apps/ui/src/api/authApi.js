/**
 * Auth API — RTK Query endpoints for all /api/v1/auth/* routes.
 *
 * Injected into the base apiSlice so they share the same baseQueryWithReauth
 * wrapper (automatic 401 → refresh → retry).
 *
 * Endpoints:
 *   getMe            — GET  /api/v1/auth/me           (app-load hydration)
 *   login            — POST /api/v1/auth/login
 *   register         — POST /api/v1/auth/register
 *   logout           — POST /api/v1/auth/logout
 *   getProfile       — GET  /api/v1/auth/profile
 *   updateProfile    — PATCH /api/v1/auth/profile
 *   uploadAvatar     — POST /api/v1/auth/profile/avatar
 *   removeAvatar     — DELETE /api/v1/auth/profile/avatar
 */
import { apiSlice } from './apiSlice';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ── Session hydration ───────────────────────────────────────────────────
    getMe: builder.query({
      query: () => '/api/v1/auth/me',
      transformResponse: (res) => res?.data?.user ?? res?.data ?? null,
    }),

    // ── Auth mutations ───────────────────────────────────────────────────────
    login: builder.mutation({
      query: (credentials) => ({
        url: '/api/v1/auth/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (res) => res?.data?.user ?? res?.data ?? null,
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/api/v1/auth/register',
        method: 'POST',
        body: userData,
      }),
      transformResponse: (res) => res?.data?.user ?? res?.data ?? null,
    }),
    logout: builder.mutation({
      query: () => ({ url: '/api/v1/auth/logout', method: 'POST' }),
    }),

    // ── Profile queries & mutations ─────────────────────────────────────────
    getProfile: builder.query({
      query: () => '/api/v1/auth/profile',
      transformResponse: (res) => res?.data ?? res,
      providesTags: ['Profile'],
    }),
    updateProfile: builder.mutation({
      query: (profileData) => ({
        url: '/api/v1/auth/profile',
        method: 'PATCH',
        body: profileData,
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: ['Profile'],
    }),
    uploadAvatar: builder.mutation({
      query: (body) => ({
        url: '/api/v1/auth/profile/avatar',
        method: 'POST',
        body,
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: ['Profile'],
    }),
    removeAvatar: builder.mutation({
      query: () => ({
        url: '/api/v1/auth/profile/avatar',
        method: 'DELETE',
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: ['Profile'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useRemoveAvatarMutation,
} = authApi;
