import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// ── Brand ──────────────────────────────────────────────────────────────────
const NAVY = "#0B1739";
const GOLD = "#E8C547";

// ── Navigation ─────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard",   label: "Dashboard",   icon: "⊞", target: null        },
  { id: "leads",       label: "Leads",       icon: "◈", target: null        },
  { id: "partners",    label: "Partners",    icon: "◇", target: "partners"  },
  { id: "clients",     label: "Clients",     icon: "◉", target: null        },
  { id: "commissions", label: "Commissions", icon: "◎", target: null        },
  { id: "payouts",     label: "Payouts",     icon: "⊙", target: null        },
  { id: "training",    label: "Training",    icon: "◎", target: "training"  },
  { id: "analytics",   label: "Analytics",   icon: "▦", target: null        },
  { id: "reports",     label: "Reports",     icon: "◧", target: null        },
  { id: "resources",   label: "Resources",   icon: "◇", target: "materials" },
];

// ── Lead status config ─────────────────────────────────────────────────────
const SC = {
  new:       { text: "#2563eb", bg: "#eff6ff" },
  contacted: { text: "#0891b2", bg: "#ecfeff" },
  demo:      { text: "#7c3aed", bg: "#f5f3ff" },
  signed:    { text: "#d97706", bg: "#fffbeb" },
  active:    { text: "#16a34a", bg: "#f0fdf4" },
  churned:   { text: "#6b7280", bg: "#f9fafb" },
};
const EARN = ["signed", "active"];

// ── Helpers ────────────────────────────────────────────────────────────────
const usd  = (n) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`;
const fmtD = (iso) => !iso ? "—" : new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const inits = (n = "") => n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

// ── Data sources — untouched ───────────────────────────────────────────────
export default function LightDashboard({ navigate, onLogout, profile }) {
  const [partners,  setPartners]  = useState([]);
  const [leads,     setLeads]     = useState([]);
  const [promotors, setPromotors] = useState([]);
  const [loading,   setLoading]   = useState(true);

  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const today     = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  useEffect(() => {
    (async () => {
      const [pRes, lRes, prRes] = await Promise.all([
        supabase.from("partners").select("*").order("created_at", { ascending: false }),
        supabase
          .from("leads")
          .select("*, submitted_by_partner:partners!leads_submitted_by_partner_id_fkey(full_name)")
          .order("created_at", { ascending: false }),
        supabase.from("promotors").select("*"),
      ]);
      if (!pRes.error)  setPartners(pRes.data  || []);
      if (!lRes.error)  setLeads(lRes.data     || []);
      if (!prRes.error) setPromotors(prRes.data || []);
      setLoading(false);
    })();
  }, []);

  // ── Metrics ────────────────────────────────────────────────────────────
  const earnLeads   = leads.filter((l) => EARN.includes(l.status));
  const mrr         = earnLeads.filter((l) => l.monthly_value).reduce((s, l) => s + Number(l.monthly_value), 0);
  const activeCount = leads.filter((l) => l.status === "active").length;
  const signedCount = leads.filter((l) => l.status === "signed").length;
  const pipelineVal = leads.filter((l) => l.status !== "churned" && l.monthly_value).reduce((s, l) => s + Number(l.monthly_value), 0);
  const commsDue    = earnLeads.filter((l) => l.monthly_value && l.partner_pct).reduce((s, l) => s + l.monthly_value * l.partner_pct / 100, 0);
  const convRate    = leads.length > 0 ? Math.round(((signedCount + activeCount) / leads.length) * 100) : 0;

  const topPromotors = promotors
    .map((pr) => {
      const owed = leads
        .filter((l) => l.submitted_by_promotor_id === pr.id && EARN.includes(l.status) && l.monthly_value && l.promotor_pct)
        .reduce((s, l) => s + l.monthly_value * l.promotor_pct / 100, 0);
      return { ...pr, owed };
    })
    .filter((pr) => pr.owed > 0)
    .sort((a, b) => b.owed - a.owed)
    .slice(0, 5);

  const recentLeads = leads.slice(0, 8);

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ fontSize: 14, color: "#9ca3af", letterSpacing: "0.05em" }}>Loading…</div>
      </div>
    );
  }

  // ── Shared styles ──────────────────────────────────────────────────────
  const card = {
    background: "#ffffff",
    borderRadius: 20,
    border: "1px solid #f1f5f9",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
  };

  const sectionLabel = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#9ca3af",
    marginBottom: 24,
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f8fafc", fontFamily: "system-ui,-apple-system,Segoe UI,sans-serif" }}>

      {/* ─────────────── SIDEBAR ─────────────────────────────────────── */}
      <aside style={{ width: 184, background: NAVY, display: "flex", flexDirection: "column", flexShrink: 0 }}>

        {/* Logo */}
        <div style={{ padding: "28px 20px 22px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <img src="/Logo.png" alt="QR-Wegn" style={{ height: 24 }} />
          <div style={{ marginTop: 8, fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: "rgba(255,255,255,0.2)" }}>
            PARTNER NETWORK
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          {NAV.map((item) => {
            const active = item.id === "dashboard";
            return (
              <button
                key={item.id}
                onClick={() => item.target && navigate(item.target)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 10, marginBottom: 2,
                  border: "none", cursor: item.target ? "pointer" : "default",
                  background: active ? `${GOLD}15` : "transparent",
                  color: active ? GOLD : "rgba(255,255,255,0.4)",
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  textAlign: "left", transition: "all 0.15s",
                  borderLeft: active ? `2px solid ${GOLD}` : "2px solid transparent",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.75)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
              >
                <span style={{ width: 16, textAlign: "center", fontSize: 14 }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ margin: "0 10px 16px", padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${GOLD}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: GOLD, flexShrink: 0 }}>
              {inits(profile?.full_name)}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {profile?.full_name || "Admin"}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Admin</div>
            </div>
            <button onClick={onLogout} title="Sign out"
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "rgba(255,255,255,0.25)", flexShrink: 0, padding: 0 }}
              onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.25)"}>
              ↩
            </button>
          </div>
        </div>
      </aside>

      {/* ─────────────── MAIN ────────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 1600, margin: "0 auto", padding: "44px 52px 60px" }}>

          {/* ── Header ──────────────────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 44 }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
                {greeting}, {firstName} 👋
              </h1>
              <p style={{ fontSize: 15, color: "#94a3b8", marginTop: 8, marginBottom: 0 }}>
                Here's what's happening in your network today.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              <div style={{ fontSize: 13, color: "#94a3b8", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "10px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                {today}
              </div>
              <button
                onClick={() => navigate("partners")}
                style={{ fontSize: 13, fontWeight: 700, padding: "11px 22px", borderRadius: 12, border: "none", background: NAVY, color: "#fff", cursor: "pointer", boxShadow: "0 2px 8px rgba(11,23,57,0.25)", transition: "opacity 0.15s" }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
                + Add Lead
              </button>
            </div>
          </div>

          {/* ── KPI Cards ───────────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 32 }}>
            {[
              {
                label: "Monthly Recurring Revenue",
                value: usd(mrr),
                sub:   `${earnLeads.length} earning leads`,
                accent: GOLD,
                valueColor: "#0f172a",
              },
              {
                label: "Active Clients",
                value: String(activeCount),
                sub:   `${signedCount} signed · ${leads.length} total`,
                accent: "#22c55e",
                valueColor: "#0f172a",
              },
              {
                label: "Commissions Due",
                value: usd(commsDue),
                sub:   `across ${partners.length} partners`,
                accent: GOLD,
                valueColor: "#0f172a",
              },
              {
                label: "Pipeline Value",
                value: usd(pipelineVal),
                sub:   `${leads.filter((l) => l.status !== "churned").length} open leads`,
                accent: "#3b82f6",
                valueColor: "#0f172a",
              },
            ].map((kpi) => (
              <div key={kpi.label} style={{ ...card, padding: "32px 28px", minHeight: 152, display: "flex", flexDirection: "column", justifyContent: "space-between", borderTop: `3px solid ${kpi.accent}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#94a3b8" }}>
                  {kpi.label}
                </div>
                <div>
                  <div style={{ fontSize: 56, fontWeight: 800, color: kpi.valueColor, lineHeight: 1, letterSpacing: "-0.03em", marginBottom: 6 }}>
                    {kpi.value}
                  </div>
                  <div style={{ fontSize: 13, color: "#94a3b8" }}>{kpi.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── 3 Stat Tiles (replaces pipeline chart) ──────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 32 }}>
            {[
              {
                label: "Total Leads",
                value: String(leads.length),
                sub:   "in pipeline",
                color: "#0f172a",
              },
              {
                label: "Signed Clients",
                value: String(signedCount + activeCount),
                sub:   `${signedCount} signed · ${activeCount} active`,
                color: "#16a34a",
              },
              {
                label: "Conversion Rate",
                value: `${convRate}%`,
                sub:   "signed + active / total",
                color: "#0f172a",
              },
            ].map((stat) => (
              <div key={stat.label} style={{ ...card, padding: "28px 32px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9ca3af", marginBottom: 16 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: 48, fontWeight: 800, color: stat.color, lineHeight: 1, letterSpacing: "-0.03em" }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 8 }}>{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Recent Leads Table ───────────────────────────────────── */}
          <div style={{ ...card, marginBottom: 32, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "28px 32px 20px" }}>
              <div style={sectionLabel}>Recent Leads</div>
              <button
                onClick={() => navigate("dashboard")}
                style={{ fontSize: 12, fontWeight: 600, color: "#64748b", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.04em" }}>
                View all →
              </button>
            </div>

            {recentLeads.length === 0 ? (
              <div style={{ padding: "40px 32px", textAlign: "center", color: "#cbd5e1", fontSize: 14 }}>No leads yet.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderTop: "1px solid #f1f5f9" }}>
                    {["Business", "Contact", "Country", "Status", "Plan", "Monthly Value", "Date"].map((h) => (
                      <th key={h} style={{ padding: "12px 32px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map((l) => {
                    const sc = SC[l.status] || SC.new;
                    return (
                      <tr key={l.id}
                        style={{ borderTop: "1px solid #f8fafc", cursor: "default", transition: "background 0.1s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#fafbfc"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "20px 32px", fontSize: 14, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {l.business_name}
                        </td>
                        <td style={{ padding: "20px 32px", fontSize: 14, color: "#475569" }}>
                          {l.contact_name || "—"}
                        </td>
                        <td style={{ padding: "20px 32px", fontSize: 14, color: "#64748b" }}>
                          {l.country || "—"}
                        </td>
                        <td style={{ padding: "20px 32px" }}>
                          <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: "4px 12px", borderRadius: 99, background: sc.bg, color: sc.text }}>
                            {l.status || "new"}
                          </span>
                        </td>
                        <td style={{ padding: "20px 32px", fontSize: 14, color: "#64748b" }}>
                          {l.plan || "—"}
                        </td>
                        <td style={{ padding: "20px 32px", fontSize: 14, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap" }}>
                          {l.monthly_value != null ? `${l.currency || "USD"} ${Number(l.monthly_value).toFixed(0)}` : "—"}
                        </td>
                        <td style={{ padding: "20px 32px", fontSize: 13, color: "#94a3b8", whiteSpace: "nowrap" }}>
                          {fmtD(l.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Commissions ─────────────────────────────────────────── */}
          {topPromotors.length > 0 && (
            <div style={{ ...card, padding: "28px 32px", marginBottom: 32 }}>
              <div style={sectionLabel}>Commissions Due</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
                {topPromotors.map((pr) => (
                  <div key={pr.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", background: "#f8fafc", borderRadius: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${GOLD}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: NAVY, flexShrink: 0 }}>
                      {(pr.full_name || "?")[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pr.full_name}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>Promotor</div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, flexShrink: 0 }}>
                      ${pr.owed.toFixed(0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Quick Actions ────────────────────────────────────────── */}
          <div>
            <div style={sectionLabel}>Quick Actions</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 16 }}>
              {[
                { label: "Add Lead",      icon: "＋",  action: () => navigate("partners"),  accent: NAVY  },
                { label: "Add Partner",   icon: "◇",   action: () => navigate("partners"),  accent: NAVY  },
                { label: "Record Payout", icon: "⊙",   action: () => navigate("partners"),  accent: GOLD  },
                { label: "View Reports",  icon: "◧",   action: () => {},                     accent: "#3b82f6" },
                { label: "Training",      icon: "◎",   action: () => navigate("training"),   accent: "#7c3aed" },
                { label: "Demo Links",    icon: "◈",   action: () => navigate("materials"),  accent: "#0891b2" },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={a.action}
                  style={{ ...card, padding: "28px 16px 22px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, cursor: "pointer", border: "1px solid #f1f5f9", transition: "all 0.15s" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = a.accent;
                    e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.08)`;
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#f1f5f9";
                    e.currentTarget.style.boxShadow = card.boxShadow;
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${a.accent}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: a.accent }}>
                    {a.icon}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", letterSpacing: "0.02em", textAlign: "center", lineHeight: 1.3 }}>
                    {a.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
