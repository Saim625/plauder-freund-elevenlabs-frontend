export default function StartButton({ stage, onStart, greetingLoading }) {
  // Check 1: If the greeting is still loading, show the spinner.
  if (greetingLoading) {
    return (
      <div className="h-20 flex items-center justify-center mt-8">
        <div className="flex flex-col items-center">
          {/* Tailwind CSS spinner */}
          <div className="w-8 h-8 border-4 border-t-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 text-sm mt-2 font-semibold">
            Vorbereiten...
          </p>
        </div>
      </div>
    );
  }

  // Check 2: If we are not loading, show the button only in 'idle' or 'starting' stages.
  return (
    // Keeps height reserved even when button disappears
    <div className="h-20 flex items-center justify-center mt-8">
      {stage !== "chatting" && stage !== "denied" && (
        <button
          onClick={onStart}
          // The button is disabled when the stage is 'starting' to prevent double-clicks
          className={`px-8 py-4 text-xl font-bold rounded-full shadow-lg text-white bg-purple-600 transition-all duration-500 
            ${
              stage === "starting"
                ? "opacity-0 scale-90 pointer-events-none"
                : "opacity-100 hover:scale-105 hover:bg-purple-700"
            }`}
        >
          Starten
        </button>
      )}
    </div>
  );
}
