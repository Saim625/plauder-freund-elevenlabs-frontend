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
  const [name, setName] = useState("");
  const [numbers, setNumbers] = useState([""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && tokenData) {
      setName(tokenData.name || "");

      const existingNumbers =
        tokenData.phoneNumbers?.map((phone) => phone.number) || [];

      setNumbers(existingNumbers.length ? existingNumbers : [""]);
    }
  }, [isOpen, tokenData]);

  const updateNumber = (index, value) => {
    setNumbers((currentNumbers) =>
      currentNumbers.map((number, currentIndex) =>
        currentIndex === index ? value : number,
      ),
    );
  };

  const addNumber = () => {
    setNumbers((currentNumbers) => [...currentNumbers, ""]);
  };

  const removeNumber = (index) => {
    if (numbers.length === 1) return;

    setNumbers((currentNumbers) =>
      currentNumbers.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanedNumbers = numbers.map((number) => number.trim());

    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (name.trim().length > 100) {
      toast.error("Name must be 100 characters or fewer");
      return;
    }

    if (cleanedNumbers.some((number) => !/^\+?\d{1,19}$/.test(number))) {
      toast.error(
        "Every number must contain 1–19 digits, with an optional + prefix",
      );
      return;
    }

    if (new Set(cleanedNumbers).size !== cleanedNumbers.length) {
      toast.error("Each number may only be entered once");
      return;
    }

    setIsSubmitting(true);

    try {
      const hasExistingNumbers = tokenData.phoneNumbers?.length > 0;
      const endpoint = hasExistingNumbers
        ? `/token/${tokenData.id}/update-number`
        : `/token/${tokenData.id}/assign-number`;

      const res = await axios({
        method: hasExistingNumbers ? "put" : "post",
        url: `${API_BASE_URL}${endpoint}`,
        data: {
          name: name.trim(),
          numbers: cleanedNumbers,
        },
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (res.data.success) {
        toast.success(res.data.message);
        onSuccess();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save details");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName("");
      setNumbers([""]);
      onClose();
    }
  };

  if (!isOpen) return null;

  const isEditMode = tokenData?.phoneNumbers?.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] px-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-lg border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {isEditMode ? "Edit User Details" : "Assign User Details"}
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., John Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                disabled={isSubmitting}
                maxLength={100}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Phone Numbers
                </label>

                <button
                  type="button"
                  onClick={addNumber}
                  disabled={isSubmitting}
                  className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  + Add number
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {numbers.map((number, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={number}
                      onChange={(e) => updateNumber(index, e.target.value)}
                      placeholder="e.g., +491512345678"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      disabled={isSubmitting}
                      maxLength={20}
                      required
                    />

                    {numbers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeNumber(index)}
                        disabled={isSubmitting}
                        className="px-3 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500 mt-1">
                Each number must contain 1–19 digits. A leading + is allowed.
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NumberAssignModal;
