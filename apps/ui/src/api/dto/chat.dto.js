import { str } from './helpers';

// ---------------------------------------------------------------------------
// toChatReplyDTO
// Consumed by: sendChatMessage
// Raw source: chat.controller.js → sendSuccess(res, { reply }) → { reply: string }
// ---------------------------------------------------------------------------

export function toChatReplyDTO(raw) {
  return {
    reply: str(raw?.reply),
  };
}
