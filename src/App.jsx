import { useEffect, useState, useRef, useCallback } from "react";
import StartButton from "./components/StartButton";
import Avatar from "./components/Avatar";
import { useMicrophone } from "./hooks/useMicrophone";
import { useSocket } from "./hooks/useSocket";
import { playBlob } from "./utils/audioHelpers";
import { useTokenAuth } from "./hooks/useTokenAuth";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { useGreeting } from "./hooks/useGreeting";
import { AdminDashboard } from "./components/adminDashboard/adminDashboard";
import { LandingPage } from "./components/LandingPage";
import { useAdminSession } from "./hooks/useAdminSession";
import AdminPasswordScreen from "./components/AdminPasswordScreen";
import ResetPasswordScreen from "./components/ResetPasswordScreen";
import { disableWakeLock, enableWakeLock } from "./utils/wakeLock";

export default function App() {
  const [stage, setStage] = useState("idle");
  const stageRef = useRef("idle");

  useEffect(() => {
    return () => {
      // We still want to release it if the component unmounts
      disableWakeLock();
    };
  }, []);

  if (window.location.pathname.startsWith("/admin/reset-password")) {
    return <ResetPasswordScreen />;
  }

  const { isAuthorized, token, isAdmin, role } = useTokenAuth();

  const { isAdminAuthenticated } = useAdminSession();

  const {
    greetingText,
    isLoading: greetingLoading,
    hasGreeting,
    decodeGreeting,
  } = useGreeting({ token, isAdmin });

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

  // ✅ Setup socket listeners ONCE
  useEffect(() => {
    if (!token || isAdmin) {
      return;
    }

    const socket = connect();

    if (!greetingText) {
      return;
    }

    // Clear all old listeners
    socket.off("ai-audio-chunk");
    socket.off("ai-audio-complete");
    socket.off("ai-interrupt");
    socket.off("ai-response-done");
    socket.off("ai-error");
    socket.off("reengagement-needed");

    let expectedIndex = 0;
    let lastTs = Date.now();
    let chunkCounter = 0; // +++
    const processedContexts = new Set(); // 🔥 Track processed contexts

    socket.on("reengagement-needed", () => {
      console.log("🟡 [FE] Backend requests re-engagement check");

      if (stageRef.current !== "chatting") {
        console.log("🚫 [FE] Not in chatting mode — ignoring re-engagement");
        return;
      }

      const isAiPlaying =
        activeSourcesRef.current.length > 0 || audioQueueRef.current.length > 0;

      if (isAiPlaying) {
        console.log("⏳ [FE] AI still speaking — ignoring re-engagement");
        return;
      }

      console.log("🟢 [FE] Confirmed silence → emitting trigger-reengagement");
      socket.emit("trigger-reengagement");
    });

    socket.on("ai-audio-chunk", (data) => {
      if (!data?.audio || !data?.contextId) {
        return;
      }
      const { contextId, audio, index, sentAt } = data;

      const now = Date.now();
      const gapMs = now - lastTs; //+++
      lastTs = now;

      chunkCounter++; //+++

      console.log("🎧 Audio Chunk Received", {
        chunkCounter,
        indexFromBE: index,
        expectedIndex,
        gapMs, // ⬅ key for production debugging
        chunkSizeBytes: audio.byteLength,
        contextId,
        queueLength: audioQueueRef.current.length,
      }); //+++

      console.log("🎧 Chunk timing", {
        index,
        sentAt,
        receivedAt: Date.now(),
        transportDelayMs: Date.now() - sentAt,
      });

      if (index !== expectedIndex) {
        console.warn("⚠️ Chunk sequence issue", {
          expectedIndex,
          receivedIndex: index,
          gapMs,
        });
        expectedIndex = index;
      }
      expectedIndex++;

      if (
        currentContextIdRef.current &&
        currentContextIdRef.current !== contextId
      ) {
        console.log(`🔄 New context detected, stopping old playback`);
        stopAudioPlayback();
      }

      currentContextIdRef.current = contextId;
      audioQueueRef.current.push(audio);
      playQueuedAudio();
    });

    socket.on("ai-audio-complete", (data) => {
      const { contextId } = data;

      // 🔥 FIX: Handle null/unknown contextId
      if (!contextId || contextId === "unknown") {
        console.warn(
          `⚠️ [AUDIO COMPLETE] Received null/unknown contextId, skipping`,
        );
        return;
      }

      console.log(`✅ [AUDIO COMPLETE] Received for context: ${contextId}`);

      // 🔥 FIX: Prevent duplicate processing
      if (processedContexts.has(contextId)) {
        console.log(
          `⚠️ Already processed context ${contextId}, ignoring duplicate`,
        );
        return;
      }

      processedContexts.add(contextId);

      const checkIfDone = () => {
        if (
          activeSourcesRef.current.length === 0 &&
          audioQueueRef.current.length === 0
        ) {
          console.log(`[PLAYBACK_DONE] Notifying backend. ctx=${contextId}`);
          socket.emit("ai-audio-done", { contextId });

          audioQueueRef.current = [];
          nextStartTimeRef.current = 0;
          currentContextIdRef.current = null;
          expectedIndex = 0;

          // 🔥 Clean up old contexts (keep last 10)
          if (processedContexts.size > 10) {
            const arr = Array.from(processedContexts);
            processedContexts.clear();
            arr.slice(-10).forEach((ctx) => processedContexts.add(ctx));
          }
        } else {
          console.log(
            `[WAITING] Still playing... sources=${activeSourcesRef.current.length}, queue=${audioQueueRef.current.length}`,
          );
          setTimeout(checkIfDone, 100);
        }
      };

      setTimeout(checkIfDone, 200);
    });

    socket.on("ai-interrupt", () => {
      console.log("🛑 [AI INTERRUPT] Stopping playback");
      stopAudioPlayback();
    });

    socket.on("ai-response-done", (data) => {
      console.log("✅ AI response complete:", data);
    });

    socket.on("ai-error", ({ message }) => {
      console.error("❌ AI Error:", message);
    });

    return () => {
      socket.off("reengagement-needed");
      socket.off("ai-audio-chunk");
      socket.off("ai-audio-complete");
      socket.off("ai-interrupt");
      socket.off("ai-response-done");
      socket.off("ai-error");
    };
  }, [token, greetingText]);

  if (isAuthorized === null)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-600 text-lg">
        Lädt...
      </div>
    );

  if (!isAuthorized) return <LandingPage />;

  if (isAdmin) {
    if (role === "MAIN_ADMIN" && !isAdminAuthenticated) {
      return (
        <AdminPasswordScreen
          urlToken={token}
          onSuccess={() => window.location.reload()}
        />
      );
    }
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

      await enableWakeLock();
    } catch (e) {
      console.error("❌ Failed to resume Playback AudioContext:", e);
    }

    try {
      setStage("starting");
      stageRef.current = "starting";

      if (hasGreeting) {
        const audioBuffer = await decodeGreeting(audioContextRef.current);
        await playGreeting(audioBuffer);
      } else {
        await playBlob(
          new Blob([await fetch("/intro.mp3").then((r) => r.arrayBuffer())], {
            type: "audio/mpeg",
          }),
        );
      }
      await start();
      setStage("chatting");
      stageRef.current = "chatting";
      socketRef.current.emit("conversation-started");
    } catch (err) {
      console.error("Mic denied:", err);
      setStage("denied");
      stageRef.current = "denied";
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
