import axios from "axios";
import React, { useState, useEffect, useCallback } from "react";
import DeleteConfirmModal from "../helperModal/DeleteConfirmModal.jsx";
import CreateAdminModal from "./helperModals/CreateAdminModal.jsx";
import toast from "react-hot-toast";
import EditAdminTokenModal from "./helperModals/EditAdminTokenModal.jsx";

const API_BASE_URL = import.meta.env.VITE_SERVER_URL + "/api";

export const AdminManagement = ({ token: adminToken }) => {
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [openEditTokenModal, setOpenEditTokenModal] = useState(false);
  const [selectedAdminData, setSelectedAdminData] = useState(null);

  // MODAL STATES
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);

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

  // ---------------------------
  // FETCH ADMINS
  // ---------------------------
  const fetchAdmins = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/admins`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (res.data.success && Array.isArray(res.data.admins)) {
        setAdmins(res.data.admins);
      } else {
        throw new Error(res.data.message || "Invalid admin data from server");
      }
    } catch (err) {
      setAdmins([]);
      const msg =
        err.response?.data?.message ||
        "Network error or you do not have permission to view admins.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    if (adminToken) fetchAdmins();
  }, [fetchAdmins, adminToken]);

  // ---------------------------
  // DELETE ADMIN
  // ---------------------------
  const askDelete = (id) => {
    setSelectedAdminId(id);
    setOpenDeleteModal(true);
  };
  const message =
    "Are you sure you want to delete this admin? This action cannot be undone.";
  const confirmDelete = async () => {
    try {
      const url = `${API_BASE_URL}/admins/${selectedAdminId}`;
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      setOpenDeleteModal(false);
      setSelectedAdminId(null);
      toast.success("Admin deleted successfully");
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete admin");
    }
  };

  // ---------------------------
  // TOGGLE ACTIVE / INACTIVE
  // ---------------------------
  const handleToggleStatus = async (admin) => {
    if (!admin.permissions?.canEditAdmin) {
      toast.error("You are not allowed to edit this admin");
      return;
    }

    try {
      const url = `${API_BASE_URL}/admins/${admin._id}/toggle-status`; // create this route in backend
      const res = await axios.put(
        url,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      toast.success(res.data.message || "Status updated");
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to toggle status");
    }
  };

  const handleEditToken = (admin) => {
    setSelectedAdminData(admin);
    setOpenEditTokenModal(true);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Admin Management
        </h3>
        <p className="text-gray-500 text-sm md:text-base">
          Manage admin users, permissions, and tokens
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 bg-gray-100 p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Total Admins:</span>
          <span className="font-bold text-xl text-blue-600">
            {isLoading ? "..." : admins.length}
          </span>
          <span className="text-gray-400">
            / Active: {admins.filter((a) => a.isActive).length}
          </span>
        </div>

        <button
          onClick={() => setOpenCreateModal(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium text-sm md:text-base cursor-pointer whitespace-nowrap"
        >
          + Create New Admin
        </button>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="text-gray-500 mt-3">Loading admins...</p>
        </div>
      )}

      {error && !isLoading && (
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
                    Token
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {admins.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
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
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                        <p className="font-medium">No admins found</p>
                        <p className="text-sm mt-1">
                          Create a new admin to get started
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  admins.map((admin) => (
                    <tr
                      key={admin._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-sm text-gray-900">
                        {admin.token.substring(0, 16)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {admin.role}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-xs font-medium ${
                              admin.isActive
                                ? "text-green-600"
                                : "text-gray-500"
                            }`}
                          >
                            {admin.isActive ? "Active" : "Inactive"}
                          </span>

                          <button
                            onClick={() => handleToggleStatus(admin)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer ${
                              admin.isActive ? "bg-green-500" : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                admin.isActive
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatCreationDate(admin.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditToken(admin)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium py-1 px-3 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => askDelete(admin._id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium py-1 px-3 rounded-lg border border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
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
            {admins.length === 0 ? (
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
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <p className="font-medium">No admins found</p>
                  <p className="text-sm mt-1">
                    Create a new admin to get started
                  </p>
                </div>
              </div>
            ) : (
              admins.map((admin) => (
                <div key={admin._id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Token</p>
                      <p className="text-sm font-mono text-gray-900 break-all">
                        {admin.token.substring(0, 20)}
                      </p>
                    </div>
                    <div className="ml-3">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                        {admin.role}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-medium ${
                            admin.isActive ? "text-green-600" : "text-gray-500"
                          }`}
                        >
                          {admin.isActive ? "Active" : "Inactive"}
                        </span>
                        <button
                          onClick={() => handleToggleStatus(admin)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            admin.isActive ? "bg-green-500" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              admin.isActive ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Created</p>
                      <p className="text-xs text-gray-700">
                        {formatCreationDate(admin.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditToken(admin)}
                      className="flex-1 text-blue-600 hover:text-blue-800 text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200"
                    >
                      Edit Token
                    </button>
                    <button
                      onClick={() => askDelete(admin._id)}
                      className="flex-1 text-red-600 hover:text-red-800 text-sm font-medium py-2 px-4 rounded-lg hover:bg-red-50 transition-colors border border-red-200"
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
        message={message}
      />

      <CreateAdminModal
        isOpen={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        adminToken={adminToken}
        onCreated={fetchAdmins}
      />

      {selectedAdminData && (
        <EditAdminTokenModal
          isOpen={openEditTokenModal}
          onClose={() => setOpenEditTokenModal(false)}
          adminToken={adminToken}
          adminData={selectedAdminData}
          onUpdated={fetchAdmins}
        />
      )}
    </div>
  );
};
