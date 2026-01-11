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
    enableWakeLock();

    return () => {
      disableWakeLock();
    };
  }, []);

  if (window.location.pathname.startsWith("/admin/reset-password")) {
    return <ResetPasswordScreen />;
  }

  const { isAuthorized, token, isAdmin } = useTokenAuth();

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
    if (!token || !greetingText || isAdmin) {
      return;
    }
    const socket = connect();

    socket.off("ai-audio-chunk");
    socket.off("ai-audio-complete");
    socket.off("ai-interrupt"); // ✅ NEW
    socket.off("ai-response-done");
    socket.off("ai-error");

    let expectedIndex = 0;
    let lastTs = Date.now();

    socket.on("reengagement-needed", () => {
      console.log("🟡 [FE] Backend requests re-engagement check");

      console.log("📌 [FE] Stage:", stageRef.current);
      console.log(
        "📌 [FE] ActiveSources:",
        activeSourcesRef.current.length,
        "AudioQueue:",
        audioQueueRef.current.length
      );

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
      const { contextId, audio, index } = data;

      const now = Date.now();
      const delay = now - lastTs;
      lastTs = now;

      // Detect missing chunks on FE
      if (index !== expectedIndex) {
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
      socket.on("ai-audio-complete", (data) => {
        const { contextId } = data;
        console.log(`✅ [AUDIO COMPLETE] Received for context: ${contextId}`);

        // Reset state when stream finishes
        const checkIfDone = () => {
          if (
            activeSourcesRef.current.length === 0 &&
            audioQueueRef.current.length === 0
          ) {
            console.log(`[PLAYBACK_DONE] Notifying backend. ctx=${contextId}`);
            // ✅ Frontend tells backend: "I'm done playing audio!"
            socket.emit("ai-audio-done", { contextId });

            // Clean up frontend state
            audioQueueRef.current = [];
            nextStartTimeRef.current = 0;
            currentContextIdRef.current = null;
          } else {
            console.log(
              `[WAITING] Still playing... sources=${activeSourcesRef.current.length}, queue=${audioQueueRef.current.length}`
            );
            setTimeout(checkIfDone, 100);
          }
        };
        setTimeout(checkIfDone, 200);
      });
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
      socket.off("reengagement-needed");
      socket.off("ai-audio-chunk");
      socket.off("ai-audio-complete");
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

  if (!isAuthorized) return <LandingPage />;

  if (isAdmin) {
    if (!isAdminAuthenticated) {
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
          })
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
