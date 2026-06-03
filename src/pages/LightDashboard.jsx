import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

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

// ── Stage colours (Tailwind) ───────────────────────────────────────────────
const SC = {
  new:       { text: "text-blue-600",   bg: "bg-blue-50",    bar: "bg-blue-400"   },
  contacted: { text: "text-cyan-600",   bg: "bg-cyan-50",    bar: "bg-cyan-400"   },
  demo:      { text: "text-violet-600", bg: "bg-violet-50",  bar: "bg-violet-400" },
  signed:    { text: "text-amber-600",  bg: "bg-amber-50",   bar: "bg-amber-400"  },
  active:    { text: "text-green-600",  bg: "bg-green-50",   bar: "bg-green-400"  },
  churned:   { text: "text-gray-400",   bg: "bg-gray-100",   bar: "bg-gray-300"   },
};
const STAGES = ["new", "contacted", "demo", "signed", "active", "churned"];
const EARN   = ["signed", "active"];

// ── Helpers ────────────────────────────────────────────────────────────────
const usd = (n) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;
const fmtD = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
const initials = (name = "") =>
  name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

// ── Reusable card wrapper ──────────────────────────────────────────────────
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, right }) => (
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{children}</h3>
    {right && <span className="text-xs text-violet-500 font-medium">{right}</span>}
  </div>
);

// ── Component ──────────────────────────────────────────────────────────────
export default function LightDashboard({ navigate, onLogout, profile }) {
  const [partners,  setPartners]  = useState([]);
  const [leads,     setLeads]     = useState([]);
  const [promotors, setPromotors] = useState([]);
  const [loading,   setLoading]   = useState(true);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const today    = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  // ── Same queries as AdminDashboard — no logic changed ──────────────────
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

  // ── KPIs ───────────────────────────────────────────────────────────────
  const earnLeads    = leads.filter((l) => EARN.includes(l.status));
  const mrr          = earnLeads.filter((l) => l.monthly_value).reduce((s, l) => s + Number(l.monthly_value), 0);
  const activeCount  = leads.filter((l) => l.status === "active").length;
  const pipelineVal  = leads.filter((l) => l.status !== "churned" && l.monthly_value).reduce((s, l) => s + Number(l.monthly_value), 0);
  const commsDue     = earnLeads.filter((l) => l.monthly_value && l.partner_pct).reduce((s, l) => s + l.monthly_value * l.partner_pct / 100, 0);

  // ── Pipeline counts ────────────────────────────────────────────────────
  const stageCounts = STAGES.reduce((acc, s) => ({ ...acc, [s]: leads.filter((l) => (l.status || "new") === s).length }), {});
  const maxCount    = Math.max(...Object.values(stageCounts), 1);

  // ── Promotor commissions ────────────────────────────────────────────────
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

  const recentLeads = leads.slice(0, 6);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm animate-pulse">Loading dashboard…</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col flex-shrink-0 shadow-sm">
        {/* Logo */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <img src="/Logo.png" alt="QR-Wegn" style={{ height: 28 }} />
          <div className="text-xs text-gray-300 mt-1.5 font-semibold tracking-widest">PARTNER NETWORK</div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          {NAV.map((item) => {
            const active = item.id === "dashboard";
            return (
              <button
                key={item.id}
                onClick={() => item.target && navigate(item.target)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl mb-0.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-violet-50 text-violet-700"
                    : "text-gray-400 hover:bg-gray-50 hover:text-gray-700 cursor-pointer"
                }`}
              >
                <span className="text-base w-4 text-center">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User card */}
        <div className="p-3 mx-3 mb-4 rounded-xl bg-gray-50 border border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-bold flex-shrink-0">
              {initials(profile?.full_name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-gray-800 truncate">{profile?.full_name || "Admin"}</div>
              <div className="text-xs text-gray-400">Admin</div>
            </div>
            <button onClick={onLogout} title="Sign out" className="text-gray-300 hover:text-gray-500 text-sm flex-shrink-0">
              ↩
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{greeting}, {firstName} 👋</h1>
              <p className="text-sm text-gray-400 mt-0.5">Here's what's happening in your network today.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500 bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm">
                📅 {today}
              </div>
              <button
                onClick={() => navigate("partners")}
                className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors"
              >
                + Add Lead
              </button>
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-4 gap-4">
            {[
              {
                label: "Monthly Recurring Revenue",
                value: usd(mrr),
                sub:   `${earnLeads.length} earning leads`,
                color: "text-violet-600",
                ring:  "bg-violet-50",
                icon:  "💰",
              },
              {
                label: "Active Clients",
                value: String(activeCount),
                sub:   `of ${leads.length} total`,
                color: "text-green-600",
                ring:  "bg-green-50",
                icon:  "✓",
              },
              {
                label: "Pipeline Value",
                value: usd(pipelineVal),
                sub:   `${leads.filter((l) => l.status !== "churned").length} open`,
                color: "text-blue-600",
                ring:  "bg-blue-50",
                icon:  "◈",
              },
              {
                label: "Commissions Due",
                value: usd(commsDue),
                sub:   `${partners.length} partners`,
                color: "text-amber-600",
                ring:  "bg-amber-50",
                icon:  "◎",
              },
            ].map((kpi) => (
              <Card key={kpi.label}>
                <div className="flex items-start justify-between">
                  <div className={`w-9 h-9 rounded-xl ${kpi.ring} flex items-center justify-center text-base mb-3`}>
                    {kpi.icon}
                  </div>
                </div>
                <div className={`text-2xl font-bold ${kpi.color} leading-none mb-1`}>{kpi.value}</div>
                <div className="text-xs text-gray-400 mt-1">{kpi.label}</div>
                <div className="text-xs text-gray-300 mt-0.5">{kpi.sub}</div>
              </Card>
            ))}
          </div>

          {/* Mid row */}
          <div className="grid grid-cols-3 gap-4">

            {/* Sales Pipeline */}
            <Card>
              <CardTitle right={`${leads.length} leads`}>Sales Pipeline</CardTitle>
              <div className="space-y-3">
                {STAGES.map((s) => {
                  const c     = SC[s] || SC.new;
                  const count = stageCounts[s] || 0;
                  const pct   = (count / maxCount) * 100;
                  return (
                    <div key={s}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className={`font-medium capitalize ${c.text}`}>{s}</span>
                        <span className="text-gray-400">{count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${c.bar} transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Network Map */}
            <Card>
              <CardTitle>Network Map</CardTitle>
              <div className="space-y-2.5 mb-4">
                {[
                  { label: "Partners",  val: partners.length,  dot: "bg-violet-400" },
                  { label: "Promotors", val: promotors.length, dot: "bg-blue-400"   },
                  { label: "Leads",     val: leads.length,     dot: "bg-green-400"  },
                  { label: "Active",    val: activeCount,      dot: "bg-amber-400"  },
                ].map((r) => (
                  <div key={r.label} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.dot}`} />
                    <span className="text-sm text-gray-500 flex-1">{r.label}</span>
                    <span className="text-sm font-bold text-gray-800">{r.val}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3">
                <div className="text-xs text-gray-400 mb-2 font-medium">PARTNER STAGES</div>
                {["Active", "Onboarding", "Interested", "Identified", "Evaluating"].map((stage) => {
                  const count = partners.filter((p) => p.stage === stage).length;
                  if (count === 0) return null;
                  return (
                    <div key={stage} className="flex justify-between text-xs py-0.5">
                      <span className="text-gray-500">{stage}</span>
                      <span className="font-semibold text-gray-700">{count}</span>
                    </div>
                  );
                })}
                {partners.length === 0 && <p className="text-xs text-gray-300">No partners yet</p>}
              </div>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardTitle>Recent Activity</CardTitle>
              <div className="space-y-3">
                {recentLeads.slice(0, 5).map((l) => {
                  const c = SC[l.status] || SC.new;
                  return (
                    <div key={l.id} className="flex items-start gap-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${c.bar}`} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-700 truncate">{l.business_name}</div>
                        <div className="text-xs text-gray-400">{fmtD(l.created_at)} · <span className={c.text}>{l.status || "new"}</span></div>
                      </div>
                    </div>
                  );
                })}
                {recentLeads.length === 0 && <p className="text-xs text-gray-300 text-center py-4">No recent activity</p>}
              </div>
            </Card>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-2 gap-4">

            {/* Recent Leads */}
            <Card>
              <CardTitle right="View all →">Recent Leads</CardTitle>
              <div className="space-y-1">
                {recentLeads.length === 0 && <p className="text-xs text-gray-300 text-center py-6">No leads yet</p>}
                {recentLeads.map((l) => {
                  const c = SC[l.status] || SC.new;
                  return (
                    <div key={l.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-800 truncate">{l.business_name}</div>
                        <div className="text-xs text-gray-400 truncate">
                          {l.contact_name || l.country || "—"} · {fmtD(l.created_at)}
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${c.bg} ${c.text}`}>
                        {l.status || "new"}
                      </span>
                      {l.monthly_value != null && (
                        <span className="text-xs font-bold text-gray-600 flex-shrink-0">
                          {l.currency || "USD"} {Number(l.monthly_value).toFixed(0)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Commissions + Earnings stacked */}
            <div className="flex flex-col gap-4">

              {/* Commissions Overview */}
              <Card className="flex-1">
                <CardTitle>Commissions Overview</CardTitle>
                {topPromotors.length === 0 ? (
                  <p className="text-xs text-gray-300 text-center py-3">No commissions yet</p>
                ) : (
                  <div className="space-y-2.5">
                    {topPromotors.map((pr) => (
                      <div key={pr.id} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-bold flex-shrink-0">
                          {(pr.full_name || "?")[0]}
                        </div>
                        <span className="text-sm text-gray-700 flex-1 truncate">{pr.full_name}</span>
                        <span className="text-sm font-bold text-amber-600">USD {pr.owed.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Earnings Overview */}
              <Card className="flex-1">
                <CardTitle>Earnings Overview</CardTitle>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: "Total MRR",   value: usd(mrr),          color: "text-violet-600" },
                    { label: "Comms Due",   value: usd(commsDue),     color: "text-amber-600"  },
                    { label: "Pipeline",    value: usd(pipelineVal),  color: "text-blue-600"   },
                    { label: "Partners",    value: partners.length,   color: "text-green-600"  },
                  ].map((s) => (
                    <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                      <div className="text-xs text-gray-400 mb-1">{s.label}</div>
                      <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {/* Quick Links */}
          <Card>
            <CardTitle>Quick Links</CardTitle>
            <div className="grid grid-cols-6 gap-3">
              {[
                { label: "Add Lead",      icon: "◈", action: () => navigate("partners")  },
                { label: "Add Partner",   icon: "◇", action: () => navigate("partners")  },
                { label: "Record Payout", icon: "⊙", action: () => navigate("partners")  },
                { label: "View Reports",  icon: "◧", action: () => {}                    },
                { label: "Training",      icon: "◎", action: () => navigate("training")  },
                { label: "Demo Links",    icon: "◈", action: () => navigate("materials") },
              ].map((link) => (
                <button
                  key={link.label}
                  onClick={link.action}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-violet-200 hover:bg-violet-50 transition-all group"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">{link.icon}</span>
                  <span className="text-xs font-medium text-gray-500 group-hover:text-violet-700 text-center leading-tight">
                    {link.label}
                  </span>
                </button>
              ))}
            </div>
          </Card>

        </div>
      </main>
    </div>
  );
}
