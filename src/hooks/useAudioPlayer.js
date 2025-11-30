import { useRef, useCallback, useEffect } from "react";

export function useAudioPlayer() {
  const audioContextRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const nextStartTimeRef = useRef(0);
  const currentContextIdRef = useRef(null);
  const activeSourcesRef = useRef([]); // ✅ NEW: Track active audio sources
  const MIN_BUFFER_CHUNKS = 2;

  const playGreeting = (audioBuffer) => {
    return new Promise((resolve) => {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);

      // 🆕 Store in activeSourcesRef for interruption!
      activeSourcesRef.current.push(source);

      source.onended = () => {
        // Remove from active sources
        const index = activeSourcesRef.current.indexOf(source);
        if (index > -1) {
          activeSourcesRef.current.splice(index, 1);
        }
        resolve(); // Greeting finished
      };

      source.start(0);
    });
  };

  // ✅ Initialize AudioContext ONCE
  useEffect(() => {
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

    // ⚠️ Ensure this check is here to resume a context that *you* suspended
    if (
      audioContext.state === "suspended" ||
      audioContext.state === "interrupted"
    ) {
      await audioContext.resume();
      console.log("State of Audio Context", audioContext.state);
    }

    if (
      nextStartTimeRef.current === 0 &&
      audioQueue.length < MIN_BUFFER_CHUNKS
    ) {
      return;
      console.log("Length", audioQueue.length);
      s;
    }

    isPlayingRef.current = true;

    while (audioQueue.length > 0) {
      const base64Chunk = audioQueue.shift();

      try {
        // Decoding logic
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

    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
    }
    // Check if more chunks arrived while playing
    if (audioQueueRef.current.length > 0) {
      setTimeout(() => playQueuedAudio(), 50);
    }
  }, []);

  return {
    audioContextRef,
    audioQueueRef,
    currentContextIdRef,
    activeSourcesRef,
    nextStartTimeRef,
    MIN_BUFFER_CHUNKS,
    stopAudioPlayback,
    playQueuedAudio,
    playGreeting,
  };
}
