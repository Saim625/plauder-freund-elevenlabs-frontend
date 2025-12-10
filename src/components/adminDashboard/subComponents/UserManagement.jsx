import axios from "axios";
import React, { useState, useEffect, useCallback } from "react";
import DeleteConfirmModal from "./DeleteConfirmModal.jsx";
import toast from "react-hot-toast";
import InviteTokenModal from "./InviteTokenModal.jsx";

const API_BASE_URL = import.meta.env.VITE_SERVER_URL + "/api";

export const UserManagement = ({ token: adminToken }) => {
  const [tokens, setTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // MODAL STATES
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState(null);

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteData, setInviteData] = useState({ token: "", inviteUrl: "" });

  const formatCreationDate = (isoString) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fetchTokenDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = `${API_BASE_URL}/getTokenDetails?token=${adminToken}`;
      const res = await axios.get(url);

      if (res.data.success && Array.isArray(res.data.tokens)) {
        setTokens(res.data.tokens);
      } else {
        throw new Error("Invalid token structure from server.");
      }
    } catch (err) {
      setError("Network or permission error fetching tokens.");
      setTokens([]);
      toast.error("Failed to fetch token details");
    } finally {
      setIsLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    if (adminToken) fetchTokenDetails();
  }, [fetchTokenDetails, adminToken]);

  const totalActive = tokens.filter((t) => t.isActive).length;

  // ---------------------------
  // DELETE
  // ---------------------------
  const askDelete = (id) => {
    setSelectedTokenId(id);
    setOpenDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const url = `${API_BASE_URL}/token/${selectedTokenId}`;
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      setOpenDeleteModal(false);
      setSelectedTokenId(null);
      toast.success("Token deleted successfully");
      fetchTokenDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete token");
    }
  };

  // ---------------------------
  // TOGGLE ACTIVE/INACTIVE
  // ---------------------------
  const handleToggleStatus = async (id) => {
    try {
      const url = `${API_BASE_URL}/token/${id}/toggle-status`;
      const res = await axios.put(
        url,
        {},
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      toast.success(res.data.message || "Status updated");
      fetchTokenDetails();
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to toggle token status";
      toast.error(message);
      console.error("Toggle error:", err);
    }
  };

  // const handleViewData = (id) => {
  //   toast.info(`Viewing data for token: ${id.substring(0, 8)}`);
  // };

  const handleGenerateToken = async () => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/token/generate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      if (res.data.success) {
        setInviteData({
          token: res.data.token,
          inviteUrl: res.data.inviteUrl,
        });

        setInviteModalOpen(true);
        fetchTokenDetails();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate token");
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          User Access Tokens
        </h3>
        <p className="text-gray-500 text-sm md:text-base">
          Manage user tokens and access permissions
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Active Users:</span>
          <span className="font-bold text-xl text-blue-600">
            {isLoading ? "..." : totalActive}
          </span>
          <span className="text-gray-400">/ {tokens.length}</span>
        </div>

        <button
          onClick={handleGenerateToken}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm md:text-base whitespace-nowrap"
          disabled={isLoading}
        >
          + Invite New User
        </button>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="text-gray-500 mt-3">Loading tokens...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8 px-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Token ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {tokens.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center">
                        <svg
                          className="w-12 h-12 text-gray-300 mb-3"
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
                        <p className="font-medium">No user tokens found</p>
                        <p className="text-sm mt-1">
                          Generate a new token to get started
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tokens.map((t) => (
                    <tr
                      key={t._id}
                      className={`hover:bg-gray-50 transition-colors ${
                        !t.isActive ? "bg-gray-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">
                        {t.token.substring(0, 16)}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatCreationDate(t.createdAt)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-xs font-medium ${
                              t.isActive ? "text-green-600" : "text-gray-500"
                            }`}
                          >
                            {t.isActive ? "Active" : "Inactive"}
                          </span>
                          <button
                            onClick={() => handleToggleStatus(t._id)}
                            className={`cursor-pointer relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              t.isActive ? "bg-green-500" : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                t.isActive ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex gap-3">
                          {/* <button
                            onClick={() => handleViewData(t._id)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            View
                          </button> */}
                          <button
                            onClick={() => askDelete(t._id)}
                            className="cursor-pointer text-red-600 hover:text-red-800 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200">
            {tokens.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <div className="flex flex-col items-center">
                  <svg
                    className="w-12 h-12 text-gray-300 mb-3"
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
                  <p className="font-medium">No user tokens found</p>
                  <p className="text-sm mt-1">
                    Generate a new token to get started
                  </p>
                </div>
              </div>
            ) : (
              tokens.map((t) => (
                <div
                  key={t._id}
                  className={`p-4 ${!t.isActive ? "bg-gray-50" : ""}`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Token ID</p>
                      <p className="text-sm font-mono text-gray-900 break-all">
                        {t.token.substring(0, 20)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <span
                        className={`text-xs font-medium whitespace-nowrap ${
                          t.isActive ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        {t.isActive ? "Active" : "Inactive"}
                      </span>
                      <button
                        onClick={() => handleToggleStatus(t._id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          t.isActive ? "bg-green-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            t.isActive ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Created</p>
                    <p className="text-sm text-gray-700">
                      {formatCreationDate(t.createdAt)}
                    </p>
                  </div>

                  <div className="flex gap-3 pt-3 border-t border-gray-200">
                    {/* <button
                      onClick={() => handleViewData(t._id)}
                      className="flex-1 text-blue-600 hover:text-blue-800 text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      View Data
                    </button> */}
                    <button
                      onClick={() => askDelete(t._id)}
                      className="flex-1 text-red-600 hover:text-red-800 text-sm font-medium py-2 px-4 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onConfirm={confirmDelete}
      />

      <InviteTokenModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        token={inviteData.token}
        inviteUrl={inviteData.inviteUrl}
      />
    </div>
  );
};
