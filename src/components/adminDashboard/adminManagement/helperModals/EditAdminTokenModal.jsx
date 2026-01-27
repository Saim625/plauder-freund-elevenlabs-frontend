// EditAdminTokenModal.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_SERVER_URL + "/api";

const EditAdminTokenModal = ({
  isOpen,
  onClose,
  adminToken,
  adminData,
  onUpdated,
}) => {
  const [newToken, setNewToken] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (adminData) setNewToken(adminData.token);
  }, [adminData]);

  const handleSubmit = async () => {
    if (!newToken) {
      toast.error("Token cannot be empty");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.put(
        `${API_BASE_URL}/admins/${adminData.id}/edit-token`,
        { newToken },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      if (res.data.success) {
        toast.success("Token updated successfully");
        onUpdated(); // refresh admins
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update token");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg border border-gray-200">
        <h3 className="text-xl font-bold mb-4">Edit Admin Token</h3>
        <p className="text-gray-500 text-sm mb-4">
          Change the token for admin <strong>{adminData?.role}</strong>
        </p>

        <input
          type="text"
          value={newToken}
          onChange={(e) => setNewToken(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors cursor-pointer"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Token"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditAdminTokenModal;
