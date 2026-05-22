import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { STAGE_COLORS, STAGES, StageBadge, Card } from "./AdminDashboard";


const TRAINING = [
  { id: 1, title: "QR-Wegn Platform Overview", type: "PDF", status: "completed", assignedAt: "May 14" },
  { id: 2, title: "How to Onboard a Restaurant", type: "Video", status: "in_progress", assignedAt: "May 17" },
  { id: 3, title: "Partner Commission Structure", type: "PDF", status: "assigned", assignedAt: "May 19" },
  { id: 4, title: "QR Label Printing Guide", type: "PDF", status: "assigned", assignedAt: "May 19" },
];

const STATUS_COLORS = {
  completed:   { bg: "rgba(40,180,80,0.1)",   color: "#35c060", label: "Completed" },
  in_progress: { bg: "rgba(240,180,60,0.12)", color: "#f0c040", label: "In Progress" },
  assigned:    { bg: "rgba(100,160,220,0.3)", color: "#5ab0f0", label: "Assigned" },
};

export default function PartnerProfile({ partnerId, navigate }) {
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setTab] = useState("overview");
  const [note, setNote] = useState("");
  const [commType, setCommType] = useState("Call");
  const [commLog, setCommLog] = useState([]);
  const [commLoading, setCommLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!partnerId) { setLoading(false); return; }
    const loadPartner = async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .eq("id", partnerId)
        .single();
      if (!error && data) setPartner(data);
      setLoading(false);
    };
    loadPartner();
  }, [partnerId]);

  const loadComms = async () => {
    if (!partnerId) return;
    setCommLoading(true);
    const { data, error } = await supabase
      .from("communications")
      .select("*")
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: false });
    if (!error) setCommLog(data || []);
    setCommLoading(false);
  };

  useEffect(() => { loadComms(); }, [partnerId]);

  const handleSaveInteraction = async () => {
    if (!note.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("communications").insert({
      partner_id: partnerId,
      type: commType,
      notes: note.trim(),
    });
    setSaving(false);
    if (!error) {
      setNote("");
      loadComms();
    }
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: "80px 0", color: "#a0c8e8", fontSize: 18 }}>
      Loading partner...
    </div>
  );

  if (!partner) return (
    <div style={{ textAlign: "center", padding: "80px 0" }}>
      <p style={{ color: "#f07070", fontSize: 18, marginBottom: 16 }}>Partner not found.</p>
      <button onClick={() => navigate("partners")} style={{ color: "#5ab0f0", background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>
        ← Back to Partners
      </button>
    </div>
  );

  const initials = (partner.full_name || "?").split(" ").map(n => n[0]).join("").slice(0, 2);
  const stageColor = STAGE_COLORS[partner.stage] || STAGE_COLORS.Identified;

  return (
    <div>
      {/* Back */}
      <button onClick={() => navigate("partners")} style={{ fontSize: 16, color: "#a0c8e8", background: "none", border: "none", cursor: "pointer", marginBottom: 20, padding: 0 }}>
        ← Back to Partners
      </button>

      {/* Header */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "linear-gradient(135deg, #1a3560, #0d2045)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 700, color: "#5ab0f0", flexShrink: 0
            }}>{initials}</div>
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 700, color: "#ffffff", margin: 0 }}>{partner.full_name}</h2>
              <p style={{ fontSize: 16, color: "#a0c8e8", margin: "3px 0 6px" }}>{partner.territory || "—"}</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(partner.languages || []).map(l => (
                  <span key={l} style={{ fontSize: 13, background: "rgba(100,160,220,0.22)", color: "#90bcd8", padding: "2px 8px", borderRadius: 20 }}>{l}</span>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
            <StageBadge stage={partner.stage || "Identified"} />
            <select defaultValue={partner.stage}
              style={{
                padding: "7px 12px", borderRadius: 8, fontSize: 14,
                border: "1.5px solid rgba(100,160,220,0.35)", background: "rgba(8,16,36,0.95)",
                color: "#ffffff", outline: "none", cursor: "pointer"
              }}>
              {STAGES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 24, marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(100,160,220,0.22)" }}>
          {[
            { label: "Email",       value: partner.email || "—" },
            { label: "Phone",       value: partner.phone || "—" },
            { label: "Source",      value: partner.source || "—" },
            { label: "Commission",  value: partner.commission_rate != null ? `${partner.commission_rate}%` : "—" },
            { label: "Market Tier", value: partner.market_tier || "—" },
            { label: "Training",    value: `${TRAINING.filter(t => t.status === "completed").length}/${TRAINING.length} done` },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 12, color: "#7ab0cc", letterSpacing: "0.06em", marginBottom: 2 }}>{s.label.toUpperCase()}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#ffffff" }}>{s.value}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "rgba(8,16,36,0.8)", borderRadius: 12, padding: 4, width: "fit-content" }}>
        {["overview", "communication", "training", "materials"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
            background: activeTab === t ? "rgba(90,176,240,0.18)" : "transparent",
            color: activeTab === t ? "#7dc4ff" : "#a0c8e8",
            fontSize: 15, fontWeight: activeTab === t ? 600 : 400,
            boxShadow: activeTab === t ? "inset 0 0 0 1px rgba(90,160,255,0.3)" : "none",
            textTransform: "capitalize", transition: "all 0.15s"
          }}>{t}</button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em", marginBottom: 14 }}>PARTNER NOTES</div>
            <p style={{ fontSize: 16, color: "#a0c8e8", lineHeight: 1.7, margin: 0, opacity: 0.7 }}>
              No notes yet.
            </p>
          </Card>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em", marginBottom: 14 }}>QUICK STATS</div>
            {[
              { label: "Businesses Onboarded", value: "0" },
              { label: "Territory",  value: partner.territory || "—" },
              { label: "Source",     value: partner.source || "—" },
              { label: "Market Tier", value: partner.market_tier || "—" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(100,160,220,0.22)" }}>
                <span style={{ fontSize: 15, color: "#a0c8e8" }}>{s.label}</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#ffffff" }}>{s.value}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {activeTab === "communication" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 16 }}>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em", marginBottom: 14 }}>LOG INTERACTION</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {["Call","Email","Meeting","Message"].map(t => (
                <button key={t} onClick={() => setCommType(t)} style={{
                  padding: "6px 12px", borderRadius: 8, border: "1.5px solid",
                  borderColor: commType === t ? "#5ab0f0" : "rgba(100,160,220,0.35)",
                  background: commType === t ? "rgba(80,160,230,0.18)" : "transparent",
                  color: commType === t ? "#5ab0f0" : "#a0c8e8",
                  fontSize: 14, fontWeight: commType === t ? 600 : 400, cursor: "pointer"
                }}>{t}</button>
              ))}
            </div>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Notes from this interaction..."
              rows={5} style={{
                width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 15,
                border: "1.5px solid rgba(100,160,220,0.35)", background: "rgba(8,16,36,0.9)",
                color: "#ffffff", outline: "none", resize: "vertical", boxSizing: "border-box",
                fontFamily: "inherit", lineHeight: 1.6
              }} />
            <button onClick={handleSaveInteraction} disabled={saving || !note.trim()} style={{
              marginTop: 10, width: "100%", padding: "10px 0", borderRadius: 10,
              background: saving || !note.trim() ? "rgba(80,160,230,0.2)" : "linear-gradient(135deg, #3a9ad9, #2a7ab8)",
              color: "white", border: "none", fontSize: 15, fontWeight: 600,
              cursor: saving || !note.trim() ? "default" : "pointer"
            }}>{saving ? "Saving..." : "Save Interaction"}</button>
          </Card>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em", marginBottom: 14 }}>COMMUNICATION LOG</div>
            {commLoading && <p style={{ color: "#7ab0cc", fontSize: 14 }}>Loading...</p>}
            {!commLoading && commLog.length === 0 && (
              <p style={{ fontSize: 14, color: "#7ab0cc", textAlign: "center", padding: "20px 0" }}>No interactions logged yet.</p>
            )}
            {commLog.map(c => (
              <div key={c.id} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: "1px solid rgba(100,160,220,0.22)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, background: "rgba(100,160,220,0.3)", color: "#5ab0f0", padding: "2px 9px", borderRadius: 20 }}>{c.type}</span>
                  <span style={{ fontSize: 13, color: "#7ab0cc" }}>{new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
                <p style={{ fontSize: 15, color: "#a0c8e8", lineHeight: 1.6, margin: 0, opacity: 0.8 }}>{c.notes}</p>
              </div>
            ))}
          </Card>
        </div>
      )}

      {activeTab === "training" && (
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em", marginBottom: 16 }}>TRAINING PROGRESS</div>
          {TRAINING.map(t => {
            const sc = STATUS_COLORS[t.status];
            return (
              <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid rgba(100,160,220,0.22)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(100,160,220,0.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                    {t.type === "Video" ? "▷" : "◻"}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#ffffff" }}>{t.title}</div>
                    <div style={{ fontSize: 13, color: "#7ab0cc" }}>{t.type} · Assigned {t.assignedAt}</div>
                  </div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, background: sc.bg, color: sc.color, padding: "3px 10px", borderRadius: 20 }}>{sc.label}</span>
              </div>
            );
          })}
          <button style={{ marginTop: 14, fontSize: 15, color: "#5ab0f0", background: "rgba(80,160,230,0.15)", border: "1px solid rgba(80,160,230,0.35)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 500 }}>
            + Assign Material
          </button>
        </Card>
      )}

      {activeTab === "materials" && (
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em", marginBottom: 16 }}>SHARED MATERIALS</div>
          {[
            { title: "Partner Overview Deck", type: "PDF", shared: "May 17" },
            { title: "QR-Wegn Demo Video", type: "Video", shared: "May 17" },
            { title: "Commission Structure", type: "PDF", shared: "May 19" },
          ].map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(100,160,220,0.22)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{m.type === "Video" ? "▷" : "◻"}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#ffffff" }}>{m.title}</div>
                  <div style={{ fontSize: 13, color: "#7ab0cc" }}>Shared {m.shared}</div>
                </div>
              </div>
              <button style={{ fontSize: 14, color: "#5ab0f0", background: "none", border: "none", cursor: "pointer" }}>Send again</button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
