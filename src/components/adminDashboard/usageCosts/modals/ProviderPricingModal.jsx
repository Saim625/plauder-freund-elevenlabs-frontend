import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_SERVER_URL + "/api";

export function ProviderPricingModal({ isOpen, onClose, adminToken }) {
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState({});
  const [saving, setSaving] = useState(null);

  const headers = { Authorization: `Bearer ${adminToken}` };

  const fetchPricing = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/usage/pricing`, { headers });
      setPricing(res.data.data || []);
    } catch {
      toast.error("Failed to load pricing");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchPricing();
  }, [isOpen]);

  const handleSave = async (id) => {
    const val = editing[id];
    if (!val || isNaN(parseFloat(val))) {
      toast.error("Invalid price");
      return;
    }
    setSaving(id);
    try {
      await axios.patch(
        `${API_BASE_URL}/usage/pricing/${id}`,
        { pricePerUnit: parseFloat(val) },
        { headers },
      );
      toast.success("Price updated");
      setEditing((prev) => {
        const n = { ...prev };
        delete n[id];
        return n;
      });
      fetchPricing();
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(null);
    }
  };

  const providerLabel = (p) =>
    ({
      openai_realtime: "GPT-4o Realtime",
      openai_chat: "GPT-4o-mini Chat",
      elevenlabs: "ElevenLabs TTS",
    })[p] || p;

  const typeLabel = (t) =>
    ({
      input_token: "Input Token",
      output_token: "Output Token",
      audio_character: "Audio Character",
    })[t] || t;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              ⚙️ Provider Pricing
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              USD per unit. Changes apply to future sessions only.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="text-center py-6">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-4 border-gray-200 border-t-blue-600" />
            </div>
          ) : (
            <div className="space-y-3">
              {pricing.map((p) => (
                <div key={p.id} className="bg-gray-50 rounded-xl px-4 py-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {providerLabel(p.provider)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {typeLabel(p.priceType)}
                      </p>
                      {p.description && (
                        <p className="text-xs text-gray-400 italic">
                          {p.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-mono">
                      ${Number(p.pricePerUnit).toFixed(8)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.000000001"
                      placeholder="New price per unit"
                      value={editing[p.id] ?? ""}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          [p.id]: e.target.value,
                        }))
                      }
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleSave(p.id)}
                      disabled={saving === p.id || !editing[p.id]}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
                    >
                      {saving === p.id ? "…" : "Save"}
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
