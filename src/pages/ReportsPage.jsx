import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const NAVY = "#0B1739";
const GOLD = "#E8C547";
const EARN = ["signed", "active"];
const STAGES = ["new", "contacted", "demo", "signed", "active", "churned"];

const fmtDate = (iso) => !iso ? "—" : new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const card = {
  background: "#fff",
  borderRadius: 20,
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
};

const TH = ({ children }) => (
  <th style={{ padding: "11px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#374151", whiteSpace: "nowrap" }}>
    {children}
  </th>
);

const sectionLabel = {
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#374151",
  margin: 0,
};

export default function ReportsPage({ navigate }) {
  const [leads,     setLeads]     = useState([]);
  const [payouts,   setPayouts]   = useState([]);
  const [partners,  setPartners]  = useState([]);
  const [promotors, setPromotors] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("leads").select("id, status, monthly_value, currency, partner_pct, promotor_pct, submitted_by_promotor_id, regional_partner_id").order("created_at", { ascending: false }),
      supabase.from("payouts").select("*").order("paid_on", { ascending: false }),
      supabase.from("partners").select("id, full_name"),
      supabase.from("promotors").select("id, full_name"),
    ]).then(([lRes, payRes, pRes, prRes]) => {
      if (!lRes.error)   setLeads(lRes.data    || []);
      if (!payRes.error) setPayouts(payRes.data || []);
      if (!pRes.error)   setPartners(pRes.data  || []);
      if (!prRes.error)  setPromotors(prRes.data || []);
      setLoading(false);
    });
  }, []);

  // ── Commission summary (same logic as AdminDashboard) ─────────────────
  const commMap = {};
  const upsert = (key, init) => { if (!commMap[key]) commMap[key] = { ...init, owed: 0, paid: 0 }; };

  promotors.forEach((pr) => {
    leads.forEach((l) => {
      if (l.submitted_by_promotor_id !== pr.id || !EARN.includes(l.status)) return;
      if (l.monthly_value == null || l.promotor_pct == null) return;
      const cur = l.currency || "USD";
      const key = `promotor:${pr.id}:${cur}`;
      upsert(key, { name: pr.full_name, role: "Promotor", currency: cur });
      commMap[key].owed += l.monthly_value * l.promotor_pct / 100;
    });
  });
  partners.forEach((pa) => {
    leads.forEach((l) => {
      if (l.regional_partner_id !== pa.id || !EARN.includes(l.status)) return;
      if (l.monthly_value == null || l.partner_pct == null) return;
      const cur = l.currency || "USD";
      const key = `partner:${pa.id}:${cur}`;
      upsert(key, { name: pa.full_name, role: "Partner", currency: cur });
      commMap[key].owed += l.monthly_value * l.partner_pct / 100;
    });
  });
  payouts.forEach((p) => {
    if (!p.beneficiary_type || !p.beneficiary_id) return;
    const cur = p.currency || "USD";
    const key = `${p.beneficiary_type}:${p.beneficiary_id}:${cur}`;
    if (!commMap[key]) {
      const all = [
        ...promotors.map((pr) => ({ type: "promotor", id: pr.id, name: pr.full_name, role: "Promotor" })),
        ...partners.map((pa)  => ({ type: "partner",  id: pa.id, name: pa.full_name, role: "Partner"  })),
      ];
      const match = all.find((x) => x.type === p.beneficiary_type && String(x.id) === String(p.beneficiary_id));
      upsert(key, { name: match?.name || p.beneficiary, role: match?.role || p.beneficiary_type, currency: cur });
    }
    commMap[key].paid += Number(p.amount);
  });
  const commRows    = Object.values(commMap).sort((a, b) => a.name.localeCompare(b.name));
  const totalOwed   = commRows.reduce((s, r) => s + r.owed, 0);
  const totalPaid   = payouts.reduce((s, p) => s + Number(p.amount), 0);
  const totalDue    = commRows.reduce((s, r) => s + Math.max(0, r.owed - r.paid), 0);

  // ── Pipeline summary ──────────────────────────────────────────────────
  const stageCounts = STAGES.reduce((acc, s) => ({
    ...acc, [s]: leads.filter((l) => (l.status || "new") === s).length,
  }), {});
  const mrr = leads
    .filter((l) => EARN.includes(l.status) && l.monthly_value)
    .reduce((s, l) => s + Number(l.monthly_value), 0);

  const ExportBtn = ({ label }) => (
    <button disabled
      title="Export not yet available"
      style={{ fontSize: 13, fontWeight: 600, padding: "8px 18px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#f9fafb", color: "#9ca3af", cursor: "not-allowed" }}>
      ↓ {label}
    </button>
  );

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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0, letterSpacing: "-0.02em" }}>Reports</h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <ExportBtn label="Export PDF" />
          <ExportBtn label="Export CSV" />
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "40px 48px 60px", display: "flex", flexDirection: "column", gap: 28 }}>

        {/* Summary row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          {[
            { label: "Total Commission Owed", value: `$${totalOwed.toFixed(2)}`,    accent: GOLD         },
            { label: "Total Paid Out",         value: `$${totalPaid.toFixed(2)}`,    accent: "#16a34a"    },
            { label: "Balance Due",            value: `$${totalDue.toFixed(2)}`,     accent: totalDue > 0 ? "#d97706" : "#16a34a" },
            { label: "MRR (Signed + Active)",  value: `$${mrr.toLocaleString()}`,    accent: NAVY         },
          ].map((s) => (
            <div key={s.label} style={{ ...card, padding: "24px 22px", borderTop: `3px solid ${s.accent}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#374151", marginBottom: 12 }}>{s.label}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Commission summary */}
        <div style={{ ...card, overflow: "hidden" }}>
          <div style={{ padding: "22px 28px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={sectionLabel}>Commission Summary</p>
            <ExportBtn label="Export" />
          </div>
          {commRows.length === 0 ? (
            <p style={{ padding: "24px 28px", fontSize: 15, color: "#374151" }}>No commission data yet. Commissions accrue when leads reach Signed or Active status.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderTop: "1px solid #f3f4f6" }}>
                  <TH>Person</TH><TH>Role</TH><TH>Currency</TH><TH>Owed</TH><TH>Paid</TH><TH>Balance</TH>
                </tr>
              </thead>
              <tbody>
                {commRows.map((r, i) => {
                  const bal  = Math.max(0, r.owed - r.paid);
                  const over = r.paid > r.owed ? r.paid - r.owed : 0;
                  return (
                    <tr key={`${r.role}:${r.name}:${r.currency}`}
                      style={{ borderTop: "1px solid #f3f4f6" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#fafafa"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "14px 20px", fontSize: 15, fontWeight: 600, color: "#111827" }}>{r.name}</td>
                      <td style={{ padding: "14px 20px", fontSize: 14, color: "#374151" }}>{r.role}</td>
                      <td style={{ padding: "14px 20px", fontSize: 14, color: "#374151" }}>{r.currency}</td>
                      <td style={{ padding: "14px 20px", fontSize: 15, fontWeight: 600, color: "#111827" }}>{r.currency} {r.owed.toFixed(2)}</td>
                      <td style={{ padding: "14px 20px", fontSize: 15, fontWeight: 600, color: "#15803d" }}>{r.currency} {r.paid.toFixed(2)}</td>
                      <td style={{ padding: "14px 20px", fontSize: 15, fontWeight: 700, color: over > 0 ? "#b91c1c" : bal > 0 ? "#b45309" : "#15803d" }}>
                        {over > 0 ? `Overpaid ${r.currency} ${over.toFixed(2)}` : `${r.currency} ${bal.toFixed(2)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <div style={{ height: 4 }} />
        </div>

        {/* Payout history */}
        <div style={{ ...card, overflow: "hidden" }}>
          <div style={{ padding: "22px 28px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={sectionLabel}>Payout History <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#374151" }}>({payouts.length})</span></p>
            <ExportBtn label="Export" />
          </div>
          {payouts.length === 0 ? (
            <p style={{ padding: "24px 28px", fontSize: 15, color: "#374151" }}>No payouts recorded yet.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderTop: "1px solid #f3f4f6" }}>
                  <TH>Date</TH><TH>Beneficiary</TH><TH>Role</TH><TH>Amount</TH><TH>Note</TH>
                </tr>
              </thead>
              <tbody>
                {payouts.slice(0, 15).map((p) => (
                  <tr key={p.id}
                    style={{ borderTop: "1px solid #f3f4f6" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#fafafa"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: "#374151", whiteSpace: "nowrap" }}>{fmtDate(p.paid_on)}</td>
                    <td style={{ padding: "14px 20px", fontSize: 15, fontWeight: 600, color: "#111827" }}>{p.beneficiary || "—"}</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: "#374151", textTransform: "capitalize" }}>{p.beneficiary_type || "—"}</td>
                    <td style={{ padding: "14px 20px", fontSize: 15, fontWeight: 700, color: "#15803d" }}>{p.currency || "USD"} {Number(p.amount).toLocaleString()}</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: "#374151" }}>{p.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div style={{ height: 4 }} />
        </div>

        {/* Lead pipeline summary */}
        <div style={{ ...card, padding: "28px 32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <p style={sectionLabel}>Lead Pipeline Summary</p>
            <ExportBtn label="Export" />
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                {["Stage", "Count", "% of Total", "MRR Contribution"].map((h) => (
                  <th key={h} style={{ padding: "8px 16px 12px 0", textAlign: "left", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#374151" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STAGES.map((s) => {
                const count = stageCounts[s] || 0;
                const pct   = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
                const stageMrr = EARN.includes(s)
                  ? leads.filter((l) => l.status === s && l.monthly_value).reduce((sum, l) => sum + Number(l.monthly_value), 0)
                  : null;
                return (
                  <tr key={s} style={{ borderBottom: "1px solid #f3f4f6" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#fafafa"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "14px 16px 14px 0" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "4px 12px", borderRadius: 99, background: s === "active" ? "#dcfce7" : s === "signed" ? "#fef3c7" : "#f3f4f6", color: s === "active" ? "#15803d" : s === "signed" ? "#b45309" : "#374151" }}>
                        {s}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px 14px 0", fontSize: 16, fontWeight: 700, color: "#111827" }}>{count}</td>
                    <td style={{ padding: "14px 16px 14px 0", fontSize: 15, color: "#374151" }}>{pct}%</td>
                    <td style={{ padding: "14px 0", fontSize: 15, fontWeight: stageMrr ? 600 : 400, color: stageMrr ? "#15803d" : "#9ca3af" }}>
                      {stageMrr != null ? `$${stageMrr.toLocaleString()}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
