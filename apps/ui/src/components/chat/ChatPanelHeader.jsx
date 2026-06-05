import { Bot, X } from 'lucide-react';
import { Button } from '../common';
import { CHAT_LABELS } from '../../constants/chat';

export const ChatPanelHeader = ({ onClose }) => {
  return (
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
        className="w-8 p-0 text-white hover:bg-white/15"
        onClick={onClose}
        aria-label={CHAT_LABELS.close}
      >
        <X className="h-4 w-4" aria-hidden />
      </Button>
    </header>
  );
};

export default ChatPanelHeader;
