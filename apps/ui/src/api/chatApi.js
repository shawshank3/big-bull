/**
 * Chat API — RTK Query endpoints for /api/v1/chat.
 *
 * Endpoints:
 *   sendChatMessage — POST /api/v1/chat
 *
 * The backend injects the user's portfolio context into the Gemini prompt
 * before responding. The response envelope is { reply: string }.
 */
import { apiSlice } from './apiSlice';

export const chatApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    sendChatMessage: builder.mutation({
      query: (message) => ({
        url: '/api/v1/chat',
        method: 'POST',
        body: { message },
      }),
      transformResponse: (res) => res?.data ?? res,
    }),
  }),
  overrideExisting: false,
});

export const { useSendChatMessageMutation } = chatApi;
