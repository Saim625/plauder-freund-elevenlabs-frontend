import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_SERVER_URL + "/api";

const permissionFields = [
  { key: "canManageUsers", label: "Manage Users" },
  { key: "canCreateTokens", label: "Create User Tokens" },
  { key: "canDeleteTokens", label: "Delete User Tokens" },
  { key: "canEditAdmin", label: "Edit Admins" },
  { key: "canAccessMemoryEditor", label: "Access Memory Editor" },
  { key: "canAccessPersonalisedConfig", label: "Access Personalised Config" },
];

const CreateAdminModal = ({ isOpen, onClose, adminToken, onCreated }) => {
  const [role, setRole] = useState("ADMIN");
  const [permissions, setPermissions] = useState(
    permissionFields.reduce((acc, p) => ({ ...acc, [p.key]: false }), {})
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedData, setGeneratedData] = useState(null);

  if (!isOpen) return null;

  const handleCheckboxChange = (key) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/admins`,
        { role, permissions },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (res.data.success) {
        setGeneratedData({
          token: res.data.admin.token,
          inviteUrl: res.data.inviteUrl,
        });
        toast.success("Admin created successfully");
        onCreated(); // refresh admin list
      } else {
        toast.error(res.data.message || "Failed to create admin");
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Server error while creating admin"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setGeneratedData(null);
    setRole("ADMIN");
    setPermissions(
      permissionFields.reduce((acc, p) => ({ ...acc, [p.key]: false }), {})
    );
    onClose();
  };

  const handleCopy = () => {
    if (generatedData?.inviteUrl) {
      navigator.clipboard.writeText(generatedData.inviteUrl);
      toast.success("Invite link copied!");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white backdrop-blur-md rounded-xl max-w-lg w-full p-6 relative shadow-lg border border-gray-200">
        <h3 className="text-xl font-bold mb-4 text-gray-800">
          Create New Admin
        </h3>

        {!generatedData ? (
          <>
            {/* Role selection */}
            <div className="mb-4">
              <label className="block mb-2 font-medium text-gray-700">
                Role
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2 cursor-pointer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            {/* Permissions checkboxes */}
            <div className="mb-4">
              <label className="block mb-2 font-medium text-gray-700">
                Permissions
              </label>
              <div className="grid grid-cols-2 gap-2">
                {permissionFields.map((p) => (
                  <label
                    key={p.key}
                    className="flex items-center gap-2 text-gray-700 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={permissions[p.key]}
                      onChange={() => handleCheckboxChange(p.key)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 cursor-pointer"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Admin"}
              </button>
            </div>
          </>
        ) : (
          // Display generated token & invite URL in same style as InviteTokenModal
          <div className="space-y-4">
            <div className="flex items-center justify-center mb-3">
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
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Token</p>
              <p className="text-sm font-mono text-gray-900 break-all">
                {generatedData.token}
              </p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Invite URL</p>
              <p className="text-sm font-mono text-gray-900 break-all">
                {generatedData.inviteUrl}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleCopy}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Copy Invite URL
              </button>

              <button
                onClick={handleClose}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Close X */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 font-bold cursor-pointer"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default CreateAdminModal;
