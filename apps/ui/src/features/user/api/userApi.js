/**
 * User API — RTK Query endpoints for /api/v1/users/* routes.
 *
 * Endpoints:
 *   getProfile     — GET    /api/v1/users/profile
 *   updateProfile  — PATCH  /api/v1/users/profile
 *   uploadAvatar   — POST   /api/v1/users/profile/avatar
 *   removeAvatar   — DELETE /api/v1/users/profile/avatar
 */
import { apiSlice } from '@/shared/api/apiSlice';
import { toUserProfileDTO } from '../dto/user.dto';

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query({
      query: () => '/api/v1/users/profile',
      transformResponse: (res) => toUserProfileDTO(res?.data),
      providesTags: ['Profile'],
    }),
    updateProfile: builder.mutation({
      query: (profileData) => ({
        url: '/api/v1/users/profile',
        method: 'PATCH',
        body: profileData,
      }),
      transformResponse: (res) => toUserProfileDTO(res?.data),
      invalidatesTags: ['Profile'],
    }),
    uploadAvatar: builder.mutation({
      query: (body) => ({
        url: '/api/v1/users/profile/avatar',
        method: 'POST',
        body,
      }),
      transformResponse: (res) => toUserProfileDTO(res?.data),
      invalidatesTags: ['Profile'],
    }),
    removeAvatar: builder.mutation({
      query: () => ({
        url: '/api/v1/users/profile/avatar',
        method: 'DELETE',
      }),
      transformResponse: (res) => toUserProfileDTO(res?.data),
      invalidatesTags: ['Profile'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useRemoveAvatarMutation,
} = userApi;
