import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const STATUS_COLORS = {
  pending: { color: "#f0c040", bg: "rgba(240,180,60,0.14)" },
  sent:    { color: "#35c060", bg: "rgba(40,180,80,0.12)"  },
  failed:  { color: "#f07070", bg: "rgba(220,80,80,0.18)"  },
};

const Card = ({ children, style = {} }) => (
  <div style={{
    background: "rgba(10,20,45,0.95)", backdropFilter: "blur(16px)",
    borderRadius: 14, border: "1px solid rgba(50,80,140,0.4)",
    boxShadow: "0 2px 16px rgba(100,160,220,0.22)", padding: "20px 22px",
    ...style,
  }}>{children}</div>
);

const StatusBadge = ({ status }) => {
  const c = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span style={{
      background: c.bg, color: c.color, fontSize: 11, fontWeight: 700,
      padding: "3px 10px", borderRadius: 20, letterSpacing: "0.06em",
      textTransform: "uppercase",
    }}>{status}</span>
  );
};

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const emptyForm = { recipient_email: "", subject: "", body: "" };

export default function NotificationsPage() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState(emptyForm);
  const [saving,  setSaving]  = useState(false);
  const [trigger, setTrigger] = useState({ loading: false, result: null });
  const [filter,  setFilter]  = useState("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notification_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (!error && data) setLogs(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const counts = {
    all:     logs.length,
    pending: logs.filter(l => l.status === "pending").length,
    sent:    logs.filter(l => l.status === "sent").length,
    failed:  logs.filter(l => l.status === "failed").length,
  };

  const visible = filter === "all" ? logs : logs.filter(l => l.status === filter);

  const createNotification = async () => {
    if (!form.recipient_email.trim() || !form.subject.trim() || !form.body.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("notification_logs").insert({
      recipient_email: form.recipient_email.trim(),
      subject:         form.subject.trim(),
      body:            form.body.trim(),
      status:          "pending",
    });
    if (!error) {
      setForm(emptyForm);
      await load();
    } else {
      console.error("createNotification error:", error);
    }
    setSaving(false);
  };

  const deleteLog = async (id) => {
    if (!window.confirm("Delete this notification log entry?")) return;
    await supabase.from("notification_logs").delete().eq("id", id);
    setLogs(ls => ls.filter(l => l.id !== id));
  };

  const triggerSend = async () => {
    setTrigger({ loading: true, result: null });
    try {
      const { data, error } = await supabase.functions.invoke("send-pending-notifications");
      setTrigger({ loading: false, result: error ? `Error: ${error.message}` : `Sent: ${data?.sent ?? 0}  Failed: ${data?.failed ?? 0}` });
    } catch (e) {
      setTrigger({ loading: false, result: `Error: ${e.message}` });
    }
    await load();
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: "#ffffff", fontWeight: 800, fontSize: 48, margin: 0, marginBottom: 10, letterSpacing: "-1px" }}>
          Notifications
        </h1>
        <p style={{ color: "#a0c8e8", fontSize: 17, margin: 0 }}>
          Compose and manage email notifications sent to partners and promotors
        </p>
      </div>

      {/* Stat chips */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { key: "all",     label: "All",     color: "#a0c8e8" },
          { key: "pending", label: "Pending", color: "#f0c040" },
          { key: "sent",    label: "Sent",    color: "#35c060" },
          { key: "failed",  label: "Failed",  color: "#f07070" },
        ].map(({ key, label, color }) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            background: filter === key ? "rgba(100,160,220,0.18)" : "rgba(10,20,45,0.8)",
            color: filter === key ? color : "rgba(255,255,255,0.45)",
            border: `1px solid ${filter === key ? "rgba(100,160,220,0.5)" : "rgba(100,160,220,0.18)"}`,
            borderRadius: 20, padding: "6px 16px", fontSize: 13, fontWeight: 700,
            cursor: "pointer", transition: "all 0.15s",
          }}>
            {label} <span style={{ marginLeft: 4, opacity: 0.8 }}>{counts[key]}</span>
          </button>
        ))}

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          {trigger.result && (
            <span style={{ fontSize: 13, color: trigger.result.startsWith("Error") ? "#f07070" : "#35c060" }}>
              {trigger.result}
            </span>
          )}
          <button onClick={triggerSend} disabled={trigger.loading || counts.pending === 0} style={{
            background: counts.pending > 0 ? "#1a4080" : "rgba(10,20,45,0.5)",
            color: counts.pending > 0 ? "#a0c8e8" : "#4a6080",
            border: "1px solid rgba(100,160,220,0.35)", borderRadius: 8,
            padding: "7px 18px", fontSize: 13, fontWeight: 700,
            cursor: counts.pending > 0 ? "pointer" : "not-allowed", whiteSpace: "nowrap",
          }}>
            {trigger.loading ? "Sending…" : `Send Pending (${counts.pending})`}
          </button>
        </div>
      </div>

      {/* Compose form */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#a0c8e8", letterSpacing: "0.08em", marginBottom: 14 }}>
          COMPOSE NOTIFICATION
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
          <input
            placeholder="recipient@email.com"
            value={form.recipient_email}
            onChange={e => setForm(f => ({ ...f, recipient_email: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="Subject"
            value={form.subject}
            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            style={{ ...inputStyle, flex: 2 }}
          />
          <textarea
            placeholder="Email body (HTML supported)"
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            rows={3}
            style={{ ...inputStyle, flex: "1 1 100%", resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
          />
          <button
            onClick={createNotification}
            disabled={saving || !form.recipient_email || !form.subject || !form.body}
            style={{
              background: "#1a4080", color: "#a0c8e8",
              border: "1px solid rgba(100,160,220,0.4)", borderRadius: 8,
              padding: "7px 20px", fontSize: 13, fontWeight: 700,
              cursor: "pointer", whiteSpace: "nowrap", alignSelf: "flex-end",
            }}
          >
            {saving ? "Adding…" : "Add to queue"}
          </button>
        </div>
      </Card>

      {/* Logs table */}
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#a0c8e8", letterSpacing: "0.08em", marginBottom: 14 }}>
          NOTIFICATION LOG
          <span style={{ marginLeft: 10, fontSize: 13, color: "#5ab0f0", fontWeight: 700 }}>{visible.length}</span>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "#7ab0cc", padding: "32px 0" }}>Loading…</p>
        ) : visible.length === 0 ? (
          <p style={{ textAlign: "center", color: "#5a7a90", padding: "32px 0" }}>No notifications yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(100,160,220,0.35)" }}>
                  {["Recipient", "Subject", "Status", "Created", "Sent at", "Error", ""].map(h => (
                    <th key={h} style={{
                      padding: "8px 14px", textAlign: "left", fontSize: 11,
                      color: "#a0c8e8", fontWeight: 700, letterSpacing: "0.08em", whiteSpace: "nowrap",
                    }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((row, i) => (
                  <tr key={row.id}
                    style={{ borderBottom: i < visible.length - 1 ? "1px solid rgba(100,160,220,0.14)" : "none" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(100,160,220,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "#5ab0f0", whiteSpace: "nowrap" }}>{row.recipient_email}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "#d0e8ff", maxWidth: 280 }}>
                      {row.subject?.length > 60 ? row.subject.slice(0, 60) + "…" : row.subject}
                    </td>
                    <td style={{ padding: "10px 14px" }}><StatusBadge status={row.status} /></td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#7ab0cc", whiteSpace: "nowrap" }}>{fmtDate(row.created_at)}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#7ab0cc", whiteSpace: "nowrap" }}>{fmtDate(row.sent_at)}</td>
                    <td style={{ padding: "10px 14px", fontSize: 11, color: "#f07070", maxWidth: 260 }}>
                      {row.error_message || "—"}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <button
                        onClick={() => deleteLog(row.id)}
                        style={{
                          background: "rgba(30,10,10,0.7)", color: "#e88a8a",
                          border: "1px solid rgba(220,100,100,0.25)", borderRadius: 7,
                          padding: "3px 10px", fontSize: 11, fontWeight: 700,
                          cursor: "pointer", whiteSpace: "nowrap",
                        }}
                      >Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

const inputStyle = {
  background: "rgba(10,20,45,0.9)",
  color: "#a0c8e8",
  border: "1px solid rgba(100,160,220,0.25)",
  borderRadius: 8,
  padding: "6px 10px",
  fontSize: 13,
  outline: "none",
  flex: 1,
  minWidth: 160,
};
