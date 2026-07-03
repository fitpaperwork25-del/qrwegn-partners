import { supabase } from "../lib/supabase";
import { useSupabaseQuery } from "../hooks/useSupabaseQuery";
import { Card } from "./AdminDashboard";

const EARN = ["signed", "active"];

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function CommissionsPage() {
  const { data, loading, error } = useSupabaseQuery(async () => {
    const [pRes, prRes, lRes, payRes] = await Promise.all([
      supabase.from("partners").select("id, full_name"),
      supabase.from("promotors").select("id, full_name"),
      supabase.from("leads").select("id, status, monthly_value, currency, promotor_pct, partner_pct, submitted_by_promotor_id, regional_partner_id"),
      supabase.from("payouts").select("*").order("paid_on", { ascending: false }),
    ]);
    if (pRes.error) throw pRes.error;
    if (prRes.error) throw prRes.error;
    if (lRes.error) throw lRes.error;
    if (payRes.error) throw payRes.error;
    return {
      partners: pRes.data || [],
      promotors: prRes.data || [],
      leads: lRes.data || [],
      payouts: payRes.data || [],
    };
  }, []);

  const partners = data?.partners || [];
  const promotors = data?.promotors || [];
  const leads = data?.leads || [];
  const payouts = data?.payouts || [];

  // ── Same earnings calculation as AdminDashboard ─────────────────────────
  const map = {};
  const upsert = (key, init) => { if (!map[key]) map[key] = { ...init, owed: 0, paid: 0 }; };

  promotors.forEach((pr) => {
    leads.forEach((l) => {
      if (l.submitted_by_promotor_id !== pr.id) return;
      if (!EARN.includes(l.status)) return;
      if (l.monthly_value == null || l.promotor_pct == null) return;
      const cur = l.currency || "USD";
      const key = `promotor:${pr.id}:${cur}`;
      upsert(key, { name: pr.full_name, type: "Promotor", currency: cur });
      map[key].owed += l.monthly_value * l.promotor_pct / 100;
    });
  });

  partners.forEach((pa) => {
    leads.forEach((l) => {
      if (l.regional_partner_id !== pa.id) return;
      if (!EARN.includes(l.status)) return;
      if (l.monthly_value == null || l.partner_pct == null) return;
      const cur = l.currency || "USD";
      const key = `partner:${pa.id}:${cur}`;
      upsert(key, { name: pa.full_name, type: "Partner", currency: cur });
      map[key].owed += l.monthly_value * l.partner_pct / 100;
    });
  });

  payouts.forEach((p) => {
    if (!p.beneficiary_type || !p.beneficiary_id) return;
    const cur = p.currency || "USD";
    const key = `${p.beneficiary_type}:${p.beneficiary_id}:${cur}`;
    if (!map[key]) {
      const all = [
        ...promotors.map((pr) => ({ type: "promotor", id: pr.id, name: pr.full_name })),
        ...partners.map((pa)  => ({ type: "partner",  id: pa.id, name: pa.full_name })),
      ];
      const match = all.find((x) => x.type === p.beneficiary_type && String(x.id) === String(p.beneficiary_id));
      upsert(key, { name: match?.name || p.beneficiary, type: p.beneficiary_type, currency: cur });
    }
    map[key].paid += Number(p.amount);
  });

  const rows = Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  const totalOwed = rows.reduce((s, r) => s + r.owed, 0);
  const totalPaid = rows.reduce((s, r) => s + r.paid, 0);
  const totalDue  = rows.reduce((s, r) => s + Math.max(0, r.owed - r.paid), 0);

  if (loading) return (
    <div style={{ textAlign: "center", padding: "80px 0", color: "#a0c8e8", fontSize: 16 }}>Loading commissions…</div>
  );

  if (error) return (
    <div style={{ textAlign: "center", padding: "80px 0", color: "#f07070", fontSize: 16 }}>
      Could not load commissions. {error.message}
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#ffffff", margin: 0 }}>Commissions</h1>
        <p style={{ fontSize: 15, color: "#a0c8e8", margin: "6px 0 0" }}>Earnings and payout balances for partners and promotors.</p>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Earned",  value: `$${totalOwed.toFixed(2)}`,  color: "#a0c8e8" },
          { label: "Total Paid",    value: `$${totalPaid.toFixed(2)}`,  color: "#35c060" },
          { label: "Balance Due",   value: `$${totalDue.toFixed(2)}`,   color: totalDue > 0 ? "#e8c547" : "#35c060" },
        ].map((s) => (
          <Card key={s.label} style={{ padding: "20px 24px" }}>
            <div style={{ fontSize: 12, color: "#7ab0cc", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Earnings table */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid rgba(100,160,220,0.22)" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#a0c8e8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            EARNINGS &amp; BALANCES
          </span>
        </div>
        {rows.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#7ab0cc", fontSize: 15 }}>
            No earnings yet. Commission accrues when leads reach Signed or Active status.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(100,160,220,0.3)" }}>
                {["Person", "Role", "Currency", "Owed", "Paid", "Balance", "Overpaid"].map((h) => (
                  <th key={h} style={{ padding: "11px 18px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#a0c8e8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const balance  = Math.max(0, r.owed - r.paid);
                const overpaid = r.paid > r.owed ? r.paid - r.owed : 0;
                return (
                  <tr key={`${r.type}:${r.name}:${r.currency}`}
                    style={{ borderBottom: i < rows.length - 1 ? "1px solid rgba(100,160,220,0.14)" : "none" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(100,160,220,0.04)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "12px 18px", fontSize: 15, fontWeight: 600, color: "#ffffff" }}>{r.name}</td>
                    <td style={{ padding: "12px 18px", fontSize: 14, color: "#7ab0cc", textTransform: "capitalize" }}>{r.type}</td>
                    <td style={{ padding: "12px 18px", fontSize: 14, color: "#7ab0cc" }}>{r.currency}</td>
                    <td style={{ padding: "12px 18px", fontSize: 14, color: "#a0c8e8" }}>{r.currency} {r.owed.toFixed(2)}</td>
                    <td style={{ padding: "12px 18px", fontSize: 14, color: "#a0c8e8" }}>{r.currency} {r.paid.toFixed(2)}</td>
                    <td style={{ padding: "12px 18px", fontSize: 14, fontWeight: 700, color: balance > 0 ? "#e8c547" : "#35c060" }}>{r.currency} {balance.toFixed(2)}</td>
                    <td style={{ padding: "12px 18px", fontSize: 14, fontWeight: 700, color: overpaid > 0 ? "#f07070" : "#3a5a70" }}>{r.currency} {overpaid.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
