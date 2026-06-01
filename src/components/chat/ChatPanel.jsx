import { Bot, Send, X } from 'lucide-react';
import { Alert, Button } from '../common';
import { cn } from '@/lib/utils';
import { CHAT_LABELS } from '../../constants/chat';
import { ChatMessage } from './ChatMessage';

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
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-primary px-4 py-3 text-white">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
          <Bot className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-bold leading-tight">{CHAT_LABELS.title}</p>
          <p className="text-xs text-white/80">{CHAT_LABELS.subtitle}</p>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-white hover:bg-white/15"
        onClick={onClose}
        aria-label={CHAT_LABELS.close}
      >
        <X className="h-4 w-4" aria-hidden />
      </Button>
    </header>

    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((message, index) => (
          <ChatMessage key={`${message.role}-${index}`} role={message.role} content={message.content} />
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

      {errorMessage ? (
        <div className="shrink-0 px-4 pb-2">
          <Alert variant="danger">{errorMessage}</Alert>
        </div>
      ) : null}

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
    </div>
  </div>
);

export default ChatPanel;
