import type { ApiData } from "../pages/CandidatePage";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { useNavigate } from "react-router-dom";

type Props = { data: ApiData };

const graphLabels: Record<string, string> = {
  communication: "תקשורת", confidence: "ביטחון", reliability: "אמינות",
  role_fit: "התאמה לתפקיד", motivation: "מוטיבציה", availability: "זמינות",
  stability: "יציבות", customer_orientation: "שירותיות", clarity: "בהירות",
  engagement: "מעורבות",
};

export default function Dashboard({ data }: Props) {
  const navigate = useNavigate();
  const dv = data.dashboard_view;
  const details = data.interview_details;
  const pct = Math.round(dv.match_percent * 10);
  const isGood = pct >= 60;

  const traits = Object.entries(details.graph).map(([k, v]) => ({
    name: graphLabels[k] || k,
    value: Math.round((v as number) * 10),
  }));

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 20px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--primary)", margin: 0 }}>תוצאות ניתוח</h1>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 2 }}>{dv.full_name}</p>
          </div>
          <button onClick={() => navigate("/")} style={{
            padding: "8px 20px", border: "1px solid var(--border)", borderRadius: 8,
            background: "var(--card)", cursor: "pointer", fontSize: 14, color: "var(--text)",
          }}>מועמד חדש</button>
        </div>

        {/* Score + Info cards row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
          {/* Score card */}
          <div style={{ ...card, textAlign: "center", padding: 28 }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%", margin: "0 auto 12px",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `4px solid ${isGood ? "var(--success)" : "var(--warning)"}`,
              fontSize: 28, fontWeight: 700, color: isGood ? "var(--success)" : "var(--warning)",
            }}>
              {pct}%
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: isGood ? "var(--success)" : "var(--warning)" }}>
              {dv.status}
            </div>
          </div>

          {/* Contact card */}
          <div style={card}>
            <h3 style={cardTitle}>פרטי קשר</h3>
            <div style={infoRow}><span style={infoLabel}>שם</span><span>{dv.full_name}</span></div>
            <div style={infoRow}><span style={infoLabel}>אימייל</span><span dir="ltr">{dv.email}</span></div>
            <div style={infoRow}><span style={infoLabel}>טלפון</span><span dir="ltr">{dv.phone || "—"}</span></div>
          </div>

          {/* Quick summary */}
          <div style={card}>
            <h3 style={cardTitle}>סיכום</h3>
            {details.score_reasons.slice(0, 3).map((r, i) => (
              <p key={i} style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, lineHeight: 1.5 }}>
                {r}
              </p>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div style={{ ...card, padding: 28, marginBottom: 32 }}>
          <h3 style={{ ...cardTitle, marginBottom: 20 }}>פרופיל תכונות</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={traits} margin={{ bottom: 60 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12, angle: -35, textAnchor: 'end' }} interval={0} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={36}>
                {traits.map((t, i) => (
                  <Cell key={i} fill={t.value >= 60 ? "#3b82f6" : t.value >= 40 ? "#94a3b8" : "#e2e8f0"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Strengths + Weaknesses */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={card}>
            <h3 style={{ ...cardTitle, color: "var(--success)" }}>נקודות חוזק</h3>
            {details.strengths.map((s, i) => (
              <div key={i} style={listItem}>
                <span style={{ color: "var(--success)", marginLeft: 8 }}>●</span> {s}
              </div>
            ))}
          </div>
          <div style={card}>
            <h3 style={{ ...cardTitle, color: "var(--accent)" }}>נקודות לשיפור</h3>
            {details.weaker_points.map((w, i) => (
              <div key={i} style={listItem}>
                <span style={{ color: "var(--accent)", marginLeft: 8 }}>●</span> {w}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "var(--card)", borderRadius: 10, padding: 24,
  boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)",
};
const cardTitle: React.CSSProperties = {
  fontSize: 15, fontWeight: 700, color: "var(--primary)", marginBottom: 14, margin: 0,
  paddingBottom: 10, borderBottom: "1px solid var(--border)",
};
const infoRow: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", padding: "8px 0",
  fontSize: 14, borderBottom: "1px solid #f3f4f6",
};
const infoLabel: React.CSSProperties = { color: "var(--text-secondary)", fontWeight: 500 };
const listItem: React.CSSProperties = { fontSize: 14, padding: "6px 0", lineHeight: 1.6 };
