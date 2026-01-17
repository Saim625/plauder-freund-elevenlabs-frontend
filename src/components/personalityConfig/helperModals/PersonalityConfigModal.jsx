import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_SERVER_URL + "/api";

const PersonalityConfigModal = ({
  isOpen,
  onClose,
  userToken,
  adminToken,
  onUpdated,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const [form, setForm] = useState({
    voiceId: "",
    speakingSpeed: "normal",
    empathyLevel: "medium",
    activePrompting: true,
    reminderOffers: true,
    reengageAfterSilence: true,
    expertiseMode: "general",
    personalityTraits: {
      calm: true,
      humorous: false,
      supportive: true,
      direct: false,
    },
    conversationGuidelines: [],
  });

  useEffect(() => {
    if (!isOpen || !userToken) return;

    const fetchConfig = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${API_BASE}/user/personality/${userToken}`,
          {
            headers: { Authorization: `Bearer ${adminToken}` },
          }
        );

        if (res.data.success && res.data.personality) {
          // Map the response to form structure
          const personality = res.data.personality;
          setForm({
            voiceId: personality.voiceId || "",
            speakingSpeed: personality.speakingSpeed,
            empathyLevel: personality.empathyLevel || "medium",
            activePrompting: personality.activePrompting ?? true,
            reminderOffers: personality.reminderOffers ?? true,
            reengageAfterSilence: personality.reengageAfterSilence ?? true,
            expertiseMode: personality.expertise || "general",
            personalityTraits: personality.traits || {
              calm: true,
              humorous: false,
              supportive: true,
              direct: false,
            },
            conversationGuidelines: personality.conversationGuidelines || [],
          });
        }
      } catch (err) {
        toast.error("Failed to load personality config");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [isOpen, userToken, adminToken]);

  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        voiceId: form.voiceId,
        speakingSpeed: form.speakingSpeed || 1,
        empathyLevel: form.empathyLevel,
        activePrompting: form.activePrompting,
        reminderOffers: form.reminderOffers,
        reengageAfterSilence: form.reengageAfterSilence,
        expertise: form.expertiseMode,
        traits: form.personalityTraits,
        conversationGuidelines: (form.conversationGuidelines || [])
          .map((line) => line.trim())
          .filter(Boolean),
      };

      await axios.put(
        `${API_BASE}/update/user/personality/${userToken}`,
        payload,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      toast.success("Personality updated successfully");
      onUpdated?.();
      onClose();
    } catch (err) {
      toast.error("Update failed");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      await axios.post(
        `${API_BASE}/user/personality/${userToken}/reset`,
        {},
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      toast.success("Personality reset to default");
      onUpdated?.();
      setResetModalOpen(false);
      onClose();
    } catch (err) {
      toast.error("Reset failed");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
        <div className="bg-white rounded-xl w-full max-w-3xl shadow-lg overflow-hidden border border-gray-200 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-start p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-800 mb-1">
                Personality Configuration
              </h2>
              <p className="text-sm text-gray-500 font-mono">
                Token: {userToken?.substring(0, 16)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold ml-4"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
                <p className="text-gray-500">Loading configuration...</p>
              </div>
            ) : (
              <>
                {/* Voice Settings */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    Voice Settings
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Voice ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={form.voiceId || ""}
                        onChange={(e) =>
                          setForm({ ...form, voiceId: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="ElevenLabs Voice ID"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Speaking Speed
                      </label>
                      <select
                        value={form.speakingSpeed}
                        onChange={(e) =>
                          setForm({ ...form, speakingSpeed: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="slow">Slow</option>
                        <option value="normal">Normal</option>
                        <option value="fast">Fast</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Personality Settings */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    Personality Settings
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Empathy Level
                      </label>
                      <select
                        value={form.empathyLevel}
                        onChange={(e) =>
                          setForm({ ...form, empathyLevel: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expertise Mode
                      </label>
                      <select
                        value={form.expertiseMode}
                        onChange={(e) =>
                          setForm({ ...form, expertiseMode: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="general">General</option>
                        <option value="psychology">Psychology</option>
                        <option value="meditation">Meditation</option>
                        <option value="productivity">Productivity</option>
                        <option value="coaching">Coaching</option>
                        <option value="therapy">Therapy</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Personality Traits */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    Personality Traits
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["calm", "Calm"],
                      ["humorous", "Humorous"],
                      ["supportive", "Supportive"],
                      ["direct", "Direct"],
                    ].map(([key, label]) => (
                      <label
                        key={key}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={form.personalityTraits[key] || false}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                personalityTraits: {
                                  ...form.personalityTraits,
                                  [key]: e.target.checked,
                                },
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                        </div>
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Conversation Guidelines */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    Conversation Guidelines
                  </h3>
                  <textarea
                    value={form.conversationGuidelines?.join("\n") || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        conversationGuidelines: e.target.value.split("\n"),
                      })
                    }
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Enter guidelines (one per line)&#10;Example:&#10;Always be respectful&#10;Keep responses under 2 minutes&#10;Avoid medical advice"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Enter conversation rules or constraints, one per line
                  </p>
                </div>

                {/* Behavior Toggles */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    Behavior Settings
                  </h3>
                  <div className="space-y-3">
                    {[
                      ["activePrompting", "Active Prompting"],
                      ["reminderOffers", "Reminder Offers"],
                      ["reengageAfterSilence", "Re-engage After Silence"],
                    ].map(([key, label]) => (
                      <label
                        key={key}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={form[key]}
                            onChange={(e) =>
                              setForm({ ...form, [key]: e.target.checked })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                        </div>
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => setResetModalOpen(true)}
              className="text-red-600 hover:text-red-700 font-medium text-sm"
            >
              Reset to Default
            </button>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] px-4">
          <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                Reset Configuration
              </h2>
            </div>

            <p className="mb-6 text-gray-600">
              Are you sure you want to reset this personality configuration to
              default values? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setResetModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PersonalityConfigModal;
