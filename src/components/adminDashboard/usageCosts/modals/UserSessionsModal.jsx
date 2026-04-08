import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { SessionDetailModal } from "./SessionDetailModal";

const API_BASE_URL = import.meta.env.VITE_SERVER_URL + "/api";

const fmt = (n, d = 6) => `$${Number(n || 0).toFixed(d)}`;
const fmtShort = (n) => `$${Number(n || 0).toFixed(4)}`;
const fmtDuration = (s) => {
  if (!s) return "0s";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
};
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export default function UserSessionsModal({
  isOpen,
  onClose,
  userToken,
  userNumber,
  adminToken,
}) {
  const [sessions, setSessions] = useState([]);
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [detailModal, setDetailModal] = useState({
    open: false,
    session: null,
  });

  const headers = { Authorization: `Bearer ${adminToken}` };

  const fetchSessions = async () => {
    if (!userToken) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.append("from", from);
      if (to) params.append("to", to);
      const res = await axios.get(
        `${API_BASE_URL}/usage/sessions/${userToken}?${params}`,
        { headers },
      );
      setSessions(res.data.data || []);
      setTotals(res.data.totals || null);
    } catch {
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userToken) fetchSessions();
  }, [isOpen, userToken]);

  const handleDownloadCSV = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/usage/export/csv/${userToken}`,
        {
          headers,
          responseType: "blob",
        },
      );
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `sessions_${userToken}_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download");
    }
  };

  const handleDownloadJSON = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/usage/export/json/${userToken}`,
        { headers },
      );
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sessions_${userToken}_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download");
    }
  };

  if (!isOpen) return null;

  console.log("Totals:", totals);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Session Logs</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {userNumber ? `Number: ${userNumber} · ` : ""}
              Token: {userToken?.substring(0, 16)}…
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCSV}
              className="text-xs border border-gray-300 text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              ⬇ CSV
            </button>
            <button
              onClick={handleDownloadJSON}
              className="text-xs border border-gray-300 text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              ⬇ JSON
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 ml-2 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-gray-500 block mb-1">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={fetchSessions}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Filter
          </button>
          <button
            onClick={() => {
              setFrom("");
              setTo("");
              setTimeout(fetchSessions, 100);
            }}
            className="px-4 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Totals */}
        {totals && (
          <div className="px-6 py-3 border-b border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Sessions", value: sessions.length },
              {
                label: "Total Duration",
                value: fmtDuration(totals.totalDurationSeconds),
              },
              {
                label: "Total Tokens",
                value: (
                  totals.totalRealtimeAudioInputTokens +
                  totals.totalRealtimeCachedInputTokens +
                  totals.totalRealtimeTextInputTokens +
                  totals.totalRealtimeOutputTokens +
                  totals.totalChatInputTokens +
                  totals.totalChatOutputTokens
                ).toLocaleString(),
              },
              {
                label: "Total Cost",
                value: fmtShort(totals.totalCost),
                highlight: true,
              },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-lg p-3 ${item.highlight ? "bg-blue-50" : "bg-gray-50"}`}
              >
                <p className="text-xs text-gray-500">{item.label}</p>
                <p
                  className={`text-base font-bold ${item.highlight ? "text-blue-600" : "text-gray-800"}`}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              No sessions found
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {[
                    "Started At",
                    "Duration",
                    "Tokens",
                    "Audio Chars",
                    "Cost",
                    "Detail",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-sm text-gray-700">
                      {fmtDate(s.startedAt)}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700">
                      {fmtDuration(s.durationSeconds)}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700">
                      {(
                        s.realtimeAudioInputTokens +
                        s.realtimeCachedInputTokens +
                        s.realtimeTextInputTokens +
                        s.realtimeOutputTokens +
                        s.chatInputTokens +
                        s.chatOutputTokens
                      ).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700">
                      {(
                        s.realtimeAudioChars + s.greetingAudioChars
                      ).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-gray-800">
                      {fmtShort(s.totalCost)}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() =>
                          setDetailModal({ open: true, session: s })
                        }
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium border border-blue-200 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <SessionDetailModal
        isOpen={detailModal.open}
        onClose={() => setDetailModal({ open: false, session: null })}
        session={detailModal.session}
      />
    </div>
  );
}
