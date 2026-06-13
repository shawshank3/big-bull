import { CHAT_LABELS } from '../../constants/chat';
import { ChatMessage } from './ChatMessage';

export const ChatMessageList = ({ messages, isLoading, messagesEndRef }) => {
  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
      {messages.map((message, index) => (
        <ChatMessage
          key={`${message.role}-${index}`}
          role={message.role}
          content={message.content}
        />
      ))}
      {isLoading ? (
        <div className="flex justify-start">
          <div className="rounded-2xl border border-border bg-bg px-3 py-2 text-sm text-muted">
            {CHAT_LABELS.loading}
          </div>
        </div>
      ) : null}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessageList;
