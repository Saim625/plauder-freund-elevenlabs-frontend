/**
 * ICE server configuration (STUN/TURN).
 * Set VITE_TURN_URL (+ username/credential) in production for restrictive NATs.
 */
export function getIceServers() {
  const servers = [];

  const stunUrl =
    import.meta.env.VITE_STUN_URL || "stun:stun.l.google.com:19302";
  servers.push({ urls: stunUrl });

  const turnUrl = import.meta.env.VITE_TURN_URL;
  if (turnUrl) {
    servers.push({
      urls: turnUrl,
      username: import.meta.env.VITE_TURN_USERNAME || undefined,
      credential: import.meta.env.VITE_TURN_CREDENTIAL || undefined,
    });
  }

  return servers;
}

/** @returns {boolean} WebRTC mic transport (default on unless explicitly disabled) */
export function isWebRtcTransportEnabled() {
  return import.meta.env.VITE_USE_WEBRTC !== "false";
}

/** @returns {boolean} Fall back to socket audio-chunk if WebRTC negotiation fails */
export function isWebRtcSocketFallbackEnabled() {
  return import.meta.env.VITE_WEBRTC_SOCKET_FALLBACK === "true";
}

/**
 * Who creates the SDP offer: "caller" (browser) or "callee" (server).
 * @returns {"caller"|"callee"}
 */
export function getWebRtcSignalingRole() {
  const role = import.meta.env.VITE_WEBRTC_SIGNALING_ROLE;
  return role === "callee" ? "callee" : "caller";
}
