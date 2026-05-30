import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const DEFAULT_CHECKLIST = [
  { item_key: "platform_overview", label: "Review platform overview", sort_order: 0 },
  { item_key: "onboarding_video", label: "Watch onboarding video", sort_order: 1 },
  { item_key: "commission_structure", label: "Read commission structure", sort_order: 2 },
  { item_key: "intro_call", label: "Schedule intro call with admin", sort_order: 3 },
  { item_key: "target_businesses", label: "Identify 3 target businesses", sort_order: 4 },
];

const emptyLead = { business_name: "", owner_name: "", phone: "", country: "", notes: "" };

const BASE_TABS = [
  { id: "home",         label: "Home" },
  { id: "profile",      label: "My Profile" },
  { id: "my-promotors", label: "My Promotors" },
  { id: "commissions",  label: "Commissions" },
  { id: "training",     label: "Training" },
  { id: "materials",    label: "Materials" },
  { id: "leads",        label: "Submit Lead" },
];

const STAGE_COLORS = {
  Identified: "#5ab0f0",
  Contacted:  "#5aaae0",
  Interested: "#35c080",
  Evaluating: "#f0c040",
  Onboarding: "#c080f0",
  Active:     "#35c060",
  Stalled:    "#e0a030",
  Declined:   "#f07070",
};

const StagePill = ({ stage }) => {
  const color = STAGE_COLORS[stage] || STAGE_COLORS.Identified;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, color,
      background: `${color}18`,
      border: `1px solid ${color}33`,
      padding: "2px 9px", borderRadius: 20,
    }}>{stage || "Identified"}</span>
  );
};

const Card = ({ children, style = {} }) => (
  <div style={{
    background: "rgba(10,20,45,0.95)",
    backdropFilter: "blur(16px)",
    borderRadius: 16,
    border: "1px solid rgba(50,80,140,0.3)",
    boxShadow: "0 4px 28px rgba(0,0,0,0.35)",
    padding: "24px",
    ...style,
  }}>{children}</div>
);

const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: "#4a7090", letterSpacing: "0.12em", marginBottom: 16 }}>
    {children}
  </div>
);

const FieldRow = ({ label, value }) => (
  <div style={{ display: "flex", padding: "14px 0", borderBottom: "1px solid rgba(50,80,140,0.18)" }}>
    <div style={{ width: 130, fontSize: 11, fontWeight: 700, color: "#4a7090", letterSpacing: "0.07em", flexShrink: 0, paddingTop: 1 }}>
      {label.toUpperCase()}
    </div>
    <div style={{ fontSize: 14, color: value ? "#c0d8e8" : "#3a5a6a", fontStyle: value ? "normal" : "italic" }}>
      {value || "Not set"}
    </div>
  </div>
);

const inputStyle = {
  width: "100%",
  padding: "11px 13px",
  borderRadius: 9,
  border: "1px solid rgba(50,80,140,0.3)",
  background: "rgba(4,10,26,0.85)",
  color: "#c0d8e8",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

export default function PartnerPortal({ profile, onLogout }) {
  const [tab, setTab] = useState("home");
  const [checklist, setChecklist] = useState([]);
  const [promotors, setPromotors] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [commissionsUnavailable, setCommissionsUnavailable] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [training, setTraining] = useState([]);
  const [lead, setLead] = useState(emptyLead);
  const [leadSaving, setLeadSaving] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);
  const [leadError, setLeadError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { init(); }, []);

  const init = () => {
    setChecklist(DEFAULT_CHECKLIST.map(item => ({ ...item, done: false })));
    setLoading(false);
  };

  const toggleCheck = async (item) => {
    const newDone = !item.done;
    setChecklist(c => c.map(x => x.id === item.id ? { ...x, done: newDone } : x));
    await supabase.from("partner_checklist").update({ done: newDone }).eq("id", item.id);
  };

  const doneCount = checklist.filter(c => c.done).length;
  const totalCount = checklist.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const submitLead = async () => {
    if (!lead.business_name.trim() || !profile?.id) return;
    setLeadSaving(true);
    setLeadError("");

    // Fetch partner_id fresh so we never rely on potentially-stale state.
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profileRow } = await supabase
      .from("profiles").select("partner_id").eq("id", user.id).single();

    if (!profileRow?.partner_id) {
      setLeadSaving(false);
      setLeadError("Your account isn't linked to a partner record. Contact admin.");
      return;
    }

    const { error } = await supabase.from("leads").insert({
      submitted_by_partner_id: profileRow.partner_id,
      business_name: lead.business_name.trim(),
      contact_name: lead.owner_name.trim(),
      phone: lead.phone.trim(),
      country: lead.country.trim(),
      notes: lead.notes.trim(),
    });
    setLeadSaving(false);
    if (error) {
      console.error("submitLead error:", error);
      setLeadError(error.message || "Failed to submit lead. Please try again.");
      return;
    }
    setLead(emptyLead);
    setLeadSuccess(true);
    setTimeout(() => setLeadSuccess(false), 3500);
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "P";

  const firstName = profile?.full_name?.split(" ")[0] || "Partner";

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #050d1a 0%, #0a1525 50%, #060e1c 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#4a7090", fontSize: 15 }}>
        Loading your portal&hellip;
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #050d1a 0%, #0a1525 25%, #0d1a30 50%, #081020 75%, #060e1c 100%)", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Background orbs */}
      <div style={{ position: "fixed", top: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: "rgba(30,60,120,0.1)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: -80, left: -80, width: 400, height: 400, borderRadius: "50%", background: "rgba(20,50,100,0.08)", pointerEvents: "none", zIndex: 0 }} />

      {/* Topbar */}
      <div style={{ background: "rgba(6,12,30,0.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(50,80,140,0.3)", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, height: 58 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src="/Logo.png" alt="QR-Wegn" style={{ height: 30 }} />
          <span style={{ fontSize: 11, color: "#3a5a70", fontWeight: 700, letterSpacing: "0.12em" }}>PARTNER PORTAL</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, color: "#b0cce0", fontWeight: 600, lineHeight: 1.2 }}>{profile?.full_name || "Partner"}</div>
            <div style={{ fontSize: 11, color: "#3a5a70", textTransform: "capitalize" }}>{profile?.role || "Partner"}</div>
          </div>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #1a3a6a, #0d2045)", border: "1.5px solid rgba(80,140,200,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#5ab0f0", flexShrink: 0 }}>
            {initials}
          </div>
          <button onClick={onLogout} style={{ fontSize: 12, color: "#3a5a70", background: "none", border: "none", cursor: "pointer", padding: "6px 0", fontWeight: 500 }}>Sign out</button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 20px 48px", position: "relative", zIndex: 1 }}>

        {/* Welcome */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#ffffff", margin: 0, letterSpacing: "-0.01em" }}>Welcome back, {firstName}</h1>
          <p style={{ fontSize: 14, color: "#4a7090", margin: "5px 0 0" }}>
            {profile?.region ? `${profile.region} · ` : ""}
            <span style={{ textTransform: "capitalize" }}>{profile?.role || "Partner"}</span>
          </p>
        </div>

        {/* Status banner */}
        <div style={{ background: "rgba(232,197,71,0.08)", border: "1px solid rgba(232,197,71,0.22)", borderRadius: 12, padding: "13px 18px", marginBottom: 22, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#e8c547" }}>Onboarding in progress</div>
            <div style={{ fontSize: 12, color: "#8a7030", marginTop: 2 }}>Complete your checklist to become an active partner</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ width: 90, height: 5, background: "rgba(232,197,71,0.18)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #e8c547, #c9a832)", borderRadius: 3, transition: "width 0.4s ease" }} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#e8c547", minWidth: 36, textAlign: "right" }}>{pct}%</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: 22, background: "rgba(4,10,24,0.85)", borderRadius: 10, padding: 3, width: "fit-content", flexWrap: "wrap" }}>
          {BASE_TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "7px 15px", borderRadius: 8, border: "none", cursor: "pointer",
              background: tab === t.id ? "rgba(80,140,210,0.22)" : "transparent",
              color: tab === t.id ? "#8fd0ff" : "#3a5a70",
              fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
              boxShadow: tab === t.id ? "inset 0 0 0 1px rgba(80,140,210,0.28)" : "none",
              transition: "all 0.15s",
            }}>{t.label}</button>
          ))}
        </div>

        {/* HOME */}
        {tab === "home" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            <Card>
              <SectionLabel>ONBOARDING CHECKLIST</SectionLabel>
              {checklist.map(c => (
                <div key={c.id} onClick={() => toggleCheck(c)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid rgba(50,80,140,0.18)", cursor: "pointer", userSelect: "none" }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 5, border: "1.5px solid",
                    borderColor: c.done ? "#5ab0f0" : "rgba(80,130,180,0.28)",
                    background: c.done ? "#5ab0f0" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, transition: "all 0.15s",
                  }}>
                    {c.done && (
                      <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                        <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: 14, color: c.done ? "#3a5a70" : "#b0cce0", textDecoration: c.done ? "line-through" : "none", lineHeight: 1.4 }}>
                    {c.label}
                  </span>
                </div>
              ))}
            </Card>

            <Card>
              <SectionLabel>YOUR PROGRESS</SectionLabel>
              <div style={{ textAlign: "center", padding: "20px 0 12px" }}>
                <div style={{ fontSize: 54, fontWeight: 800, color: "#5ab0f0", lineHeight: 1 }}>{pct}%</div>
                <div style={{ fontSize: 13, color: "#3a5a70", marginTop: 6 }}>{doneCount} of {totalCount} tasks complete</div>
                <div style={{ marginTop: 18, height: 7, background: "rgba(80,130,180,0.12)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #3a9ad9, #2a7ab8)", borderRadius: 4, transition: "width 0.4s ease" }} />
                </div>
              </div>
              <div style={{ marginTop: 18, padding: "12px 14px", background: "rgba(80,140,210,0.07)", borderRadius: 10, border: "1px solid rgba(80,140,210,0.13)", fontSize: 13, color: "#5a8aaa", lineHeight: 1.65 }}>
                Complete onboarding to start bringing businesses onto the QR-Wegn platform and earning commissions.
              </div>
            </Card>
          </div>
        )}

        {/* PROFILE */}
        {tab === "profile" && (
          <Card style={{ maxWidth: 540 }}>
            <SectionLabel>PARTNER INFORMATION</SectionLabel>
            <div>
              <FieldRow label="Full Name" value={profile?.full_name} />
              <FieldRow label="Email" value={profile?.email} />
              <FieldRow label="Region" value={profile?.region} />
              <FieldRow label="Phone" value={profile?.phone} />
              <FieldRow label="Role" value={profile?.role} />
            </div>
            <div style={{ marginTop: 18, fontSize: 12, color: "#2a4050", lineHeight: 1.5 }}>
              To update your profile, contact your QR-Wegn administrator.
            </div>
          </Card>
        )}

        {/* TRAINING */}
        {tab === "training" && (
          <Card>
            <SectionLabel>TRAINING MATERIALS</SectionLabel>
            {training.length === 0 ? (
              <div style={{ color: "#3a5a70", fontSize: 14, padding: "24px 0", textAlign: "center" }}>No training materials available yet.</div>
            ) : training.map(t => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(50,80,140,0.18)", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(80,130,180,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                    {t.type === "video" ? "▶" : "📄"}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#b0cce0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: "#3a5a70", marginTop: 2, fontWeight: 600, letterSpacing: "0.06em" }}>{(t.type || "FILE").toUpperCase()}</div>
                  </div>
                </div>
                <a href={t.file_url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#5ab0f0", background: "rgba(80,160,230,0.1)", border: "1px solid rgba(80,160,230,0.22)", borderRadius: 7, padding: "5px 13px", textDecoration: "none", fontWeight: 600, flexShrink: 0 }}>Open</a>
              </div>
            ))}
          </Card>
        )}

        {/* MATERIALS */}
        {tab === "materials" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
            {materials.length === 0 ? (
              <div style={{ color: "#3a5a70", fontSize: 14, gridColumn: "1 / -1", textAlign: "center", padding: "48px 0" }}>No outreach materials available yet.</div>
            ) : materials.map((m) => (
              <Card key={m.id} style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 26, marginBottom: 10 }}>
                  {m.type === "video" ? "🎥" : m.type === "doc" ? "📝" : "📄"}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#b0cce0", lineHeight: 1.3, marginBottom: 6 }}>{m.title}</div>
                {m.description && <div style={{ fontSize: 12, color: "#3a5a70", lineHeight: 1.55, marginBottom: 8 }}>{m.description}</div>}
                <div style={{ marginBottom: 12 }}>
                  <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#5ab0f0", background: "rgba(80,160,230,0.1)", padding: "3px 9px", borderRadius: 20 }}>
                    {(m.type || "FILE").toUpperCase()}
                  </span>
                </div>
                <a href={m.file_url} target="_blank" rel="noreferrer" style={{ display: "block", marginTop: "auto", textAlign: "center", padding: "8px 0", borderRadius: 8, background: "rgba(80,160,230,0.12)", border: "1px solid rgba(80,160,230,0.25)", color: "#5ab0f0", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                  Download
                </a>
              </Card>
            ))}
          </div>
        )}

        {/* MY PROMOTORS */}
        {tab === "my-promotors" && (() => {
          const activeCount     = promotors.filter(p => p.stage === "Active").length;
          const bizTotal        = promotors.reduce((s, p) => s + (p.businesses_count || 0), 0);
          const pendingComm     = commissions.filter(c => c.status === "pending").reduce((s, c) => s + (Number(c.amount) || 0), 0);

          return (
            <div>
              {/* Summary cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
                {[
                  { label: "Total Promotors",      value: promotors.length,                       color: "#5ab0f0" },
                  { label: "Active Promotors",      value: activeCount,                            color: "#35c060" },
                  { label: "Businesses Onboarded",  value: bizTotal,                               color: "#c080f0" },
                  { label: "Pending Commissions",   value: `$${pendingComm.toLocaleString()}`,     color: "#e8c547" },
                ].map(m => (
                  <Card key={m.label} style={{ padding: "16px 18px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#4a7090", letterSpacing: "0.1em", marginBottom: 8 }}>{m.label.toUpperCase()}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: m.color, lineHeight: 1 }}>{m.value}</div>
                  </Card>
                ))}
              </div>

              {/* Promotor cards */}
              {promotors.length === 0 ? (
                <Card style={{ textAlign: "center", padding: "52px 24px" }}>
                  <div style={{ fontSize: 36, marginBottom: 14 }}>👥</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#b0cce0", marginBottom: 8 }}>No promotors yet</div>
                  <div style={{ fontSize: 13, color: "#4a7090" }}>Share your referral link to recruit sub-partners under you.</div>
                </Card>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                  {promotors.map(p => (
                    <Card key={p.id} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                      {/* Header */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                        <div style={{
                          width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                          background: "linear-gradient(135deg, #1a3a6a, #0d2045)",
                          border: "1.5px solid rgba(80,140,200,0.3)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 14, fontWeight: 700, color: "#5ab0f0",
                        }}>
                          {(p.full_name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#c0d8e8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.full_name || "—"}</div>
                          <div style={{ fontSize: 12, color: "#4a7090", marginTop: 2 }}>{p.territory || "No territory set"}</div>
                        </div>
                      </div>

                      {/* Stage + commission */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <StagePill stage={p.stage || "Identified"} />
                        <span style={{ fontSize: 12, color: "#5a8aaa" }}>
                          {p.commission_rate != null ? `${p.commission_rate}% commission` : "—"}
                        </span>
                      </div>

                      {/* Stats row */}
                      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                        <div style={{ flex: 1, background: "rgba(80,130,180,0.08)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "#5ab0f0" }}>{p.businesses_count || 0}</div>
                          <div style={{ fontSize: 10, color: "#4a7090", marginTop: 2 }}>BUSINESSES</div>
                        </div>
                        <div style={{ flex: 1, background: "rgba(80,130,180,0.08)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "#35c080" }}>{p.email ? "✓" : "—"}</div>
                          <div style={{ fontSize: 10, color: "#4a7090", marginTop: 2 }}>CONTACT</div>
                        </div>
                      </div>

                      {/* View button */}
                      <button style={{
                        marginTop: "auto", width: "100%", padding: "8px 0", borderRadius: 8,
                        background: "rgba(80,160,230,0.1)", border: "1px solid rgba(80,160,230,0.25)",
                        color: "#5ab0f0", fontSize: 13, fontWeight: 600, cursor: "pointer",
                      }}>
                        View →
                      </button>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* COMMISSIONS */}
        {tab === "commissions" && (
          <div>
            <div style={{ marginBottom: 18 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#ffffff", margin: 0 }}>Commissions</h2>
              <p style={{ fontSize: 13, color: "#4a7090", margin: "4px 0 0" }}>Your earnings from referred businesses</p>
            </div>

            {commissionsUnavailable ? (
              <Card style={{ textAlign: "center", padding: "52px 24px" }}>
                <div style={{ fontSize: 36, marginBottom: 14 }}>💰</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#b0cce0", marginBottom: 8 }}>Commission tracking coming soon</div>
                <div style={{ fontSize: 13, color: "#4a7090" }}>Your commission history will appear here once the system is live.</div>
              </Card>
            ) : commissions.length === 0 ? (
              <Card style={{ textAlign: "center", padding: "52px 24px" }}>
                <div style={{ fontSize: 36, marginBottom: 14 }}>💰</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#b0cce0", marginBottom: 8 }}>No commissions recorded yet</div>
                <div style={{ fontSize: 13, color: "#4a7090" }}>Commissions will appear here as businesses you referred go live.</div>
              </Card>
            ) : (
              <Card style={{ padding: 0, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(50,80,140,0.25)" }}>
                      {["Partner / Promotor", "Business", "Amount", "Status", "Date"].map(h => (
                        <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, color: "#4a7090", fontWeight: 700, letterSpacing: "0.1em" }}>
                          {h.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((c, i) => {
                      const isPaid = c.status === "paid";
                      return (
                        <tr key={c.id}
                          style={{ borderBottom: i < commissions.length - 1 ? "1px solid rgba(50,80,140,0.15)" : "none", transition: "background 0.1s" }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(80,140,210,0.05)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <td style={{ padding: "13px 20px", fontSize: 14, fontWeight: 600, color: "#c0d8e8" }}>{c.partner_name || c.promotor_name || "—"}</td>
                          <td style={{ padding: "13px 20px", fontSize: 13, color: "#5a8aaa" }}>{c.business_name || "—"}</td>
                          <td style={{ padding: "13px 20px", fontSize: 13, fontWeight: 700, color: "#ffffff" }}>
                            ${Number(c.amount || 0).toLocaleString()}
                          </td>
                          <td style={{ padding: "13px 20px" }}>
                            <span style={{
                              fontSize: 11, fontWeight: 700,
                              color: isPaid ? "#35c060" : "#e8c547",
                              background: isPaid ? "rgba(53,192,96,0.1)" : "rgba(232,197,71,0.1)",
                              border: `1px solid ${isPaid ? "rgba(53,192,96,0.25)" : "rgba(232,197,71,0.25)"}`,
                              padding: "3px 9px", borderRadius: 20,
                            }}>
                              {isPaid ? "Paid" : "Pending"}
                            </span>
                          </td>
                          <td style={{ padding: "13px 20px", fontSize: 12, color: "#4a7090" }}>
                            {c.created_at ? new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        )}

        {/* LEADS */}
        {tab === "leads" && (
          <Card style={{ maxWidth: 540 }}>
            <SectionLabel>SUBMIT A LEAD</SectionLabel>
            <p style={{ fontSize: 13, color: "#4a7090", marginTop: -4, marginBottom: 20, lineHeight: 1.6 }}>
              Know a restaurant or business that could benefit from QR-Wegn? Submit their details and we&apos;ll follow up.
            </p>

            {leadSuccess && (
              <div style={{ background: "rgba(40,180,80,0.08)", border: "1px solid rgba(40,180,80,0.22)", borderRadius: 10, padding: "12px 16px", marginBottom: 18, fontSize: 13, color: "#35c060", display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
                  <path d="M1 6L5 10L13 1" stroke="#35c060" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Lead submitted successfully!
              </div>
            )}

            {leadError && (
              <div style={{ background: "rgba(220,60,60,0.08)", border: "1px solid rgba(220,60,60,0.3)", borderRadius: 10, padding: "12px 16px", marginBottom: 18, fontSize: 13, color: "#f07070" }}>
                {leadError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { key: "business_name", label: "Business Name", required: true, placeholder: "e.g. Juba Kitchen" },
                { key: "owner_name", label: "Owner / Contact Name", required: false, placeholder: "e.g. James Wani" },
                { key: "phone", label: "Phone Number", required: false, placeholder: "+211 ..." },
                { key: "country", label: "Country", required: false, placeholder: "e.g. South Sudan" },
              ].map(({ key, label, required, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#4a7090", letterSpacing: "0.08em", display: "block", marginBottom: 5 }}>
                    {label.toUpperCase()}{required && <span style={{ color: "#e8c547", marginLeft: 3 }}>*</span>}
                  </label>
                  <input
                    value={lead[key]}
                    onChange={e => setLead(l => ({ ...l, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={inputStyle}
                  />
                </div>
              ))}

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#4a7090", letterSpacing: "0.08em", display: "block", marginBottom: 5 }}>NOTES</label>
                <textarea
                  value={lead.notes}
                  onChange={e => setLead(l => ({ ...l, notes: e.target.value }))}
                  placeholder="Any additional context about this business..."
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              <button
                onClick={submitLead}
                disabled={leadSaving || !lead.business_name.trim()}
                style={{
                  padding: "12px 0",
                  borderRadius: 10,
                  border: "none",
                  background: leadSaving || !lead.business_name.trim()
                    ? "rgba(80,140,210,0.18)"
                    : "linear-gradient(135deg, #3a9ad9, #2a7ab8)",
                  color: leadSaving || !lead.business_name.trim() ? "#3a5a70" : "white",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: leadSaving || !lead.business_name.trim() ? "default" : "pointer",
                  boxShadow: leadSaving || !lead.business_name.trim() ? "none" : "0 4px 16px rgba(42,122,184,0.28)",
                  transition: "all 0.15s",
                }}
              >
                {leadSaving ? "Submitting…" : "Submit Lead"}
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
