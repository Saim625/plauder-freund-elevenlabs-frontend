import React from "react";

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  message,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="
      fixed inset-0 
      bg-black/50 
      backdrop-blur-sm 
      flex items-center justify-center 
      transition-all duration-300
      z-50
    "
    >
      <div className="bg-white w-full max-w-md mx-4 p-6 rounded-xl shadow-lg border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">Confirm Delete</h2>
        </div>

        <p className="mb-6 text-gray-600">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="cursor-pointer flex-1 px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="cursor-pointer flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
