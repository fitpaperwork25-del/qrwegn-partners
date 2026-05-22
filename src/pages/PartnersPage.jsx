import { useState } from "react";
import { MOCK_PARTNERS, STAGE_COLORS, STAGES, StageBadge, Card } from "./AdminDashboard";

export default function PartnersPage({ navigate }) {
  const [view, setView] = useState("list");
  const [filterStage, setFilterStage] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = MOCK_PARTNERS.filter(p => {
    const matchStage = filterStage === "All" || p.stage === filterStage;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.territory.toLowerCase().includes(search.toLowerCase());
    return matchStage && matchSearch;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a3a5a", margin: 0 }}>Partners</h1>
          <p style={{ fontSize: 14, color: "#7aaac8", margin: "4px 0 0" }}>{MOCK_PARTNERS.length} total partners in pipeline</p>
        </div>
        <button style={{
          background: "linear-gradient(135deg, #3a9ad9, #2a7ab8)", color: "white",
          border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14,
          fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px rgba(42,122,184,0.25)"
        }}>+ Add Partner</button>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search partners..."
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 10, fontSize: 14,
            border: "1.5px solid rgba(100,160,220,0.2)", background: "rgba(255,255,255,0.7)",
            color: "#1a3a5a", outline: "none"
          }} />
        <select value={filterStage} onChange={e => setFilterStage(e.target.value)}
          style={{
            padding: "10px 14px", borderRadius: 10, fontSize: 13,
            border: "1.5px solid rgba(100,160,220,0.2)", background: "rgba(255,255,255,0.7)",
            color: "#1a3a5a", outline: "none"
          }}>
          <option>All</option>
          {STAGES.map(s => <option key={s}>{s}</option>)}
        </select>
        <div style={{ display: "flex", background: "rgba(255,255,255,0.6)", borderRadius: 10, border: "1px solid rgba(100,160,220,0.15)" }}>
          {["list", "board"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              background: view === v ? "rgba(42,122,184,0.12)" : "transparent",
              color: view === v ? "#2a7ab8" : "#9abccc", fontSize: 13, fontWeight: view === v ? 600 : 400,
              textTransform: "capitalize"
            }}>{v}</button>
          ))}
        </div>
      </div>

      {view === "list" ? (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(100,160,220,0.1)" }}>
                {["Partner", "Territory", "Languages", "Stage", "Last Contact", "Next Followup", ""].map(h => (
                  <th key={h} style={{ padding: "12px 18px", textAlign: "left", fontSize: 11, color: "#7aaac8", fontWeight: 600, letterSpacing: "0.06em" }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(100,160,220,0.06)" : "none", transition: "background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(100,160,220,0.04)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "linear-gradient(135deg, #c8e8f8, #a0ccf0)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 700, color: "#2a7ab8", flexShrink: 0
                      }}>{p.name.split(" ").map(n => n[0]).join("")}</div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#1a3a5a" }}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 18px", fontSize: 13, color: "#4a7a9a" }}>{p.territory}</td>
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {p.languages.map(l => (
                        <span key={l} style={{ fontSize: 11, background: "rgba(100,160,220,0.08)", color: "#4a7aaa", padding: "2px 7px", borderRadius: 20 }}>{l}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: "14px 18px" }}><StageBadge stage={p.stage} /></td>
                  <td style={{ padding: "14px 18px", fontSize: 13, color: "#7aaac8" }}>{p.lastContact}</td>
                  <td style={{ padding: "14px 18px" }}>
                    <span style={{
                      fontSize: 12, fontWeight: 500,
                      color: p.nextFollowup === "Overdue" ? "#c03030" : p.nextFollowup === "Tomorrow" ? "#9a6a10" : "#4a7a9a"
                    }}>{p.nextFollowup}</span>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <button onClick={() => navigate("partner-profile", { partnerId: p.id })}
                      style={{ fontSize: 12, color: "#2a7ab8", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        /* Board view */
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
          {STAGES.filter(s => !["Declined"].includes(s)).map(stage => {
            const c = STAGE_COLORS[stage];
            const stagePartners = filtered.filter(p => p.stage === stage);
            return (
              <div key={stage} style={{ minWidth: 200, flex: "0 0 200px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: c.color, letterSpacing: "0.08em", marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                  <span>{stage.toUpperCase()}</span>
                  <span style={{ background: c.bg, padding: "1px 8px", borderRadius: 20 }}>{stagePartners.length}</span>
                </div>
                {stagePartners.map(p => (
                  <div key={p.id} onClick={() => navigate("partner-profile", { partnerId: p.id })}
                    style={{
                      background: "rgba(255,255,255,0.75)", borderRadius: 10, padding: "12px 14px",
                      marginBottom: 8, cursor: "pointer", border: "1px solid rgba(255,255,255,0.9)",
                      boxShadow: "0 1px 8px rgba(100,160,220,0.08)"
                    }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1a3a5a", marginBottom: 4 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "#7aaac8" }}>{p.territory}</div>
                    <div style={{ fontSize: 11, color: p.nextFollowup === "Overdue" ? "#c03030" : "#9abccc", marginTop: 6 }}>
                      ↻ {p.nextFollowup}
                    </div>
                  </div>
                ))}
                {stagePartners.length === 0 && (
                  <div style={{ fontSize: 12, color: "#c0d8e8", textAlign: "center", padding: "20px 0", background: "rgba(255,255,255,0.3)", borderRadius: 10, border: "1px dashed rgba(100,160,220,0.2)" }}>
                    Empty
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
