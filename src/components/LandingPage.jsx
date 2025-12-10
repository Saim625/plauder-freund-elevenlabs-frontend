import React from "react";

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Logo & Title */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            PlauderFreund
          </h1>

          <p className="text-xl text-gray-600 mb-8">
            Ihr persönlicher Sprachbegleiter
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 sm:p-12 text-center">
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            PlauderFreund ist ein Sprachassistent, der speziell für Senioren
            entwickelt wurde. Sprechen Sie über Ihren Tag, teilen Sie Ihre
            Gedanken – ein Begleiter, der immer zuhört.
          </p>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
            <p className="text-blue-900 font-semibold mb-2">
              Zugang erforderlich
            </p>
            <p className="text-blue-700 text-sm">
              Bitte verwenden Sie den persönlichen Link, den Sie erhalten haben.
            </p>
          </div>

          <div className="text-sm text-gray-500">
            Noch keinen Zugang? Wenden Sie sich an Ihre Familie oder{" "}
            <a
              href=""
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              kontaktieren Sie uns
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          © {new Date().getFullYear()} PlauderFreund
        </div>
      </div>
    </div>
  );
};
