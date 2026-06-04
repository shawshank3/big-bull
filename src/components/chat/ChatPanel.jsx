import { createContext, useContext } from 'react';
import { Send } from 'lucide-react';
import { Alert, Button } from '../common';
import { cn } from '@/lib/utils';
import { CHAT_LABELS } from '../../constants/chat';
import { ChatMessage } from './ChatMessage';

// Create context for sharing state between compound components
const ChatContext = createContext(null);

const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('ChatPanel compound components must be used within ChatPanel');
  }
  return context;
};

// Compound components
const Header = ({ onClose }) => (
  <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
    <p className="font-semibold text-foreground">{CHAT_LABELS.title}</p>
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClose}
      className="h-8 w-8 p-0"
      aria-label={CHAT_LABELS.close}
    >
      ✕
    </Button>
  </header>
);

const MessageList = ({ messagesEndRef }) => {
  const { messages, isLoading } = useChatContext();
  
  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
      {messages.map((message, index) => (
        <ChatMessage key={`${message.role}-${index}`} role={message.role} content={message.content} />
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="rounded-2xl border border-border bg-bg px-3 py-2 text-sm text-muted">
            {CHAT_LABELS.loading}
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

const ErrorAlert = () => {
  const { errorMessage } = useChatContext();
  
  if (!errorMessage) return null;
  
  return (
    <div className="shrink-0 px-4 pb-2">
      <Alert variant="danger">{errorMessage}</Alert>
    </div>
  );
};

const Composer = ({ inputRef, onInputChange, onSend, onKeyDown }) => {
  const { input, isLoading } = useChatContext();
  
  return (
    <footer className="shrink-0 border-t border-border p-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={CHAT_LABELS.placeholder}
          rows={2}
          disabled={isLoading}
          className={cn(
            'min-h-[2.75rem] flex-1 resize-none rounded-xl border border-border bg-bg px-3 py-2 text-sm text-foreground',
            'placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        />
        <Button
          type="button"
          size="sm"
          className="h-10 w-10 shrink-0 p-0"
          onClick={onSend}
          disabled={!input.trim() || isLoading}
          loading={isLoading}
          aria-label={CHAT_LABELS.send}
        >
          <Send className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </footer>
  );
};

// Main component
export const ChatPanel = ({ messages, isLoading, errorMessage, input, children }) => {
  return (
    <ChatContext.Provider value={{ messages, isLoading, errorMessage, input }}>
      <div
        className="pointer-events-auto flex h-[min(70vh,32rem)] w-[min(100vw-2rem,24rem)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-soft"
        role="dialog"
        aria-label={CHAT_LABELS.dialog}
      >
        {children}
      </div>
    </ChatContext.Provider>
  );
};

// Attach compound components
ChatPanel.Header = Header;
ChatPanel.MessageList = MessageList;
ChatPanel.ErrorAlert = ErrorAlert;
ChatPanel.Composer = Composer;

export default ChatPanel;
