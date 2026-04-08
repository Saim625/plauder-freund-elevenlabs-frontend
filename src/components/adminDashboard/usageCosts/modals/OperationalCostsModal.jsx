import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_SERVER_URL + "/api";

export function OperationalCostsModal({ isOpen, onClose, adminToken }) {
  const [costs, setCosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    label: "",
    costUsd: "",
    month: new Date().toISOString().slice(0, 7) + "-01",
  });
  const [adding, setAdding] = useState(false);

  const headers = { Authorization: `Bearer ${adminToken}` };

  const fetchCosts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/usage/operational-costs`, {
        headers,
      });
      setCosts(res.data.data || []);
    } catch {
      toast.error("Failed to load costs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchCosts();
  }, [isOpen]);

  const handleAdd = async () => {
    if (!form.label || !form.costUsd || !form.month) {
      toast.error("All fields required");
      return;
    }
    setAdding(true);
    try {
      await axios.post(
        `${API_BASE_URL}/usage/operational-cost`,
        {
          label: form.label,
          costUsd: parseFloat(form.costUsd),
          month: form.month,
        },
        { headers },
      );
      toast.success("Cost added");
      setForm({
        label: "",
        costUsd: "",
        month: new Date().toISOString().slice(0, 7) + "-01",
      });
      fetchCosts();
    } catch {
      toast.error("Failed to add cost");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/usage/operational-cost/${id}`, {
        headers,
      });
      toast.success("Deleted");
      fetchCosts();
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">
            🏢 Operational Costs
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Add Form */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
            Add New Cost
          </p>
          <div className="space-y-2">
            <input
              placeholder="Label (e.g. Server Hosting)"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Cost in USD"
                value={form.costUsd}
                onChange={(e) => setForm({ ...form, costUsd: e.target.value })}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={form.month}
                onChange={(e) => setForm({ ...form, month: e.target.value })}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={adding}
              className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {adding ? "Adding…" : "+ Add Cost"}
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="text-center py-6">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-4 border-gray-200 border-t-blue-600" />
            </div>
          ) : costs.length === 0 ? (
            <p className="text-center text-gray-400 py-6">
              No operational costs added yet
            </p>
          ) : (
            <div className="space-y-2">
              {costs.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {c.label}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(c.month).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-800">
                      ${Number(c.costUsd).toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-red-400 hover:text-red-600 text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
