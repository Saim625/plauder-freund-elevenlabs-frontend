import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

const STORAGE_PREFIX = "pf_chat_";
const DEFAULT_LIMIT = 20;

export function useSessionMessages({ token, limit = DEFAULT_LIMIT } = {}) {
  const key = `${STORAGE_PREFIX}${token || "anon"}`;
  const [messages, setMessages] = useState(() => {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("sessionStorage read error", e);
      return [];
    }
  });

  useEffect(() => {
    const listener = (e) => {
      if (e.storageArea === sessionStorage && e.key === key) {
        setMessages(e.newValue ? JSON.parse(e.newValue) : []);
      }
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, [key]);

  const save = (next) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(next));
      setMessages(next);
    } catch (e) {
      console.error("sessionStorage save error", e);
    }
  };

  const addMessage = ({
    role,
    text,
    id = uuidv4(),
    timestamp = Date.now(),
  }) => {
    const next = [...messages, { id, role, text, timestamp }];

    // 🔧 If limit is null or 0 → store ALL messages
    const trimmed = limit ? next.slice(-limit) : next;

    save(trimmed);
    return id;
  };

  const getRecent = (n = limit) => messages.slice(-n);

  const clearMessages = () => {
    sessionStorage.removeItem(key);
    setMessages([]);
  };

  const replaceMessages = (newMessages = []) => {
    const trimmed = limit ? newMessages.slice(-limit) : newMessages;
    save(trimmed);
  };

  return {
    messages,
    addMessage,
    getRecent,
    clearMessages,
    replaceMessages,
  };
}
