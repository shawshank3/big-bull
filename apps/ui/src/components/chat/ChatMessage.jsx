import { cn } from '@/lib/utils';
import { CHAT_ROLES } from '../../constants/chat';

export const ChatMessage = ({ role, content }) => {
  const isUser = role === CHAT_ROLES.USER;

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
          'whitespace-pre-wrap break-words',
          isUser ? 'bg-primary text-white' : 'border border-border bg-bg text-foreground'
        )}
      >
        {content}
      </div>
    </div>
  );
};

export default ChatMessage;
