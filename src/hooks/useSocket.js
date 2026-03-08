import { useCallback, useEffect, useRef } from "react";
import { io } from "socket.io-client";

export function useSocket({ token }) {
  const socketRef = useRef(null);
  const socketUrl = import.meta.env.VITE_SERVER_URL;

  // Track if session was intentionally disconnected (user action vs network drop)
  const isManualDisconnectRef = useRef(false);

  // 🧹 Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        console.log("🧹 Cleaning up socket on unmount");
        isManualDisconnectRef.current = true;
        socketRef.current.off();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // 👁️ Page visibility — restore session when user comes back to tab/app
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("👁️ Page visible again — checking socket health");

        const socket = socketRef.current;
        if (!socket) return;

        if (!socket.connected) {
          console.log(
            "🔄 Socket disconnected while page was hidden — reconnecting",
          );
          isManualDisconnectRef.current = false;
          socket.connect();
          // start-realtime will be re-emitted in the "connect" handler below
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const startSession = useCallback(
    (socket) => {
      if (!token) {
        console.warn("⚠️ No token provided — skipping start-realtime emit");
        return;
      }
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log("🎟️ Sending start-realtime:", token, userTimeZone);
      socket.emit("start-realtime", { token, timezone: userTimeZone });
    },
    [token],
  );

  const connect = useCallback(
    (url = socketUrl) => {
      // If socket exists and is connected, reuse it
      if (socketRef.current?.connected) {
        return socketRef.current;
      }

      // If socket exists but is disconnected, reconnect it instead of creating new one
      if (socketRef.current && !socketRef.current.connected) {
        console.log("🔄 Existing socket found but disconnected — reconnecting");
        isManualDisconnectRef.current = false;
        socketRef.current.connect();
        return socketRef.current;
      }

      console.log(`🔄 [FE] Connecting to Socket: ${url}`);

      const socket = io(url, {
        transports: ["websocket", "polling"], // polling as fallback
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000, // start at 1s
        reconnectionDelayMax: 10000, // cap at 10s
        timeout: 20000,
      });

      socketRef.current = socket;

      // ✅ Connected (fires on first connect AND every reconnect)
      socket.on("connect", () => {
        console.log(`✅ Connected to server (id: ${socket.id})`);
        if (!isManualDisconnectRef.current) {
          startSession(socket);
        }
      });

      // 🔄 Reconnecting — inform user something is happening
      socket.on("reconnecting", (attempt) => {
        console.log(`🔄 Reconnecting... attempt ${attempt}`);
      });

      // ✅ Reconnected successfully
      socket.on("reconnect", (attempt) => {
        console.log(`✅ Reconnected after ${attempt} attempt(s)`);
        // start-realtime is handled in "connect" event above
      });

      // ❌ All reconnection attempts failed
      socket.on("reconnect_failed", () => {
        console.error("❌ All reconnection attempts failed");
        socket.emit("ai-error", {
          message: "Connection lost. Please refresh the page.",
        });
      });

      socket.on("disconnect", (reason) => {
        console.log(`🔴 Disconnected: ${reason}`);

        // Socket.io will auto-reconnect for these reasons — no action needed
        // For server-initiated disconnects, manually trigger reconnect
        if (reason === "io server disconnect") {
          console.log("🔄 Server disconnected us — reconnecting manually");
          isManualDisconnectRef.current = false;
          socket.connect();
        }
      });

      socket.on("connect_error", (err) => {
        console.error("❌ Socket connection error:", err.message);
      });

      return socket;
    },
    [token, startSession],
  );

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log("⚠️ Manually closing socket");
      isManualDisconnectRef.current = true;
      socketRef.current.off();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const sendChunk = useCallback((data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("audio-chunk", data);
    }
  }, []);

  return { connect, disconnect, sendChunk, socketRef };
}
