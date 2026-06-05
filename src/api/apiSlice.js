import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { API_URLS } from '../constants/apiUrls'
import { getFromLocalStorage } from '@/utils'
import { tokenRefreshed, logout } from '../store/slices/authSlice'

const AUTH_SKIP_PATHS = [
  API_URLS.AUTH.LOGIN,
  API_URLS.AUTH.REGISTER,
  API_URLS.AUTH.REFRESH,
]

const isAuthSkipPath = (url) =>
  AUTH_SKIP_PATHS.some((path) => url?.includes(path))

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || '/api',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth?.token || getFromLocalStorage('token')
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    return headers
  },
})

let refreshPromise = null

const refreshAccessToken = async (api, extraOptions) => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const refreshToken =
          api.getState().auth?.refreshToken || getFromLocalStorage('refreshToken')

        if (!refreshToken) {
          return false
        }

        const refreshResult = await baseQuery(
          {
            url: API_URLS.AUTH.REFRESH,
            method: 'POST',
            body: { refreshToken },
          },
          api,
          extraOptions
        )

        if (refreshResult.data) {
          const data = refreshResult.data?.data ?? refreshResult.data
          api.dispatch(tokenRefreshed(data))
          return true
        }

        return false
      } finally {
        refreshPromise = null
      }
    })()
  }

  return refreshPromise
}

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions)

  if (result.error?.status === 401) {
    const url = typeof args === 'string' ? args : args?.url

    if (!isAuthSkipPath(url)) {
      const refreshed = await refreshAccessToken(api, extraOptions)

      if (refreshed) {
        result = await baseQuery(args, api, extraOptions)
      } else {
        api.dispatch(logout())
      }
    }
  }

  return result
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
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
    logout: builder.mutation({
      query: () => ({
        url: API_URLS.AUTH.LOGOUT,
        method: 'POST',
      }),
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
    sendChatMessage: builder.mutation({
      query: (message) => ({
        url: API_URLS.CHAT.BASE,
        method: 'POST',
        body: { message },
      }),
      transformResponse: (response) => response?.data ?? response,
    }),
    searchMarket: builder.query({
      query: (q) => ({
        url: API_URLS.MARKET.SEARCH,
        params: { q },
      }),
      transformResponse: (response) => response?.data ?? response,
    }),
    getTickerQuotes: builder.query({
      query: () => API_URLS.MARKET.TICKER,
      transformResponse: (response) => response?.data ?? response,
    }),
    getStockQuote: builder.query({
      query: (symbol) => API_URLS.MARKET.STOCK(symbol),
      transformResponse: (response) => response?.data ?? response,
    }),
    getMutualQuote: builder.query({
      query: (schemeCode) => API_URLS.MARKET.MUTUAL(schemeCode),
      transformResponse: (response) => response?.data ?? response,
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
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
  useSendChatMessageMutation,
  useLazySearchMarketQuery,
  useGetStockQuoteQuery,
  useGetMutualQuoteQuery,
  useGetTickerQuotesQuery,
} = apiSlice
