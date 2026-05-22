import { useState } from "react";
import { STAGE_COLORS, STAGES, StageBadge, Card } from "./AdminDashboard";

const COMM_LOG = [
  { id: 1, type: "Call", date: "May 19, 2026", notes: "Introduced QR-Wegn concept. Teclai showed strong interest in the restaurant vertical. Mentioned 3 contacts in Juba.", by: "Admin" },
  { id: 2, type: "Email", date: "May 17, 2026", notes: "Sent partner overview PDF and demo link. Asked him to review by end of week.", by: "Admin" },
  { id: 3, type: "Meeting", date: "May 14, 2026", notes: "First in-person meeting at Snelling Cafe. Walked through live demo on tablet. Very positive reaction.", by: "Admin" },
];

const TRAINING = [
  { id: 1, title: "QR-Wegn Platform Overview", type: "PDF", status: "completed", assignedAt: "May 14" },
  { id: 2, title: "How to Onboard a Restaurant", type: "Video", status: "in_progress", assignedAt: "May 17" },
  { id: 3, title: "Partner Commission Structure", type: "PDF", status: "assigned", assignedAt: "May 19" },
  { id: 4, title: "QR Label Printing Guide", type: "PDF", status: "assigned", assignedAt: "May 19" },
];

const STATUS_COLORS = {
  completed: { bg: "rgba(40,180,80,0.1)", color: "#35c060", label: "Completed" },
  in_progress: { bg: "rgba(240,180,60,0.12)", color: "#f0c040", label: "In Progress" },
  assigned: { bg: "rgba(100,160,220,0.3)", color: "#5ab0f0", label: "Assigned" },
};

export default function PartnerProfile({ partnerId, navigate }) {
  const partner = MOCK_PARTNERS.find(p => p.id === partnerId) || MOCK_PARTNERS[0];
  const [activeTab, setTab] = useState("overview");
  const [note, setNote] = useState("");
  const [commType, setCommType] = useState("Call");
  const stageColor = STAGE_COLORS[partner.stage];

  return (
    <div>
      {/* Back */}
      <button onClick={() => navigate("partners")} style={{ fontSize: 19, color: "#a0c8e8", background: "none", border: "none", cursor: "pointer", marginBottom: 20, padding: 0 }}>
        â† Back to Partners
      </button>

      {/* Header */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "linear-gradient(135deg, #1a3560, #0d2045)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, fontWeight: 700, color: "#5ab0f0", flexShrink: 0
            }}>{partner.name.split(" ").map(n => n[0]).join("")}</div>
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 700, color: "#ffffff", margin: 0 }}>{partner.name}</h2>
              <p style={{ fontSize: 20, color: "#a0c8e8", margin: "3px 0 6px" }}>{partner.territory}</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {partner.languages.map(l => (
                  <span key={l} style={{ fontSize: 17, background: "rgba(100,160,220,0.22)", color: "#90bcd8", padding: "2px 8px", borderRadius: 20 }}>{l}</span>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
            <StageBadge stage={partner.stage} />
            <select defaultValue={partner.stage}
              style={{
                padding: "7px 12px", borderRadius: 8, fontSize: 18,
                border: "1.5px solid rgba(100,160,220,0.35)", background: "rgba(8,16,36,0.95)",
                color: "#ffffff", outline: "none", cursor: "pointer"
              }}>
              {STAGES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 24, marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(100,160,220,0.22)" }}>
          {[
            { label: "Last Contact", value: partner.lastContact },
            { label: "Next Followup", value: partner.nextFollowup, warn: partner.nextFollowup === "Overdue" },
            { label: "Training", value: `${TRAINING.filter(t => t.status === "completed").length}/${TRAINING.length} done` },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 17, color: "#7ab0cc", letterSpacing: "0.06em", marginBottom: 2 }}>{s.label.toUpperCase()}</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: s.warn ? "#f07070" : "#ffffff" }}>{s.value}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "rgba(8,16,36,0.8)", borderRadius: 12, padding: 4, width: "fit-content" }}>
        {["overview", "communication", "training", "materials"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
            background: activeTab === t ? "white" : "transparent",
            color: activeTab === t ? "#5ab0f0" : "#a0c8e8",
            fontSize: 19, fontWeight: activeTab === t ? 600 : 400,
            boxShadow: activeTab === t ? "0 1px 6px rgba(100,160,220,0.25)" : "none",
            textTransform: "capitalize", transition: "all 0.15s"
          }}>{t}</button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em", marginBottom: 14 }}>PARTNER NOTES</div>
            <p style={{ fontSize: 20, color: "#4a6a8a", lineHeight: 1.7, margin: 0 }}>
              Strong community connections in East Africa. Has training and onboarding experience. Familiar with restaurant workflows. Potential to cover South Sudan and Uganda territory.
            </p>
          </Card>
          <Card>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em", marginBottom: 14 }}>QUICK STATS</div>
            {[
              { label: "Businesses Onboarded", value: "0" },
              { label: "Territory", value: partner.territory },
              { label: "Source", value: "Direct referral" },
              { label: "Date Added", value: "May 14, 2026" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(100,160,220,0.22)" }}>
                <span style={{ fontSize: 19, color: "#a0c8e8" }}>{s.label}</span>
                <span style={{ fontSize: 19, fontWeight: 600, color: "#ffffff" }}>{s.value}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {activeTab === "communication" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 16 }}>
          <Card>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em", marginBottom: 14 }}>LOG INTERACTION</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {["Call","Email","Meeting","Message"].map(t => (
                <button key={t} onClick={() => setCommType(t)} style={{
                  padding: "6px 12px", borderRadius: 8, border: "1.5px solid",
                  borderColor: commType === t ? "#5ab0f0" : "rgba(100,160,220,0.35)",
                  background: commType === t ? "rgba(80,160,230,0.18)" : "transparent",
                  color: commType === t ? "#5ab0f0" : "#a0c8e8",
                  fontSize: 18, fontWeight: commType === t ? 600 : 400, cursor: "pointer"
                }}>{t}</button>
              ))}
            </div>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Notes from this interaction..."
              rows={5} style={{
                width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 19,
                border: "1.5px solid rgba(100,160,220,0.35)", background: "rgba(8,16,36,0.9)",
                color: "#ffffff", outline: "none", resize: "vertical", boxSizing: "border-box",
                fontFamily: "inherit", lineHeight: 1.6
              }} />
            <button style={{
              marginTop: 10, width: "100%", padding: "10px 0", borderRadius: 10,
              background: "linear-gradient(135deg, #3a9ad9, #2a7ab8)", color: "white",
              border: "none", fontSize: 19, fontWeight: 600, cursor: "pointer"
            }}>Save Interaction</button>
          </Card>
          <Card>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em", marginBottom: 14 }}>COMMUNICATION LOG</div>
            {COMM_LOG.map(c => (
              <div key={c.id} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: "1px solid rgba(100,160,220,0.22)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 18, fontWeight: 600, background: "rgba(100,160,220,0.3)", color: "#5ab0f0", padding: "2px 9px", borderRadius: 20 }}>{c.type}</span>
                  <span style={{ fontSize: 17, color: "#7ab0cc" }}>{c.date}</span>
                </div>
                <p style={{ fontSize: 19, color: "#4a6a8a", lineHeight: 1.6, margin: 0 }}>{c.notes}</p>
              </div>
            ))}
          </Card>
        </div>
      )}

      {activeTab === "training" && (
        <Card>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em", marginBottom: 16 }}>TRAINING PROGRESS</div>
          {TRAINING.map(t => {
            const sc = STATUS_COLORS[t.status];
            return (
              <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid rgba(100,160,220,0.22)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(100,160,220,0.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                    {t.type === "Video" ? "â–·" : "â—»"}
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: "#ffffff" }}>{t.title}</div>
                    <div style={{ fontSize: 17, color: "#7ab0cc" }}>{t.type} Â· Assigned {t.assignedAt}</div>
                  </div>
                </div>
                <span style={{ fontSize: 17, fontWeight: 600, background: sc.bg, color: sc.color, padding: "3px 10px", borderRadius: 20 }}>{sc.label}</span>
              </div>
            );
          })}
          <button style={{ marginTop: 14, fontSize: 19, color: "#5ab0f0", background: "rgba(80,160,230,0.15)", border: "1px solid rgba(80,160,230,0.35)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 500 }}>
            + Assign Material
          </button>
        </Card>
      )}

      {activeTab === "materials" && (
        <Card>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em", marginBottom: 16 }}>SHARED MATERIALS</div>
          {[
            { title: "Partner Overview Deck", type: "PDF", shared: "May 17" },
            { title: "QR-Wegn Demo Video", type: "Video", shared: "May 17" },
            { title: "Commission Structure", type: "PDF", shared: "May 19" },
          ].map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(100,160,220,0.22)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 24 }}>{m.type === "Video" ? "â–·" : "â—»"}</span>
                <div>
                  <div style={{ fontSize: 19, fontWeight: 600, color: "#ffffff" }}>{m.title}</div>
                  <div style={{ fontSize: 17, color: "#7ab0cc" }}>Shared {m.shared}</div>
                </div>
              </div>
              <button style={{ fontSize: 18, color: "#5ab0f0", background: "none", border: "none", cursor: "pointer" }}>Send again</button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
