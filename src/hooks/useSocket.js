import { useCallback, useEffect, useRef } from "react";
import { io } from "socket.io-client";

export function useSocket({ token }) {
  const socketRef = useRef(null);
  const socketUrl = import.meta.env.VITE_SERVER_URL;

  // 🧹 Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        console.log("🧹 Cleaning up socket on unmount");
        socketRef.current.off();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const connect = useCallback(
    (url = socketUrl) => {
      // Prevent duplicates (This logic is only useful *after* a successful connection)
      if (socketRef.current) {
        console.log("⚙️ Reusing existing socket connection");
        return socketRef.current;
      }

      console.log(`🔄 [FE] Connecting to Socket: ${url}`);
      const socket = io(url, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
      });

      socketRef.current = socket;

      // ✅ When connected
      socket.on("connect", () => {
        console.log(`✅ Connected to server (id: ${socket.id})`);

        if (token) {
          console.log("🎟️ Sending token for realtime session:", token);
          socket.emit("start-realtime", { token });
        } else {
          console.warn("⚠️ No token provided — skipping start-realtime emit");
        }
      });

      socket.on("disconnect", (reason) => {
        console.log(`🔴 Disconnected: ${reason}`);
      });

      socket.on("connect_error", (err) => {
        console.error("❌ Socket connection error:", err.message);
      });

      return socket;
    },
    [token]
  );

  // ... (disconnect and sendChunk functions) ...

  // NOTE: You should also wrap `disconnect` and `sendChunk` in useCallback for best practice.

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log("⚠️ Manually closing socket");
      socketRef.current.off();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const sendChunk = useCallback((data) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("audio-chunk", data);
    }
  }, []);

  return { connect, disconnect, sendChunk, socketRef };
}
