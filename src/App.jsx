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
import { useGreeting } from "./hooks/useGreeting";
import { AdminDashboard } from "./components/adminDashboard/adminDashboard";

export default function App() {
  const [stage, setStage] = useState("idle");

  const { isAuthorized, token, isAdmin } = useTokenAuth();

  const {
    greetingText,
    isLoading: greetingLoading,
    hasGreeting,
    decodeGreeting,
  } = useGreeting({ token });

  // 1. Audio Playback Logic
  const {
    audioContextRef,
    audioQueueRef,
    currentContextIdRef,
    stopAudioPlayback,
    playQueuedAudio,
    activeSourcesRef,
    nextStartTimeRef,
    playGreeting,
  } = useAudioPlayer();

  const { connect, sendChunk, disconnect, socketRef } = useSocket({
    token,
  });

  const { start, stop } = useMicrophone({
    onChunk: sendChunk,
  });

  const { addMessage } = useSessionMessages({ token, limit: 0 });

  const { saveSessionMemory } = useSessionMemory({ token });

  // ✅ Setup socket listeners ONCE
  useEffect(() => {
    if (!token || !greetingText || isAdmin) {
      return;
    }
    const socket = connect();

    socket.off("ai-audio-chunk");
    socket.off("ai-interrupt"); // ✅ NEW
    socket.off("ai-response-done");
    socket.off("ai-error");

    let expectedIndex = 0;
    let lastTs = Date.now();

    socket.on("ai-audio-chunk", (data) => {
      if (!data?.audio || !data?.contextId) {
        return;
      }
      const { contextId, audio, index, isFinal } = data;

      const now = Date.now();
      const delay = now - lastTs;
      lastTs = now;

      // 🟩 Detailed log — helps detect missing chunks / jitter / small chunks
      console.log(
        `[RECV_CHUNK] ctx=${contextId} idx=${index} expected=${expectedIndex} size=${audio.length} delay=${delay}ms queue=${audioQueueRef.current.length}`
      );

      // Detect missing chunks on FE
      if (index !== expectedIndex) {
        console.warn(
          `🚨 Missing chunk! Got=${index} Expected=${expectedIndex}`
        );
        expectedIndex = index; // realign to avoid flood errors
      }
      expectedIndex++;

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
        console.log(`[STREAM_DONE] Waiting for playback to finish...`);
        const checkIfDone = () => {
          if (
            activeSourcesRef.current.length === 0 &&
            audioQueueRef.current.length === 0
          ) {
            console.log(`[PLAYBACK_DONE] Notifying backend. ctx=${contextId}`);
            // ✅ Frontend tells backend: "I'm done playing audio!"
            socket.emit("ai-audio-complete", { contextId });

            // Clean up frontend state
            audioQueueRef.current = [];
            nextStartTimeRef.current = 0;
            currentContextIdRef.current = null;
            isPlayingRef.current = false;
          } else {
            setTimeout(checkIfDone, 100);
          }
        };
        setTimeout(checkIfDone, 200);
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

    return () => {
      socket.off("ai-audio-chunk");
      socket.off("ai-interrupt");
      socket.off("ai-response-done");
      socket.off("ai-error");
      socket.off("user-transcript");
      socket.off("ai-transcript");
      socket.off("disconnect");
    };
  }, [token, greetingText]);

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

  if (isAdmin) {
    return <AdminDashboard token={token} />;
  }

  const handleStart = async () => {
    const audioContext = audioContextRef.current;

    // Create the context NOW, on click, if it doesn't exist.
    if (!audioContext) {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    }

    try {
      await audioContextRef.current.resume();
    } catch (e) {
      console.error("❌ Failed to resume Playback AudioContext:", e);
    }

    try {
      setStage("starting");

      if (hasGreeting) {
        const audioBuffer = await decodeGreeting(audioContextRef.current);
        await playGreeting(audioBuffer);
      } else {
        await playBlob(
          new Blob([await fetch("/intro.mp3").then((r) => r.arrayBuffer())], {
            type: "audio/mpeg",
          })
        );
      }
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
      <StartButton
        stage={stage}
        onStart={handleStart}
        greetingLoading={greetingLoading}
      />

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
