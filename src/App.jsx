import { useEffect, useState, useRef, useCallback } from "react";
import StartButton from "./components/StartButton";
import Avatar from "./components/Avatar";
import { useMicrophone } from "./hooks/useMicrophone";
import { useSocket } from "./hooks/useSocket";
import { playBlob } from "./utils/audioHelpers";

export default function App() {
  const [stage, setStage] = useState("idle");
  const [statusLabel, setStatusLabel] = useState("");

  // Audio playback state
  const audioContextRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const nextStartTimeRef = useRef(0);
  const currentContextIdRef = useRef(null);
  const activeSourcesRef = useRef([]); // ✅ NEW: Track active audio sources
  const MIN_BUFFER_CHUNKS = 2;

  const { connect, sendChunk, disconnect, socketRef } = useSocket({
    onStatus: setStatusLabel,
  });

  const { start, stop } = useMicrophone({
    onChunk: sendChunk,
  });

  // ✅ Initialize AudioContext ONCE
  useEffect(() => {
    audioContextRef.current = new AudioContext({ sampleRate: 24000 });

    return () => {
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // ✅ NEW: Function to stop all audio immediately
  const stopAudioPlayback = useCallback(() => {
    // Stop all active audio sources
    activeSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch (e) {
        // Already stopped, ignore
        console.log(e.message);
      }
    });
    activeSourcesRef.current = [];

    // Clear queue and reset state
    audioQueueRef.current = [];
    nextStartTimeRef.current = 0;
    isPlayingRef.current = false;
    currentContextIdRef.current = null;
  }, []);

  // Memoized playback function
  const playQueuedAudio = useCallback(async () => {
    const audioContext = audioContextRef.current;
    const audioQueue = audioQueueRef.current;

    if (!audioContext || audioContext.state === "closed") {
      return;
    }

    if (isPlayingRef.current || audioQueue.length === 0) {
      return;
    }

    if (
      nextStartTimeRef.current === 0 &&
      audioQueue.length < MIN_BUFFER_CHUNKS
    ) {
      return;
    }

    isPlayingRef.current = true;

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    while (audioQueue.length > 0) {
      const base64Chunk = audioQueue.shift();

      try {
        const binaryString = atob(base64Chunk);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const pcmData = new Int16Array(bytes.buffer);
        const audioBuffer = audioContext.createBuffer(1, pcmData.length, 24000);
        const channelData = audioBuffer.getChannelData(0);
        for (let i = 0; i < pcmData.length; i++) {
          channelData[i] = pcmData[i] / 32768.0;
        }

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);

        if (nextStartTimeRef.current === 0) {
          nextStartTimeRef.current = audioContext.currentTime;
        }

        source.start(nextStartTimeRef.current);
        nextStartTimeRef.current += audioBuffer.duration;

        // ✅ NEW: Track active source for interruption
        activeSourcesRef.current.push(source);

        // ✅ NEW: Remove from tracking when finished
        source.onended = () => {
          const index = activeSourcesRef.current.indexOf(source);
          if (index > -1) {
            activeSourcesRef.current.splice(index, 1);
          }
        };
      } catch (err) {
        console.error("❌ Error decoding audio chunk:", err);
      }
    }

    isPlayingRef.current = false;

    // Check if more chunks arrived while playing
    if (audioQueueRef.current.length > 0) {
      setTimeout(() => playQueuedAudio(), 50);
    }
  }, []);

  // ✅ Setup socket listeners ONCE
  useEffect(() => {
    const socket = connect();

    socket.off("ai-audio-chunk");
    socket.off("ai-interrupt"); // ✅ NEW
    socket.off("ai-response-done");
    socket.off("ai-error");

    // Handle audio chunks
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
    };
  }, [connect, playQueuedAudio, stopAudioPlayback]); // ✅ Add stopAudioPlayback

  const handleStart = async () => {
    try {
      connect();
      setStage("starting");

      await playBlob(
        new Blob([await fetch("/intro.mp3").then((r) => r.arrayBuffer())], {
          type: "audio/mpeg",
        })
      );

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
