import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { API_URLS } from '../constants/apiUrls'
import { getFromLocalStorage } from '../utils/localStorage'

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth?.token || getFromLocalStorage('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Holdings', 'Profile'],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: API_URLS.AUTH.LOGIN,
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (response) => response?.data ?? response,
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: API_URLS.AUTH.REGISTER,
        method: 'POST',
        body: userData,
      }),
      transformResponse: (response) => response?.data ?? response,
    }),
    getProfile: builder.query({
      query: () => API_URLS.AUTH.PROFILE,
      transformResponse: (response) => response?.data ?? response,
      providesTags: ['Profile'],
    }),
    updateProfile: builder.mutation({
      query: (profileData) => ({
        url: API_URLS.AUTH.PROFILE,
        method: 'PATCH',
        body: profileData,
      }),
      transformResponse: (response) => response?.data ?? response,
      invalidatesTags: ['Profile'],
    }),
    uploadAvatar: builder.mutation({
      query: (body) => ({
        url: API_URLS.AUTH.PROFILE_AVATAR,
        method: 'POST',
        body,
      }),
      transformResponse: (response) => response?.data ?? response,
      invalidatesTags: ['Profile'],
    }),
    removeAvatar: builder.mutation({
      query: () => ({
        url: API_URLS.AUTH.PROFILE_AVATAR,
        method: 'DELETE',
      }),
      transformResponse: (response) => response?.data ?? response,
      invalidatesTags: ['Profile'],
    }),
    getHoldings: builder.query({
      query: () => API_URLS.HOLDINGS.BASE,
      transformResponse: (response) => response?.data?.holdings ?? response?.data ?? [],
      providesTags: ['Holdings'],
    }),
    getMutualHoldings: builder.query({
      query: () => API_URLS.HOLDINGS.MUTUALS,
      transformResponse: (response) => response?.data ?? [],
      providesTags: ['Holdings'],
    }),
    getStockHoldings: builder.query({
      query: () => API_URLS.HOLDINGS.STOCKS,
      transformResponse: (response) => response?.data ?? [],
      providesTags: ['Holdings'],
    }),
    createHolding: builder.mutation({
      query: (newHolding) => ({ url: API_URLS.HOLDINGS.BASE, method: 'POST', body: newHolding }),
      transformResponse: (response) => response?.data,
      invalidatesTags: ['Holdings'],
    }),
    updateHolding: builder.mutation({
      query: ({ id, ...holding }) => ({ url: API_URLS.HOLDINGS.BY_ID(id), method: 'PUT', body: holding }),
      transformResponse: (response) => response?.data,
      invalidatesTags: ['Holdings'],
    }),
    deleteHolding: builder.mutation({
      query: (id) => ({ url: API_URLS.HOLDINGS.BY_ID(id), method: 'DELETE' }),
      transformResponse: (response) => response?.data,
      invalidatesTags: ['Holdings'],
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useRemoveAvatarMutation,
  useGetHoldingsQuery,
  useGetMutualHoldingsQuery,
  useGetStockHoldingsQuery,
  useCreateHoldingMutation,
  useUpdateHoldingMutation,
  useDeleteHoldingMutation,
} = apiSlice
