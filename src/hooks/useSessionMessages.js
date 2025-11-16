import { useState } from "react";
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

  const addMessage = ({
    role,
    text,
    id = uuidv4(),
    timestamp = Date.now(),
  }) => {
    setMessages((prevMessages) => {
      const next = [...prevMessages, { id, role, text, timestamp }];
      const trimmed = limit ? next.slice(-limit) : next;

      // Save to sessionStorage
      try {
        sessionStorage.setItem(key, JSON.stringify(trimmed));
      } catch (e) {
        console.error("sessionStorage save error", e);
      }

      return trimmed;
    });

    return id;
  };

  return {
    addMessage,
  };
}
