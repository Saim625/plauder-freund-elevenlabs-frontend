import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_SERVER_URL + "/api";

const AddMemoryModal = ({
  isOpen,
  onClose,
  userToken,
  adminToken,
  onSuccess, // callback to refetch summary
}) => {
  const [category, setCategory] = useState("");
  const [keyName, setKeyName] = useState("");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!category || !keyName || !value) {
      toast.error("All fields are required");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${API_BASE_URL}/user/summary/${userToken}/item`,
        {
          token: userToken,
          category,
          key: keyName,
          value,
        },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      if (res.data.success) {
        toast.success("Memory added successfully");
        onSuccess?.(); // refresh summary list
        onClose();
        setCategory("");
        setKeyName("");
        setValue("");
      } else {
        throw new Error("Failed to add memory");
      }
    } catch (err) {
      toast.error("Failed to add memory");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md mx-4 rounded-xl shadow-lg border border-gray-200 p-6 relative">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-800">Add User Memory</h2>
          <p className="text-sm text-gray-500 font-mono mt-1">
            Token: {userToken?.substring(0, 16)}...
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. personality, interest, goal"
              className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Key</label>
            <input
              type="text"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="e.g. communicationStyle"
              className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Value</label>
            <textarea
              rows={3}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Describe the user preference or information"
              className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Saving..." : "Add Memory"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemoryModal;
