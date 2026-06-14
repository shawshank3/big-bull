/**
 * Chat API — RTK Query endpoints for /api/v1/chat.
 *
 * Endpoints:
 *   sendChatMessage — POST /api/v1/chat
 */
import { apiSlice } from '@/shared/api/apiSlice';
import { toChatReplyDTO } from '../dto/chat.dto';

export const chatApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    sendChatMessage: builder.mutation({
      query: (message) => ({
        url: '/api/v1/chat',
        method: 'POST',
        body: { message },
      }),
      transformResponse: (res) => toChatReplyDTO(res?.data),
    }),
  }),
  overrideExisting: false,
});

export const { useSendChatMessageMutation } = chatApi;
