import { Send } from 'lucide-react';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { cn } from '@/lib/utils';
import { CHAT_LABELS } from '../constants/chat';

export const ChatComposer = ({
  input,
  isLoading,
  errorMessage,
  inputRef,
  onInputChange,
  onSend,
  onKeyDown,
}) => (
  <>
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
          onChange={(e) => onInputChange(e.target.value)}
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
          size="md"
          className="w-10 shrink-0 p-0"
          onClick={onSend}
          disabled={!input.trim() || isLoading}
          loading={isLoading}
          aria-label={CHAT_LABELS.send}
        >
          <Send className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </footer>
  </>
);

export default ChatComposer;
