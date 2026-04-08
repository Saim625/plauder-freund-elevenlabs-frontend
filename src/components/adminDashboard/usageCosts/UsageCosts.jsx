import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import UserSessionsModal from "./modals/UserSessionsModal";
import { OperationalCostsModal } from "./modals/OperationalCostsModal";
import { ProviderPricingModal } from "./modals/ProviderPricingModal";

const API_BASE_URL = import.meta.env.VITE_SERVER_URL + "/api";

const fmt = (n, d = 6) => `$${Number(n || 0).toFixed(d)}`;
const fmtShort = (n) => `$${Number(n || 0).toFixed(4)}`;
const fmtDuration = (s) => {
  if (!s) return "0s";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
};

export const UsageCosts = ({ token: adminToken }) => {
  const [summaries, setSummaries] = useState([]);
  const [platform, setPlatform] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );

  // Modal states
  const [sessionsModal, setSessionsModal] = useState({
    open: false,
    userToken: null,
    number: null,
  });
  const [opCostsModal, setOpCostsModal] = useState(false);
  const [pricingModal, setPricingModal] = useState(false);

  const headers = { Authorization: `Bearer ${adminToken}` };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, platformRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/usage/summary`, { headers }),
        axios.get(`${API_BASE_URL}/usage/platform?month=${selectedMonth}`, {
          headers,
        }),
      ]);
      setSummaries(summaryRes.data.data || []);
      setPlatform(platformRes.data || null);
    } catch (err) {
      toast.error("Failed to load usage data");
    } finally {
      setLoading(false);
    }
  }, [adminToken, selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDownloadSummaryCSV = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/usage/export/summary/csv`, {
        headers,
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `all_users_summary_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download summary");
    }
  };

  const platformTotal = platform?.grandTotal || 0;
  const apiTotal = platform?.apiCosts?.totalApiCost || 0;
  const opTotal = platform?.totalOperationalCost || 0;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
            Usage & Costs
          </h3>
          <p className="text-gray-500 text-sm">
            Track API usage, session costs, and platform expenses
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setOpCostsModal(true)}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            🏢 Operational Costs
          </button>
          <button
            onClick={() => setPricingModal(true)}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            ⚙️ Provider Pricing
          </button>
          <button
            onClick={handleDownloadSummaryCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            ⬇️ Export All
          </button>
        </div>
      </div>

      {/* Platform Overview Cards */}
      {platform && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              API Costs
            </p>
            <p className="text-2xl font-bold text-gray-800">
              {fmtShort(apiTotal)}
            </p>
            <div className="mt-2 space-y-0.5">
              <p className="text-xs text-gray-400">
                GPT Realtime: {fmt(platform.apiCosts?.realtimeGptCost)}
              </p>
              <p className="text-xs text-gray-400">
                GPT Chat: {fmt(platform.apiCosts?.chatGptCost)}
              </p>
              <p className="text-xs text-gray-400">
                ElevenLabs: {fmt(platform.apiCosts?.elevenlabsCost)}
              </p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Operational Costs
            </p>
            <p className="text-2xl font-bold text-gray-800">
              ${Number(opTotal).toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Server, domain & infrastructure
            </p>
            <button
              onClick={() => setOpCostsModal(true)}
              className="mt-2 text-xs text-blue-600 hover:underline"
            >
              Manage →
            </button>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 border border-blue-500 rounded-xl p-5 shadow-sm">
            <p className="text-xs text-blue-200 uppercase tracking-wider mb-1">
              Grand Total
            </p>
            <p className="text-2xl font-bold text-white">
              ${Number(platformTotal).toFixed(4)}
            </p>
            <p className="text-xs text-blue-200 mt-2">
              API + Operational for {selectedMonth}
            </p>
          </div>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600" />
          <p className="text-gray-500 mt-3">Loading usage data...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h4 className="font-semibold text-gray-800">Per-User Usage</h4>
            <span className="text-sm text-gray-500">
              {summaries.length} users
            </span>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Token",
                    "Number",
                    "Sessions",
                    "Duration",
                    "Total Tokens",
                    "Total Cost",
                    "Actions",
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
                {summaries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-10 text-center text-gray-400"
                    >
                      No usage data yet. Sessions will appear here after users
                      disconnect.
                    </td>
                  </tr>
                ) : (
                  summaries.map((s) => (
                    <tr
                      key={s.userToken}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-4 text-sm font-mono text-gray-800">
                        {s.userToken.substring(0, 14)}…
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {s.user?.number || (
                          <span className="text-gray-400 italic text-xs">
                            Not assigned
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        {s.totalSessions}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        {fmtDuration(s.totalDurationSeconds)}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        {(
                          s.totalRealtimeInputTokens +
                          s.totalRealtimeOutputTokens +
                          s.totalChatInputTokens +
                          s.totalChatOutputTokens
                        ).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-800">
                        {fmtShort(s.totalCost)}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() =>
                            setSessionsModal({
                              open: true,
                              userToken: s.userToken,
                              number: s.user?.number,
                            })
                          }
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          View Sessions
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {summaries.map((s) => (
              <div key={s.userToken} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs text-gray-500">Token</p>
                    <p className="text-sm font-mono text-gray-800">
                      {s.userToken.substring(0, 16)}…
                    </p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {fmtShort(s.totalCost)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-xs text-gray-500">Sessions</p>
                    <p className="text-sm font-semibold">{s.totalSessions}</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="text-sm font-semibold">
                      {fmtDuration(s.totalDurationSeconds)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-xs text-gray-500">Number</p>
                    <p className="text-sm font-semibold">
                      {s.user?.number || "—"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setSessionsModal({
                      open: true,
                      userToken: s.userToken,
                      number: s.user?.number,
                    })
                  }
                  className="w-full text-blue-600 border border-blue-200 hover:bg-blue-50 text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  View Sessions
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <UserSessionsModal
        isOpen={sessionsModal.open}
        onClose={() =>
          setSessionsModal({ open: false, userToken: null, number: null })
        }
        userToken={sessionsModal.userToken}
        userNumber={sessionsModal.number}
        adminToken={adminToken}
      />
      <OperationalCostsModal
        isOpen={opCostsModal}
        onClose={() => {
          setOpCostsModal(false);
          fetchData();
        }}
        adminToken={adminToken}
      />
      <ProviderPricingModal
        isOpen={pricingModal}
        onClose={() => setPricingModal(false)}
        adminToken={adminToken}
      />
    </div>
  );
};
