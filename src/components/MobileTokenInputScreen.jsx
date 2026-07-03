import { useState } from "react";

export function MobileTokenInputScreen({ onSubmit }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) {
      setError("Please enter your invite token");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await onSubmit(input.trim());
      if (!result.success)
        setError("Invalid token. Please check and try again.");
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Plauderfreund
          </h1>
          <p className="text-gray-500 text-sm">
            Enter your invite token to get started
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter invite token"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoCapitalize="none"
            autoCorrect="off"
          />

          {error && <p className="text-red-500 text-xs text-center">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 text-white font-medium py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Verifying..." : "Continue"}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Don't have a token? Contact your administrator.
        </p>
      </div>
    </div>
  );
}
