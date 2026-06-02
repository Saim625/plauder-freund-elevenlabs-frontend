import { useCallback, useEffect, useRef, useState } from "react";
import {
  getIceServers,
  getWebRtcSignalingRole,
  isWebRtcTransportEnabled,
} from "../config/webrtc";

const SIGNAL_EVENTS = {
  OFFER: "webrtc-offer",
  ANSWER: "webrtc-answer",
  ICE: "webrtc-ice-candidate",
  CLOSE: "webrtc-close",
  RESET: "webrtc-reset",
  READY: "webrtc-ready",
};

/**
 * WebRTC mic uplink with Socket.IO signaling.
 * One RTCPeerConnection per session; recreated on explicit reset or failed connection.
 */
export function useWebRTC({ socketRef, enabled = isWebRtcTransportEnabled() }) {
  const pcRef = useRef(null);
  const pendingIceRef = useRef([]);
  const localStreamRef = useRef(null);
  const remoteAudioElRef = useRef(null);
  const isNegotiatingRef = useRef(false);
  const hasSocketConnectedOnceRef = useRef(false);

  const [connectionState, setConnectionState] = useState("new");
  const [lastError, setLastError] = useState(null);

  const getSocket = useCallback(() => socketRef.current, [socketRef]);

  const emitSignal = useCallback(
    (event, payload) => {
      const socket = getSocket();
      if (!socket?.connected) {
        console.warn(`[WebRTC] Cannot emit ${event} — socket disconnected`);
        return false;
      }
      socket.emit(event, payload);
      return true;
    },
    [getSocket],
  );

  const flushPendingIce = useCallback(async (pc) => {
    const queue = pendingIceRef.current.splice(0);
    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("[WebRTC] Deferred ICE candidate failed:", err.message);
      }
    }
  }, []);

  const queueOrAddIceCandidate = useCallback(
    async (pc, candidateInit) => {
      if (!candidateInit) return;
      if (!pc.remoteDescription) {
        pendingIceRef.current.push(candidateInit);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
      } catch (err) {
        console.warn("[WebRTC] ICE candidate error:", err.message);
      }
    },
    [],
  );

  const closePeerConnection = useCallback(() => {
    isNegotiatingRef.current = false;
    pendingIceRef.current = [];

    if (remoteAudioElRef.current) {
      remoteAudioElRef.current.srcObject = null;
      remoteAudioElRef.current.remove();
      remoteAudioElRef.current = null;
    }

    const pc = pcRef.current;
    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.close();
    }
    pcRef.current = null;
    setConnectionState("closed");
  }, []);

  const attachRemotePlayback = useCallback((stream) => {
    if (!stream) return;

    let audioEl = remoteAudioElRef.current;
    if (!audioEl) {
      audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioEl.playsInline = true;
      audioEl.setAttribute("playsinline", "true");
      document.body.appendChild(audioEl);
      remoteAudioElRef.current = audioEl;
    }

    audioEl.srcObject = stream;
    audioEl.play().catch((err) => {
      console.warn("[WebRTC] Remote audio autoplay blocked:", err.message);
    });
  }, []);

  const createPeerConnection = useCallback(() => {
    closePeerConnection();

    const pc = new RTCPeerConnection({ iceServers: getIceServers() });
    pcRef.current = pc;
    setConnectionState("connecting");
    setLastError(null);

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      emitSignal(SIGNAL_EVENTS.ICE, { candidate: event.candidate.toJSON() });
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      setConnectionState(state);
      console.log(`[WebRTC] connectionState=${state}`);

      if (state === "failed") {
        setLastError(new Error("WebRTC connection failed"));
        emitSignal(SIGNAL_EVENTS.CLOSE, { reason: "failed" });
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        console.log("[WebRTC] Remote audio track received");
        attachRemotePlayback(stream);
      }
    };

    return pc;
  }, [attachRemotePlayback, closePeerConnection, emitSignal]);

  const addLocalTracks = useCallback((pc, stream) => {
    const senders = pc.getSenders();
    stream.getAudioTracks().forEach((track) => {
      const alreadySending = senders.some((s) => s.track?.id === track.id);
      if (!alreadySending) {
        pc.addTrack(track, stream);
      }
    });
  }, []);

  const attachLocalStream = useCallback(
    (stream) => {
      if (!enabled || !stream) return;
      localStreamRef.current = stream;

      const pc = pcRef.current;
      if (pc && pc.connectionState !== "closed") {
        addLocalTracks(pc, stream);
      }
    },
    [addLocalTracks, enabled],
  );

  const createAndSendOffer = useCallback(async () => {
    if (!enabled || isNegotiatingRef.current) return false;

    const stream = localStreamRef.current;
    if (!stream) {
      console.warn("[WebRTC] No local stream — skip offer");
      return false;
    }

    isNegotiatingRef.current = true;
    try {
      const pc = createPeerConnection();
      addLocalTracks(pc, stream);

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        voiceActivityDetection: true,
      });
      await pc.setLocalDescription(offer);
      emitSignal(SIGNAL_EVENTS.OFFER, { sdp: pc.localDescription });
      await flushPendingIce(pc);
      return true;
    } catch (err) {
      console.error("[WebRTC] createOffer failed:", err);
      setLastError(err);
      closePeerConnection();
      return false;
    } finally {
      isNegotiatingRef.current = false;
    }
  }, [
    addLocalTracks,
    closePeerConnection,
    createPeerConnection,
    emitSignal,
    enabled,
    flushPendingIce,
  ]);

  const handleRemoteOffer = useCallback(
    async ({ sdp }) => {
      if (!enabled || !sdp) return false;

      const stream = localStreamRef.current;
      if (!stream) {
        console.warn("[WebRTC] Offer received before local stream attached");
        pendingIceRef.current = [];
        return false;
      }

      if (isNegotiatingRef.current) return false;
      isNegotiatingRef.current = true;

      try {
        const pc = pcRef.current?.signalingState !== "closed"
          ? pcRef.current
          : createPeerConnection();

        if (!pc) return false;

        addLocalTracks(pc, stream);
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushPendingIce(pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        emitSignal(SIGNAL_EVENTS.ANSWER, { sdp: pc.localDescription });
        return true;
      } catch (err) {
        console.error("[WebRTC] handleRemoteOffer failed:", err);
        setLastError(err);
        closePeerConnection();
        return false;
      } finally {
        isNegotiatingRef.current = false;
      }
    },
    [
      addLocalTracks,
      closePeerConnection,
      createPeerConnection,
      emitSignal,
      enabled,
      flushPendingIce,
    ],
  );

  const handleRemoteAnswer = useCallback(
    async ({ sdp }) => {
      if (!enabled || !sdp) return false;

      const pc = pcRef.current;
      if (!pc) {
        console.warn("[WebRTC] Answer received but no peer connection");
        return false;
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushPendingIce(pc);
        return true;
      } catch (err) {
        console.error("[WebRTC] handleRemoteAnswer failed:", err);
        setLastError(err);
        return false;
      }
    },
    [enabled, flushPendingIce],
  );

  const handleRemoteIce = useCallback(
    async ({ candidate }) => {
      if (!enabled) return;
      const pc = pcRef.current;
      if (!pc) {
        pendingIceRef.current.push(candidate);
        return;
      }
      await queueOrAddIceCandidate(pc, candidate);
    },
    [enabled, queueOrAddIceCandidate],
  );

  const startNegotiation = useCallback(async () => {
    if (!enabled) return { ok: false, reason: "disabled" };

    const role = getWebRtcSignalingRole();
    if (role === "caller") {
      const ok = await createAndSendOffer();
      return { ok, role };
    }

    emitSignal(SIGNAL_EVENTS.READY, {});
    return { ok: true, role: "callee", waitingForOffer: true };
  }, [createAndSendOffer, emitSignal, enabled]);

  const renegotiateAfterReconnect = useCallback(async () => {
    if (!enabled || !localStreamRef.current) return;
    console.log("[WebRTC] Socket reconnected — renegotiating peer connection");
    closePeerConnection();
    await startNegotiation();
  }, [closePeerConnection, enabled, startNegotiation]);

  const teardown = useCallback(() => {
    emitSignal(SIGNAL_EVENTS.CLOSE, { reason: "client-teardown" });
    closePeerConnection();
    localStreamRef.current = null;
  }, [closePeerConnection, emitSignal]);

  /** Register WebRTC signaling on the socket (call from App's socket effect). */
  const registerSignalingHandlers = useCallback(
    (socket) => {
      if (!enabled || !socket) return () => {};

      const onOffer = (payload) => {
        void handleRemoteOffer(payload);
      };
      const onAnswer = (payload) => {
        void handleRemoteAnswer(payload);
      };
      const onIce = (payload) => {
        void handleRemoteIce(payload);
      };
      const onReset = () => {
        console.log("[WebRTC] Server requested reset");
        closePeerConnection();
        void startNegotiation();
      };
      const onConnect = () => {
        if (
          hasSocketConnectedOnceRef.current &&
          localStreamRef.current
        ) {
          void renegotiateAfterReconnect();
        }
        hasSocketConnectedOnceRef.current = true;
      };

      socket.on(SIGNAL_EVENTS.OFFER, onOffer);
      socket.on(SIGNAL_EVENTS.ANSWER, onAnswer);
      socket.on(SIGNAL_EVENTS.ICE, onIce);
      socket.on(SIGNAL_EVENTS.RESET, onReset);
      socket.on("connect", onConnect);

      return () => {
        socket.off(SIGNAL_EVENTS.OFFER, onOffer);
        socket.off(SIGNAL_EVENTS.ANSWER, onAnswer);
        socket.off(SIGNAL_EVENTS.ICE, onIce);
        socket.off(SIGNAL_EVENTS.RESET, onReset);
        socket.off("connect", onConnect);
      };
    },
    [
      closePeerConnection,
      enabled,
      handleRemoteAnswer,
      handleRemoteIce,
      handleRemoteOffer,
      renegotiateAfterReconnect,
      startNegotiation,
    ],
  );

  useEffect(() => {
    return () => {
      teardown();
    };
  }, [teardown]);

  return {
    attachLocalStream,
    startNegotiation,
    renegotiateAfterReconnect,
    registerSignalingHandlers,
    teardown,
    connectionState,
    lastError,
    isEnabled: enabled,
  };
}

export { SIGNAL_EVENTS };
