import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_SERVER_URL + "/api";

const providerLabel = (p) =>
  ({
    openai_realtime: "Realtime",
    openai_chat: "Chat",
    elevenlabs: "ElevenLabs TTS",
    whisper: "Whisper",
  })[p] || p;

const typeLabel = (t) =>
  ({
    text_input_token: "Text Input",
    cached_text_input_token: "Cached Text Input",
    audio_input_token: "Audio Input",
    cached_audio_input_token: "Cached Audio Input",
    output_token: "Output",
    input_token: "Input",
    cached_input_token: "Cached Input",
    audio_character: "Per Character",
    per_minute: "Per Minute",
  })[t] || t;

const providerColor = (p) =>
  ({
    openai_realtime: "bg-blue-100 text-blue-700",
    openai_chat: "bg-purple-100 text-purple-700",
    elevenlabs: "bg-green-100 text-green-700",
    whisper: "bg-orange-100 text-orange-700",
  })[p] || "bg-gray-100 text-gray-600";

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

  // Group by provider → model
  const grouped = pricing.reduce((acc, p) => {
    const key = `${p.provider}__${p.model}`;
    if (!acc[key]) {
      acc[key] = { provider: p.provider, model: p.model, items: [] };
    }
    acc[key].items.push(p);
    return acc;
  }, {});

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading ? (
            <div className="text-center py-6">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-4 border-gray-200 border-t-blue-600" />
            </div>
          ) : (
            Object.values(grouped).map((group) => (
              <div
                key={`${group.provider}__${group.model}`}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                {/* Group header — shows provider type + exact model name */}
                <div className="bg-gray-50 px-4 py-2.5 flex items-center gap-2 border-b border-gray-100">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${providerColor(group.provider)}`}
                  >
                    {providerLabel(group.provider)}
                  </span>
                  <span className="text-sm font-mono font-medium text-gray-700">
                    {group.model}
                  </span>
                </div>

                {/* Price rows */}
                <div className="divide-y divide-gray-100">
                  {group.items.map((p) => (
                    <div
                      key={p.id}
                      className="px-4 py-3 flex items-center gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700">
                          {typeLabel(p.priceType)}
                        </p>
                        <p className="text-xs text-gray-400 font-mono">
                          Current: ${Number(p.pricePerUnit).toFixed(9)}
                        </p>
                        {p.description && (
                          <p className="text-xs text-gray-400 italic">
                            {p.description}
                          </p>
                        )}
                      </div>
                      <input
                        type="number"
                        step="0.000000001"
                        placeholder="New price"
                        value={editing[p.id] ?? ""}
                        onChange={(e) =>
                          setEditing((prev) => ({
                            ...prev,
                            [p.id]: e.target.value,
                          }))
                        }
                        className="w-32 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleSave(p.id)}
                        disabled={saving === p.id || !editing[p.id]}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
                      >
                        {saving === p.id ? "…" : "Save"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
