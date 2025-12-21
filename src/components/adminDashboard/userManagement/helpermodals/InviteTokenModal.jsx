import React from "react";
import { toast } from "react-hot-toast";

export default function InviteTokenModal({
  isOpen,
  onClose,
  token,
  inviteUrl,
}) {
  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    toast.success("Invite link copied!");
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md mx-4 p-6 rounded-xl shadow-lg border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">New User Token</h2>
        </div>

        <div className="space-y-3 mb-6">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Token</p>
            <p className="text-sm font-mono text-gray-900 break-all">{token}</p>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Invite URL</p>
            <p className="text-sm font-mono text-gray-900 break-all">
              {inviteUrl}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleCopy}
            className="cursor-pointer w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Copy Invite URL
          </button>

          <button
            onClick={onClose}
            className="cursor-pointer w-full bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
