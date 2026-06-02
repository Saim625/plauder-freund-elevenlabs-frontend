import { useEffect, useRef, useState } from "react";
import { calculateRms } from "../utils/audioUtils"; // Import the VAD helper

// --- VAD Configuration ---
const VAD_THRESHOLD = 0.003; // RMS threshold for speech detection
const SILENCE_GRACE_PERIOD_MS = 1500; // 1.5 seconds of silence allowed before ending turn

export function useMicrophone({ onChunk } = {}) {
  const [speaking, setSpeaking] = useState(false);

  const speakingRef = useRef(false);
  const audioContextRef = useRef(null);
  const workletNodeRef = useRef(null);
  const streamRef = useRef(null);
  const isPausedRef = useRef(false);
  const silenceTimerRef = useRef(null);

  const setSpeakingState = (val) => {
    setSpeaking(val);
    speakingRef.current = val;
  };

  const handlePcmMessage = (event) => {
    if (isPausedRef.current) return;

    const pcm16Buffer = event.data;
    const int16Array = new Int16Array(pcm16Buffer);

    const rms = calculateRms(int16Array);
    const isLoud = rms > VAD_THRESHOLD;

    // Socket fallback only — WebRTC sends the MediaStream track directly
    if (onChunk) {
      onChunk(pcm16Buffer);
    }

    if (isLoud) {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      if (!speakingRef.current) {
        setSpeakingState(true);
      }
    } else if (speakingRef.current) {
      if (!silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          setSpeakingState(false);
          silenceTimerRef.current = null;
        }, SILENCE_GRACE_PERIOD_MS);
      }
    }
  };

  async function start() {
    try {
      console.log("🔄 Attempting to start microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      await audioContext.audioWorklet.addModule("/pcm-processor.js");
      const source = audioContext.createMediaStreamSource(stream);
      const pcmNode = new AudioWorkletNode(audioContext, "pcm-processor");

      pcmNode.port.onmessage = handlePcmMessage;

      source.connect(pcmNode).connect(audioContext.destination);
      workletNodeRef.current = pcmNode;

      setSpeakingState(false);
      isPausedRef.current = false;
      return stream;
    } catch (error) {
      console.error("❌ Error accessing microphone:", error);
      throw error;
    }
  }

  function stop() {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    isPausedRef.current = true;
    setSpeakingState(false);

    if (workletNodeRef.current) {
      workletNodeRef.current.port.onmessage = null;
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current?.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }

  function pause() {
    isPausedRef.current = true;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    setSpeakingState(false);
  }

  function resume() {
    isPausedRef.current = false;
  }

  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  return { start, stop, pause, resume, speaking, streamRef };
}
