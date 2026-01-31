import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_SERVER_URL + "/api";

const NumberAssignModal = ({
  isOpen,
  onClose,
  tokenData,
  adminToken,
  onSuccess,
}) => {
  const [number, setNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && tokenData) {
      setNumber(tokenData.number || "");
    }
  }, [isOpen, tokenData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!number.trim()) {
      toast.error("Number is required");
      return;
    }

    if (!/^\d{11,12}$/.test(number.trim())) {
      toast.error("Number must be 11 or 12 digits");
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = tokenData.number
        ? `/token/${tokenData.id}/update-number`
        : `/token/${tokenData.id}/assign-number`;

      const res = await axios({
        method: tokenData.number ? "put" : "post",
        url: `${API_BASE_URL}${endpoint}`,
        data: { number: number.trim() },
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (res.data.success) {
        toast.success(res.data.message);
        onSuccess();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save number");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setNumber("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] px-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-lg border border-gray-200">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            {tokenData?.number ? "Edit" : "Assign"} Number
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number (10-15 digits)
              </label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="e.g., 03001234567"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled={isSubmitting}
                maxLength={12}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter an 10 or 15 digit phone number
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NumberAssignModal;
