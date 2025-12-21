import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import DeleteConfirmModal from "../helperModal/DeleteConfirmModal";
import { EditMemoryModal } from "./helpermodals/EditMemoryModal";
import AddMemoryModal from "./helpermodals/AddMemoryModal";

const API_BASE_URL = import.meta.env.VITE_SERVER_URL + "/api";

const UserSummaryModal = ({ isOpen, onClose, userToken, adminToken }) => {
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteAction, setDeleteAction] = useState(null);

  const fetchSummary = async () => {
    if (!userToken) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/user/summary/${userToken}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (res.data.success) {
        setSummaryData(res.data.summary || []);
      } else {
        throw new Error("Invalid response");
      }
    } catch (err) {
      toast.error("Failed to load user summary");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setSummaryData([]);
      setLoading(true);
      setEditModalOpen(false);
      setEditData(null);
      setDeleteModalOpen(false);
      setDeleteAction(null);
      setShowAddModal(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !userToken) return;
    fetchSummary();
  }, [isOpen, userToken, adminToken]);

  /* -----------------------------
     ASK DELETE
  ----------------------------- */
  const message =
    "Are you sure you want to delete this summary? This action cannot be undone.";

  const askDeleteWholeSummary = () => {
    setDeleteAction({ type: "ALL" });
    setDeleteModalOpen(true);
  };

  const askDeleteItem = (category, key) => {
    setDeleteAction({ type: "ITEM", category, key });
    setDeleteModalOpen(true);
  };

  /* -----------------------------
     CONFIRM DELETE
  ----------------------------- */
  const handleConfirmDelete = async () => {
    try {
      if (deleteAction.type === "ALL") {
        await axios.delete(`${API_BASE_URL}/user/summary/${userToken}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });

        setSummaryData([]);
        toast.success("User summary deleted");
      }

      if (deleteAction.type === "ITEM") {
        const res = await axios.delete(
          `${API_BASE_URL}/user/summary/${userToken}/item`,
          {
            headers: { Authorization: `Bearer ${adminToken}` },
            data: {
              category: deleteAction.category,
              key: deleteAction.key,
            },
          }
        );

        setSummaryData(res.data.updated.summary);
        toast.success("Item deleted");
      }
    } catch (err) {
      toast.error("Delete failed");
      console.error(err);
    } finally {
      setDeleteModalOpen(false);
      setDeleteAction(null);
    }
  };

  /* -----------------------------
     UPDATE ITEM
  ----------------------------- */
  const handleEditItem = (category, key, value) => {
    setEditData({ category, key, value });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (newValue) => {
    if (!editData) return;

    try {
      const res = await axios.put(
        `${API_BASE_URL}/user/summary/${userToken}/item`,
        {
          category: editData.category,
          key: editData.key,
          value: newValue,
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      setSummaryData(res.data.updated.summary);
      toast.success("Item updated");
      setEditModalOpen(false);
      setEditData(null);
    } catch (err) {
      toast.error("Failed to update item");
      console.error(err);
    }
  };

  // group by category
  const groupedSummary = summaryData.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
        <div className="bg-white rounded-xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-lg border border-gray-200 flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-start p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                User Memory Summary
              </h2>
              <p className="text-sm text-gray-500 font-mono">
                Token: {userToken?.substring(0, 16)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm cursor-pointer"
              >
                + Add Memory
              </button>
              {summaryData.length > 0 && (
                <button
                  onClick={askDeleteWholeSummary}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm cursor-pointer"
                >
                  Delete All
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
                <p className="text-gray-500">Loading user summary...</p>
              </div>
            ) : Object.keys(groupedSummary).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <svg
                  className="w-16 h-16 text-gray-300 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-gray-500 font-medium">
                  No memory summary available for this user
                </p>
                <div className="mt-4">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    + Add Memory
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedSummary).map(([category, items]) => (
                  <div
                    key={category}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                  >
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-800 capitalize">
                        {category}{" "}
                        <span className="text-sm text-gray-500 font-normal">
                          ({items.length})
                        </span>
                      </h3>
                    </div>

                    <div className="divide-y divide-gray-200">
                      {items.map((item, index) => (
                        <div
                          key={index}
                          className="p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-700 mb-1">
                                {item.key}
                              </p>
                              <p className="text-sm text-gray-600 break-words">
                                {item.value}
                              </p>
                              {item.lastUpdated && (
                                <p className="text-xs text-gray-400 mt-2">
                                  Updated:{" "}
                                  {new Date(item.lastUpdated).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() =>
                                  handleEditItem(category, item.key, item.value)
                                }
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium py-1 px-3 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  askDeleteItem(category, item.key)
                                }
                                className="text-red-600 hover:text-red-800 text-sm font-medium py-1 px-3 rounded-lg border border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      <EditMemoryModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditData(null);
        }}
        memory={editData}
        onSave={handleSaveEdit}
      />

      {/* DELETE CONFIRM MODAL */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteAction(null);
        }}
        onConfirm={handleConfirmDelete}
        message={message}
      />

      <AddMemoryModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        userToken={userToken}
        adminToken={adminToken}
        onSuccess={fetchSummary}
      />
    </>
  );
};

export default UserSummaryModal;
