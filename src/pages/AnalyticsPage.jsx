import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const NAVY = "#0B1739";
const GOLD = "#E8C547";
const EARN = ["signed", "active"];

const STAGES = ["new", "contacted", "demo", "signed", "active", "churned"];
const STAGE_COLOR = {
  new:       "#2563eb",
  contacted: "#0e7490",
  demo:      "#7c3aed",
  signed:    "#b45309",
  active:    "#15803d",
  churned:   "#374151",
};
const STAGE_BG = {
  new:       "#dbeafe",
  contacted: "#cffafe",
  demo:      "#ede9fe",
  signed:    "#fef3c7",
  active:    "#dcfce7",
  churned:   "#f3f4f6",
};

const usd = (n) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`;

const card = {
  background: "#fff",
  borderRadius: 20,
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
};

const label = {
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#374151",
  marginBottom: 20,
};

export default function AnalyticsPage({ navigate }) {
  const [leads,     setLeads]     = useState([]);
  const [partners,  setPartners]  = useState([]);
  const [promotors, setPromotors] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("leads").select("id, status, monthly_value, currency, partner_pct, country, created_at").order("created_at", { ascending: false }),
      supabase.from("partners").select("id, full_name"),
      supabase.from("promotors").select("id, full_name"),
    ]).then(([lRes, pRes, prRes]) => {
      if (!lRes.error)  setLeads(lRes.data   || []);
      if (!pRes.error)  setPartners(pRes.data || []);
      if (!prRes.error) setPromotors(prRes.data || []);
      setLoading(false);
    });
  }, []);

  const earnLeads   = leads.filter((l) => EARN.includes(l.status));
  const signed      = leads.filter((l) => l.status === "signed").length;
  const active      = leads.filter((l) => l.status === "active").length;
  const conversion  = leads.length > 0 ? Math.round(((signed + active) / leads.length) * 100) : 0;
  const mrr         = earnLeads.filter((l) => l.monthly_value).reduce((s, l) => s + Number(l.monthly_value), 0);
  const commOwed    = earnLeads.filter((l) => l.monthly_value && l.partner_pct).reduce((s, l) => s + l.monthly_value * l.partner_pct / 100, 0);

  const stageCounts = STAGES.reduce((acc, s) => ({ ...acc, [s]: leads.filter((l) => (l.status || "new") === s).length }), {});
  const maxStage    = Math.max(...Object.values(stageCounts), 1);

  const byCountry = Object.entries(
    leads.reduce((acc, l) => {
      const c = l.country?.trim() || "Unknown";
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const maxCountry = byCountry[0]?.[1] || 1;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 16, color: "#374151" }}>Loading…</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui,-apple-system,Segoe UI,sans-serif" }}>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "18px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <button onClick={() => navigate("dashboard")}
            style={{ fontSize: 14, fontWeight: 600, color: "#374151", background: "none", border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 16px", cursor: "pointer" }}>
            ← Dashboard
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0, letterSpacing: "-0.02em" }}>Analytics</h1>
        </div>
        <p style={{ fontSize: 15, color: "#374151", margin: 0 }}>{leads.length} leads · {partners.length} partners · {promotors.length} promotors</p>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "40px 48px 60px" }}>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Total Leads",      value: leads.length,     color: "#111827", accent: NAVY  },
            { label: "Signed Clients",   value: signed + active,  color: "#15803d", accent: "#16a34a" },
            { label: "Conversion Rate",  value: `${conversion}%`, color: "#111827", accent: GOLD  },
            { label: "Monthly Revenue",  value: usd(mrr),         color: "#111827", accent: GOLD  },
            { label: "Commission Owed",  value: usd(commOwed),    color: "#b45309", accent: "#d97706" },
          ].map((k) => (
            <div key={k.label} style={{ ...card, padding: "24px 22px", borderTop: `3px solid ${k.accent}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#374151", marginBottom: 12 }}>{k.label}</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: k.color, letterSpacing: "-0.03em", lineHeight: 1 }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Mid row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

          {/* Leads by status */}
          <div style={{ ...card, padding: "28px 32px" }}>
            <p style={label}>Leads by Status</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {STAGES.map((s) => {
                const count = stageCounts[s] || 0;
                const pct   = (count / maxStage) * 100;
                const pctOfTotal = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
                return (
                  <div key={s}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ display: "inline-block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "3px 10px", borderRadius: 99, background: STAGE_BG[s], color: STAGE_COLOR[s] }}>
                          {s}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 13, color: "#374151" }}>{pctOfTotal}%</span>
                        <span style={{ fontSize: 16, fontWeight: 700, color: "#111827", minWidth: 28, textAlign: "right" }}>{count}</span>
                      </div>
                    </div>
                    <div style={{ height: 8, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: STAGE_COLOR[s], borderRadius: 99, transition: "width 0.4s", opacity: 0.8 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leads by country */}
          <div style={{ ...card, padding: "28px 32px" }}>
            <p style={label}>Leads by Country</p>
            {byCountry.length === 0 ? (
              <p style={{ fontSize: 15, color: "#374151" }}>No country data yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {byCountry.map(([country, count]) => {
                  const pct = (count / maxCountry) * 100;
                  const pctOfTotal = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
                  return (
                    <div key={country}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 15, fontWeight: 500, color: "#111827" }}>{country}</span>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <span style={{ fontSize: 13, color: "#374151" }}>{pctOfTotal}%</span>
                          <span style={{ fontSize: 16, fontWeight: 700, color: "#111827", minWidth: 28, textAlign: "right" }}>{count}</span>
                        </div>
                      </div>
                      <div style={{ height: 6, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: NAVY, borderRadius: 99, opacity: 0.55 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
