import { useCallback, useEffect } from "react";

export function useSessionMemory({ messages, token }) {
  const saveSessionMemory = useCallback(() => {
    if (!messages || !messages.length) {
      console.warn("⚠️ No messages found to summarize.");
      return;
    }

    const key = `pf_chat_${token}`;

    const conversationForSummary = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.text}`)
      .join("\n");

    const payload = JSON.stringify({ token, text: conversationForSummary });
    const blob = new Blob([payload], { type: "application/json" });

    const url = `${import.meta.env.VITE_SERVER_URL}/api/memory/summarize`;
    const sent = navigator.sendBeacon(url, blob);

    console.log("📡 sendBeacon sent?", sent);

    // 🎯 CRITICAL: Clear session storage after queuing the data for backend save
    if (sent) {
      sessionStorage.removeItem(key);
      console.log(`🧹 Cleared sessionStorage key: ${key}`);
    }
  }, [messages, token]);

  // Effect to attach the memory saving to browser cleanup events
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log("📤 beforeunload triggered! Saving memory...");
      // saveSessionMemory runs inside here
      saveSessionMemory();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [saveSessionMemory]);

  return { saveSessionMemory };
}
