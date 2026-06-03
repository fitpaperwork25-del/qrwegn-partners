import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { STAGE_COLORS, STAGES, StageBadge, Card } from "./AdminDashboard";

// ── Shared style constants ─────────────────────────────────────────
const LEAD_STATUS_COLORS = {
  new:       { color: "#5ab0f0", bg: "rgba(100,160,220,0.18)" },
  contacted: { color: "#38d4e8", bg: "rgba(56,212,232,0.12)" },
  demo:      { color: "#c080f0", bg: "rgba(160,100,220,0.14)" },
  signed:    { color: "#f0c040", bg: "rgba(240,180,60,0.14)" },
  active:    { color: "#35c060", bg: "rgba(40,180,80,0.12)" },
  churned:   { color: "#909090", bg: "rgba(140,140,140,0.12)" },
};

const TRAINING_STATUS_COLORS = {
  completed:   { bg: "rgba(40,180,80,0.1)",   color: "#35c060", label: "Completed" },
  in_progress: { bg: "rgba(240,180,60,0.12)", color: "#f0c040", label: "In Progress" },
  pending:     { bg: "rgba(100,160,220,0.3)", color: "#5ab0f0", label: "Pending" },
  assigned:    { bg: "rgba(100,160,220,0.3)", color: "#5ab0f0", label: "Assigned" },
};

const PROMOTOR_STATUS_STYLE = {
  Interested: { color: "#5ab0f0", bg: "rgba(100,160,220,0.18)" },
  active:     { color: "#35c060", bg: "rgba(40,180,80,0.12)"   },
  rejected:   { color: "#f07070", bg: "rgba(220,80,80,0.12)"   },
};
const promotorStatusStyle = (s) =>
  PROMOTOR_STATUS_STYLE[s] || { color: "#a0c8e8", bg: "rgba(100,160,220,0.1)" };

const TABS = ["overview", "promotors", "leads", "earnings", "communication", "training", "materials"];
const EARNING_STATUSES = ["signed", "active"];

const TH = ({ children }) => (
  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: "#a0c8e8", fontWeight: 700, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
    {children}
  </th>
);

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const LeadStatusBadge = ({ status }) => {
  const c = LEAD_STATUS_COLORS[status] || LEAD_STATUS_COLORS.new;
  return (
    <span style={{
      background: c.bg, color: c.color, fontSize: 11, fontWeight: 700,
      padding: "3px 9px", borderRadius: 20, letterSpacing: "0.06em",
      textTransform: "uppercase", whiteSpace: "nowrap",
    }}>{status || "new"}</span>
  );
};

// ── Component ──────────────────────────────────────────────────────
export default function PartnerProfile({ partnerId, navigate }) {
  const [partner,          setPartner]          = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [activeTab,        setTab]              = useState("overview");

  // Communication log
  const [note,             setNote]             = useState("");
  const [commType,         setCommType]         = useState("Call");
  const [commLog,          setCommLog]          = useState([]);
  const [commLoading,      setCommLoading]      = useState(false);
  const [saving,           setSaving]           = useState(false);

  // Training & Materials
  const [training,         setTraining]         = useState([]);
  const [trainingLoading,  setTrainingLoading]  = useState(false);
  const [trainingError,    setTrainingError]    = useState(null);
  const [materials,        setMaterials]        = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);

  // Promotors, Leads, Payouts
  const [subPartners,      setSubPartners]      = useState([]);
  const [promotors,        setPromotors]        = useState([]);
  const [leads,            setLeads]            = useState([]);
  const [partnerPayouts,   setPartnerPayouts]   = useState([]);
  const [dataLoading,      setDataLoading]      = useState(false);
  const [linkCopied,       setLinkCopied]       = useState(false);
  const [approvingId,      setApprovingId]      = useState(null);
  const [loginCreating,    setLoginCreating]    = useState(null);
  const [loginStatus,      setLoginStatus]      = useState({});
  const [loginLinks,       setLoginLinks]       = useState({});
  const [linkCopiedId,     setLinkCopiedId]     = useState(null);

  // Payout modal
  const [showPayoutModal,  setShowPayoutModal]  = useState(false);
  const [savingPayout,     setSavingPayout]     = useState(false);
  const [payoutError,      setPayoutError]      = useState("");
  const [payoutForm,       setPayoutForm]       = useState({
    amount: "", currency: "USD", payment_method: "Bank Transfer",
    payout_date: new Date().toISOString().slice(0, 10), notes: "",
  });

  // ── Loaders ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!partnerId) { setLoading(false); return; }
    supabase
      .from("partners")
      .select("*")
      .eq("id", partnerId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setPartner(data);
        setLoading(false);
      });
  }, [partnerId]);

  const loadComms = async () => {
    if (!partnerId) return;
    setCommLoading(true);
    const { data, error } = await supabase
      .from("communications")
      .select("*")
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: false });
    if (!error) setCommLog(data || []);
    setCommLoading(false);
  };
  useEffect(() => { loadComms(); }, [partnerId]);

  useEffect(() => {
    if (!partnerId) return;
    setTrainingLoading(true);
    supabase
      .from("partner_training")
      .select("*")
      .eq("partner_id", partnerId)
      .then(({ data, error }) => {
        if (error) setTrainingError(error.message);
        setTraining(data || []);
        setTrainingLoading(false);
      });
  }, [partnerId]);

  useEffect(() => {
    setMaterialsLoading(true);
    supabase
      .from("outreach_materials")
      .select("*")
      .eq("is_official", true)
      .order("title")
      .then(({ data, error }) => {
        if (!error) setMaterials(data || []);
        setMaterialsLoading(false);
      });
  }, []);

  // Load promotors, sub-partners, leads, payouts, and existing login status
  useEffect(() => {
    if (!partnerId) return;
    setDataLoading(true);
    const load = async () => {
      const [promotorRes, subPartnerRes, leadRes, payoutRes] = await Promise.all([
        supabase.from("promotors").select("*").eq("partner_id", partnerId).order("full_name"),
        supabase.from("partners").select("*").eq("parent_partner_id", partnerId).order("full_name"),
        supabase
          .from("leads")
          .select("*, submitted_by_partner:partners!leads_submitted_by_partner_id_fkey(full_name)")
          .or(`regional_partner_id.eq.${partnerId},submitted_by_partner_id.eq.${partnerId}`)
          .order("created_at", { ascending: false }),
        supabase
          .from("partner_payouts")
          .select("*")
          .eq("partner_id", partnerId)
          .order("payout_date", { ascending: false }),
      ]);
      if (!promotorRes.error)   setPromotors(promotorRes.data || []);
      if (!subPartnerRes.error) setSubPartners(subPartnerRes.data || []);
      if (!leadRes.error)       setLeads(leadRes.data || []);
      if (!payoutRes.error)     setPartnerPayouts(payoutRes.data || []);

      // Pre-check which promotors already have a login profile
      const pIds = (promotorRes.data || []).map(p => p.id).filter(Boolean);
      if (pIds.length > 0) {
        const { data: existingProfiles } = await supabase
          .from("profiles")
          .select("promotor_id")
          .in("promotor_id", pIds);
        const statusMap = {};
        (existingProfiles || []).forEach(row => {
          if (row.promotor_id) statusMap[row.promotor_id] = "exists";
        });
        setLoginStatus(statusMap);
      }

      setDataLoading(false);
    };
    load();
  }, [partnerId]);

  const handleSaveInteraction = async () => {
    if (!note.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("communications").insert({
      partner_id: partnerId, type: commType, notes: note.trim(),
    });
    setSaving(false);
    if (!error) { setNote(""); loadComms(); }
  };

  const updatePromotorStatus = async (promotorId, newStatus) => {
    setApprovingId(promotorId);
    const { error } = await supabase
      .from("promotors")
      .update({ status: newStatus })
      .eq("id", promotorId);
    if (!error) {
      setPromotors(prev => prev.map(p => p.id === promotorId ? { ...p, status: newStatus } : p));
    }
    setApprovingId(null);
  };

  const handleCreateLogin = async (pr) => {
    setLoginCreating(pr.id);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/create-promotor-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ promotorId: pr.id, email: pr.email, fullName: pr.full_name }),
    });
    const data = await res.json();
    setLoginCreating(null);
    if (res.status === 409) {
      setLoginStatus(prev => ({ ...prev, [pr.id]: "exists" }));
    } else if (res.ok) {
      setLoginStatus(prev => ({ ...prev, [pr.id]: "done" }));
      if (data.loginLink) setLoginLinks(prev => ({ ...prev, [pr.id]: data.loginLink }));
    } else {
      alert("Failed to create login: " + (data.error || "Unknown error"));
    }
  };

  const loadPayouts = async () => {
    if (!partnerId) return;
    const { data } = await supabase
      .from("partner_payouts")
      .select("*")
      .eq("partner_id", partnerId)
      .order("payout_date", { ascending: false });
    if (data) setPartnerPayouts(data);
  };

  const addPayout = async () => {
    if (!payoutForm.amount || !payoutForm.payout_date) return;
    setSavingPayout(true);
    setPayoutError("");
    const { error } = await supabase.from("partner_payouts").insert({
      partner_id:     partnerId,
      amount:         Number(payoutForm.amount),
      currency:       payoutForm.currency,
      payout_date:    payoutForm.payout_date,
      payment_method: payoutForm.payment_method || null,
      notes:          payoutForm.notes.trim() || null,
    });
    setSavingPayout(false);
    if (error) { setPayoutError(error.message); return; }
    setShowPayoutModal(false);
    setPayoutForm({ amount: "", currency: "USD", payment_method: "Bank Transfer", payout_date: new Date().toISOString().slice(0, 10), notes: "" });
    await loadPayouts();
  };

  // ── Computed values ───────────────────────────────────────────────

  // Per-currency earnings summary for this partner
  const earningsByCurrency = (() => {
    const map = {};
    leads
      .filter(l => EARNING_STATUSES.includes(l.status) && l.monthly_value != null && l.partner_pct != null)
      .forEach(l => {
        const cur = l.currency || "USD";
        if (!map[cur]) map[cur] = { owed: 0, paid: 0 };
        map[cur].owed += l.monthly_value * l.partner_pct / 100;
      });
    partnerPayouts.forEach(p => {
      const cur = p.currency || "USD";
      if (!map[cur]) map[cur] = { owed: 0, paid: 0 };
      map[cur].paid += Number(p.amount);
    });
    return map;
  })();

  // Promotors with lead counts + commission earned
  const promotorStats = promotors.map(pr => {
    const prLeads = leads.filter(l => l.submitted_by_promotor_id === pr.id);
    const commissionEarned = prLeads
      .filter(l => EARNING_STATUSES.includes(l.status) && l.monthly_value != null && l.promotor_pct != null)
      .reduce((sum, l) => sum + l.monthly_value * l.promotor_pct / 100, 0);
    return { ...pr, leadCount: prLeads.length, commissionEarned, isSubPartner: false };
  });

  // Sub-partners with lead counts + commission earned
  const subPartnerStats = subPartners.map(sp => {
    const spLeads = leads.filter(l => l.submitted_by_partner_id === sp.id || l.regional_partner_id === sp.id);
    const commissionEarned = spLeads
      .filter(l => EARNING_STATUSES.includes(l.status) && l.monthly_value != null && l.partner_pct != null)
      .reduce((sum, l) => sum + l.monthly_value * l.partner_pct / 100, 0);
    return { ...sp, leadCount: spLeads.length, commissionEarned, isSubPartner: true };
  });

  const allPromotors = [...promotorStats, ...subPartnerStats];

  // ── Guards ─────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ textAlign: "center", padding: "80px 0", color: "#a0c8e8", fontSize: 18 }}>
      Loading partner...
    </div>
  );

  if (!partner) return (
    <div style={{ textAlign: "center", padding: "80px 0" }}>
      <p style={{ color: "#f07070", fontSize: 18, marginBottom: 16 }}>Partner not found.</p>
      <button onClick={() => navigate("partners")}
        style={{ color: "#5ab0f0", background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>
        ← Back to Partners
      </button>
    </div>
  );

  const initials = (partner.full_name || "?").split(" ").map(n => n[0]).join("").slice(0, 2);

  // Helper: resolve "submitted by" label from a lead row
  const submittedByName = (l) => {
    if (l.submitted_by_partner?.full_name) return l.submitted_by_partner.full_name;
    if (l.submitted_by_promotor_id) {
      const pr = promotors.find(p => p.id === l.submitted_by_promotor_id);
      if (pr) return pr.full_name;
    }
    return "—";
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div>
      <button onClick={() => navigate("partners")}
        style={{ fontSize: 16, color: "#a0c8e8", background: "none", border: "none", cursor: "pointer", marginBottom: 20, padding: 0 }}>
        ← Back to Partners
      </button>

      {/* ── Header card ────────────────────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "linear-gradient(135deg, #1a3560, #0d2045)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 700, color: "#5ab0f0", flexShrink: 0,
            }}>{initials}</div>
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 700, color: "#ffffff", margin: 0 }}>{partner.full_name}</h2>
              <p style={{ fontSize: 16, color: "#a0c8e8", margin: "3px 0 6px" }}>{partner.territory || "—"}</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(partner.languages || []).map(l => (
                  <span key={l} style={{ fontSize: 13, background: "rgba(100,160,220,0.22)", color: "#90bcd8", padding: "2px 8px", borderRadius: 20 }}>{l}</span>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
            <StageBadge stage={partner.stage || "Identified"} />
            <button
              onClick={() => {
                const link = `https://qrwegn-partners.vercel.app/join/${partnerId}`;
                navigator.clipboard.writeText(link).then(() => {
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                });
              }}
              style={{
                padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: `1.5px solid ${linkCopied ? "rgba(40,180,80,0.5)" : "rgba(100,160,220,0.35)"}`,
                background: linkCopied ? "rgba(40,180,80,0.12)" : "rgba(8,16,36,0.8)",
                color: linkCopied ? "#35c060" : "#a0c8e8",
                cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
              }}
            >
              {linkCopied ? "✓ Copied!" : "Copy Referral Link"}
            </button>
            <select
              value={partner.stage || "Identified"}
              onChange={async (e) => {
                const newStage = e.target.value;
                setPartner(prev => ({ ...prev, stage: newStage }));
                const { error } = await supabase.from("partners").update({ stage: newStage }).eq("id", partner.id);
                if (error) alert("Stage save failed: " + error.message);
              }}
              style={{
                padding: "7px 12px", borderRadius: 8, fontSize: 14,
                border: "1.5px solid rgba(100,160,220,0.35)", background: "rgba(8,16,36,0.95)",
                color: "#ffffff", outline: "none", cursor: "pointer",
              }}>
              {STAGES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 24, marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(100,160,220,0.22)", flexWrap: "wrap" }}>
          {[
            { label: "Email",       value: partner.email || "—" },
            { label: "Phone",       value: partner.phone || "—" },
            { label: "Territory",   value: partner.territory || "—" },
            { label: "Source",      value: partner.source || "—" },
            { label: "Commission",  value: partner.commission_rate != null ? `${partner.commission_rate}%` : "—" },
            { label: "Market Tier", value: partner.market_tier || "—" },
            { label: "Joined",      value: fmtDate(partner.created_at) },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 12, color: "#7ab0cc", letterSpacing: "0.06em", marginBottom: 2 }}>{s.label.toUpperCase()}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#ffffff" }}>{s.value}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Tab bar ────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "rgba(8,16,36,0.8)", borderRadius: 12, padding: 4, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
            background: activeTab === t ? "rgba(90,176,240,0.18)" : "transparent",
            color: activeTab === t ? "#7dc4ff" : "#a0c8e8",
            fontSize: 14, fontWeight: activeTab === t ? 600 : 400,
            boxShadow: activeTab === t ? "inset 0 0 0 1px rgba(90,160,255,0.3)" : "none",
            textTransform: "capitalize", transition: "all 0.15s",
          }}>{t}</button>
        ))}
      </div>

      {/* ── Overview tab ───────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em", marginBottom: 14 }}>QUICK STATS</div>
            {[
              { label: "Total Leads",   value: leads.length },
              { label: "Active Leads",  value: leads.filter(l => l.status === "active").length },
              { label: "Signed Leads",  value: leads.filter(l => l.status === "signed").length },
              { label: "Promotors",     value: allPromotors.length },
              { label: "Training",      value: training.length ? `${training.filter(t => t.status === "completed").length}/${training.length} done` : "—" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(100,160,220,0.22)" }}>
                <span style={{ fontSize: 15, color: "#a0c8e8" }}>{s.label}</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#ffffff" }}>{s.value}</span>
              </div>
            ))}
          </Card>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em", marginBottom: 14 }}>RECENT ACTIVITY</div>
            {commLoading && <p style={{ color: "#7ab0cc", fontSize: 14 }}>Loading...</p>}
            {!commLoading && commLog.length === 0 && (
              <p style={{ fontSize: 14, color: "#7ab0cc", textAlign: "center", padding: "16px 0", opacity: 0.7 }}>
                No interactions logged yet.
              </p>
            )}
            {commLog.slice(0, 4).map(c => (
              <div key={c.id} style={{ paddingBottom: 10, marginBottom: 10, borderBottom: "1px solid rgba(100,160,220,0.18)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, background: "rgba(100,160,220,0.3)", color: "#5ab0f0", padding: "1px 8px", borderRadius: 20 }}>{c.type}</span>
                  <span style={{ fontSize: 12, color: "#7ab0cc" }}>{fmtDate(c.created_at)}</span>
                </div>
                <p style={{ fontSize: 14, color: "#a0c8e8", lineHeight: 1.5, margin: 0, opacity: 0.85 }}>{c.notes}</p>
              </div>
            ))}
            {commLog.length > 4 && (
              <button onClick={() => setTab("communication")} style={{ fontSize: 13, color: "#5ab0f0", background: "none", border: "none", cursor: "pointer", padding: "4px 0", fontWeight: 600 }}>
                View all {commLog.length} interactions →
              </button>
            )}
          </Card>
        </div>
      )}

      {/* ── Promotors tab ──────────────────────────────────────────── */}
      {activeTab === "promotors" && (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(100,160,220,0.22)" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em" }}>PROMOTORS &amp; SUB-PARTNERS</span>
            <span style={{ marginLeft: 10, fontSize: 13, color: "#5ab0f0", fontWeight: 700 }}>{allPromotors.length}</span>
          </div>
          {dataLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#7ab0cc", fontSize: 14 }}>Loading...</div>
          ) : allPromotors.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#4a7090", fontSize: 14 }}>
              No promotors or sub-partners linked to this partner yet.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(100,160,220,0.3)", background: "rgba(8,16,36,0.5)" }}>
                    <TH>Name</TH>
                    <TH>Type</TH>
                    <TH>Email</TH>
                    <TH>Phone</TH>
                    <TH>Territory</TH>
                    <TH>Status</TH>
                    <TH>Leads</TH>
                    <TH>Commission</TH>
                    <TH>Actions</TH>
                  </tr>
                </thead>
                <tbody>
                  {allPromotors.map((pr, i) => {
                    const sc      = promotorStatusStyle(pr.status);
                    const isPending = pr.status === "Interested";
                    const isBusy  = approvingId === pr.id;
                    return (
                      <tr key={pr.id}
                        style={{ borderBottom: i < allPromotors.length - 1 ? "1px solid rgba(100,160,220,0.14)" : "none", cursor: pr.isSubPartner ? "pointer" : "default", transition: "background 0.1s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(100,160,220,0.05)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        onClick={() => pr.isSubPartner && navigate("partner-profile", { partnerId: pr.id })}
                      >
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #1a3560, #0d2045)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#5ab0f0", flexShrink: 0 }}>
                              {(pr.full_name || "?").split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 600, color: pr.isSubPartner ? "#7dc4ff" : "#ffffff" }}>{pr.full_name}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontSize: 12, fontWeight: 600, background: pr.isSubPartner ? "rgba(100,160,220,0.18)" : "rgba(80,180,140,0.12)", color: pr.isSubPartner ? "#5ab0f0" : "#35c080", padding: "2px 9px", borderRadius: 20 }}>
                            {pr.isSubPartner ? "sub-partner" : (pr.type || "promotor")}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: 13, color: "#7ab0cc" }}>{pr.email || "—"}</td>
                        <td style={{ padding: "12px 14px", fontSize: 13, color: "#7ab0cc", whiteSpace: "nowrap" }}>{pr.phone || "—"}</td>
                        <td style={{ padding: "12px 14px", fontSize: 13, color: "#7ab0cc" }}>{pr.territory || pr.country || "—"}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, background: sc.bg, color: sc.color, padding: "3px 10px", borderRadius: 20, textTransform: "capitalize", whiteSpace: "nowrap" }}>
                            {pr.status || "—"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 600, color: "#ffffff" }}>{pr.leadCount}</td>
                        <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 600, color: pr.commissionEarned > 0 ? "#e8c547" : "#5a7a90" }}>
                          {pr.commissionEarned > 0 ? `USD ${pr.commissionEarned.toFixed(2)}` : "—"}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          {!pr.isSubPartner && isPending && (
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                onClick={e => { e.stopPropagation(); updatePromotorStatus(pr.id, "active"); }}
                                disabled={isBusy}
                                style={{ padding: "4px 12px", borderRadius: 7, border: "1px solid rgba(40,180,80,0.4)", background: "rgba(40,180,80,0.12)", color: "#35c060", fontSize: 12, fontWeight: 700, cursor: isBusy ? "default" : "pointer", whiteSpace: "nowrap" }}>
                                {isBusy ? "…" : "Approve"}
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); updatePromotorStatus(pr.id, "rejected"); }}
                                disabled={isBusy}
                                style={{ padding: "4px 12px", borderRadius: 7, border: "1px solid rgba(220,80,80,0.4)", background: "rgba(220,80,80,0.1)", color: "#f07070", fontSize: 12, fontWeight: 700, cursor: isBusy ? "default" : "pointer", whiteSpace: "nowrap" }}>
                                {isBusy ? "…" : "Reject"}
                              </button>
                            </div>
                          )}
                          {!pr.isSubPartner && pr.status === "active" && (() => {
                            const ls   = loginStatus[pr.id];
                            const link = loginLinks[pr.id];
                            if (ls === "done" && link) return (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(link);
                                  setLinkCopiedId(pr.id);
                                  setTimeout(() => setLinkCopiedId(null), 2000);
                                }}
                                style={{ padding: "4px 12px", borderRadius: 7, border: `1px solid ${linkCopiedId === pr.id ? "rgba(40,180,80,0.4)" : "rgba(100,160,220,0.4)"}`, background: linkCopiedId === pr.id ? "rgba(40,180,80,0.12)" : "rgba(100,160,220,0.12)", color: linkCopiedId === pr.id ? "#35c060" : "#5ab0f0", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                                {linkCopiedId === pr.id ? "Copied ✓" : "Copy Login Link"}
                              </button>
                            );
                            if (ls === "done") return (
                              <span style={{ fontSize: 12, fontWeight: 600, color: "#35c060" }}>Login Active ✓</span>
                            );
                            if (ls === "exists") return (
                              <span style={{ fontSize: 12, color: "#7ab0cc" }}>Login Already Created</span>
                            );
                            if (!pr.email) return (
                              <span style={{ fontSize: 12, color: "#5a7a90", fontStyle: "italic" }}>No email on file</span>
                            );
                            return (
                              <button
                                onClick={e => { e.stopPropagation(); handleCreateLogin(pr); }}
                                disabled={loginCreating === pr.id}
                                style={{ padding: "4px 12px", borderRadius: 7, border: "1px solid rgba(100,160,220,0.4)", background: "rgba(100,160,220,0.12)", color: "#5ab0f0", fontSize: 12, fontWeight: 700, cursor: loginCreating === pr.id ? "default" : "pointer", whiteSpace: "nowrap" }}>
                                {loginCreating === pr.id ? "…" : "Create Login"}
                              </button>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── Leads tab ──────────────────────────────────────────────── */}
      {activeTab === "leads" && (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(100,160,220,0.22)" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em" }}>LEADS</span>
            <span style={{ marginLeft: 10, fontSize: 13, color: "#5ab0f0", fontWeight: 700 }}>{leads.length}</span>
          </div>
          {dataLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#7ab0cc", fontSize: 14 }}>Loading...</div>
          ) : leads.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#4a7090", fontSize: 14 }}>
              No leads linked to this partner yet.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(100,160,220,0.35)", background: "rgba(8,16,36,0.5)" }}>
                    <TH>Business</TH>
                    <TH>Contact</TH>
                    <TH>Phone</TH>
                    <TH>Country</TH>
                    <TH>Status</TH>
                    <TH>Plan</TH>
                    <TH>Monthly Value</TH>
                    <TH>Promotor Comm</TH>
                    <TH>Partner Comm</TH>
                    <TH>Submitted By</TH>
                    <TH>Follow-up</TH>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l, i) => (
                    <tr key={l.id}
                      style={{ borderBottom: i < leads.length - 1 ? "1px solid rgba(100,160,220,0.14)" : "none", transition: "background 0.1s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(100,160,220,0.04)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 600, color: "#ffffff", whiteSpace: "nowrap" }}>{l.business_name}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#b0cce0" }}>{l.contact_name || "—"}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#7ab0cc", whiteSpace: "nowrap" }}>{l.phone || "—"}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#7ab0cc" }}>{l.country || "—"}</td>
                      <td style={{ padding: "12px 14px" }}><LeadStatusBadge status={l.status} /></td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#a0c8e8" }}>{l.plan || "—"}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: l.monthly_value ? 600 : 400, color: l.monthly_value ? "#e8c547" : "#5a7a90", whiteSpace: "nowrap" }}>
                        {l.monthly_value != null ? `${l.currency || "USD"} ${Number(l.monthly_value).toLocaleString()}` : "—"}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#a0c8e8", whiteSpace: "nowrap" }}>
                        {l.monthly_value != null && l.promotor_pct != null
                          ? `${l.currency || "USD"} ${(l.monthly_value * l.promotor_pct / 100).toFixed(2)}`
                          : "—"}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#a0c8e8", whiteSpace: "nowrap" }}>
                        {l.monthly_value != null && l.partner_pct != null
                          ? `${l.currency || "USD"} ${(l.monthly_value * l.partner_pct / 100).toFixed(2)}`
                          : "—"}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#5ab0f0", whiteSpace: "nowrap" }}>{submittedByName(l)}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#7ab0cc", whiteSpace: "nowrap" }}>{fmtDate(l.follow_up_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── Earnings tab ───────────────────────────────────────────── */}
      {activeTab === "earnings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Earnings summary cards */}
          {Object.keys(earningsByCurrency).length === 0 ? (
            <Card>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em", marginBottom: 14 }}>EARNINGS SUMMARY</div>
              <p style={{ fontSize: 14, color: "#5a7a90", textAlign: "center", padding: "20px 0" }}>
                No earnings yet. Commission accrues when leads reach <strong style={{ color: "#a0c8e8" }}>Signed</strong> or <strong style={{ color: "#a0c8e8" }}>Active</strong> status.
              </p>
            </Card>
          ) : Object.entries(earningsByCurrency).map(([cur, e]) => {
            const balance  = Math.max(0, e.owed - e.paid);
            const overpaid = e.paid > e.owed ? e.paid - e.owed : 0;
            return (
              <Card key={cur}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em", marginBottom: 16 }}>
                  EARNINGS SUMMARY — {cur}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
                  {[
                    { label: "Total Commission Owed", value: `${cur} ${e.owed.toFixed(2)}`,    color: "#a0c8e8" },
                    { label: "Total Paid",             value: `${cur} ${e.paid.toFixed(2)}`,    color: "#35c060" },
                    { label: "Balance Due",            value: `${cur} ${balance.toFixed(2)}`,   color: balance > 0 ? "#e8c547" : "#35c060" },
                    { label: "Overpaid",               value: `${cur} ${overpaid.toFixed(2)}`,  color: overpaid > 0 ? "#f07070" : "#5a7a90" },
                  ].map(s => (
                    <div key={s.label} style={{ background: "rgba(8,16,36,0.6)", borderRadius: 10, padding: "14px 16px", border: "1px solid rgba(50,80,140,0.3)" }}>
                      <div style={{ fontSize: 11, color: "#7ab0cc", letterSpacing: "0.06em", marginBottom: 6 }}>{s.label.toUpperCase()}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}

          {/* Record Payout button */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => { setPayoutError(""); setShowPayoutModal(true); }}
              style={{ padding: "9px 20px", borderRadius: 9, border: "1px solid rgba(90,176,240,0.4)", background: "rgba(90,176,240,0.12)", color: "#5ab0f0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              + Record Payout
            </button>
          </div>

          {/* Payout history */}
          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em", marginBottom: 14 }}>
              PAYOUT HISTORY
              <span style={{ marginLeft: 10, fontSize: 13, color: "#5ab0f0", fontWeight: 700 }}>{partnerPayouts.length}</span>
            </div>
            {partnerPayouts.length === 0 ? (
              <p style={{ fontSize: 14, color: "#5a7a90", textAlign: "center", padding: "16px 0" }}>No payouts recorded for this partner yet.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(100,160,220,0.3)" }}>
                    <TH>Date</TH><TH>Amount</TH><TH>Method</TH><TH>Notes</TH>
                  </tr>
                </thead>
                <tbody>
                  {partnerPayouts.map((p, i) => (
                    <tr key={p.id}
                      style={{ borderBottom: i < partnerPayouts.length - 1 ? "1px solid rgba(100,160,220,0.14)" : "none" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(100,160,220,0.04)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "10px 14px", fontSize: 13, color: "#7ab0cc", whiteSpace: "nowrap" }}>{fmtDate(p.payout_date)}</td>
                      <td style={{ padding: "10px 14px", fontSize: 14, fontWeight: 600, color: "#35c060", whiteSpace: "nowrap" }}>{p.currency || "USD"} {Number(p.amount).toFixed(2)}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: "#a0c8e8" }}>{p.payment_method || "—"}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: "#7ab0cc" }}>{p.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}

      {/* ── Communication tab ──────────────────────────────────────── */}
      {activeTab === "communication" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 16 }}>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em", marginBottom: 14 }}>LOG INTERACTION</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
              {["Call", "Email", "Meeting", "Message"].map(t => (
                <button key={t} onClick={() => setCommType(t)} style={{
                  padding: "6px 12px", borderRadius: 8, border: "1.5px solid",
                  borderColor: commType === t ? "#5ab0f0" : "rgba(100,160,220,0.35)",
                  background: commType === t ? "rgba(80,160,230,0.18)" : "transparent",
                  color: commType === t ? "#5ab0f0" : "#a0c8e8",
                  fontSize: 14, fontWeight: commType === t ? 600 : 400, cursor: "pointer",
                }}>{t}</button>
              ))}
            </div>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Notes from this interaction..."
              rows={5} style={{
                width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 15,
                border: "1.5px solid rgba(100,160,220,0.35)", background: "rgba(8,16,36,0.9)",
                color: "#ffffff", outline: "none", resize: "vertical", boxSizing: "border-box",
                fontFamily: "inherit", lineHeight: 1.6,
              }} />
            <button onClick={handleSaveInteraction} disabled={saving || !note.trim()} style={{
              marginTop: 10, width: "100%", padding: "10px 0", borderRadius: 10,
              background: saving || !note.trim() ? "rgba(80,160,230,0.2)" : "linear-gradient(135deg, #3a9ad9, #2a7ab8)",
              color: "white", border: "none", fontSize: 15, fontWeight: 600,
              cursor: saving || !note.trim() ? "default" : "pointer",
            }}>{saving ? "Saving..." : "Save Interaction"}</button>
          </Card>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em", marginBottom: 14 }}>
              COMMUNICATION LOG
              {commLog.length > 0 && <span style={{ marginLeft: 8, fontSize: 13, color: "#5ab0f0" }}>{commLog.length}</span>}
            </div>
            {commLoading && <p style={{ color: "#7ab0cc", fontSize: 14 }}>Loading...</p>}
            {!commLoading && commLog.length === 0 && (
              <p style={{ fontSize: 14, color: "#7ab0cc", textAlign: "center", padding: "20px 0" }}>No interactions logged yet.</p>
            )}
            {commLog.map(c => (
              <div key={c.id} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: "1px solid rgba(100,160,220,0.22)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, background: "rgba(100,160,220,0.3)", color: "#5ab0f0", padding: "2px 9px", borderRadius: 20 }}>{c.type}</span>
                  <span style={{ fontSize: 12, color: "#7ab0cc" }}>{fmtDate(c.created_at)}</span>
                </div>
                <p style={{ fontSize: 15, color: "#a0c8e8", lineHeight: 1.6, margin: 0, opacity: 0.8 }}>{c.notes}</p>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ── Training tab ───────────────────────────────────────────── */}
      {activeTab === "training" && (
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em", marginBottom: 16 }}>TRAINING PROGRESS</div>
          {trainingLoading && <p style={{ color: "#7ab0cc", fontSize: 14 }}>Loading...</p>}
          {!trainingLoading && trainingError && (
            <p style={{ fontSize: 14, color: "#f07070", padding: "10px 0" }}>Error: {trainingError}</p>
          )}
          {!trainingLoading && !trainingError && training.length === 0 && (
            <p style={{ fontSize: 14, color: "#7ab0cc", textAlign: "center", padding: "20px 0" }}>No training assigned yet.</p>
          )}
          {training.map(t => {
            const sc = TRAINING_STATUS_COLORS[t.status] || TRAINING_STATUS_COLORS.pending;
            return (
              <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid rgba(100,160,220,0.22)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(100,160,220,0.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>◻</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#ffffff" }}>{t.title}</div>
                    {t.description && <div style={{ fontSize: 13, color: "#7ab0cc", marginTop: 2 }}>{t.description}</div>}
                  </div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, background: sc.bg, color: sc.color, padding: "3px 10px", borderRadius: 20 }}>{sc.label}</span>
              </div>
            );
          })}
          <button style={{ marginTop: 14, fontSize: 15, color: "#5ab0f0", background: "rgba(80,160,230,0.15)", border: "1px solid rgba(80,160,230,0.35)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 500 }}>
            + Assign Training
          </button>
        </Card>
      )}

      {/* ── Materials tab ──────────────────────────────────────────── */}
      {activeTab === "materials" && (
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em", marginBottom: 16 }}>SHARED MATERIALS</div>
          {materialsLoading && <p style={{ color: "#7ab0cc", fontSize: 14 }}>Loading...</p>}
          {!materialsLoading && materials.length === 0 && (
            <p style={{ fontSize: 14, color: "#7ab0cc", textAlign: "center", padding: "20px 0" }}>No materials available.</p>
          )}
          {materials.map(m => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(100,160,220,0.22)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{m.type === "Video" ? "▷" : "◻"}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#ffffff" }}>{m.title}</div>
                  {m.description && <div style={{ fontSize: 13, color: "#7ab0cc", marginTop: 2 }}>{m.description}</div>}
                  {m.type && <div style={{ fontSize: 12, color: "#5ab0f0", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.type}</div>}
                </div>
              </div>
              {m.file_url ? (
                <a href={m.file_url} target="_blank" rel="noreferrer" style={{ fontSize: 14, color: "#5ab0f0", textDecoration: "none" }}>Download →</a>
              ) : (
                <span style={{ fontSize: 13, color: "#7ab0cc" }}>No file</span>
              )}
            </div>
          ))}
        </Card>
      )}

      {/* ── Record Payout Modal ─────────────────────────────────────── */}
      {showPayoutModal && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowPayoutModal(false); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24 }}>
          <div style={{ background: "#0d1a35", border: "1px solid rgba(90,160,255,0.2)", borderRadius: 16, padding: "32px 36px", width: 460, boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#ffffff", margin: 0 }}>Record Payout</h2>
              <button onClick={() => setShowPayoutModal(false)} style={{ background: "none", border: "none", color: "#7ab0cc", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>

            {/* Partner name (read-only) */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: "#a0c8e8", fontWeight: 600, letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>PARTNER</label>
              <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(8,16,36,0.8)", border: "1px solid rgba(100,160,220,0.2)", fontSize: 14, color: "#7ab0cc" }}>
                {partner?.full_name || "—"}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: "#a0c8e8", fontWeight: 600, letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>AMOUNT *</label>
                <input
                  type="number" min="0" step="0.01" placeholder="0.00"
                  value={payoutForm.amount}
                  onChange={e => setPayoutForm(f => ({ ...f, amount: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 14, border: "1.5px solid rgba(100,160,220,0.35)", background: "rgba(8,16,36,0.95)", color: "#ffffff", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#a0c8e8", fontWeight: 600, letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>CURRENCY</label>
                <select
                  value={payoutForm.currency}
                  onChange={e => setPayoutForm(f => ({ ...f, currency: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 14, border: "1.5px solid rgba(100,160,220,0.35)", background: "rgba(8,16,36,0.95)", color: "#ffffff", outline: "none", cursor: "pointer", boxSizing: "border-box" }}>
                  {["USD", "EUR", "GBP", "ETB", "SSP", "KES", "NGN"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: "#a0c8e8", fontWeight: 600, letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>PAYMENT METHOD</label>
              <select
                value={payoutForm.payment_method}
                onChange={e => setPayoutForm(f => ({ ...f, payment_method: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 14, border: "1.5px solid rgba(100,160,220,0.35)", background: "rgba(8,16,36,0.95)", color: "#ffffff", outline: "none", cursor: "pointer", boxSizing: "border-box" }}>
                <option>Cash</option>
                <option>Bank Transfer</option>
                <option>Mobile Money</option>
                <option>Other</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: "#a0c8e8", fontWeight: 600, letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>DATE *</label>
              <input
                type="date"
                value={payoutForm.payout_date}
                onChange={e => setPayoutForm(f => ({ ...f, payout_date: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 14, border: "1.5px solid rgba(100,160,220,0.35)", background: "rgba(8,16,36,0.95)", color: "#ffffff", outline: "none", cursor: "pointer", boxSizing: "border-box", colorScheme: "dark" }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: "#a0c8e8", fontWeight: 600, letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>NOTES</label>
              <textarea
                rows={3}
                placeholder="Optional notes..."
                value={payoutForm.notes}
                onChange={e => setPayoutForm(f => ({ ...f, notes: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 14, border: "1.5px solid rgba(100,160,220,0.35)", background: "rgba(8,16,36,0.95)", color: "#ffffff", outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box" }}
              />
            </div>

            {payoutError && (
              <p style={{ color: "#f07070", fontSize: 13, margin: "0 0 14px", padding: "8px 12px", background: "rgba(220,80,80,0.1)", borderRadius: 7, border: "1px solid rgba(220,80,80,0.25)" }}>
                {payoutError}
              </p>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowPayoutModal(false)}
                style={{ flex: 1, padding: "11px 0", borderRadius: 9, border: "1px solid rgba(100,160,220,0.3)", background: "transparent", color: "#a0c8e8", fontSize: 15, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={addPayout} disabled={savingPayout || !payoutForm.amount || !payoutForm.payout_date}
                style={{ flex: 2, padding: "11px 0", borderRadius: 9, border: "none", background: savingPayout || !payoutForm.amount || !payoutForm.payout_date ? "rgba(80,160,230,0.3)" : "linear-gradient(135deg, #3a9ad9, #2a7ab8)", color: "white", fontSize: 15, fontWeight: 700, cursor: savingPayout || !payoutForm.amount || !payoutForm.payout_date ? "default" : "pointer" }}>
                {savingPayout ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
