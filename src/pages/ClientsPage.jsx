import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Card } from "./AdminDashboard";

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("leads")
      .select("*, submitted_by_partner:partners!leads_submitted_by_partner_id_fkey(full_name)")
      .in("status", ["signed", "active"])
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error) setClients(data || []);
        setLoading(false);
      });
  }, []);

  const mrr = clients
    .filter((c) => c.monthly_value)
    .reduce((s, c) => s + Number(c.monthly_value), 0);

  if (loading) return (
    <div style={{ textAlign: "center", padding: "80px 0", color: "#a0c8e8", fontSize: 16 }}>Loading clients…</div>
  );

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#ffffff", margin: 0 }}>Clients</h1>
        <p style={{ fontSize: 15, color: "#a0c8e8", margin: "6px 0 0" }}>
          Signed and active businesses — {clients.length} total · USD {mrr.toLocaleString()} MRR
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Clients",  value: clients.length,                                     color: "#ffffff" },
          { label: "Live / Active",  value: clients.filter((c) => c.status === "active").length, color: "#35c060" },
          { label: "Monthly Revenue",value: `$${mrr.toLocaleString()}`,                          color: "#e8c547" },
        ].map((s) => (
          <Card key={s.label} style={{ padding: "20px 24px" }}>
            <div style={{ fontSize: 12, color: "#7ab0cc", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {clients.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#7ab0cc", fontSize: 15 }}>
            No signed or active clients yet.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(100,160,220,0.3)" }}>
                {["Business", "Contact", "Country", "Status", "Plan", "Monthly Value", "Client Since"].map((h) => (
                  <th key={h} style={{ padding: "12px 18px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#a0c8e8", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c, i) => (
                <tr key={c.id}
                  style={{ borderBottom: i < clients.length - 1 ? "1px solid rgba(100,160,220,0.14)" : "none", transition: "background 0.1s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(100,160,220,0.04)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px 18px", fontSize: 15, fontWeight: 600, color: "#ffffff" }}>{c.business_name}</td>
                  <td style={{ padding: "14px 18px", fontSize: 15, color: "#b0cce0" }}>{c.contact_name || "—"}</td>
                  <td style={{ padding: "14px 18px", fontSize: 15, color: "#a0c8e8" }}>{c.country || "—"}</td>
                  <td style={{ padding: "14px 18px" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: c.status === "active" ? "rgba(40,180,80,0.12)" : "rgba(240,180,60,0.14)", color: c.status === "active" ? "#35c060" : "#f0c040", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 18px", fontSize: 15, color: "#a0c8e8" }}>{c.plan || "—"}</td>
                  <td style={{ padding: "14px 18px", fontSize: 15, fontWeight: 600, color: "#e8c547" }}>
                    {c.monthly_value != null ? `${c.currency || "USD"} ${Number(c.monthly_value).toLocaleString()}` : "—"}
                  </td>
                  <td style={{ padding: "14px 18px", fontSize: 14, color: "#7ab0cc", whiteSpace: "nowrap" }}>{fmtDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
