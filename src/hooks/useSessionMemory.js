import { useCallback, useEffect, useRef } from "react";

export function useSessionMemory({ token }) {
  // ✅ No messages param!
  const hasSavedRef = useRef(false);
  const isUnloadingRef = useRef(false);

  const saveSessionMemory = useCallback(() => {
    if (hasSavedRef.current) {
      return;
    }

    // ✅ Read directly from sessionStorage
    const key = `pf_chat_${token}`;
    const raw = sessionStorage.getItem(key);
    console.log(raw);
    const messages = raw ? JSON.parse(raw) : [];

    if (!messages || !messages.length) {
      return;
    }

    const conversationForSummary = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.text}`)
      .join("\n");

    const payload = JSON.stringify({ token, text: conversationForSummary });
    const blob = new Blob([payload], { type: "application/json" });

    const url = `${import.meta.env.VITE_SERVER_URL}/api/memory/summarize`;
    const sent = navigator.sendBeacon(url, blob);

    if (sent) {
      hasSavedRef.current = true;

      if (isUnloadingRef.current) {
        sessionStorage.removeItem(key);
      }
    }
  }, [token]); // ✅ Only token dependency!

  useEffect(() => {
    if (!token) {
      return;
    }

    const handleBeforeUnload = (e) => {
      console.log("📤 [beforeunload] EVENT FIRED!");
      isUnloadingRef.current = true;

      saveSessionMemory();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [token]);

  return { saveSessionMemory };
}
