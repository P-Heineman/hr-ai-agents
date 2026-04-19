import { useNavigate } from "react-router-dom";
import { fetchCandidatesList, type CandidateResponse } from "../services/candidatesService";

type Candidate = { name: string; phone: string; email: string; profile: string; score: number };
type Props = { data?: Candidate[]; rawData?: unknown };

export default function CandidatesTable({ data, rawData }: Props) {
  const navigate = useNavigate();
  const candidates = data || [];

  if (candidates.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "var(--text-secondary)" }}>
        אין מועמדים להצגה
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", background: "var(--card)", borderRadius: 10, overflow: "hidden", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}>
        <thead>
          <tr style={{ background: "var(--primary)", color: "#fff" }}>
            <th style={th}>שם מלא</th>
            <th style={th}>טלפון</th>
            <th style={th}>אימייל</th>
            <th style={th}>סטטוס</th>
            <th style={th}>ציון</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c, i) => {
            const isGood = c.score >= 60;
            return (
              <tr
                key={i}
                onClick={() => navigate(`/candidate/${c.email}`, { state: rawData })}
                style={{ cursor: "pointer", borderBottom: "1px solid var(--border)", transition: "background .15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fb")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <td style={td}><span style={{ fontWeight: 600 }}>{c.name}</span></td>
                <td style={{ ...td, direction: "ltr" }}>{c.phone || "—"}</td>
                <td style={{ ...td, direction: "ltr" }}>{c.email}</td>
                <td style={td}>
                  <span style={{
                    display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                    background: isGood ? "#dcfce7" : "#fef9c3",
                    color: isGood ? "#166534" : "#854d0e",
                  }}>
                    {c.profile}
                  </span>
                </td>
                <td style={td}>
                  <span style={{ fontWeight: 700, color: isGood ? "var(--success)" : "var(--warning)" }}>
                    {c.score}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const th: React.CSSProperties = { padding: "14px 16px", fontSize: 14, fontWeight: 600, textAlign: "right" };
const td: React.CSSProperties = { padding: "14px 16px", fontSize: 14 };

// Re-export for HRDashboard
export { fetchCandidatesList, type CandidateResponse };
