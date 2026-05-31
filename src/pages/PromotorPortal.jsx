import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const TABS = [
  { id: "home",      label: "Home" },
  { id: "leads",     label: "Submit Lead" },
  { id: "my-leads",  label: "My Leads" },
];

const emptyLead = { business_name: "", owner_name: "", phone: "", country: "", notes: "" };

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

const inputStyle = {
  width: "100%",
  padding: "11px 13px",
  borderRadius: 9,
  border: "1px solid rgba(50,80,140,0.3)",
  background: "rgba(4,10,24,0.85)",
  color: "#c0d8e8",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function PromotorPortal({ profile, onLogout }) {
  const [tab,          setTabState]    = useState("home");
  const [lead,         setLead]        = useState(emptyLead);
  const [leadSaving,   setLeadSaving]  = useState(false);
  const [leadSuccess,  setLeadSuccess] = useState(false);
  const [leadError,    setLeadError]   = useState("");
  const [myLeads,      setMyLeads]     = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsLoaded,  setLeadsLoaded] = useState(false);
  const [myPayouts,    setMyPayouts]   = useState([]);
  const [demoLinks,    setDemoLinks]   = useState([]);

  const initials  = profile?.full_name
    ? profile.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "P";
  const firstName = profile?.full_name?.split(" ")[0] || "Promotor";

  useEffect(() => {
    supabase.from("leads").select("*").order("created_at", { ascending: false }).then(({ data, error }) => {
      if (!error) { setMyLeads(data || []); setLeadsLoaded(true); }
    });
    supabase.from("payouts").select("*").order("paid_on", { ascending: false }).then(({ data, error }) => {
      if (!error) setMyPayouts(data || []);
    });
    supabase.from("demo_links").select("*").order("created_at", { ascending: false }).then(({ data, error }) => {
      if (!error) setDemoLinks(data || []);
    });
  }, []);

  const switchTab = async (id) => {
    setTabState(id);
    if (id === "my-leads" && !leadsLoaded) {
      setLeadsLoading(true);
      const { data } = await supabase
        .from("leads").select("*").order("created_at", { ascending: false });
      setMyLeads(data || []);
      setLeadsLoaded(true);
      setLeadsLoading(false);
    }
  };

  const submitLead = async () => {
    if (!lead.business_name.trim() || !profile?.id) return;
    setLeadSaving(true);
    setLeadError("");

    const { data: { user } } = await supabase.auth.getUser();
    const { data: profileRow } = await supabase
      .from("profiles").select("promotor_id").eq("id", user.id).single();

    if (!profileRow?.promotor_id) {
      setLeadSaving(false);
      setLeadError("Your account isn't linked to a promotor record. Contact admin.");
      return;
    }

    const { error } = await supabase.from("leads").insert({
      submitted_by_promotor_id: profileRow.promotor_id,
      business_name: lead.business_name.trim(),
      contact_name:  lead.owner_name.trim(),
      phone:         lead.phone.trim(),
      country:       lead.country.trim(),
      notes:         lead.notes.trim(),
    });
    setLeadSaving(false);
    if (error) {
      console.error("submitLead error:", error);
      setLeadError(error.message || "Failed to submit lead. Please try again.");
      return;
    }
    setLead(emptyLead);
    setLeadsLoaded(false);
    setLeadSuccess(true);
    setTimeout(() => setLeadSuccess(false), 3500);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #050d1a 0%, #0a1525 25%, #0d1a30 50%, #081020 75%, #060e1c 100%)", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ position: "fixed", top: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: "rgba(30,60,120,0.1)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: -80, left: -80, width: 400, height: 400, borderRadius: "50%", background: "rgba(20,50,100,0.08)", pointerEvents: "none", zIndex: 0 }} />

      {/* Topbar */}
      <div style={{ background: "rgba(6,12,30,0.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(50,80,140,0.3)", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, height: 58 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src="/Logo.png" alt="QR-Wegn" style={{ height: 30 }} />
          <span style={{ fontSize: 11, color: "#3a5a70", fontWeight: 700, letterSpacing: "0.12em" }}>PROMOTOR PORTAL</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, color: "#b0cce0", fontWeight: 600, lineHeight: 1.2 }}>{profile?.full_name || "Promotor"}</div>
            <div style={{ fontSize: 11, color: "#3a5a70" }}>Promotor</div>
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
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#ffffff", margin: 0, letterSpacing: "-0.01em" }}>Welcome, {firstName}</h1>
          <p style={{ fontSize: 14, color: "#4a7090", margin: "5px 0 0" }}>Promotor</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: 22, background: "rgba(4,10,24,0.85)", borderRadius: 10, padding: 3, width: "fit-content" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => switchTab(t.id)} style={{
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
          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 540 }}>
            {(() => {
              const EARNING_STATUSES = ["signed", "active"];
              const owedByCurrency = {};
              myLeads.forEach(l => {
                if (!EARNING_STATUSES.includes(l.status)) return;
                if (l.monthly_value == null || l.promotor_pct == null) return;
                const cur = l.currency || "USD";
                owedByCurrency[cur] = (owedByCurrency[cur] || 0) + l.monthly_value * l.promotor_pct / 100;
              });
              const paidByCurrency = {};
              myPayouts.forEach(p => {
                const cur = p.currency || "USD";
                paidByCurrency[cur] = (paidByCurrency[cur] || 0) + Number(p.amount);
              });
              const allCurrencies = [...new Set([...Object.keys(owedByCurrency), ...Object.keys(paidByCurrency)])];
              const earningRows = allCurrencies.map(cur => ({
                currency: cur,
                owed: owedByCurrency[cur] || 0,
                paid: paidByCurrency[cur] || 0,
                balance: (owedByCurrency[cur] || 0) - (paidByCurrency[cur] || 0),
              }));
              return (
                <Card>
                  <SectionLabel>MY EARNINGS</SectionLabel>
                  {earningRows.length === 0 ? (
                    <p style={{ fontSize: 14, color: "#3a5a70", margin: 0 }}>No earnings yet.</p>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(50,80,140,0.35)" }}>
                          {["Currency", "Owed", "Paid", "Balance"].map(h => (
                            <th key={h} style={{ padding: "7px 12px", textAlign: "left", fontSize: 11, color: "#4a7090", fontWeight: 700, letterSpacing: "0.08em" }}>
                              {h.toUpperCase()}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {earningRows.map(r => {
                          const balanceColor = r.balance > 0 ? "#e8c547" : "#7ac77a";
                          return (
                            <tr key={r.currency} style={{ borderBottom: "1px solid rgba(50,80,140,0.14)" }}>
                              <td style={{ padding: "10px 12px", fontSize: 13, color: "#7ab0cc" }}>{r.currency}</td>
                              <td style={{ padding: "10px 12px", fontSize: 13, color: "#a0c8e8", whiteSpace: "nowrap" }}>{r.currency} {r.owed.toFixed(2)}</td>
                              <td style={{ padding: "10px 12px", fontSize: 13, color: "#a0c8e8", whiteSpace: "nowrap" }}>{r.currency} {r.paid.toFixed(2)}</td>
                              <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 700, color: balanceColor, whiteSpace: "nowrap" }}>{r.currency} {r.balance.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </Card>
              );
            })()}
            <Card>
              <SectionLabel>DEMO LINKS</SectionLabel>
              <p style={{ fontSize: 13, color: "#4a7090", marginTop: -8, marginBottom: 14 }}>Open or share these with prospects.</p>
              {demoLinks.length === 0 ? (
                <p style={{ fontSize: 14, color: "#3a5a70", margin: 0 }}>No demos available yet.</p>
              ) : demoLinks.map(d => (
                <div key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(50,80,140,0.18)", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#c0d8e8" }}>{d.name}</div>
                    {d.description && <div style={{ fontSize: 12, color: "#4a7090", marginTop: 2 }}>{d.description}</div>}
                  </div>
                  <a href={d.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#5ab0f0", textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>Open ↗</a>
                </div>
              ))}
            </Card>
            <Card>
              <SectionLabel>WELCOME</SectionLabel>
              <p style={{ fontSize: 15, color: "#b0cce0", margin: "0 0 10px", lineHeight: 1.6 }}>
                Hi {firstName}, glad you're here.
              </p>
              <p style={{ fontSize: 14, color: "#4a7090", margin: 0, lineHeight: 1.7 }}>
                Submit restaurants you've signed. You'll see them under{" "}
                <strong style={{ color: "#5ab0f0" }}>My Leads</strong>.
              </p>
            </Card>
          </div>
        )}

        {/* SUBMIT LEAD */}
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
                { key: "business_name", label: "Business Name",       required: true,  placeholder: "e.g. Juba Kitchen" },
                { key: "owner_name",    label: "Owner / Contact Name", required: false, placeholder: "e.g. James Wani" },
                { key: "phone",         label: "Phone Number",         required: false, placeholder: "+211 ..." },
                { key: "country",       label: "Country",              required: false, placeholder: "e.g. South Sudan" },
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
                  padding: "12px 0", borderRadius: 10, border: "none",
                  background: leadSaving || !lead.business_name.trim()
                    ? "rgba(80,140,210,0.18)"
                    : "linear-gradient(135deg, #3a9ad9, #2a7ab8)",
                  color: leadSaving || !lead.business_name.trim() ? "#3a5a70" : "white",
                  fontSize: 14, fontWeight: 700,
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

        {/* MY LEADS */}
        {tab === "my-leads" && (
          <Card>
            <SectionLabel>MY LEADS</SectionLabel>
            {leadsLoading ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#4a7090", fontSize: 14 }}>Loading…</div>
            ) : myLeads.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ fontSize: 15, color: "#3a5a70" }}>No leads yet.</div>
                <div style={{ fontSize: 13, color: "#2a4050", marginTop: 6 }}>Submit your first lead from the Submit Lead tab.</div>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(50,80,140,0.35)" }}>
                      {["Business", "Contact", "Status", "Date"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: "#4a7090", fontWeight: 700, letterSpacing: "0.08em" }}>
                          {h.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {myLeads.map((l, i) => (
                      <tr key={l.id}
                        style={{ borderBottom: i < myLeads.length - 1 ? "1px solid rgba(50,80,140,0.14)" : "none" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(80,140,210,0.04)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 600, color: "#ffffff" }}>{l.business_name}</td>
                        <td style={{ padding: "12px 14px", fontSize: 14, color: "#b0cce0" }}>{l.contact_name || "—"}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "rgba(100,160,220,0.18)", color: "#5ab0f0", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            {l.status || "new"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: 13, color: "#4a7090", whiteSpace: "nowrap" }}>{fmtDate(l.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

      </div>
    </div>
  );
}
