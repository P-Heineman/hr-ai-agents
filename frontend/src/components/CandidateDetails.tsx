import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const labels: Record<string, string> = {
  communication: "תקשורת", confidence: "ביטחון", reliability: "אמינות",
  role_fit: "התאמה לתפקיד", motivation: "מוטיבציה", availability: "זמינות",
  stability: "יציבות", customer_orientation: "שירותיות", clarity: "בהירות",
  engagement: "מעורבות",
};

export default function CandidateDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const raw = location.state;
  if (!raw) return <div style={{ padding: 60, textAlign: "center" }}>אין נתונים</div>;
  const data = raw.analysis || raw;
  const dv = data.dashboard_view;
  const details = data.interview_details;
  const pct = Math.round(dv.match_percent * 10);

  const traits = Object.entries(details.graph).map(([k, v]) => ({
    name: labels[k] || k, value: Math.round((v as number) * 10),
  }));

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 20px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        <button onClick={() => navigate(-1)} style={{
          marginBottom: 24, padding: "6px 16px", border: "1px solid var(--border)",
          borderRadius: 6, background: "var(--card)", cursor: "pointer", fontSize: 14,
        }}>חזרה</button>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "var(--primary)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 700,
          }}>
            {dv.full_name?.charAt(0)}
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--primary)", margin: 0 }}>{dv.full_name}</h1>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 2 }}>
              {dv.email} · {dv.phone || "—"}
            </p>
          </div>
          <div style={{ marginRight: "auto" }}>
            <span style={{
              fontSize: 28, fontWeight: 700,
              color: pct >= 60 ? "var(--success)" : "var(--warning)",
            }}>{pct}%</span>
            <span style={{
              display: "block", fontSize: 13, marginTop: 2,
              color: pct >= 60 ? "var(--success)" : "var(--warning)",
            }}>{dv.status}</span>
          </div>
        </div>

        {/* Chart */}
        <div style={{ ...card, padding: 28, marginBottom: 24 }}>
          <h3 style={title}>פרופיל תכונות</h3>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={traits} margin={{ bottom: 60 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12, angle: -35, textAnchor: 'end' }} interval={0} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                {traits.map((t, i) => (
                  <Cell key={i} fill={t.value >= 60 ? "#3b82f6" : t.value >= 40 ? "#94a3b8" : "#e2e8f0"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Lists */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <div style={card}>
            <h3 style={{ ...title, color: "var(--success)" }}>חוזקות</h3>
            {details.strengths.map((s: string, i: number) => <p key={i} style={li}>{s}</p>)}
          </div>
          <div style={card}>
            <h3 style={{ ...title, color: "var(--accent)" }}>נקודות לשיפור</h3>
            {details.weaker_points.map((w: string, i: number) => <p key={i} style={li}>{w}</p>)}
          </div>
        </div>

        <div style={card}>
          <h3 style={title}>נימוקי ציון</h3>
          {details.score_reasons.map((r: string, i: number) => <p key={i} style={li}>{r}</p>)}
        </div>
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "var(--card)", borderRadius: 10, padding: 24,
  boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)",
};
const title: React.CSSProperties = {
  fontSize: 15, fontWeight: 700, color: "var(--primary)", margin: "0 0 14px",
  paddingBottom: 10, borderBottom: "1px solid var(--border)",
};
const li: React.CSSProperties = { fontSize: 14, lineHeight: 1.7, color: "var(--text)", margin: "4px 0" };
