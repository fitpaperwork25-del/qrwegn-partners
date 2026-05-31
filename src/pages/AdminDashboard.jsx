import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const STAGES = ["Identified","Contacted","Interested","Evaluating","Onboarding","Active","Stalled","Declined"];

const STAGE_COLORS = {
  Identified: { bg: "rgba(100,160,220,0.3)", color: "#5ab0f0", dot: "#5aaae0" },
  Contacted:  { bg: "rgba(120,180,240,0.12)", color: "#5aaae0", dot: "#4a9ad0" },
  Interested: { bg: "rgba(80,180,140,0.12)", color: "#35c080", dot: "#3abf8a" },
  Evaluating: { bg: "rgba(240,180,60,0.12)", color: "#f0c040", dot: "#e0a830" },
  Onboarding: { bg: "rgba(160,100,220,0.1)", color: "#c080f0", dot: "#a060e0" },
  Active:     { bg: "rgba(40,180,80,0.12)", color: "#35c060", dot: "#2ac860" },
  Stalled:    { bg: "rgba(220,160,60,0.1)", color: "#e0a030", dot: "#d09030" },
  Declined:   { bg: "rgba(220,80,80,0.2)", color: "#f07070", dot: "#d05050" },
};

const Card = ({ children, style = {} }) => (
  <div style={{
    background: "rgba(10,20,45,0.95)", backdropFilter: "blur(16px)",
    borderRadius: 14, border: "1px solid rgba(50,80,140,0.4)",
    boxShadow: "0 2px 16px rgba(100,160,220,0.22)", padding: "20px 22px",
    ...style
  }}>{children}</div>
);

const StageBadge = ({ stage }) => {
  const c = STAGE_COLORS[stage] || STAGE_COLORS.Identified;
  return (
    <span style={{
      background: c.bg, color: c.color, fontSize: 17, fontWeight: 600,
      padding: "3px 10px", borderRadius: 20, letterSpacing: "0.04em"
    }}>{stage}</span>
  );
};

const LEAD_STAGES = ["new", "contacted", "demo", "signed", "active", "churned"];

const LEAD_STATUS_COLORS = {
  new:       { color: "#5ab0f0", bg: "rgba(100,160,220,0.18)" },
  contacted: { color: "#38d4e8", bg: "rgba(56,212,232,0.12)" },
  demo:      { color: "#c080f0", bg: "rgba(160,100,220,0.14)" },
  signed:    { color: "#f0c040", bg: "rgba(240,180,60,0.14)" },
  active:    { color: "#35c060", bg: "rgba(40,180,80,0.12)" },
  churned:   { color: "#909090", bg: "rgba(140,140,140,0.12)" },
};

const LeadStatusBadge = ({ status }) => {
  const c = LEAD_STATUS_COLORS[status] || LEAD_STATUS_COLORS.new;
  return (
    <span style={{
      background: c.bg, color: c.color, fontSize: 12, fontWeight: 700,
      padding: "3px 10px", borderRadius: 20, letterSpacing: "0.06em",
      textTransform: "uppercase",
    }}>{status || "new"}</span>
  );
};

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminDashboard({ navigate }) {
  const [partners,  setPartners]  = useState([]);
  const [leads,     setLeads]     = useState([]);
  const [promotors, setPromotors] = useState([]);
  const [payouts,   setPayouts]   = useState([]);
  const [loading,   setLoading]   = useState(true);

  const today = new Date().toISOString().slice(0, 10);
  const [payoutForm, setPayoutForm] = useState({ beneficiary: "", amount: "", currency: "USD", paid_on: today, note: "" });

  const updateLead = async (id, patch) => {
    const { error } = await supabase.from("leads").update(patch).eq("id", id);
    if (error) { console.error("updateLead error:", error); return; }
    setLeads(ls => ls.map(l => l.id === id ? { ...l, ...patch } : l));
  };

  useEffect(() => {
    // Partners unblocks the dashboard render; races against 2.5s so setLoading(false)
    // always fires even if the query hangs.
    (async () => {
      try {
        const partnersFetch = supabase
          .from("partners").select("*").order("created_at", { ascending: false });
        const timeout = new Promise(resolve => setTimeout(resolve, 2500));
        const result = await Promise.race([partnersFetch, timeout]);
        if (result?.data) setPartners(result.data);
      } catch (e) {
        console.warn("partners fetch failed:", e);
      } finally {
        setLoading(false);
      }
    })();

    // Leads loads independently — a slow query never delays the page.
    supabase.from("leads")
      .select("*, submitted_by_partner:partners!leads_submitted_by_partner_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error) setLeads(data || []);
      });

    supabase.from("promotors").select("*").then(({ data, error }) => {
      if (!error) setPromotors(data || []);
    });

    supabase.from("payouts").select("*").order("paid_on", { ascending: false }).then(({ data, error }) => {
      if (!error) setPayouts(data || []);
    });
  }, []);

  const fetchPayouts = () =>
    supabase.from("payouts").select("*").order("paid_on", { ascending: false }).then(({ data, error }) => {
      if (!error) setPayouts(data || []);
    });

  const recordPayout = async () => {
    if (!payoutForm.beneficiary.trim() || !payoutForm.amount) return;
    const { error } = await supabase.from("payouts").insert({
      beneficiary: payoutForm.beneficiary.trim(),
      amount: Number(payoutForm.amount),
      currency: payoutForm.currency,
      paid_on: payoutForm.paid_on,
      note: payoutForm.note.trim() || null,
    });
    if (error) { console.error("recordPayout error:", error); return; }
    await fetchPayouts();
    setPayoutForm({ beneficiary: "", amount: "", currency: "USD", paid_on: today, note: "" });
  };

  const deletePayout = async (id) => {
    if (!window.confirm("Delete this payout?")) return;
    const { error } = await supabase.from("payouts").delete().eq("id", id);
    if (error) { console.error("deletePayout error:", error); return; }
    await fetchPayouts();
  };

  const leadStageCounts = LEAD_STAGES.reduce((acc, s) => {
    acc[s] = leads.filter(l => (l.status || "new") === s).length;
    return acc;
  }, {});

  const recentPartners = partners.slice(0, 5);

  if (loading) return (
    <div style={{ textAlign: "center", padding: "80px 0", color: "#a0c8e8", fontSize: 18 }}>
      Loading dashboard...
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <h1
          style={{
            color: "#ffffff",
            fontWeight: 800,
            fontSize: "56px",
            lineHeight: 1.05,
            margin: 0,
            marginBottom: 14,
            textShadow: "0 4px 18px rgba(0,0,0,0.65)",
            letterSpacing: "-1px",
          }}
        >
          Dashboard
        </h1>

        <p
          style={{
            color: "#ffffff",
            fontSize: "22px",
            fontWeight: 500,
            margin: 0,
            opacity: 1,
            textShadow: "0 3px 12px rgba(0,0,0,0.55)",
          }}
        >
          Overview of your sales pipeline and network
        </p>
      </div>

      {/* Metric row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Restaurants", value: leads.length,                                      sub: "in pipeline" },
          { label: "Signed",            value: leads.filter(l => l.status === "signed").length,   sub: "signed up" },
          { label: "Active",            value: leads.filter(l => l.status === "active").length,   sub: "live" },
          { label: "Partners",          value: partners.length,                                   sub: "regional partners" },
          { label: "Promotors",         value: promotors.length,                                  sub: "in network" },
        ].map(m => (
          <Card key={m.label} style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: 12, color: "#a0c8e8", letterSpacing: "0.06em", marginBottom: 6, fontWeight: 600 }}>{m.label.toUpperCase()}</div>
            <div style={{ fontSize: 34, fontWeight: 700, color: "#ffffff", lineHeight: 1 }}>{m.value}</div>
            <div style={{ fontSize: 13, color: "#7ab0cc", marginTop: 4 }}>{m.sub}</div>
          </Card>
        ))}
      </div>

      {/* Pipeline stages */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em", marginBottom: 16 }}>PIPELINE OVERVIEW</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {LEAD_STAGES.map(s => {
            const c = LEAD_STATUS_COLORS[s];
            const count = leadStageCounts[s] || 0;
            return (
              <div key={s} style={{
                background: c.bg, borderRadius: 10, padding: "10px 14px",
                display: "flex", flexDirection: "column", alignItems: "center", minWidth: 80, flex: 1
              }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: c.color }}>{count}</div>
                <div style={{ fontSize: 17, color: c.color, opacity: 0.8, textAlign: "center", marginTop: 2, textTransform: "capitalize" }}>{s}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Submitted leads */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em" }}>
            SUBMITTED LEADS
            <span style={{ marginLeft: 10, fontSize: 14, color: "#5ab0f0", fontWeight: 700 }}>{leads.length}</span>
          </div>
        </div>
        {leads.length === 0 ? (
          <p style={{ fontSize: 16, color: "#7ab0cc", textAlign: "center", padding: "24px 0" }}>No leads submitted yet</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(100,160,220,0.35)" }}>
                  {["Business", "Owner", "Phone", "Country", "Notes", "Status", "Follow-up", "Plan", "Price", "Promotor %", "Partner %", "Submitted by", "Date"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: "#a0c8e8", fontWeight: 700, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
                      {h.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((l, i) => (
                  <tr key={l.id}
                    style={{ borderBottom: i < leads.length - 1 ? "1px solid rgba(100,160,220,0.14)" : "none" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(100,160,220,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 600, color: "#ffffff", whiteSpace: "nowrap" }}>{l.business_name}</td>
                    <td style={{ padding: "12px 14px", fontSize: 14, color: "#b0cce0" }}>{l.contact_name || "—"}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#7ab0cc", whiteSpace: "nowrap" }}>{l.phone || "—"}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#7ab0cc" }}>{l.country || "—"}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#7ab0cc", maxWidth: 220 }}>
                      {l.notes ? (l.notes.length > 60 ? l.notes.slice(0, 60) + "…" : l.notes) : "—"}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <select
                        value={l.status || "new"}
                        onChange={e => updateLead(l.id, { status: e.target.value })}
                        style={{
                          background: "rgba(10,20,45,0.9)",
                          color: (LEAD_STATUS_COLORS[l.status] || LEAD_STATUS_COLORS.new).color,
                          border: "1px solid rgba(100,160,220,0.3)",
                          borderRadius: 12,
                          padding: "3px 8px",
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          cursor: "pointer",
                          outline: "none",
                        }}
                      >
                        {LEAD_STAGES.map(s => (
                          <option key={s} value={s} style={{ background: "#0a1428", color: "#e0f0ff" }}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <input
                        type="date"
                        value={l.follow_up_date || ""}
                        onChange={e => updateLead(l.id, { follow_up_date: e.target.value || null })}
                        style={{
                          background: "rgba(10,20,45,0.9)",
                          color: "#a0c8e8",
                          border: "1px solid rgba(100,160,220,0.25)",
                          borderRadius: 8,
                          padding: "3px 7px",
                          fontSize: 12,
                          outline: "none",
                          cursor: "pointer",
                        }}
                      />
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <select
                        value={l.plan || ""}
                        onChange={e => updateLead(l.id, { plan: e.target.value || null })}
                        style={{
                          background: "rgba(10,20,45,0.9)",
                          color: "#a0c8e8",
                          border: "1px solid rgba(100,160,220,0.3)",
                          borderRadius: 12,
                          padding: "3px 8px",
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          cursor: "pointer",
                          outline: "none",
                        }}
                      >
                        <option value="" style={{ background: "#0a1428", color: "#e0f0ff" }}>—</option>
                        {["Starter", "Pro", "Enterprise"].map(p => (
                          <option key={p} value={p} style={{ background: "#0a1428", color: "#e0f0ff" }}>{p}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <select
                          value={l.currency || "USD"}
                          onChange={e => updateLead(l.id, { currency: e.target.value })}
                          style={{
                            background: "rgba(10,20,45,0.9)",
                            color: "#a0c8e8",
                            border: "1px solid rgba(100,160,220,0.3)",
                            borderRadius: 8,
                            padding: "3px 5px",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            outline: "none",
                          }}
                        >
                          {["USD", "EUR", "GBP", "ETB", "SSP", "KES", "NGN"].map(c => (
                            <option key={c} value={c} style={{ background: "#0a1428", color: "#e0f0ff" }}>{c}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          placeholder="0"
                          value={l.monthly_value ?? ""}
                          onChange={e => updateLead(l.id, { monthly_value: e.target.value === "" ? null : Number(e.target.value) })}
                          style={{
                            background: "rgba(10,20,45,0.9)",
                            color: "#a0c8e8",
                            border: "1px solid rgba(100,160,220,0.25)",
                            borderRadius: 8,
                            padding: "3px 7px",
                            fontSize: 12,
                            outline: "none",
                            width: 70,
                          }}
                        />
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <input
                        type="number"
                        placeholder="0"
                        value={l.promotor_pct ?? ""}
                        onChange={e => updateLead(l.id, { promotor_pct: e.target.value === "" ? null : Number(e.target.value) })}
                        style={{
                          background: "rgba(10,20,45,0.9)",
                          color: "#a0c8e8",
                          border: "1px solid rgba(100,160,220,0.25)",
                          borderRadius: 8,
                          padding: "3px 7px",
                          fontSize: 12,
                          outline: "none",
                          width: 55,
                          display: "block",
                        }}
                      />
                      <div style={{ fontSize: 11, color: "#5a7a90", marginTop: 3 }}>
                        {l.monthly_value != null && l.promotor_pct != null
                          ? `${l.currency || "USD"} ${(l.monthly_value * l.promotor_pct / 100).toFixed(2)}`
                          : "—"}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <input
                        type="number"
                        placeholder="0"
                        value={l.partner_pct ?? ""}
                        onChange={e => updateLead(l.id, { partner_pct: e.target.value === "" ? null : Number(e.target.value) })}
                        style={{
                          background: "rgba(10,20,45,0.9)",
                          color: "#a0c8e8",
                          border: "1px solid rgba(100,160,220,0.25)",
                          borderRadius: 8,
                          padding: "3px 7px",
                          fontSize: 12,
                          outline: "none",
                          width: 55,
                          display: "block",
                        }}
                      />
                      <div style={{ fontSize: 11, color: "#5a7a90", marginTop: 3 }}>
                        {l.monthly_value != null && l.partner_pct != null
                          ? `${l.currency || "USD"} ${(l.monthly_value * l.partner_pct / 100).toFixed(2)}`
                          : "—"}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#5ab0f0", whiteSpace: "nowrap" }}>{l.submitted_by_partner?.full_name || "—"}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#7ab0cc", whiteSpace: "nowrap" }}>{fmtDate(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Payouts */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em", marginBottom: 16 }}>PAYOUTS</div>

        {/* Record payout form */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 20 }}>
          <input
            placeholder="Beneficiary"
            value={payoutForm.beneficiary}
            onChange={e => setPayoutForm(f => ({ ...f, beneficiary: e.target.value }))}
            style={{ background: "rgba(10,20,45,0.9)", color: "#a0c8e8", border: "1px solid rgba(100,160,220,0.25)", borderRadius: 8, padding: "5px 10px", fontSize: 13, outline: "none", width: 150 }}
          />
          <input
            type="number"
            placeholder="Amount"
            value={payoutForm.amount}
            onChange={e => setPayoutForm(f => ({ ...f, amount: e.target.value }))}
            style={{ background: "rgba(10,20,45,0.9)", color: "#a0c8e8", border: "1px solid rgba(100,160,220,0.25)", borderRadius: 8, padding: "5px 10px", fontSize: 13, outline: "none", width: 100 }}
          />
          <select
            value={payoutForm.currency}
            onChange={e => setPayoutForm(f => ({ ...f, currency: e.target.value }))}
            style={{ background: "rgba(10,20,45,0.9)", color: "#a0c8e8", border: "1px solid rgba(100,160,220,0.3)", borderRadius: 8, padding: "5px 7px", fontSize: 13, fontWeight: 700, cursor: "pointer", outline: "none" }}
          >
            {["USD", "EUR", "GBP", "ETB", "SSP", "KES", "NGN"].map(c => (
              <option key={c} value={c} style={{ background: "#0a1428", color: "#e0f0ff" }}>{c}</option>
            ))}
          </select>
          <input
            type="date"
            value={payoutForm.paid_on}
            onChange={e => setPayoutForm(f => ({ ...f, paid_on: e.target.value }))}
            style={{ background: "rgba(10,20,45,0.9)", color: "#a0c8e8", border: "1px solid rgba(100,160,220,0.25)", borderRadius: 8, padding: "5px 7px", fontSize: 13, outline: "none", cursor: "pointer" }}
          />
          <input
            placeholder="Note (optional)"
            value={payoutForm.note}
            onChange={e => setPayoutForm(f => ({ ...f, note: e.target.value }))}
            style={{ background: "rgba(10,20,45,0.9)", color: "#a0c8e8", border: "1px solid rgba(100,160,220,0.25)", borderRadius: 8, padding: "5px 10px", fontSize: 13, outline: "none", width: 180 }}
          />
          <button
            onClick={recordPayout}
            style={{ background: "#1a4080", color: "#a0c8e8", border: "1px solid rgba(100,160,220,0.4)", borderRadius: 8, padding: "5px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            Record payout
          </button>
        </div>

        {/* Payouts table */}
        {payouts.length === 0 ? (
          <p style={{ fontSize: 15, color: "#5a7a90", textAlign: "center", padding: "16px 0" }}>No payouts recorded yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(100,160,220,0.35)" }}>
                  {["Beneficiary", "Amount", "Paid on", "Note", ""].map(h => (
                    <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 11, color: "#a0c8e8", fontWeight: 700, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
                      {h.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payouts.map((p, i) => (
                  <tr key={p.id}
                    style={{ borderBottom: i < payouts.length - 1 ? "1px solid rgba(100,160,220,0.14)" : "none" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(100,160,220,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "10px 14px", fontSize: 14, fontWeight: 600, color: "#ffffff" }}>{p.beneficiary}</td>
                    <td style={{ padding: "10px 14px", fontSize: 14, color: "#a0c8e8", whiteSpace: "nowrap" }}>{p.currency} {Number(p.amount).toLocaleString()}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "#7ab0cc", whiteSpace: "nowrap" }}>{fmtDate(p.paid_on)}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "#7ab0cc" }}>{p.note || "—"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <button
                        onClick={() => deletePayout(p.id)}
                        style={{ background: "rgba(30,10,10,0.7)", color: "#e88a8a", border: "1px solid rgba(220,100,100,0.25)", borderRadius: 7, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                      >Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Stage breakdown */}
        <Card>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em", marginBottom: 16 }}>STAGE BREAKDOWN</div>
          {LEAD_STAGES.filter(s => leadStageCounts[s] > 0).map(s => {
            const c = LEAD_STATUS_COLORS[s];
            const count = leadStageCounts[s];
            const pct = leads.length > 0 ? Math.round(count / leads.length * 100) : 0;
            return (
              <div key={s} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 15, color: c.color, fontWeight: 500, textTransform: "capitalize" }}>{s}</span>
                  <span style={{ fontSize: 15, color: "#7ab0cc" }}>{count} ({pct}%)</span>
                </div>
                <div style={{ height: 6, background: "rgba(100,160,220,0.12)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: c.color, borderRadius: 3, opacity: 0.7, transition: "width 0.4s" }} />
                </div>
              </div>
            );
          })}
          {leads.length === 0 && (
            <p style={{ fontSize: 16, color: "#7ab0cc", textAlign: "center", padding: "20px 0" }}>No leads yet.</p>
          )}
        </Card>

        {/* Recent partners */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em" }}>RECENT PARTNERS</div>
            <button onClick={() => navigate("partners")} style={{ fontSize: 18, color: "#5ab0f0", background: "none", border: "none", cursor: "pointer" }}>View all →</button>
          </div>
          {recentPartners.length === 0 && (
            <p style={{ fontSize: 16, color: "#7ab0cc", textAlign: "center", padding: "20px 0" }}>No partners yet</p>
          )}
          {recentPartners.map(p => (
            <div key={p.id} onClick={() => navigate("partner-profile", { partnerId: p.id })}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(100,160,220,0.22)", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: "linear-gradient(135deg, #1a3560, #0d2045)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700, color: "#5ab0f0", flexShrink: 0
                }}>{(p.full_name || "?").split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#ffffff" }}>{p.full_name}</div>
                  <div style={{ fontSize: 14, color: "#7ab0cc" }}>{p.territory || "—"}</div>
                </div>
              </div>
              <StageBadge stage={p.stage || "Identified"} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

export { STAGE_COLORS, STAGES, StageBadge, Card };
