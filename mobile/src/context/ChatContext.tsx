import React, { createContext, useContext, useState } from 'react';
import { router } from 'expo-router';
import type { ChatMessage, CollegeDetail } from '@/types';

interface ChatContextValue {
  messages: ChatMessage[];
  activeCollege: CollegeDetail | null;
  openForCollege: (college: CollegeDetail) => void;
  openGeneral: () => void;
  addMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;
  setActiveCollege: (college: CollegeDetail | null) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeCollege, setActiveCollege] = useState<CollegeDetail | null>(null);

  const openForCollege = (college: CollegeDetail) => {
    setActiveCollege(college);
    router.push('/chat');
  };

  const openGeneral = () => {
    setActiveCollege(null);
    router.push('/chat');
  };

  const addMessage = (msg: ChatMessage) =>
    setMessages((prev) => [...prev, msg]);

  const clearMessages = () => setMessages([]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        activeCollege,
        openForCollege,
        openGeneral,
        addMessage,
        clearMessages,
        setActiveCollege,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
