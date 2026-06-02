import { CHAT_LABELS } from '../../constants/chat';
import { ChatComposer } from './ChatComposer';
import { ChatMessageList } from './ChatMessageList';
import { ChatPanelHeader } from './ChatPanelHeader';

export const ChatPanel = ({
  messages,
  isLoading,
  errorMessage,
  input,
  onInputChange,
  onSend,
  onKeyDown,
  onClose,
  messagesEndRef,
  inputRef,
}) => (
  <div
    className="pointer-events-auto flex h-[min(70vh,32rem)] w-[min(100vw-2rem,24rem)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-soft"
    role="dialog"
    aria-label={CHAT_LABELS.dialog}
  >
    <ChatPanelHeader onClose={onClose} />

    <div className="flex min-h-0 flex-1 flex-col">
      <ChatMessageList messages={messages} isLoading={isLoading} messagesEndRef={messagesEndRef} />
      <ChatComposer
        input={input}
        isLoading={isLoading}
        errorMessage={errorMessage}
        inputRef={inputRef}
        onInputChange={onInputChange}
        onSend={onSend}
        onKeyDown={onKeyDown}
      />
    </div>
  </div>
);

export default ChatPanel;
