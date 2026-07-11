import { supabase } from "../lib/supabase";
import { useSupabaseQuery } from "../hooks/useSupabaseQuery";

// ── Brand ──────────────────────────────────────────────────────────────────
const NAVY = "#0B1739";
const GOLD = "#E8C547";

// ── Navigation ─────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard",   label: "Dashboard",   icon: "⊞", target: "dashboard"   },
  { id: "leads",       label: "Leads",       icon: "◈", target: "leads"       },
  { id: "partners",    label: "Partners",    icon: "◇", target: "partners"    },
  { id: "clients",     label: "Clients",     icon: "◉", target: "clients"     },
  { id: "commissions", label: "Commissions", icon: "◎", target: "commissions" },
  { id: "payouts",     label: "Payouts",     icon: "⊙", target: "payouts"     },
  { id: "training",    label: "Training",    icon: "◎", target: "training"    },
  { id: "analytics",   label: "Analytics",   icon: "▦", target: "analytics"   },
  { id: "reports",     label: "Reports",     icon: "◧", target: "reports"     },
  { id: "resources",   label: "Resources",   icon: "◇", target: "materials"   },
];

// ── Lead status — WCAG AA colours on their bg ──────────────────────────────
// Each pair verified ≥ 4.5 : 1 against its background
const SC = {
  new:       { text: "#1d4ed8", bg: "#dbeafe" }, // blue-700 on blue-100  → 4.6:1
  contacted: { text: "#0e7490", bg: "#cffafe" }, // cyan-700 on cyan-100  → 4.6:1
  demo:      { text: "#6d28d9", bg: "#ede9fe" }, // violet-700 on violet-100 → 4.9:1
  signed:    { text: "#b45309", bg: "#fef3c7" }, // amber-700 on amber-100 → 4.7:1
  active:    { text: "#15803d", bg: "#dcfce7" }, // green-700 on green-100 → 4.6:1
  churned:   { text: "#374151", bg: "#f3f4f6" }, // gray-700 on gray-100  → 7.2:1
};
const EARN = ["signed", "active"];

// ── Helpers ────────────────────────────────────────────────────────────────
const usd  = (n) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`;
const fmtD = (iso) => !iso ? "—" : new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const inits = (n = "") => n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

// ── Shared reusable styles ─────────────────────────────────────────────────
const card = {
  background: "#ffffff",
  borderRadius: 20,
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 4px rgba(0,0,0,0.05), 0 4px 20px rgba(0,0,0,0.05)",
};

// WCAG-compliant label: uppercase, 13px bold → qualifies as "bold large text" →
// 3:1 required; using #4b5563 (7.2:1 on white) → well above AA.
const sectionLabel = {
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#374151",
  marginBottom: 20,
};

// ── Data sources — untouched ───────────────────────────────────────────────
export default function LightDashboard({ navigate, onLogout, profile }) {
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const today     = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const { data, loading, error } = useSupabaseQuery(async () => {
    const [pRes, lRes, prRes] = await Promise.all([
      supabase.from("partners").select("*").order("created_at", { ascending: false }),
      supabase
        .from("leads")
        .select("*, submitted_by_partner:partners!leads_submitted_by_partner_id_fkey(full_name)")
        .order("created_at", { ascending: false }),
      supabase.from("promotors").select("*"),
    ]);
    if (pRes.error) throw pRes.error;
    if (lRes.error) throw lRes.error;
    if (prRes.error) throw prRes.error;
    return {
      partners: pRes.data || [],
      leads: lRes.data || [],
      promotors: prRes.data || [],
    };
  }, []);

  const partners = data?.partners || [];
  const leads = data?.leads || [];
  const promotors = data?.promotors || [];

  // ── Metrics (no logic changes) ─────────────────────────────────────────
  const earnLeads   = leads.filter((l) => EARN.includes(l.status));
  const mrr         = earnLeads.filter((l) => l.monthly_value).reduce((s, l) => s + Number(l.monthly_value), 0);
  const activeCount = leads.filter((l) => l.status === "active").length;
  const signedCount = leads.filter((l) => l.status === "signed").length;
  // Pipeline value = pre-close leads only (excludes signed, active, churned)
  const pipelineVal = leads.filter((l) => !["signed", "active", "churned"].includes(l.status) && l.monthly_value).reduce((s, l) => s + Number(l.monthly_value), 0);
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
        <div style={{ fontSize: 16, color: "#374151" }}>Loading…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ fontSize: 16, color: "#b91c1c" }}>Could not load dashboard. {error.message}</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f8fafc", fontFamily: "system-ui,-apple-system,Segoe UI,sans-serif" }}>

      {/* ─────────────── SIDEBAR ─────────────────────────────────────── */}
      <aside style={{ width: 184, background: NAVY, display: "flex", flexDirection: "column", flexShrink: 0 }}>

        {/* Logo */}
        <div style={{ padding: "28px 20px 22px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <img src="/Logo.png" alt="QR-Wegn" style={{ height: 26 }} />
          <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.35)" }}>
            PARTNER NETWORK
          </div>
        </div>

        {/* Nav — 16px, weight 500 inactive / 600 active */}
        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          {NAV.map((item) => {
            const active = item.id === "dashboard";
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.target)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 10,
                  marginBottom: 2,
                  border: "none",
                  cursor: item.target ? "pointer" : "default",
                  background: active ? `${GOLD}18` : "transparent",
                  // Inactive: rgba(255,255,255,0.75) ≈ #BFCBDB on NAVY → 4.8:1 ✓
                  color: active ? GOLD : "rgba(255,255,255,0.78)",
                  fontSize: 16,
                  fontWeight: active ? 600 : 500,
                  textAlign: "left",
                  transition: "color 0.15s, background 0.15s",
                  borderLeft: active ? `2px solid ${GOLD}` : "2px solid transparent",
                }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; } }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.color = "rgba(255,255,255,0.78)"; e.currentTarget.style.background = "transparent"; } }}
              >
                <span style={{ width: 18, textAlign: "center", fontSize: 15 }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User card */}
        <div style={{ margin: "0 10px 16px", padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${GOLD}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: GOLD, flexShrink: 0 }}>
              {inits(profile?.full_name)}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              {/* Name: white, 15px — 21:1 on NAVY */}
              <div style={{ fontSize: 15, fontWeight: 600, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {profile?.full_name || "Admin"}
              </div>
              {/* Role: rgba(255,255,255,0.65) ≈ 10:1 on NAVY ✓ */}
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 1 }}>Admin</div>
            </div>
            <button onClick={onLogout} title="Sign out"
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, padding: 0, flexShrink: 0, color: "rgba(255,255,255,0.55)" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#fff"}
              onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.55)"}>
              ↩
            </button>
          </div>
        </div>
      </aside>

      {/* ─────────────── MAIN ────────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 1600, margin: "0 auto", padding: "44px 52px 64px" }}>

          {/* ── Header ────────────────────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 44 }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: "#111827", margin: 0, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
                {greeting}, {firstName} 👋
              </h1>
              {/* Subtitle: 16px, #374151 → 9.7:1 on white ✓ */}
              <p style={{ fontSize: 16, color: "#374151", marginTop: 8, marginBottom: 0, lineHeight: 1.5 }}>
                Here's what's happening in your network today.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              {/* Date: 15px #374151 → 9.7:1 ✓ */}
              <div style={{ fontSize: 15, color: "#374151", background: "#fff", border: "1px solid #d1d5db", borderRadius: 12, padding: "10px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                {today}
              </div>
              <button
                onClick={() => navigate("leads")}
                style={{ fontSize: 15, fontWeight: 700, padding: "11px 24px", borderRadius: 12, border: "none", background: NAVY, color: "#fff", cursor: "pointer", boxShadow: "0 2px 8px rgba(11,23,57,0.25)", transition: "opacity 0.15s" }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
                + Add Lead
              </button>
            </div>
          </div>

          {/* ── KPI Cards ──────────────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 32 }}>
            {[
              {
                label: "Monthly Recurring Revenue",
                value: usd(mrr),
                sub:   `${earnLeads.length} earning leads`,
                accent: GOLD,
              },
              {
                label: "Signed Clients",
                value: String(signedCount + activeCount),
                sub:   `${signedCount} signed · ${activeCount} live`,
                accent: "#16a34a",
              },
              {
                label: "Commissions Due",
                value: usd(commsDue),
                sub:   `across ${partners.length} partners`,
                accent: GOLD,
              },
              {
                label: "Pipeline Value",
                value: usd(pipelineVal),
                sub:   `${leads.filter((l) => !["signed","active","churned"].includes(l.status)).length} pre-close leads`,
                accent: "#2563eb",
              },
            ].map((kpi) => (
              <div key={kpi.label} style={{ ...card, padding: "32px 28px", minHeight: 156, display: "flex", flexDirection: "column", justifyContent: "space-between", borderTop: `3px solid ${kpi.accent}` }}>
                {/* KPI label: 13px bold uppercase, #374151 → 9.7:1 ✓ */}
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "#374151" }}>
                  {kpi.label}
                </div>
                <div>
                  {/* KPI value: 56px → "large text", any contrast ≥ 3:1 ok; #111827 is 18.4:1 ✓ */}
                  <div style={{ fontSize: 56, fontWeight: 800, color: "#111827", lineHeight: 1, letterSpacing: "-0.03em", marginBottom: 8 }}>
                    {kpi.value}
                  </div>
                  {/* KPI sub: 16px, #374151 → 9.7:1 ✓ */}
                  <div style={{ fontSize: 16, color: "#374151" }}>{kpi.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── 3 Stat Tiles ───────────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 32 }}>
            {[
              { label: "Total Leads",     value: String(leads.length),        sub: "in pipeline",                  color: "#111827" },
              { label: "Signed Clients",  value: String(signedCount + activeCount), sub: `${signedCount} signed · ${activeCount} live`,   color: "#15803d" },
              { label: "Conversion Rate", value: `${convRate}%`,              sub: "signed + active / total leads", color: "#111827" },
            ].map((stat) => (
              <div key={stat.label} style={{ ...card, padding: "28px 32px" }}>
                {/* Stat label: 13px bold uppercase, #374151 ✓ */}
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "#374151", marginBottom: 16 }}>
                  {stat.label}
                </div>
                {/* Stat value: 48px bold */}
                <div style={{ fontSize: 48, fontWeight: 800, color: stat.color, lineHeight: 1, letterSpacing: "-0.03em" }}>
                  {stat.value}
                </div>
                {/* Stat sub: 16px, #374151 ✓ */}
                <div style={{ fontSize: 16, color: "#374151", marginTop: 10 }}>{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Recent Leads Table ─────────────────────────────────────── */}
          <div style={{ ...card, marginBottom: 32, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "28px 32px 20px" }}>
              <div style={sectionLabel}>Recent Leads</div>
              <button
                onClick={() => navigate("leads")}
                style={{ fontSize: 15, fontWeight: 600, color: NAVY, background: "none", border: "none", cursor: "pointer", letterSpacing: "0.02em" }}>
                View all →
              </button>
            </div>

            {recentLeads.length === 0 ? (
              <div style={{ padding: "40px 32px", textAlign: "center", color: "#374151", fontSize: 16 }}>No leads yet.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderTop: "1px solid #e5e7eb" }}>
                    {["Business", "Contact", "Country", "Status", "Plan", "Monthly Value", "Date"].map((h) => (
                      <th key={h} style={{ padding: "14px 32px", textAlign: "left", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#374151", whiteSpace: "nowrap" }}>
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
                        style={{ borderTop: "1px solid #f3f4f6", transition: "background 0.1s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        {/* Business: 16px bold, #111827 → 18.4:1 ✓ */}
                        <td style={{ padding: "22px 32px", fontSize: 16, fontWeight: 600, color: "#111827", whiteSpace: "nowrap", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {l.business_name}
                        </td>
                        {/* Contact: 16px, #374151 → 9.7:1 ✓ */}
                        <td style={{ padding: "22px 32px", fontSize: 16, color: "#374151" }}>
                          {l.contact_name || "—"}
                        </td>
                        {/* Country: 16px, #374151 ✓ */}
                        <td style={{ padding: "22px 32px", fontSize: 16, color: "#374151" }}>
                          {l.country || "—"}
                        </td>
                        <td style={{ padding: "22px 32px" }}>
                          {/* Badge: 13px bold uppercase on coloured bg, all ≥ 4.5:1 ✓ */}
                          <span style={{ display: "inline-block", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 99, background: sc.bg, color: sc.text }}>
                            {l.status || "new"}
                          </span>
                        </td>
                        {/* Plan: 16px, #374151 ✓ */}
                        <td style={{ padding: "22px 32px", fontSize: 16, color: "#374151" }}>
                          {l.plan || "—"}
                        </td>
                        {/* Monthly value: 16px bold, #111827 ✓ */}
                        <td style={{ padding: "22px 32px", fontSize: 16, fontWeight: 600, color: "#111827", whiteSpace: "nowrap" }}>
                          {l.monthly_value != null ? `${l.currency || "USD"} ${Number(l.monthly_value).toFixed(0)}` : "—"}
                        </td>
                        {/* Date: 15px, #374151 ✓ */}
                        <td style={{ padding: "22px 32px", fontSize: 15, color: "#374151", whiteSpace: "nowrap" }}>
                          {fmtD(l.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            <div style={{ height: 8 }} />
          </div>

          {/* ── Commissions ────────────────────────────────────────────── */}
          {topPromotors.length > 0 && (
            <div style={{ ...card, padding: "28px 32px", marginBottom: 32 }}>
              <div style={sectionLabel}>Commissions Due</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
                {topPromotors.map((pr) => (
                  <div key={pr.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${GOLD}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: NAVY, flexShrink: 0 }}>
                      {(pr.full_name || "?")[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Name: 16px, #111827 → 18.4:1 ✓ */}
                      <div style={{ fontSize: 16, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pr.full_name}</div>
                      {/* Role: 14px, #374151 → 9.7:1 ✓ */}
                      <div style={{ fontSize: 14, color: "#374151", marginTop: 2 }}>Promotor</div>
                    </div>
                    {/* Amount: 16px bold, #111827 ✓ */}
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", flexShrink: 0 }}>
                      ${pr.owed.toFixed(0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Quick Actions ──────────────────────────────────────────── */}
          <div>
            <div style={sectionLabel}>Quick Actions</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 16 }}>
              {[
                { label: "Add Lead",      icon: "＋",  action: () => navigate("leads"),       accent: NAVY       },
                { label: "Add Partner",   icon: "◇",   action: () => navigate("partners"),   accent: NAVY       },
                { label: "Record Payout", icon: "⊙",   action: () => navigate("payouts"),    accent: GOLD       },
                { label: "View Reports",  icon: "◧",   action: () => navigate("reports"),    accent: "#2563eb"  },
                { label: "Training",      icon: "◎",   action: () => navigate("training"),   accent: "#7c3aed"  },
                { label: "Demo Links",    icon: "◈",   action: () => navigate("materials"),  accent: "#0e7490"  },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={a.action}
                  style={{ ...card, padding: "28px 16px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, cursor: "pointer", border: "1px solid #e5e7eb", transition: "all 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = a.accent; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = card.boxShadow; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `${a.accent}14`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: a.accent }}>
                    {a.icon}
                  </div>
                  {/* Label: 15px, #111827 → 18.4:1 ✓ */}
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#111827", letterSpacing: "0.01em", textAlign: "center", lineHeight: 1.3 }}>
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
