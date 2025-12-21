import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import PersonalityConfigModal from "./helperModals/PersonalityConfigModal";

const API_BASE_URL = import.meta.env.VITE_SERVER_URL + "/api";

export const PersonalityConfig = ({ token: adminToken }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ tokens: [], count: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/user/personality/tokens`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      setData({
        tokens: res.data.tokens || [],
        count: res.data.count || 0,
      });
    } catch (err) {
      toast.error("Failed to load personality configs");
      console.error("Fetch Configs Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchConfigs();
    }
  }, [adminToken]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleOpenModal = (token) => {
    setSelectedToken(token);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedToken(null);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Personality & Voice Management
        </h3>
        <p className="text-gray-500 text-sm md:text-base">
          Configure AI behavior and voice parameters per user
        </p>
      </div>

      {/* Stats */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6 flex items-center gap-2">
        <span className="text-gray-600">Total Configurations:</span>
        <span className="font-bold text-xl text-blue-600">
          {loading ? "..." : data.count}
        </span>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="text-gray-500 mt-3">Loading configurations...</p>
        </div>
      ) : data.tokens.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
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
          <p className="text-gray-500 font-medium mb-4">
            No personality configurations found
          </p>
          <button
            onClick={fetchConfigs}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Refresh List
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    User Token
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.tokens.map((t) => (
                  <tr
                    key={t.token}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-900">
                        {t.token.substring(0, 16)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(t.lastModified)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenModal(t.token)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium py-1 px-4 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        View / Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200">
            {data.tokens.map((t) => (
              <div key={t.token} className="p-4">
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">User Token</p>
                  <p className="text-sm font-mono text-gray-900 break-all">
                    {t.token.substring(0, 20)}
                  </p>
                </div>
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                  <p className="text-sm text-gray-700">
                    {formatDate(t.lastModified)}
                  </p>
                </div>
                <button
                  onClick={() => handleOpenModal(t.token)}
                  className="w-full text-blue-600 hover:text-blue-800 text-sm font-medium py-2 px-4 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                >
                  View / Edit Configuration
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <PersonalityConfigModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        userToken={selectedToken}
        adminToken={adminToken}
        onUpdated={fetchConfigs}
      />
    </div>
  );
};
