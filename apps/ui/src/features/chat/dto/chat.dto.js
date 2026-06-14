import { str } from '@/shared/dto/helpers';

export function toChatReplyDTO(raw) {
  return {
    reply: str(raw?.reply),
  };
}
