import { useEffect, useState, useRef, useCallback } from "react";
import StartButton from "./components/StartButton";
import Avatar from "./components/Avatar";
import { useMicrophone } from "./hooks/useMicrophone";
import { useSocket } from "./hooks/useSocket";
import { playBlob } from "./utils/audioHelpers";
import { useTokenAuth } from "./hooks/useTokenAuth";
import { useSessionMessages } from "./hooks/useSessionMessages";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { useSessionMemory } from "./hooks/useSessionMemory";

export default function App() {
  const [stage, setStage] = useState("idle");

  const { isAuthorized, token } = useTokenAuth();

  // 1. Audio Playback Logic
  const {
    audioContextRef,
    audioQueueRef,
    currentContextIdRef,
    stopAudioPlayback,
    playQueuedAudio,
    activeSourcesRef,
    nextStartTimeRef,
  } = useAudioPlayer();

  const { connect, sendChunk, disconnect, socketRef } = useSocket({
    token,
  });

  const { start, stop } = useMicrophone({
    onChunk: sendChunk,
  });

  const { addMessage, messages } = useSessionMessages({ token, limit: 0 });

  const { saveSessionMemory } = useSessionMemory({ token, messages });

  // ✅ Setup socket listeners ONCE
  useEffect(() => {
    if (!token) {
      return;
    }
    const socket = connect();

    socket.off("ai-audio-chunk");
    socket.off("ai-interrupt"); // ✅ NEW
    socket.off("ai-response-done");
    socket.off("ai-error");

    socket.on("ai-audio-chunk", (data) => {
      if (!data?.audio || !data?.contextId) {
        return;
      }

      const { contextId, audio, isFinal } = data;

      // If new context, clear old audio queue
      if (
        currentContextIdRef.current &&
        currentContextIdRef.current !== contextId
      ) {
        stopAudioPlayback(); // ✅ Use stop function
      }

      currentContextIdRef.current = contextId;
      audioQueueRef.current.push(audio);
      playQueuedAudio();

      // Reset state when stream finishes
      if (isFinal) {
        const audioContext = audioContextRef.current;

        if (audioContext && nextStartTimeRef.current > 0) {
          const remaining = Math.max(
            0,
            nextStartTimeRef.current - audioContext.currentTime
          );
          setTimeout(() => {
            audioQueueRef.current = [];
            nextStartTimeRef.current = 0;
            currentContextIdRef.current = null;
            isPlayingRef.current = false;
            activeSourcesRef.current = []; // ✅ Clear sources
          }, remaining * 1000 + 300);
        }
      }
    });

    // ✅ NEW: Handle interruption signal from backend
    socket.on("ai-interrupt", () => {
      stopAudioPlayback();
    });

    // for storing user messages in session storage
    socket.on("user-transcript", (data) => {
      if (!data?.text) return;
      addMessage({ role: "user", text: data.text });
    });

    // for storing AI response in session storage
    socket.on("ai-transcript", (data) => {
      if (!data?.text) return;
      addMessage({ role: "assistant", text: data.text });
    });

    socket.on("ai-response-done", (data) => {
      console.log("✅ AI response complete:", data);
    });

    socket.on("ai-error", ({ message }) => {
      console.error("❌ AI Error:", message);
    });

    // --- DISCONNECT/MEMORY HANDLING ---
    // saveSessionMemory is provided by the useSessionMemory hook
    socket.on("disconnect", saveSessionMemory);

    return () => {
      socket.off("ai-audio-chunk");
      socket.off("ai-interrupt");
      socket.off("ai-response-done");
      socket.off("ai-error");
      socket.off("user-transcript");
      socket.off("ai-transcript");
      socket.off("disconnect");
    };
  }, [
    connect,
    token,
    stopAudioPlayback,
    playQueuedAudio,
    addMessage,
    saveSessionMemory,
  ]);

  useEffect(() => {
    console.log("🧠 Session messages updated:", messages);
  }, [messages]);

  if (isAuthorized === null)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-600 text-lg">
        Lädt...
      </div>
    );

  if (!isAuthorized)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 text-red-600">
        <h1 className="text-2xl font-semibold mb-2">Zugriff verweigert</h1>
        <p className="text-gray-700">Ungültiges oder fehlendes Token.</p>
      </div>
    );

  const handleStart = async () => {
    // 1. --- CRITICAL FIX START ---
    const audioContext = audioContextRef.current;

    // Create the context NOW, on click, if it doesn't exist.
    if (!audioContext) {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    }

    // Resume the context IMMEDIATELY and SYNCHRONOUSLY
    try {
      // Use the newly created or existing context
      await audioContextRef.current.resume();
      console.log(
        "✅ Playback AudioContext successfully resumed by user gesture."
      );
    } catch (e) {
      console.error("❌ Failed to resume Playback AudioContext:", e);
      // Handle failure (e.g., show a persistent button with a "Click to enable sound")
    }
    // 1. --- CRITICAL FIX END ---

    try {
      setStage("starting");

      // Now you can safely use 'await' for fetching and starting the mic
      await playBlob(
        new Blob([await fetch("/intro.mp3").then((r) => r.arrayBuffer())], {
          type: "audio/mpeg",
        })
      );

      // The start() call (which creates the MIC context) can proceed
      await start();
      setStage("chatting");
    } catch (err) {
      console.error("Mic denied:", err);
      setStage("denied");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#fdfcf7] font-[Inter] p-4">
      {/* Avatar always visible */}
      <Avatar />

      {/* Start button appears only in idle stage */}
      <StartButton stage={stage} onStart={handleStart} />

      {/* Denied state message */}
      {stage === "denied" && (
        <div className="flex flex-col items-center p-8 bg-white rounded-xl shadow-2xl mt-8">
          <p className="text-red-600 font-bold text-xl">
            Mikrofonzugriff verweigert
          </p>
          <p className="text-gray-500 mt-2 text-center">
            Bitte aktivieren Sie die Mikrofonberechtigungen in Ihren
            Browsereinstellungen.
          </p>
        </div>
      )}
    </div>
  );
}
