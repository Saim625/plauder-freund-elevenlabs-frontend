export default function Avatar() {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-52 h-52 flex items-center justify-center">
        {/* Pulsing oval background (behind avatar) */}
        <div className="absolute inset-0 oval-glow"></div>

        {/* Avatar image with transparent background */}
        <img
          src="/face.png"
          alt="Avatar"
          className="relative z-10 w-full h-full object-contain"
          style={{ filter: "drop-shadow(0 0 10px rgba(0,0,0,0.1))" }}
        />
      </div>

      <style jsx>{`
        .oval-glow {
          width: 100%;
          height: 100%;
          border-radius: 50% / 60%; /* Oval shape */
          background: radial-gradient(
            ellipse at center,
            rgba(147, 112, 219, 0.7) 0%,
            /* Darker center - increased from 0.4 to 0.7 */
              rgba(147, 112, 219, 0.5) 40%,
            /* Darker mid - increased from 0.2 to 0.5 */
              rgba(147, 112, 219, 0.2) 70%,
            /* Added visibility at edges */ rgba(147, 112, 219, 0) 100%
          );
          filter: blur(25px); /* Slightly more blur for softer nebula */
          animation: nebula-pulse 3s ease-in-out infinite;
        }

        @keyframes nebula-pulse {
          0%,
          100% {
            transform: scale(0.9);
            opacity: 0.7; /* Increased from 0.6 for more visibility */
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
