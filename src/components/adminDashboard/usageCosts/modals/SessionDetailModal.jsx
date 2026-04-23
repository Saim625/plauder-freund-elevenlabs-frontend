const fmt = (n, d = 6) => `$${Number(n || 0).toFixed(d)}`;
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";
const fmtDuration = (s) => {
  if (!s) return "0s";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
};

export function SessionDetailModal({ isOpen, onClose, session }) {
  if (!isOpen || !session) return null;

  const Row = ({ label, value, mono }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span
        className={`text-sm font-medium text-gray-800 ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );

  const Section = ({ title, children }) => (
    <div className="mb-4">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        {title}
      </h4>
      <div className="bg-gray-50 rounded-xl px-4">{children}</div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">Session Detail</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Section title="Session Info">
            <Row
              label="Session ID"
              value={session.sessionId?.substring(0, 20) + "…"}
              mono
            />
            <Row label="Started" value={fmtDate(session.startedAt)} />
            <Row label="Ended" value={fmtDate(session.endedAt)} />
            <Row
              label="Duration"
              value={fmtDuration(session.durationSeconds)}
            />
          </Section>

          <Section title="OpenAI Realtime (gpt-4o-realtime)">
            <Row
              label="Text Input Tokens (non-cached)"
              value={session.realtimeTextInputTokens?.toLocaleString()}
            />
            <Row
              label="Audio Input Tokens (non-cached)"
              value={session.realtimeAudioInputTokens?.toLocaleString()}
            />
            <Row
              label="Cached Text Tokens"
              value={session.realtimeCachedInputTokens?.toLocaleString()}
            />
            <Row
              label="Cached Audio Tokens"
              value={session.realtimeCachedAudioInputTokens?.toLocaleString()}
            />
            <Row
              label="Output Tokens"
              value={session.realtimeOutputTokens?.toLocaleString()}
            />
            <Row label="Cost" value={fmt(session.realtimeGptCost)} />
          </Section>

          <Section title="Whisper Transcription">
            <Row
              label="Audio Duration"
              value={`~${Math.round(((session.whisperSeconds || 0) / 60) * 10) / 10} min`}
            />
            <Row label="Cost" value={fmt(session.whisperCost)} />
          </Section>

          <Section title="OpenAI Chat (gpt-4o-mini)">
            <Row
              label="Input Tokens"
              value={session.chatInputTokens?.toLocaleString()}
            />
            <Row
              label="Output Tokens"
              value={session.chatOutputTokens?.toLocaleString()}
            />
            <Row label="Cost" value={fmt(session.chatGptCost)} />
          </Section>

          <Section title="ElevenLabs TTS">
            <Row
              label="Realtime Audio Chars"
              value={session.realtimeAudioChars?.toLocaleString()}
            />
            <Row
              label="Greeting Audio Chars"
              value={session.greetingAudioChars?.toLocaleString()}
            />
            <Row label="Cost" value={fmt(session.elevenlabsCost)} />
          </Section>

          <div className="bg-blue-50 rounded-xl px-4 py-3 flex justify-between items-center">
            <span className="text-sm font-semibold text-blue-700">
              Total Session Cost
            </span>
            <span className="text-lg font-bold text-blue-700">
              {fmt(session.totalCost, 8)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
