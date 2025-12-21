import React, { useEffect, useState } from "react";

export const EditMemoryModal = ({ isOpen, onClose, memory, onSave }) => {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (memory) {
      setValue(memory.value || "");
    }
  }, [memory]);

  if (!isOpen || !memory) return null;

  const handleSave = () => {
    if (!value.trim()) {
      toast.error("Value cannot be empty");
      return;
    }
    onSave(value);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] px-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-lg border border-gray-200">
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Edit Memory</h3>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Key: <span className="text-gray-900">{memory.key}</span>
          </label>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category:{" "}
            <span className="text-gray-900 capitalize">{memory.category}</span>
          </label>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Value
          </label>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Enter memory value"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
