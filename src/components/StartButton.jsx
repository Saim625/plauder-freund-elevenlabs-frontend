export default function StartButton({ stage, onStart }) {
  return (
    // Keeps height reserved even when button disappears
    <div className="h-20 flex items-center justify-center mt-8">
      {stage !== "chatting" && stage !== "denied" && (
        <button
          onClick={onStart}
          className={`px-8 py-4 text-xl font-bold rounded-full shadow-lg text-white bg-purple-600 transition-all duration-500 ${
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
