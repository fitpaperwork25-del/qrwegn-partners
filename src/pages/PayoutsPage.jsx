import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useSupabaseQuery } from "../hooks/useSupabaseQuery";
import { Card } from "./AdminDashboard";

const TODAY = new Date().toISOString().slice(0, 10);

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function PayoutsPage() {
  const [form, setForm] = useState({ beneficiary: "", beneficiary_type: "", beneficiary_id: "", amount: "", currency: "USD", paid_on: TODAY, note: "" });
  const [saving, setSaving] = useState(false);

  const { data, loading, error, refetch } = useSupabaseQuery(async () => {
    const [payRes, pRes, prRes] = await Promise.all([
      supabase.from("payouts").select("*").order("paid_on", { ascending: false }),
      supabase.from("partners").select("id, full_name"),
      supabase.from("promotors").select("id, full_name"),
    ]);
    if (payRes.error) throw payRes.error;
    if (pRes.error) throw pRes.error;
    if (prRes.error) throw prRes.error;
    return {
      payouts: payRes.data || [],
      partners: pRes.data || [],
      promotors: prRes.data || [],
    };
  }, []);

  const payouts = data?.payouts || [];
  const partners = data?.partners || [];
  const promotors = data?.promotors || [];

  const recordPayout = async () => {
    if (!form.beneficiary_id || !form.amount) return;
    setSaving(true);
    const { error } = await supabase.from("payouts").insert({
      beneficiary: form.beneficiary,
      beneficiary_type: form.beneficiary_type,
      beneficiary_id: form.beneficiary_id,
      amount: Number(form.amount),
      currency: form.currency,
      paid_on: form.paid_on,
      note: form.note.trim() || null,
    });
    if (!error) {
      refetch();
      setForm({ beneficiary: "", beneficiary_type: "", beneficiary_id: "", amount: "", currency: "USD", paid_on: TODAY, note: "" });
    }
    setSaving(false);
  };

  const deletePayout = async (id) => {
    if (!window.confirm("Delete this payout?")) return;
    const { error } = await supabase.from("payouts").delete().eq("id", id);
    if (!error) refetch();
  };

  const totalPaid = payouts.reduce((s, p) => s + Number(p.amount), 0);

  const inputStyle = { background: "rgba(10,20,45,0.9)", color: "#a0c8e8", border: "1px solid rgba(100,160,220,0.3)", borderRadius: 8, padding: "7px 10px", fontSize: 14, outline: "none" };

  if (loading) return (
    <div style={{ textAlign: "center", padding: "80px 0", color: "#a0c8e8", fontSize: 16 }}>Loading payouts…</div>
  );

  if (error) return (
    <div style={{ textAlign: "center", padding: "80px 0", color: "#f07070", fontSize: 16 }}>
      Could not load payouts. {error.message}
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#ffffff", margin: 0 }}>Payouts</h1>
        <p style={{ fontSize: 15, color: "#a0c8e8", margin: "6px 0 0" }}>
          {payouts.length} recorded · Total paid: ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Record payout form */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#a0c8e8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>RECORD PAYOUT</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <select
            value={form.beneficiary_id ? `${form.beneficiary_type}:${form.beneficiary_id}` : ""}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) { setForm((f) => ({ ...f, beneficiary: "", beneficiary_type: "", beneficiary_id: "" })); return; }
              const [type, id] = val.split(":");
              const all = [
                ...promotors.map((p) => ({ type: "promotor", id: p.id, name: p.full_name })),
                ...partners.map((p)  => ({ type: "partner",  id: p.id, name: p.full_name })),
              ];
              const match = all.find((p) => p.type === type && String(p.id) === id);
              setForm((f) => ({ ...f, beneficiary: match?.name || "", beneficiary_type: type, beneficiary_id: id }));
            }}
            style={{ ...inputStyle, minWidth: 200, cursor: "pointer" }}>
            <option value="">Select person…</option>
            {promotors.map((p) => <option key={`promotor:${p.id}`} value={`promotor:${p.id}`} style={{ background: "#0a1428" }}>{p.full_name} (promotor)</option>)}
            {partners.map((p)  => <option key={`partner:${p.id}`}  value={`partner:${p.id}`}  style={{ background: "#0a1428" }}>{p.full_name} (partner)</option>)}
          </select>

          <input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            style={{ ...inputStyle, width: 110 }} />

          <select value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
            style={{ ...inputStyle, cursor: "pointer" }}>
            {["USD", "EUR", "GBP", "ETB", "SSP", "KES", "NGN"].map((c) => (
              <option key={c} value={c} style={{ background: "#0a1428" }}>{c}</option>
            ))}
          </select>

          <input type="date" value={form.paid_on} onChange={(e) => setForm((f) => ({ ...f, paid_on: e.target.value }))}
            style={{ ...inputStyle, cursor: "pointer", colorScheme: "dark" }} />

          <input placeholder="Note (optional)" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            style={{ ...inputStyle, width: 200 }} />

          <button onClick={recordPayout} disabled={saving || !form.beneficiary_id || !form.amount}
            style={{ padding: "7px 20px", borderRadius: 8, border: "none", background: saving || !form.beneficiary_id || !form.amount ? "rgba(80,140,210,0.2)" : "linear-gradient(135deg,#3a9ad9,#2a7ab8)", color: "white", fontSize: 14, fontWeight: 700, cursor: saving || !form.beneficiary_id || !form.amount ? "default" : "pointer" }}>
            {saving ? "Saving…" : "Record Payout"}
          </button>
        </div>
      </Card>

      {/* Payouts table */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid rgba(100,160,220,0.22)" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#a0c8e8", letterSpacing: "0.08em", textTransform: "uppercase" }}>PAYOUT HISTORY</span>
        </div>
        {payouts.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#7ab0cc", fontSize: 15 }}>No payouts recorded yet.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(100,160,220,0.3)" }}>
                {["Beneficiary", "Role", "Amount", "Paid On", "Note", ""].map((h) => (
                  <th key={h} style={{ padding: "11px 18px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#a0c8e8", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payouts.map((p, i) => (
                <tr key={p.id}
                  style={{ borderBottom: i < payouts.length - 1 ? "1px solid rgba(100,160,220,0.14)" : "none" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(100,160,220,0.04)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "12px 18px", fontSize: 15, fontWeight: 600, color: "#ffffff" }}>{p.beneficiary}</td>
                  <td style={{ padding: "12px 18px", fontSize: 14, color: "#7ab0cc", textTransform: "capitalize" }}>{p.beneficiary_type || "—"}</td>
                  <td style={{ padding: "12px 18px", fontSize: 15, fontWeight: 600, color: "#35c060" }}>{p.currency} {Number(p.amount).toLocaleString()}</td>
                  <td style={{ padding: "12px 18px", fontSize: 14, color: "#7ab0cc", whiteSpace: "nowrap" }}>{fmtDate(p.paid_on)}</td>
                  <td style={{ padding: "12px 18px", fontSize: 14, color: "#7ab0cc" }}>{p.note || "—"}</td>
                  <td style={{ padding: "12px 18px" }}>
                    <button onClick={() => deletePayout(p.id)}
                      style={{ background: "rgba(30,10,10,0.7)", color: "#e88a8a", border: "1px solid rgba(220,100,100,0.25)", borderRadius: 7, padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
