import { createContext, useContext, useState } from 'react';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCollege, setActiveCollege] = useState(null);
  const [messages, setMessages] = useState([]);  // {role, content}

  function openForCollege(college) {
    // Reset chat when switching colleges
    if (!activeCollege || activeCollege.code !== college.code) {
      setMessages([]);
      setActiveCollege(college);
    }
    setIsOpen(true);
  }

  function openGeneral() {
    setActiveCollege(null);
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
  }

  function addMessage(role, content) {
    setMessages((prev) => [...prev, { role, content }]);
  }

  return (
    <ChatContext.Provider value={{ isOpen, activeCollege, messages, openForCollege, openGeneral, close, addMessage }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
