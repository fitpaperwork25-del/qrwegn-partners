import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import OnboardingChecklist from "../components/OnboardingChecklist";

const TABS = [
  { id: "home",        label: "Home"         },
  { id: "leads",       label: "Submit Lead"  },
  { id: "my-leads",    label: "My Leads"     },
  { id: "commissions", label: "Commissions"  },
  { id: "training",    label: "Training"     },
  { id: "materials",   label: "Materials"    },
];

const DEFAULT_TRAINING = [
  {
    id: "platform-overview",
    title: "Platform Overview",
    type: "guide",
    description:
      "QRWegn helps restaurants and cafés accept QR orders. QRBooker helps salons and barbershops manage bookings.",
  },
  {
    id: "qrwegn-pitch",
    title: "How to Pitch QRWegn",
    type: "sales",
    description:
      "Lead with the problem: slow ordering, staff pressure, missed orders, and poor customer flow. Then show scan → order → kitchen.",
  },
  {
    id: "qrbooker-pitch",
    title: "How to Pitch QRBooker",
    type: "sales",
    description:
      "Focus on appointment control, barber/chair schedules, fewer missed calls, and cleaner customer booking.",
  },
  {
    id: "commission-structure",
    title: "Commission Structure",
    type: "money",
    description:
      "Commissions are based on the business plan, monthly value, partner percentage, promotor percentage, and payout records.",
  },
  {
    id: "demo-links-guide",
    title: "Where Demo Links Live",
    type: "demo",
    description:
      "Demo links are shown on the Home page. Use them to show prospects live examples before they commit.",
  },
];

const DEFAULT_MATERIALS = [
  {
    id: "restaurant-one-pager",
    title: "Restaurant Pitch One-Pager",
    type: "pitch",
    description:
      "Simple talking points for restaurants, cafés, hotels, and food courts.",
  },
  {
    id: "barber-one-pager",
    title: "Barbershop Pitch One-Pager",
    type: "pitch",
    description:
      "Simple talking points for barbershops, salons, beauty shops, and appointment-based businesses.",
  },
  {
    id: "whatsapp-script",
    title: "WhatsApp Outreach Script",
    type: "script",
    description:
      "Short message a partner or promotor can send to a business owner.",
  },
  {
    id: "facebook-copy",
    title: "Facebook / Social Copy",
    type: "social",
    description:
      "Ready-to-edit post copy for promoting QRWegn and QRBooker online.",
  },
];

const emptyLead = { business_name: "", owner_name: "", phone: "", country: "", plan: "", notes: "" };

const PLAN_VALUES = { Starter: 49, Pro: 99, Enterprise: 199 };

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
  const [promotorId,   setPromotorId]  = useState(null);
  const [demoLinks,    setDemoLinks]   = useState([]);
  const [training,      setTraining]     = useState(DEFAULT_TRAINING);
  const [materials,     setMaterials]    = useState(DEFAULT_MATERIALS);
  const [selectedLead,  setSelectedLead] = useState(null);

  const initials  = profile?.full_name
    ? profile.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "P";
  const firstName = profile?.full_name?.split(" ")[0] || "Promotor";

  useEffect(() => {
    const init = async () => {
      // 1. Resolve this user's promotor_id from the profiles table
      const { data: { user } } = await supabase.auth.getUser();
      let pId = null;
      if (user) {
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("promotor_id")
          .eq("id", user.id)
          .single();
        pId = profileRow?.promotor_id ?? null;
        setPromotorId(pId);
      }

      // 2. Leads — filtered to this promotor only
      if (pId) {
        supabase
          .from("leads")
          .select("*")
          .eq("submitted_by_promotor_id", pId)
          .order("created_at", { ascending: false })
          .then(({ data, error }) => {
            if (!error) { setMyLeads(data || []); setLeadsLoaded(true); }
          });

        // 3. Payouts — filtered to this promotor only
        supabase
          .from("payouts")
          .select("*")
          .eq("beneficiary_type", "promotor")
          .eq("beneficiary_id", pId)
          .order("paid_on", { ascending: false })
          .then(({ data, error }) => {
            if (!error) setMyPayouts(data || []);
          });
      } else {
        // No promotor link yet — show empty rather than all rows
        setLeadsLoaded(true);
      }

      // 4. Unfiltered global content
      supabase.from("demo_links").select("*").order("created_at", { ascending: false }).then(({ data, error }) => {
        if (!error) setDemoLinks(data || []);
      });
      supabase.from("training_materials").select("*").order("created_at", { ascending: false }).then(({ data, error }) => {
        if (!error && data?.length) setTraining(data);
      });
      supabase.from("sales_materials").select("*").order("created_at", { ascending: false }).then(({ data, error }) => {
        if (!error && data?.length) setMaterials(data);
      });
    };

    init();
  }, []);

  const switchTab = async (id) => {
    setTabState(id);
    if (id === "my-leads" && !leadsLoaded) {
      setLeadsLoading(true);
      if (promotorId) {
        const { data } = await supabase
          .from("leads")
          .select("*")
          .eq("submitted_by_promotor_id", promotorId)
          .order("created_at", { ascending: false });
        setMyLeads(data || []);
      }
      setLeadsLoaded(true);
      setLeadsLoading(false);
    }
  };

  const submitLead = async () => {
    if (!lead.business_name.trim() || !lead.plan || !profile?.id) return;
    setLeadSaving(true);
    setLeadError("");

    if (!promotorId) {
      setLeadSaving(false);
      setLeadError("Your account isn't linked to a promotor record. Contact admin.");
      return;
    }

    const { error } = await supabase.from("leads").insert({
      submitted_by_promotor_id: promotorId,
      business_name:  lead.business_name.trim(),
      contact_name:   lead.owner_name.trim(),
      phone:          lead.phone.trim(),
      country:        lead.country.trim(),
      notes:          lead.notes.trim(),
      plan:           lead.plan,
      monthly_value:  PLAN_VALUES[lead.plan] ?? null,
      currency:       "USD",
      promotor_pct:   10,
      partner_pct:    20,
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
            <OnboardingChecklist supabase={supabase} userId={profile.id} role="promotor" />
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
                <label style={{ fontSize: 11, fontWeight: 700, color: "#4a7090", letterSpacing: "0.08em", display: "block", marginBottom: 5 }}>
                  PLAN<span style={{ color: "#e8c547", marginLeft: 3 }}>*</span>
                </label>
                <select
                  value={lead.plan}
                  onChange={e => setLead(l => ({ ...l, plan: e.target.value }))}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="">Select a plan…</option>
                  <option value="Starter">Starter — $49/mo</option>
                  <option value="Pro">Pro — $99/mo</option>
                  <option value="Enterprise">Enterprise — $199/mo</option>
                </select>
              </div>

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
                disabled={leadSaving || !lead.business_name.trim() || !lead.plan}
                style={{
                  padding: "12px 0", borderRadius: 10, border: "none",
                  background: leadSaving || !lead.business_name.trim() || !lead.plan
                    ? "rgba(80,140,210,0.18)"
                    : "linear-gradient(135deg, #3a9ad9, #2a7ab8)",
                  color: leadSaving || !lead.business_name.trim() || !lead.plan ? "#3a5a70" : "white",
                  fontSize: 14, fontWeight: 700,
                  cursor: leadSaving || !lead.business_name.trim() || !lead.plan ? "default" : "pointer",
                  boxShadow: leadSaving || !lead.business_name.trim() || !lead.plan ? "none" : "0 4px 16px rgba(42,122,184,0.28)",
                  transition: "all 0.15s",
                }}
              >
                {leadSaving ? "Submitting…" : "Submit Lead"}
              </button>
            </div>
          </Card>
        )}

        {/* MY LEADS */}
        {tab === "my-leads" && !selectedLead && (
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
                      {["Business", "Contact", "Status", "Plan", "Monthly Value", "My Commission", "Date"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: "#4a7090", fontWeight: 700, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
                          {h.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {myLeads.map((l, i) => (
                      <tr key={l.id}
                        onClick={() => setSelectedLead(l)}
                        style={{ borderBottom: i < myLeads.length - 1 ? "1px solid rgba(50,80,140,0.14)" : "none", cursor: "pointer" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(80,140,210,0.07)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 600, color: "#ffffff" }}>{l.business_name}</td>
                        <td style={{ padding: "12px 14px", fontSize: 14, color: "#b0cce0" }}>{l.contact_name || "—"}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "rgba(100,160,220,0.18)", color: "#5ab0f0", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            {l.status || "new"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: 13, color: "#a0c8e8" }}>{l.plan || "—"}</td>
                        <td style={{ padding: "12px 14px", fontSize: 13, color: "#c8a84a", whiteSpace: "nowrap" }}>
                          {l.monthly_value != null ? `${l.currency || "USD"} ${Number(l.monthly_value).toFixed(2)}` : "—"}
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: 13, color: "#a0c8e8", whiteSpace: "nowrap" }}>
                          {l.monthly_value != null && l.promotor_pct != null
                            ? `${l.currency || "USD"} ${(l.monthly_value * l.promotor_pct / 100).toFixed(2)}`
                            : "—"}
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

        {/* LEAD DETAIL */}
        {tab === "my-leads" && selectedLead && (
          <div style={{ maxWidth: 580 }}>
            <button
              onClick={() => setSelectedLead(null)}
              style={{
                display: "flex", alignItems: "center", gap: 6, marginBottom: 18,
                background: "none", border: "none", cursor: "pointer",
                color: "#5ab0f0", fontSize: 13, fontWeight: 700, padding: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8L10 13" stroke="#5ab0f0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to My Leads
            </button>

            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", marginBottom: 4 }}>
                    {selectedLead.business_name}
                  </div>
                  <div style={{ fontSize: 13, color: "#4a7090" }}>
                    Submitted {fmtDate(selectedLead.created_at)}
                  </div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20,
                  background: "rgba(100,160,220,0.18)", color: "#5ab0f0",
                  textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0,
                }}>
                  {selectedLead.status || "new"}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                {[
                  { label: "Contact Name",    value: selectedLead.contact_name },
                  { label: "Phone",           value: selectedLead.phone },
                  { label: "Country",         value: selectedLead.country },
                  { label: "Plan",            value: selectedLead.plan },
                  { label: "Monthly Value",   value: selectedLead.monthly_value != null ? `${selectedLead.currency || "USD"} ${Number(selectedLead.monthly_value).toFixed(2)}` : null },
                  { label: "Follow-up Date",  value: fmtDate(selectedLead.follow_up_date) === "—" ? null : fmtDate(selectedLead.follow_up_date) },
                  { label: "Submitted",       value: fmtDate(selectedLead.created_at) },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    display: "flex", padding: "13px 0",
                    borderBottom: "1px solid rgba(50,80,140,0.18)",
                  }}>
                    <div style={{ width: 140, fontSize: 11, fontWeight: 700, color: "#4a7090", letterSpacing: "0.07em", flexShrink: 0, paddingTop: 1 }}>
                      {label.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 14, color: value ? "#c0d8e8" : "#3a5060", fontStyle: value ? "normal" : "italic" }}>
                      {value || "Not set"}
                    </div>
                  </div>
                ))}

                {/* Notes — full width block */}
                <div style={{ padding: "13px 0" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#4a7090", letterSpacing: "0.07em", marginBottom: 8 }}>
                    NOTES
                  </div>
                  <div style={{
                    fontSize: 14, color: selectedLead.notes ? "#c0d8e8" : "#3a5060",
                    fontStyle: selectedLead.notes ? "normal" : "italic",
                    lineHeight: 1.7, whiteSpace: "pre-wrap",
                  }}>
                    {selectedLead.notes || "No notes"}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* COMMISSIONS */}
        {tab === "commissions" && (() => {
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
          const summaryRows = allCurrencies.map(cur => ({
            currency: cur,
            owed: owedByCurrency[cur] || 0,
            paid: paidByCurrency[cur] || 0,
            balance: (owedByCurrency[cur] || 0) - (paidByCurrency[cur] || 0),
          }));
          const commissionLeads = myLeads.filter(l => l.monthly_value != null && l.promotor_pct != null);

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Summary */}
              <Card>
                <SectionLabel>EARNINGS SUMMARY</SectionLabel>
                {summaryRows.length === 0 ? (
                  <p style={{ fontSize: 14, color: "#3a5a70", margin: 0 }}>No commissions yet.</p>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(50,80,140,0.35)" }}>
                        {["Currency", "Total Earned", "Total Paid", "Balance"].map(h => (
                          <th key={h} style={{ padding: "7px 12px", textAlign: "left", fontSize: 11, color: "#4a7090", fontWeight: 700, letterSpacing: "0.08em" }}>
                            {h.toUpperCase()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {summaryRows.map(r => (
                        <tr key={r.currency} style={{ borderBottom: "1px solid rgba(50,80,140,0.14)" }}>
                          <td style={{ padding: "10px 12px", fontSize: 13, color: "#7ab0cc" }}>{r.currency}</td>
                          <td style={{ padding: "10px 12px", fontSize: 13, color: "#a0c8e8", whiteSpace: "nowrap" }}>{r.currency} {r.owed.toFixed(2)}</td>
                          <td style={{ padding: "10px 12px", fontSize: 13, color: "#a0c8e8", whiteSpace: "nowrap" }}>{r.currency} {r.paid.toFixed(2)}</td>
                          <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 700, color: r.balance > 0 ? "#e8c547" : "#7ac77a", whiteSpace: "nowrap" }}>{r.currency} {r.balance.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>

              {/* Per-lead commission */}
              <Card>
                <SectionLabel>COMMISSION BY LEAD</SectionLabel>
                {commissionLeads.length === 0 ? (
                  <p style={{ fontSize: 14, color: "#3a5a70", margin: 0 }}>No commissions yet.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(50,80,140,0.35)" }}>
                          {["Business", "Status", "Monthly Value", "My Commission"].map(h => (
                            <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, color: "#4a7090", fontWeight: 700, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
                              {h.toUpperCase()}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {commissionLeads.map((l, i) => (
                          <tr key={l.id} style={{ borderBottom: i < commissionLeads.length - 1 ? "1px solid rgba(50,80,140,0.14)" : "none" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(80,140,210,0.07)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            <td style={{ padding: "11px 12px", fontSize: 14, fontWeight: 600, color: "#ffffff" }}>{l.business_name}</td>
                            <td style={{ padding: "11px 12px" }}>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "rgba(100,160,220,0.18)", color: "#5ab0f0", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                {l.status || "new"}
                              </span>
                            </td>
                            <td style={{ padding: "11px 12px", fontSize: 13, color: "#c8a84a", whiteSpace: "nowrap" }}>
                              {l.currency || "USD"} {Number(l.monthly_value).toFixed(2)}
                            </td>
                            <td style={{ padding: "11px 12px", fontSize: 13, fontWeight: 600, color: EARNING_STATUSES.includes(l.status) ? "#a0c8e8" : "#4a7090", whiteSpace: "nowrap" }}>
                              {l.currency || "USD"} {(l.monthly_value * l.promotor_pct / 100).toFixed(2)}
                              {!EARNING_STATUSES.includes(l.status) && (
                                <span style={{ fontSize: 10, color: "#3a5a70", marginLeft: 6 }}>(pending)</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              {/* Payout history */}
              <Card>
                <SectionLabel>PAYOUT HISTORY</SectionLabel>
                {myPayouts.length === 0 ? (
                  <p style={{ fontSize: 14, color: "#3a5a70", margin: 0 }}>No payouts recorded yet.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(50,80,140,0.35)" }}>
                          {["Date", "Amount", "Note"].map(h => (
                            <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, color: "#4a7090", fontWeight: 700, letterSpacing: "0.08em" }}>
                              {h.toUpperCase()}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {myPayouts.map((p, i) => (
                          <tr key={p.id} style={{ borderBottom: i < myPayouts.length - 1 ? "1px solid rgba(50,80,140,0.14)" : "none" }}>
                            <td style={{ padding: "11px 12px", fontSize: 13, color: "#7ab0cc", whiteSpace: "nowrap" }}>{fmtDate(p.paid_on)}</td>
                            <td style={{ padding: "11px 12px", fontSize: 13, fontWeight: 700, color: "#35c060", whiteSpace: "nowrap" }}>{p.currency || "USD"} {Number(p.amount).toFixed(2)}</td>
                            <td style={{ padding: "11px 12px", fontSize: 13, color: "#7ab0cc" }}>{p.note || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

            </div>
          );
        })()}

        {/* TRAINING */}
        {tab === "training" && (
          <div>
            <Card style={{ marginBottom: 16 }}>
              <SectionLabel>TRAINING</SectionLabel>
              <h2 style={{ color: "#ffffff", fontSize: 20, margin: "0 0 8px" }}>
                Promotor Enablement
              </h2>
              <p style={{ color: "#5a8aaa", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                Use this section to understand the products, explain the value, show demos,
                and understand how commissions are earned.
              </p>
            </Card>

            <div style={{ display: "grid", gap: 14 }}>
              {training.map((item) => (
                <Card key={item.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#c0d8e8", marginBottom: 6 }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 13, color: "#5a8aaa", lineHeight: 1.7 }}>
                        {item.description}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 800, color: "#5ab0f0",
                      background: "rgba(80,160,230,0.1)", border: "1px solid rgba(80,160,230,0.22)",
                      borderRadius: 20, padding: "4px 10px",
                      textTransform: "uppercase", whiteSpace: "nowrap",
                    }}>
                      {item.type || "guide"}
                    </span>
                  </div>

                  {item.file_url && (
                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: "inline-block", marginTop: 14, color: "#5ab0f0", fontSize: 13, fontWeight: 700, textDecoration: "none" }}
                    >
                      Open training ↗
                    </a>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* MATERIALS */}
        {tab === "materials" && (
          <div>
            <Card style={{ marginBottom: 16 }}>
              <SectionLabel>SALES MATERIALS</SectionLabel>
              <h2 style={{ color: "#ffffff", fontSize: 20, margin: "0 0 8px" }}>
                Assets for Outreach
              </h2>
              <p style={{ color: "#5a8aaa", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                Use these cards for pitch sheets, scripts, social posts, and customer-facing materials.
              </p>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
              {materials.map((item) => (
                <Card key={item.id} style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: 26, marginBottom: 10 }}>
                    {item.type === "script" ? "💬"
                      : item.type === "social" ? "📣"
                      : item.type === "pitch"  ? "📄"
                      : "📁"}
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 800, color: "#b0cce0", lineHeight: 1.3, marginBottom: 8 }}>
                    {item.title}
                  </div>

                  <div style={{ fontSize: 12, color: "#5a8aaa", lineHeight: 1.6, marginBottom: 12 }}>
                    {item.description}
                  </div>

                  <span style={{
                    display: "inline-block", width: "fit-content",
                    fontSize: 10, fontWeight: 800, letterSpacing: "0.08em",
                    color: "#5ab0f0", background: "rgba(80,160,230,0.1)",
                    padding: "3px 9px", borderRadius: 20,
                    textTransform: "uppercase", marginBottom: 14,
                  }}>
                    {item.type || "material"}
                  </span>

                  {item.file_url ? (
                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "block", marginTop: "auto", textAlign: "center",
                        padding: "8px 0", borderRadius: 8,
                        background: "rgba(80,160,230,0.12)", border: "1px solid rgba(80,160,230,0.25)",
                        color: "#5ab0f0", fontSize: 13, fontWeight: 700, textDecoration: "none",
                      }}
                    >
                      Open
                    </a>
                  ) : (
                    <div style={{ marginTop: "auto", fontSize: 12, color: "#3a5a70" }}>
                      Admin can attach a file later.
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
