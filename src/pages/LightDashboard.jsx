import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// ── Brand tokens ───────────────────────────────────────────────────────────
const NAVY   = "#0B1739";
const GOLD   = "#E8C547";
const GRAY   = "#F8FAFC";

// ── Nav ────────────────────────────────────────────────────────────────────
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

// ── Lead stage config ─────────────────────────────────────────────────────
const SC = {
  new:       { text: "text-blue-600",   bg: "bg-blue-50",   bar: "bg-blue-400"   },
  contacted: { text: "text-cyan-600",   bg: "bg-cyan-50",   bar: "bg-cyan-400"   },
  demo:      { text: "text-purple-600", bg: "bg-purple-50", bar: "bg-purple-400" },
  signed:    { text: "text-amber-600",  bg: "bg-amber-50",  bar: "bg-amber-400"  },
  active:    { text: "text-green-600",  bg: "bg-green-50",  bar: "bg-green-400"  },
  churned:   { text: "text-gray-400",   bg: "bg-gray-100",  bar: "bg-gray-300"   },
};
const STAGES = ["new", "contacted", "demo", "signed", "active", "churned"];
const EARN   = ["signed", "active"];

// ── Helpers ────────────────────────────────────────────────────────────────
const usd  = (n) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;
const fmtD = (iso) => !iso ? "—" : new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const inits = (name = "") => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

// ── Card shell ────────────────────────────────────────────────────────────
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>
    {children}
  </div>
);

const SectionLabel = ({ children }) => (
  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">{children}</p>
);

// ── Component ─────────────────────────────────────────────────────────────
export default function LightDashboard({ navigate, onLogout, profile }) {
  const [partners,  setPartners]  = useState([]);
  const [leads,     setLeads]     = useState([]);
  const [promotors, setPromotors] = useState([]);
  const [loading,   setLoading]   = useState(true);

  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const today     = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  // ── Data — same queries as AdminDashboard, untouched ──────────────────
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

  // ── Derived metrics ────────────────────────────────────────────────────
  const earnLeads   = leads.filter((l) => EARN.includes(l.status));
  const mrr         = earnLeads.filter((l) => l.monthly_value).reduce((s, l) => s + Number(l.monthly_value), 0);
  const activeCount = leads.filter((l) => l.status === "active").length;
  const signedCount = leads.filter((l) => l.status === "signed").length;
  const pipelineVal = leads.filter((l) => l.status !== "churned" && l.monthly_value).reduce((s, l) => s + Number(l.monthly_value), 0);
  const commsDue    = earnLeads.filter((l) => l.monthly_value && l.partner_pct).reduce((s, l) => s + l.monthly_value * l.partner_pct / 100, 0);
  const convRate    = leads.length > 0 ? Math.round(((signedCount + activeCount) / leads.length) * 100) : 0;

  const stageCounts = STAGES.reduce((acc, s) => ({ ...acc, [s]: leads.filter((l) => (l.status || "new") === s).length }), {});
  const maxCount    = Math.max(...Object.values(stageCounts), 1);

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
      <div className="flex h-screen items-center justify-center" style={{ background: GRAY }}>
        <div className="text-sm text-gray-400 animate-pulse">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: GRAY, fontFamily: "system-ui,-apple-system,sans-serif" }}>

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className="w-56 flex flex-col flex-shrink-0" style={{ background: NAVY }}>

        {/* Logo */}
        <div className="px-5 pt-6 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <img src="/Logo.png" alt="QR-Wegn" style={{ height: 26 }} />
          <div className="mt-2 text-xs font-semibold tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>
            PARTNER NETWORK
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 overflow-y-auto">
          {NAV.map((item) => {
            const active = item.id === "dashboard";
            return (
              <button
                key={item.id}
                onClick={() => item.target && navigate(item.target)}
                style={active
                  ? { background: `${GOLD}18`, color: GOLD, borderLeft: `2px solid ${GOLD}` }
                  : { color: "rgba(255,255,255,0.45)", borderLeft: "2px solid transparent" }
                }
                className="w-full flex items-center gap-2.5 pl-3 pr-3 py-2.5 text-sm font-medium mb-0.5 transition-all hover:text-white"
              >
                <span className="w-4 text-center text-base">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="mx-3 mb-4 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: `${GOLD}22`, color: GOLD }}>
              {inits(profile?.full_name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate text-white">{profile?.full_name || "Admin"}</div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Admin</div>
            </div>
            <button onClick={onLogout} title="Sign out" className="text-xs transition-colors"
              style={{ color: "rgba(255,255,255,0.3)" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}>
              ↩
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-8 space-y-8">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                {greeting}, {firstName} 👋
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Here's what's happening in your network today.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400 bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm">
                {today}
              </span>
              <button
                onClick={() => navigate("partners")}
                className="text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all text-white"
                style={{ background: NAVY }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
              >
                + Add Lead
              </button>
            </div>
          </div>

          {/* ── KPI row ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-4 gap-5">
            {[
              {
                label: "Monthly Recurring Revenue",
                value: usd(mrr),
                sub:   `${earnLeads.length} earning leads`,
                accent: GOLD,
              },
              {
                label: "Active Clients",
                value: String(activeCount),
                sub:   `${signedCount} signed · ${leads.length} total`,
                accent: "#22c55e",
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
                sub:   `${leads.filter((l) => l.status !== "churned").length} open leads`,
                accent: "#3b82f6",
              },
            ].map((kpi) => (
              <div key={kpi.label}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7"
                style={{ borderTop: `3px solid ${kpi.accent}` }}>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  {kpi.label}
                </div>
                <div className="text-4xl font-bold text-gray-900 leading-none mb-2">
                  {kpi.value}
                </div>
                <div className="text-sm text-gray-400">{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Recent Leads (full width) ────────────────────────────── */}
          <Card>
            <div className="px-7 pt-6 pb-2 flex items-center justify-between">
              <SectionLabel>Recent Leads</SectionLabel>
              <button className="text-xs font-semibold mb-5 transition-colors"
                style={{ color: NAVY }}
                onClick={() => navigate("dashboard")}>
                View all →
              </button>
            </div>

            {recentLeads.length === 0 ? (
              <p className="text-sm text-gray-300 text-center pb-8">No leads yet.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    {["Business", "Contact", "Country", "Status", "Plan", "Monthly", "Date"].map((h) => (
                      <th key={h} className="px-7 pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map((l) => {
                    const c = SC[l.status] || SC.new;
                    return (
                      <tr key={l.id}
                        className="transition-colors"
                        style={{ borderBottom: "1px solid #f8fafc" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#fafafa"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <td className="px-7 py-4 text-sm font-semibold text-gray-800 max-w-xs truncate">
                          {l.business_name}
                        </td>
                        <td className="px-7 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {l.contact_name || "—"}
                        </td>
                        <td className="px-7 py-4 text-sm text-gray-400">{l.country || "—"}</td>
                        <td className="px-7 py-4">
                          <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>
                            {l.status || "new"}
                          </span>
                        </td>
                        <td className="px-7 py-4 text-sm text-gray-400">{l.plan || "—"}</td>
                        <td className="px-7 py-4 text-sm font-semibold text-gray-700">
                          {l.monthly_value != null ? `${l.currency || "USD"} ${Number(l.monthly_value).toFixed(0)}` : "—"}
                        </td>
                        <td className="px-7 py-4 text-sm text-gray-400">{fmtD(l.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            <div className="pb-2" />
          </Card>

          {/* ── Mid row: Pipeline + Network Stats ─────────────────────── */}
          <div className="grid grid-cols-2 gap-5">

            {/* Sales Pipeline */}
            <Card className="p-7">
              <SectionLabel>Sales Pipeline</SectionLabel>
              <div className="space-y-4">
                {STAGES.map((s) => {
                  const c     = SC[s] || SC.new;
                  const count = stageCounts[s] || 0;
                  const pct   = (count / maxCount) * 100;
                  return (
                    <div key={s}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className={`font-medium capitalize ${c.text}`}>{s}</span>
                        <span className="text-gray-400 font-medium">{count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${pct}%`, transition: "width .3s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Network Stats — replaces Network Map */}
            <Card className="p-7">
              <SectionLabel>Network Overview</SectionLabel>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Total Leads",     value: leads.length,        color: "text-gray-900" },
                  { label: "Signed Clients",  value: signedCount + activeCount, color: "text-green-600" },
                  { label: "Conversion Rate", value: `${convRate}%`,      color: "text-gray-900", accent: GOLD },
                ].map((s) => (
                  <div key={s.label}
                    className="bg-gray-50 rounded-xl p-4"
                    style={s.accent ? { borderTop: `2px solid ${s.accent}` } : {}}>
                    <div className="text-xs text-gray-400 mb-2 leading-tight">{s.label}</div>
                    <div className={`text-3xl font-bold leading-none ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Commissions preview */}
              <div style={{ borderTop: "1px solid #f1f5f9" }} className="pt-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Top Promotors
                </p>
                {topPromotors.length === 0 ? (
                  <p className="text-sm text-gray-300">No commissions yet.</p>
                ) : topPromotors.map((pr) => (
                  <div key={pr.id} className="flex items-center gap-3 py-1.5">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: `${GOLD}22`, color: NAVY }}>
                      {(pr.full_name || "?")[0]}
                    </div>
                    <span className="text-sm text-gray-700 flex-1 truncate">{pr.full_name}</span>
                    <span className="text-sm font-bold" style={{ color: NAVY }}>
                      USD {pr.owed.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ── Quick Links (icon-only) ───────────────────────────────── */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Quick Actions</p>
            <div className="grid grid-cols-6 gap-3">
              {[
                { label: "Add Lead",      icon: "＋", action: () => navigate("partners")  },
                { label: "Add Partner",   icon: "◇",  action: () => navigate("partners")  },
                { label: "Record Payout", icon: "⊙",  action: () => navigate("partners")  },
                { label: "Reports",       icon: "◧",  action: () => {}                    },
                { label: "Training",      icon: "◎",  action: () => navigate("training")  },
                { label: "Demo Links",    icon: "◈",  action: () => navigate("materials") },
              ].map((link) => (
                <button
                  key={link.label}
                  onClick={link.action}
                  className="bg-white border border-gray-100 rounded-2xl py-5 flex flex-col items-center gap-2.5 shadow-sm transition-all group"
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.background = `${GOLD}0a`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#f3f4f6"; e.currentTarget.style.background = "#fff"; }}
                >
                  <span className="text-2xl leading-none">{link.icon}</span>
                  <span className="text-xs font-medium text-gray-400 text-center leading-tight">{link.label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
