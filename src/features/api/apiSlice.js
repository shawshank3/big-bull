import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    // Posts (kept for reference)
    getPosts: builder.query({ query: () => '/posts' }),
    createPost: builder.mutation({
      query: (newPost) => ({ url: '/posts', method: 'POST', body: newPost })
    }),

    // Holdings endpoints for Dashboard
    getMutualHoldings: builder.query({ query: () => '/holdings/mutuals' }),
    getStockHoldings: builder.query({ query: () => '/holdings/stocks' }),
  }),
})

export const {
  useGetPostsQuery,
  useCreatePostMutation,
  useGetMutualHoldingsQuery,
  useGetStockHoldingsQuery,
} = apiSlice
