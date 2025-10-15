export default function Avatar() {
  return (
    <div className="flex flex-col items-center">
      {/* Outer aura wrapper */}
      <div className="relative avatar-with-aura p-1 rounded-full">
        {/* Inner circular image */}
        <div className="w-52 h-52 rounded-full overflow-hidden">
          <img
            src="/face.png"
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <style jsx>{`
        .avatar-with-aura {
          box-shadow: 0 0 40px rgba(147, 112, 219, 0.6);
          animation: subtle-pulse 2.8s ease-in-out infinite;
        }

        @keyframes subtle-pulse {
          0%,
          100% {
            box-shadow: 0 0 30px rgba(147, 112, 219, 0.4);
          }
          50% {
            box-shadow: 0 0 60px rgba(147, 112, 219, 0.8);
          }
        }
      `}</style>
    </div>
  );
}
