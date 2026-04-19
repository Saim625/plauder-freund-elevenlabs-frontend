import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_SERVER_URL + "/api";

const RECURRENCE_OPTIONS = [
  {
    value: "one_time",
    label: "One-time",
    description: "Applies only to the entered month",
  },
  {
    value: "monthly",
    label: "Monthly",
    description: "Repeats every month from start date",
  },
  {
    value: "yearly",
    label: "Yearly",
    description: "Divided by 12, repeats every month of every year",
  },
];

const recurrenceBadge = (recurrence) => {
  const map = {
    one_time: { label: "One-time", cls: "bg-gray-100 text-gray-600" },
    monthly: { label: "Monthly", cls: "bg-blue-100 text-blue-600" },
    yearly: { label: "Yearly", cls: "bg-green-100 text-green-600" },
  };
  const r = map[recurrence] || map.one_time;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.cls}`}>
      {r.label}
    </span>
  );
};

export function OperationalCostsModal({ isOpen, onClose, adminToken }) {
  const [costs, setCosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    label: "",
    costUsd: "",
    recurrence: "one_time",
    startDate: new Date().toISOString().slice(0, 10), // today as default
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
    if (!form.label || !form.costUsd || !form.recurrence || !form.startDate) {
      toast.error("All fields required");
      return;
    }
    if (parseFloat(form.costUsd) < 0) {
      toast.error("Cost cannot be negative");
      return;
    }
    setAdding(true);
    try {
      await axios.post(
        `${API_BASE_URL}/usage/operational-cost`,
        {
          label: form.label,
          costUsd: parseFloat(form.costUsd),
          recurrence: form.recurrence,
          startDate: form.startDate,
        },
        { headers },
      );
      toast.success("Cost added");
      setForm({
        label: "",
        costUsd: "",
        recurrence: "one_time",
        startDate: new Date().toISOString().slice(0, 10),
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

  const selectedRecurrence = RECURRENCE_OPTIONS.find(
    (r) => r.value === form.recurrence,
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
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
            {/* Label */}
            <input
              placeholder="Label (e.g. Server Hosting)"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Cost + Start Date */}
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
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Recurrence Dropdown */}
            <select
              value={form.recurrence}
              onChange={(e) => setForm({ ...form, recurrence: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {RECURRENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Recurrence hint */}
            {selectedRecurrence && (
              <p className="text-xs text-gray-400 italic px-1">
                {selectedRecurrence.description}
              </p>
            )}

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
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {c.label}
                      </p>
                      {recurrenceBadge(c.recurrence)}
                    </div>
                    <p className="text-xs text-gray-400">
                      From{" "}
                      {new Date(c.startDate).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800">
                        ${Number(c.costUsd).toFixed(2)}
                      </p>
                      {c.recurrence === "yearly" && (
                        <p className="text-xs text-gray-400">
                          ${(c.costUsd / 12).toFixed(2)}/mo
                        </p>
                      )}
                    </div>
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
