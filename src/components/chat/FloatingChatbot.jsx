import { MessageCircle, X } from 'lucide-react';
import { Button } from '../common';
import { CHAT_LABELS } from '../../constants/chat';
import { useChat } from '../../hooks/useChat';
import { ChatPanel } from './ChatPanel';

export const FloatingChatbot = () => {
  const {
    isOpen,
    setIsOpen,
    input,
    setInput,
    messages,
    isLoading,
    errorMessage,
    messagesEndRef,
    inputRef,
    sendMessage,
    handleKeyDown,
  } = useChat();

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {isOpen ? (
        <ChatPanel
          messages={messages}
          isLoading={isLoading}
          errorMessage={errorMessage}
          input={input}
          onInputChange={setInput}
          onSend={sendMessage}
          onKeyDown={handleKeyDown}
          onClose={() => setIsOpen(false)}
          messagesEndRef={messagesEndRef}
          inputRef={inputRef}
        />
      ) : null}

      <Button
        type="button"
        className="pointer-events-auto h-14 w-14 rounded-full p-0 shadow-soft"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? CHAT_LABELS.close : CHAT_LABELS.open}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="h-6 w-6" aria-hidden /> : <MessageCircle className="h-6 w-6" aria-hidden />}
      </Button>
    </div>
  );
};

export default FloatingChatbot;
