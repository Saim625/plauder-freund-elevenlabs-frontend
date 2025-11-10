export default function Avatar() {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-92 h-92 flex items-center justify-center">
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
    </div>
  );
}
