export const PersonalityConfig = () => {
  return (
    // <div className="p-4">
    //   <h3 className="text-xl font-semibold mb-4 text-purple-700">
    //     3. AI Personality & Voice Configuration
    //   </h3>

    //   <div className="mb-6">
    //     <label className="block text-sm font-medium text-gray-700 mb-1">
    //       Select User to Personalize
    //     </label>
    //     <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md shadow-sm">
    //       <option>User: def456xyz</option>
    //       <option>Default (Applies to all unconfigured users)</option>
    //     </select>
    //   </div>

    //   <div className="space-y-4 bg-white p-4 rounded-lg shadow-inner">
    //     <h4 className="font-medium text-lg border-b pb-2 text-purple-600">
    //       Voice ID and System Prompt
    //     </h4>

    //     {/* Voice ID */}
    //     <div>
    //       <label
    //         htmlFor="voice-id"
    //         className="block text-sm font-medium text-gray-700"
    //       >
    //         ElevenLabs Voice ID
    //       </label>
    //       <input
    //         type="text"
    //         id="voice-id"
    //         defaultValue="A0Ew1r48gU1I90Fw"
    //         className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
    //       />
    //       <p className="text-xs text-gray-500 mt-1">
    //         Leave blank to use the system default voice.
    //       </p>
    //     </div>

    //     {/* Personality Instructions */}
    //     <div>
    //       <label
    //         htmlFor="style"
    //         className="block text-sm font-medium text-gray-700"
    //       >
    //         Conversational Style
    //       </label>
    //       <textarea
    //         id="style"
    //         defaultValue="A professional, slightly formal tutor."
    //         rows="2"
    //         className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
    //       ></textarea>
    //     </div>

    //     <div>
    //       <label
    //         htmlFor="behavior"
    //         className="block text-sm font-medium text-gray-700"
    //       >
    //         Assistant Behavior
    //       </label>
    //       <textarea
    //         id="behavior"
    //         defaultValue="Always use supportive language and simplify complex terms."
    //         rows="2"
    //         className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
    //       ></textarea>
    //     </div>

    //     <div>
    //       <label
    //         htmlFor="tonality"
    //         className="block text-sm font-medium text-gray-700"
    //       >
    //         Tonality (System Prompt Hint)
    //       </label>
    //       <textarea
    //         id="tonality"
    //         defaultValue="The tone should be warm, encouraging, and patient."
    //         rows="2"
    //         className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
    //       ></textarea>
    //     </div>

    //     <button className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition shadow-md w-full">
    //       Save Personality Configuration
    //     </button>
    //   </div>
    // </div>
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-6">
        <svg
          className="w-10 h-10 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </div>

      <h3 className="text-2xl font-bold text-gray-800 mb-2">
        Under Development
      </h3>

      <p className="text-gray-600 text-center max-w-md mb-4">
        This feature is currently being built and will be available soon.
      </p>

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
        <span>Work in progress</span>
      </div>
    </div>
  );
};
