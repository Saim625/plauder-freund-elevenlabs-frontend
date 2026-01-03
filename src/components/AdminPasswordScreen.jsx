import { useState } from "react";
import toast from "react-hot-toast";

export default function AdminPasswordScreen({ urlToken, onSuccess }) {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState(""); // For forgot password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isForgotMode, setIsForgotMode] = useState(false); // toggle mode

  // Login password
  const submitPassword = async () => {
    if (!password) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/verify-admin-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: urlToken,
            password,
          }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Invalid password");
        setLoading(false);
        return;
      }

      // Store admin session
      localStorage.setItem("admin_jwt", data.token);
      onSuccess();
    } catch {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  // Forgot password
  const submitForgotPassword = async () => {
    if (!email) return setError("Please enter your email");

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/api/admin/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Unable to send reset link");
        return;
      }

      toast.info("Password reset link sent! Check your email.");
      setIsForgotMode(false); // back to login
    } catch {
      setError("Server Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 w-full max-w-md mx-4">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          {isForgotMode ? "Forgot Password" : "Admin Login"}
        </h2>
        <p className="text-gray-500 text-sm text-center mb-6">
          {isForgotMode
            ? "Enter your email to reset password"
            : "Enter your password to continue"}
        </p>

        {isForgotMode ? (
          <input
            type="email"
            placeholder="Enter admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && submitForgotPassword()}
            className="w-full border border-gray-300 p-3 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        ) : (
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && submitPassword()}
            className="w-full border border-gray-300 p-3 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg mb-3">
            {error}
          </div>
        )}

        <button
          onClick={isForgotMode ? submitForgotPassword : submitPassword}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading
            ? isForgotMode
              ? "Sending..."
              : "Verifying..."
            : isForgotMode
            ? "Send Reset Link"
            : "Login"}
        </button>

        <button
          onClick={() => {
            setError("");
            setIsForgotMode(!isForgotMode);
          }}
          className="w-full text-sm text-blue-600 mt-4 hover:underline cursor-pointer"
        >
          {isForgotMode ? "Back to login" : "Forgot password?"}
        </button>
      </div>
    </div>
  );
}
