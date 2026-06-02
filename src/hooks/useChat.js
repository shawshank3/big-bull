import { useCallback, useEffect, useRef, useState } from 'react';
import { useSendChatMessageMutation } from '../api/apiSlice';
import { CHAT_ROLES, CHAT_WELCOME } from '../constants/chat';
import { getChatErrorMessage } from '@/components/chat/utils';

export const useChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([CHAT_WELCOME]);
  const [sendChatMessage, { isLoading, error, reset }] = useSendChatMessageMutation();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    inputRef.current?.focus();
  }, [isOpen, messages, isLoading]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setMessages((prev) => [...prev, { role: CHAT_ROLES.USER, content: trimmed }]);
    setInput('');
    reset();

    try {
      const { reply } = await sendChatMessage(trimmed).unwrap();
      setMessages((prev) => [...prev, { role: CHAT_ROLES.ASSISTANT, content: reply }]);
    } catch {
      // Error shown via `error` from RTK Query
    }
  }, [input, isLoading, reset, sendChatMessage]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  return {
    isOpen,
    setIsOpen,
    input,
    setInput,
    messages,
    isLoading,
    errorMessage: error ? getChatErrorMessage(error) : null,
    messagesEndRef,
    inputRef,
    sendMessage,
    handleKeyDown,
  };
};
