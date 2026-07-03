import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useSupabaseQuery } from "../hooks/useSupabaseQuery";
import { Card, StageBadge, STAGE_COLORS } from "./AdminDashboard";

const LEAD_STATUS_COLORS = {
  new:       { color: "#5ab0f0", bg: "rgba(100,160,220,0.18)" },
  contacted: { color: "#38d4e8", bg: "rgba(56,212,232,0.12)"  },
  demo:      { color: "#c080f0", bg: "rgba(160,100,220,0.14)" },
  signed:    { color: "#f0c040", bg: "rgba(240,180,60,0.14)"  },
  active:    { color: "#35c060", bg: "rgba(40,180,80,0.12)"   },
  churned:   { color: "#909090", bg: "rgba(140,140,140,0.12)" },
};
const ALL_STATUSES = ["new", "contacted", "demo", "signed", "active", "churned"];

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function LeadsPage({ navigate }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const { data, loading, error } = useSupabaseQuery(async () => {
    const [lRes, prRes] = await Promise.all([
      supabase
        .from("leads")
        .select("*, submitted_by_partner:partners!leads_submitted_by_partner_id_fkey(full_name)")
        .order("created_at", { ascending: false }),
      supabase.from("promotors").select("id, full_name"),
    ]);
    if (lRes.error) throw lRes.error;
    if (prRes.error) throw prRes.error;
    return { leads: lRes.data || [], promotors: prRes.data || [] };
  }, []);

  const leads = data?.leads || [];
  const promotors = data?.promotors || [];

  const filtered = leads.filter((l) => {
    const matchStatus = filter === "all" || (l.status || "new") === filter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || (l.business_name || "").toLowerCase().includes(q)
      || (l.contact_name  || "").toLowerCase().includes(q)
      || (l.country       || "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const statusCounts = ALL_STATUSES.reduce((acc, s) => ({
    ...acc, [s]: leads.filter((l) => (l.status || "new") === s).length,
  }), {});

  const mrr = leads
    .filter((l) => ["signed", "active"].includes(l.status) && l.monthly_value)
    .reduce((s, l) => s + Number(l.monthly_value), 0);

  if (loading) return (
    <div style={{ textAlign: "center", padding: "80px 0", color: "#a0c8e8", fontSize: 16 }}>Loading leads…</div>
  );

  if (error) return (
    <div style={{ textAlign: "center", padding: "80px 0", color: "#f07070", fontSize: 16 }}>
      Could not load leads. {error.message}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#ffffff", margin: 0 }}>Leads</h1>
          <p style={{ fontSize: 15, color: "#a0c8e8", margin: "6px 0 0" }}>
            {leads.length} total · {leads.filter((l) => ["signed","active"].includes(l.status)).length} earning
          </p>
        </div>
      </div>

      {/* Status summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10, marginBottom: 24 }}>
        {ALL_STATUSES.map((s) => {
          const c = LEAD_STATUS_COLORS[s];
          return (
            <div key={s} onClick={() => setFilter(filter === s ? "all" : s)}
              style={{ background: filter === s ? c.bg : "rgba(10,20,45,0.6)", border: `1px solid ${filter === s ? c.color + "55" : "rgba(50,80,140,0.3)"}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer", transition: "all 0.15s" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: filter === s ? c.color : "#ffffff" }}>{statusCounts[s]}</div>
              <div style={{ fontSize: 12, color: filter === s ? c.color : "#7ab0cc", textTransform: "capitalize", marginTop: 2 }}>{s}</div>
            </div>
          );
        })}
      </div>

      {/* MRR banner */}
      {mrr > 0 && (
        <Card style={{ marginBottom: 20, padding: "16px 22px", display: "flex", alignItems: "center", gap: 16, background: "rgba(232,197,71,0.07)", borderColor: "rgba(232,197,71,0.2)" }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#e8c547" }}>${mrr.toLocaleString()}</span>
          <span style={{ fontSize: 14, color: "#a0c8e8" }}>Monthly Recurring Revenue from signed + active leads</span>
        </Card>
      )}

      {/* Search + filter bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by business, contact, country…"
          style={{ flex: 1, padding: "10px 14px", borderRadius: 10, fontSize: 15, border: "1.5px solid rgba(100,160,220,0.35)", background: "rgba(8,16,36,0.9)", color: "#ffffff", outline: "none" }}
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: 10, fontSize: 15, border: "1.5px solid rgba(100,160,220,0.35)", background: "rgba(8,16,36,0.9)", color: "#ffffff", outline: "none", cursor: "pointer" }}>
          <option value="all">All statuses</option>
          {ALL_STATUSES.map((s) => <option key={s} value={s} style={{ background: "#0a1428" }}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#7ab0cc", fontSize: 15 }}>No leads found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(100,160,220,0.3)" }}>
                  {["Business", "Contact", "Country", "Status", "Plan", "Monthly Value", "Submitted By", "Date"].map((h) => (
                    <th key={h} style={{ padding: "12px 18px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#a0c8e8", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, i) => {
                  const c = LEAD_STATUS_COLORS[l.status] || LEAD_STATUS_COLORS.new;
                  const submittedBy = l.submitted_by_partner?.full_name
                    || promotors.find((p) => p.id === l.submitted_by_promotor_id)?.full_name
                    || "—";
                  return (
                    <tr key={l.id}
                      style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(100,160,220,0.14)" : "none", transition: "background 0.1s" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(100,160,220,0.04)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "14px 18px", fontSize: 15, fontWeight: 600, color: "#ffffff" }}>{l.business_name}</td>
                      <td style={{ padding: "14px 18px", fontSize: 15, color: "#b0cce0" }}>{l.contact_name || "—"}</td>
                      <td style={{ padding: "14px 18px", fontSize: 15, color: "#a0c8e8" }}>{l.country || "—"}</td>
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: c.bg, color: c.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          {l.status || "new"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 18px", fontSize: 15, color: "#a0c8e8" }}>{l.plan || "—"}</td>
                      <td style={{ padding: "14px 18px", fontSize: 15, fontWeight: 600, color: l.monthly_value ? "#e8c547" : "#5a7a90" }}>
                        {l.monthly_value != null ? `${l.currency || "USD"} ${Number(l.monthly_value).toLocaleString()}` : "—"}
                      </td>
                      <td style={{ padding: "14px 18px", fontSize: 14, color: "#5ab0f0" }}>{submittedBy}</td>
                      <td style={{ padding: "14px 18px", fontSize: 14, color: "#7ab0cc", whiteSpace: "nowrap" }}>{fmtDate(l.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
