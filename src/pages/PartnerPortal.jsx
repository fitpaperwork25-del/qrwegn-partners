import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const CHECKLIST_ITEMS = [
  {
    item_key: "platform_overview",
    label: "Review platform overview",
    section: "training",
  },
  {
    item_key: "commission_structure",
    label: "Understand commission structure",
    section: "training",
  },
  {
    item_key: "demo_links",
    label: "Review demo links",
    section: "home",
  },
  {
    item_key: "sales_materials",
    label: "Review sales materials",
    section: "materials",
  },
  {
    item_key: "target_businesses",
    label: "Identify 3 target businesses",
    section: "leads",
  },
];

const DEFAULT_TRAINING = [
  {
    id: "platform-overview",
    title: "Platform Overview",
    type: "guide",
    description:
      "QRWegn helps restaurants and cafés accept QR orders. QRBooker helps salons and barbershops manage bookings.",
  },
  {
    id: "qrwegn-pitch",
    title: "How to Pitch QRWegn",
    type: "sales",
    description:
      "Lead with the problem: slow ordering, staff pressure, missed orders, and poor customer flow. Then show scan → order → kitchen.",
  },
  {
    id: "qrbooker-pitch",
    title: "How to Pitch QRBooker",
    type: "sales",
    description:
      "Focus on appointment control, barber/chair schedules, fewer missed calls, and cleaner customer booking.",
  },
  {
    id: "commission-structure",
    title: "Commission Structure",
    type: "money",
    description:
      "Commissions are based on the business plan, monthly value, partner percentage, promotor percentage, and payout records.",
  },
  {
    id: "demo-links-guide",
    title: "Where Demo Links Live",
    type: "demo",
    description:
      "Demo links are shown on the Home page. Use them to show prospects live examples before they commit.",
  },
];

const DEFAULT_MATERIALS = [
  {
    id: "restaurant-one-pager",
    title: "Restaurant Pitch One-Pager",
    type: "pitch",
    description:
      "Simple talking points for restaurants, cafés, hotels, and food courts.",
  },
  {
    id: "barber-one-pager",
    title: "Barbershop Pitch One-Pager",
    type: "pitch",
    description:
      "Simple talking points for barbershops, salons, beauty shops, and appointment-based businesses.",
  },
  {
    id: "whatsapp-script",
    title: "WhatsApp Outreach Script",
    type: "script",
    description:
      "Short message a partner or promotor can send to a business owner.",
  },
  {
    id: "facebook-copy",
    title: "Facebook / Social Copy",
    type: "social",
    description:
      "Ready-to-edit post copy for promoting QRWegn and QRBooker online.",
  },
];

const emptyLead = {
  business_name: "",
  owner_name: "",
  phone: "",
  country: "",
  notes: "",
};

const BASE_TABS = [
  { id: "home",          label: "Home"          },
  { id: "profile",       label: "My Profile"    },
  { id: "my-promotors",  label: "My Promotors"  },
  { id: "my-leads",      label: "My Leads"      },
  { id: "commissions",   label: "Commissions"   },
  { id: "training",      label: "Training"      },
  { id: "materials",     label: "Materials"     },
  { id: "leads",         label: "Submit Lead"   },
];

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const inputStyle = {
  width: "100%",
  padding: "11px 13px",
  borderRadius: 9,
  border: "1px solid rgba(50,80,140,0.3)",
  background: "rgba(4,10,26,0.85)",
  color: "#c0d8e8",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const Card = ({ children, style = {} }) => (
  <div
    style={{
      background: "rgba(10,20,45,0.95)",
      backdropFilter: "blur(16px)",
      borderRadius: 16,
      border: "1px solid rgba(50,80,140,0.3)",
      boxShadow: "0 4px 28px rgba(0,0,0,0.35)",
      padding: 24,
      ...style,
    }}
  >
    {children}
  </div>
);

const SectionLabel = ({ children }) => (
  <div
    style={{
      fontSize: 11,
      fontWeight: 700,
      color: "#4a7090",
      letterSpacing: "0.12em",
      marginBottom: 16,
    }}
  >
    {children}
  </div>
);

const FieldRow = ({ label, value }) => (
  <div
    style={{
      display: "flex",
      padding: "14px 0",
      borderBottom: "1px solid rgba(50,80,140,0.18)",
    }}
  >
    <div
      style={{
        width: 130,
        fontSize: 11,
        fontWeight: 700,
        color: "#4a7090",
        letterSpacing: "0.07em",
        flexShrink: 0,
      }}
    >
      {label.toUpperCase()}
    </div>
    <div
      style={{
        fontSize: 14,
        color: value ? "#c0d8e8" : "#3a5a6a",
        fontStyle: value ? "normal" : "italic",
      }}
    >
      {value || "Not set"}
    </div>
  </div>
);

export default function PartnerPortal({ profile, onLogout }) {
  const [tab, setTab] = useState("home");
  const [selectedLead, setSelectedLead] = useState(null);
  const [checklist, setChecklist] = useState(
    CHECKLIST_ITEMS.map((item) => ({ ...item, completed: false }))
  );
  const [promotors, setPromotors] = useState([]);
  const [materials, setMaterials] = useState(DEFAULT_MATERIALS);
  const [training, setTraining] = useState(DEFAULT_TRAINING);
  const [lead, setLead] = useState(emptyLead);
  const [leadSaving, setLeadSaving] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);
  const [leadError, setLeadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [recruitForm, setRecruitForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    country: "",
    languages: "",
    notes: "",
    type: "individual",
  });
  const [recruitSaving, setRecruitSaving] = useState(false);
  const [recruitSuccess, setRecruitSuccess] = useState(false);
  const [recruitError, setRecruitError] = useState("");
  const [showRecruitForm, setShowRecruitForm] = useState(false);
  const [recruitCredentials, setRecruitCredentials] = useState(null);
  const [loginSetupNotice, setLoginSetupNotice] = useState("");
  const [myLeads, setMyLeads] = useState([]);
  const [myPayouts, setMyPayouts] = useState([]);
  const [demoLinks, setDemoLinks] = useState([]);
  const [partnerId, setPartnerId] = useState(null);
  const [commissionTxns,  setCommissionTxns]  = useState([]);
  const [commTxnsLoading, setCommTxnsLoading] = useState(false);
  const [commSummary,     setCommSummary]     = useState(null); // rows from commission_summary_with_payouts

  useEffect(() => {
    loadAll();
  }, []);

  // Transient-only: never persist temporary credentials past the current view.
  useEffect(() => {
    setRecruitCredentials(null);
    setLoginSetupNotice("");
  }, [tab]);

  const loadAll = async () => {
    setLoading(true);

    // Resolve this partner's partner_id from profiles before loading any scoped data
    const { data: { user } } = await supabase.auth.getUser();
    let pid = null;
    if (user) {
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("partner_id")
        .eq("id", user.id)
        .single();
      pid = profileRow?.partner_id ?? null;
      setPartnerId(pid);
    }

    await Promise.all([
      loadChecklist(),
      loadPromotors(pid),
      loadMyLeads(pid),
      loadMyPayouts(pid),
      loadCommissionTxns(pid),
      loadCommSummary(pid),
      loadDemoLinks(),
      loadTraining(),
      loadMaterials(),
    ]);
    setLoading(false);
  };

  const getCurrentUserId = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user?.id || profile?.id || null;
  };

  const loadChecklist = async () => {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const { data, error } = await supabase
      .from("partner_checklist_progress")
      .select("item_key, completed")
      .eq("user_id", userId);

    if (error) {
      console.warn("Checklist progress table not ready:", error.message);
      return;
    }

    setChecklist(
      CHECKLIST_ITEMS.map((item) => {
        const found = data?.find((row) => row.item_key === item.item_key);
        return { ...item, completed: Boolean(found?.completed) };
      })
    );
  };

  const toggleCheck = async (item) => {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const newCompleted = !item.completed;

    setChecklist((current) =>
      current.map((row) =>
        row.item_key === item.item_key
          ? { ...row, completed: newCompleted }
          : row
      )
    );

    const { error } = await supabase.from("partner_checklist_progress").upsert(
      {
        user_id: userId,
        item_key: item.item_key,
        completed: newCompleted,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,item_key" }
    );

    if (error) {
      console.error("Checklist save failed:", error.message);
    }
  };

  const loadTraining = async () => {
    const { data, error } = await supabase
      .from("training_materials")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data?.length) {
      setTraining(data);
    }
  };

  const loadMaterials = async () => {
    const { data, error } = await supabase
      .from("sales_materials")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data?.length) {
      setMaterials(data);
    }
  };

  const loadMyLeads = async (pid) => {
    const id = pid ?? partnerId;
    if (!id) { setMyLeads([]); return; }
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .or(`regional_partner_id.eq.${id},submitted_by_partner_id.eq.${id}`)
      .order("created_at", { ascending: false });
    if (!error) setMyLeads(data || []);
  };

  const loadMyPayouts = async (pid) => {
    const id = pid ?? partnerId;
    if (!id) { setMyPayouts([]); return; }
    const { data, error } = await supabase
      .from("payouts")
      .select("*")
      .eq("beneficiary_type", "partner")
      .eq("beneficiary_id", id)
      .order("paid_on", { ascending: false });
    if (!error) setMyPayouts(data || []);
  };

  const loadDemoLinks = async () => {
    const { data, error } = await supabase
      .from("demo_links")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setDemoLinks(data || []);
  };

  const loadPromotors = async (pid) => {
    const id = pid ?? partnerId;
    if (!id) { setPromotors([]); return; }
    const { data, error } = await supabase
      .from("promotors")
      .select("*")
      .eq("partner_id", id)
      .order("created_at", { ascending: false });
    if (!error) setPromotors(data || []);
  };

  const loadCommissionTxns = async (pid) => {
    const id = pid ?? partnerId;
    if (!id) { setCommissionTxns([]); return; }
    setCommTxnsLoading(true);
    const { data, error } = await supabase
      .from("commission_transactions")
      .select("*")
      .eq("partner_id", id)
      .order("created_at", { ascending: false });
    if (!error) setCommissionTxns(data || []);
    setCommTxnsLoading(false);
  };

  const loadCommSummary = async (pid) => {
    const id = pid ?? partnerId;
    if (!id) return;
    const { data, error } = await supabase
      .from("commission_summary_with_payouts")
      .select("*")
      .eq("partner_id", id);
    if (!error && data?.length) setCommSummary(data);
  };

  const recruitPromotor = async () => {
    if (!recruitForm.full_name.trim()) return;

    setRecruitSaving(true);
    setRecruitError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: profileRow } = await supabase
      .from("profiles")
      .select("partner_id")
      .eq("id", user.id)
      .single();

    if (!profileRow?.partner_id) {
      setRecruitSaving(false);
      setRecruitError("Your account is not linked to a partner record.");
      return;
    }

    const trimmedEmail = recruitForm.email.trim();
    const trimmedName = recruitForm.full_name.trim();

    const { data: inserted, error } = await supabase.from("promotors").insert({
      partner_id: profileRow.partner_id,
      full_name: trimmedName,
      email: trimmedEmail || null,
      phone: recruitForm.phone.trim() || null,
      country: recruitForm.country.trim() || null,
      languages: recruitForm.languages.trim() || null,
      notes: recruitForm.notes.trim() || null,
      type: recruitForm.type || "individual",
      status: "active",
    }).select("id").single();

    setRecruitSaving(false);

    if (error) {
      setRecruitError(error.message || "Failed to add promotor.");
      return;
    }

    // Best-effort: create the promotor's login automatically. Never blocks success.
    if (trimmedEmail && inserted?.id) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch("/api/create-promotor-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ promotorId: inserted.id, email: trimmedEmail, fullName: trimmedName }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          if (data?.tempPassword) {
            setRecruitCredentials({ email: trimmedEmail, tempPassword: data.tempPassword });
            setLoginSetupNotice("");
          } else {
            setLoginSetupNotice("Promotor created, but no temporary password was returned. A login may already exist for this email.");
          }
        } else {
          setLoginSetupNotice(data.error || "Promotor created, but login setup failed.");
          console.warn("create-promotor-login failed:", data.error || res.status);
        }
      } catch (e) {
        setLoginSetupNotice("Promotor created, but login setup could not be completed. Please try again or contact admin.");
        console.warn("create-promotor-login request failed:", e);
      }

      // Best-effort: queue onboarding notification log rows. Never blocks success.
      try {
        const partnerName = profile?.full_name || "A partner";
        const { error: notifyErr } = await supabase.from("notification_logs").insert([
          {
            recipient_role: "admin",
            recipient_email: "info@qrwegn.com",
            notification_type: "promotor_recruited",
            subject: "New promotor recruited",
            body: `${partnerName} recruited a new promotor: ${trimmedName} (${trimmedEmail}).`,
            status: "pending",
          },
          {
            recipient_role: "promotor",
            recipient_email: trimmedEmail,
            notification_type: "promotor_onboarding",
            subject: "Welcome to QR-Wegn Partners",
            body: `Hi ${trimmedName}, welcome to QR-Wegn Partners! Your account is being set up and you'll receive your login details shortly.`,
            status: "pending",
          },
        ]);
        if (notifyErr) {
          console.warn("notification_logs insert failed:", notifyErr.message || notifyErr);
        }
      } catch (e) {
        console.warn("notification_logs insert request failed:", e);
      }
    }

    setRecruitForm({
      full_name: "",
      email: "",
      phone: "",
      country: "",
      languages: "",
      notes: "",
      type: "individual",
    });
    setShowRecruitForm(false);
    setRecruitSuccess(true);
    setTimeout(() => setRecruitSuccess(false), 3500);
    loadPromotors();
  };

  const submitLead = async () => {
    if (!lead.business_name.trim()) return;

    setLeadSaving(true);
    setLeadError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: profileRow } = await supabase
      .from("profiles")
      .select("partner_id")
      .eq("id", user.id)
      .single();

    if (!profileRow?.partner_id) {
      setLeadSaving(false);
      setLeadError("Your account is not linked to a partner record.");
      return;
    }

    const { error } = await supabase.from("leads").insert({
      submitted_by_partner_id: profileRow.partner_id,
      business_name: lead.business_name.trim(),
      contact_name: lead.owner_name.trim(),
      phone: lead.phone.trim(),
      country: lead.country.trim(),
      notes: lead.notes.trim(),
    });

    setLeadSaving(false);

    if (error) {
      setLeadError(error.message || "Failed to submit lead.");
      return;
    }

    setLead(emptyLead);
    setLeadSuccess(true);
    setTimeout(() => setLeadSuccess(false), 3500);
    loadMyLeads();
  };

  // Auto-derive onboarding progress from already-loaded data — no manual DB check-off needed
  const autoChecklist = [
    { key: "profile",    label: "Profile complete",              done: Boolean(profile?.full_name),                                              section: "home"         },
    { key: "promotor",   label: "Promotor recruited",            done: promotors.length > 0,                                                     section: "my-promotors" },
    { key: "lead",       label: "First lead submitted",          done: myLeads.length > 0,                                                       section: "leads"        },
    { key: "signed",     label: "First lead signed or active",   done: myLeads.some((l) => ["signed", "active"].includes(l.status)),             section: "my-leads"     },
    { key: "commission", label: "Commission record exists",      done: commissionTxns.length > 0,                                                section: "commissions"  },
  ];
  const doneCount  = autoChecklist.filter((c) => c.done).length;
  const totalCount = autoChecklist.length;
  const pct        = Math.round((doneCount / totalCount) * 100);

  const earningRows = useMemo(() => {
    const earningStatuses = ["signed", "active"];
    const owedByCurrency = {};
    const paidByCurrency = {};

    myLeads.forEach((leadRow) => {
      if (!earningStatuses.includes(leadRow.status)) return;
      if (leadRow.monthly_value == null || leadRow.partner_pct == null) return;

      const currency = leadRow.currency || "USD";
      owedByCurrency[currency] =
        (owedByCurrency[currency] || 0) +
        (Number(leadRow.monthly_value) * Number(leadRow.partner_pct)) / 100;
    });

    myPayouts.forEach((payout) => {
      const currency = payout.currency || "USD";
      paidByCurrency[currency] =
        (paidByCurrency[currency] || 0) + Number(payout.amount || 0);
    });

    const currencies = [
      ...new Set([...Object.keys(owedByCurrency), ...Object.keys(paidByCurrency)]),
    ];

    return currencies.map((currency) => ({
      currency,
      owed: owedByCurrency[currency] || 0,
      paid: paidByCurrency[currency] || 0,
      balance:
        (owedByCurrency[currency] || 0) - (paidByCurrency[currency] || 0),
    }));
  }, [myLeads, myPayouts]);

  const reportData = useMemo(() => {
    const EARNING_STATUSES = ["signed", "active"];

    // Leads by status (unchanged)
    const byStatus = {};
    myLeads.forEach((l) => {
      const s = l.status || "new";
      byStatus[s] = (byStatus[s] || 0) + 1;
    });

    // Partner commission — use commission_summary_with_payouts if loaded
    const partnerRow = commSummary?.find((r) => !r.promotor_id) ?? commSummary?.[0] ?? null;
    let commissionRows;
    if (partnerRow) {
      const owed  = Number(partnerRow.total_partner_commission || 0);
      const paid  = Number(partnerRow.partner_paid            || 0);
      const bal   = Number(partnerRow.partner_balance_due     ?? Math.max(0, owed - paid));
      const over  = paid > owed ? paid - owed : 0;
      commissionRows = [{ currency: "USD", owed, paid, balance: bal, overpaid: over }];
    } else {
      // Fallback: derive from myLeads + myPayouts
      const owedMap = {};
      myLeads.forEach((l) => {
        if (!EARNING_STATUSES.includes(l.status)) return;
        if (l.monthly_value == null || l.partner_pct == null) return;
        const cur = l.currency || "USD";
        owedMap[cur] = (owedMap[cur] || 0) + (Number(l.monthly_value) * Number(l.partner_pct)) / 100;
      });
      const paidMap = {};
      myPayouts.forEach((p) => {
        const cur = p.currency || "USD";
        paidMap[cur] = (paidMap[cur] || 0) + Number(p.amount || 0);
      });
      const commCurrencies = [...new Set([...Object.keys(owedMap), ...Object.keys(paidMap)])];
      commissionRows = commCurrencies.map((cur) => {
        const owed = owedMap[cur] || 0; const paid = paidMap[cur] || 0;
        return { currency: cur, owed, paid, balance: Math.max(0, owed - paid), overpaid: paid > owed ? paid - owed : 0 };
      });
    }

    // Promotor performance — use per-promotor rows from view if available
    const promotorViewRows = commSummary?.filter((r) => r.promotor_id) ?? [];
    const promotorRows = promotors.map((pr) => {
      const prLeads   = myLeads.filter((l) => l.submitted_by_promotor_id === pr.id);
      const earnLeads = prLeads.filter((l) => EARNING_STATUSES.includes(l.status));
      const viewRow   = promotorViewRows.find((r) => r.promotor_id === pr.id) ?? null;
      if (viewRow) {
        const earned  = Number(viewRow.total_promotor_commission || 0);
        const paid    = Number(viewRow.promotor_paid             || 0);
        const balance = Number(viewRow.promotor_balance_due      ?? Math.max(0, earned - paid));
        return {
          id: pr.id, name: pr.full_name,
          leadCount: prLeads.length, signedActiveCount: earnLeads.length,
          earned, paid, balance,
          commSummary: `USD ${earned.toFixed(2)}`,
          hasViewData: true,
        };
      }
      // Fallback: calculate from leads
      const commByCur = {};
      earnLeads.forEach((l) => {
        if (l.monthly_value == null || l.promotor_pct == null) return;
        const cur = l.currency || "USD";
        commByCur[cur] = (commByCur[cur] || 0) + (Number(l.monthly_value) * Number(l.promotor_pct)) / 100;
      });
      const commStr = Object.entries(commByCur).map(([cur, amt]) => `${cur} ${amt.toFixed(2)}`).join(", ") || "—";
      return { id: pr.id, name: pr.full_name, leadCount: prLeads.length, signedActiveCount: earnLeads.length, earned: null, paid: null, balance: null, commSummary: commStr, hasViewData: false };
    });

    return { byStatus, commissionRows, promotorRows };
  }, [myLeads, myPayouts, promotors, commSummary]);

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((name) => name[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "P";

  const firstName = profile?.full_name?.split(" ")[0] || "Partner";

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(160deg, #050d1a 0%, #0a1525 50%, #060e1c 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#4a7090",
          fontSize: 15,
        }}
      >
        Loading your portal...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(160deg, #050d1a 0%, #0a1525 25%, #0d1a30 50%, #081020 75%, #060e1c 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          background: "rgba(6,12,30,0.97)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(50,80,140,0.3)",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
          height: 58,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src="/Logo.png" alt="QR-Wegn" style={{ height: 30 }} />
          <span
            style={{
              fontSize: 11,
              color: "#3a5a70",
              fontWeight: 700,
              letterSpacing: "0.12em",
            }}
          >
            PARTNER PORTAL
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 13,
                color: "#b0cce0",
                fontWeight: 600,
                lineHeight: 1.2,
              }}
            >
              {profile?.full_name || "Partner"}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#3a5a70",
                textTransform: "capitalize",
              }}
            >
              {profile?.role || "Partner"}
            </div>
          </div>

          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #1a3a6a, #0d2045)",
              border: "1.5px solid rgba(80,140,200,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "#5ab0f0",
            }}
          >
            {initials}
          </div>

          <button
            onClick={onLogout}
            style={{
              fontSize: 12,
              color: "#3a5a70",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px 0",
              fontWeight: 500,
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "28px 20px 48px",
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "#ffffff",
              margin: 0,
            }}
          >
            Welcome back, {firstName}
          </h1>
          <p style={{ fontSize: 14, color: "#4a7090", margin: "5px 0 0" }}>
            {profile?.region ? `${profile.region} · ` : ""}
            <span style={{ textTransform: "capitalize" }}>
              {profile?.role || "Partner"}
            </span>
          </p>
        </div>

        <div
          style={{
            background: "rgba(232,197,71,0.08)",
            border: "1px solid rgba(232,197,71,0.22)",
            borderRadius: 12,
            padding: "13px 18px",
            marginBottom: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#e8c547" }}>
              Onboarding progress
            </div>
            <div style={{ fontSize: 12, color: "#8a7030", marginTop: 2 }}>
              Complete the checklist to become fully ready for outreach.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 90,
                height: 5,
                background: "rgba(232,197,71,0.18)",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: "linear-gradient(90deg, #e8c547, #c9a832)",
                  borderRadius: 3,
                }}
              />
            </div>
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#e8c547",
                minWidth: 36,
                textAlign: "right",
              }}
            >
              {pct}%
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 2,
            marginBottom: 22,
            background: "rgba(4,10,24,0.85)",
            borderRadius: 10,
            padding: 3,
            width: "fit-content",
            flexWrap: "wrap",
          }}
        >
          {BASE_TABS.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              style={{
                padding: "7px 15px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                background:
                  tab === item.id ? "rgba(80,140,210,0.22)" : "transparent",
                color: tab === item.id ? "#8fd0ff" : "#3a5a70",
                fontSize: 13,
                fontWeight: tab === item.id ? 700 : 500,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "home" && (
          <div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Promotors",   value: promotors.length },
                { label: "Total Leads", value: myLeads.length },
                { label: "Signed",      value: reportData.byStatus["signed"]  || 0 },
                { label: "Active",      value: reportData.byStatus["active"]  || 0 },
              ].map((s) => (
                <Card key={s.label} style={{ padding: "14px 18px" }}>
                  <div style={{ fontSize: 11, color: "#4a7090", letterSpacing: "0.1em", marginBottom: 6, fontWeight: 700 }}>{s.label.toUpperCase()}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#c0d8e8" }}>{s.value}</div>
                </Card>
              ))}
            </div>

            {/* Leads by status */}
            <Card style={{ marginBottom: 16 }}>
              <SectionLabel>LEADS BY STATUS</SectionLabel>
              {myLeads.length === 0 ? (
                <p style={{ fontSize: 13, color: "#3a5a70", margin: 0 }}>No leads yet.</p>
              ) : (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {Object.entries(reportData.byStatus).map(([status, count]) => (
                    <div key={status} style={{ background: "rgba(80,140,210,0.12)", border: "1px solid rgba(80,140,210,0.2)", borderRadius: 10, padding: "10px 16px", textAlign: "center", minWidth: 76 }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#5ab0f0" }}>{count}</div>
                      <div style={{ fontSize: 11, color: "#4a7090", marginTop: 4, textTransform: "capitalize" }}>{status}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Partner commission */}
            <Card style={{ marginBottom: 16 }}>
              <SectionLabel>PARTNER COMMISSION</SectionLabel>
              {reportData.commissionRows.length === 0 ? (
                <p style={{ fontSize: 13, color: "#3a5a70", margin: 0 }}>No commission data yet.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(50,80,140,0.35)" }}>
                      {["Currency", "Owed", "Paid", "Balance", "Overpaid"].map((h) => (
                        <th key={h} style={{ padding: "7px 12px", textAlign: "left", fontSize: 11, color: "#4a7090", fontWeight: 700, letterSpacing: "0.08em" }}>
                          {h.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.commissionRows.map((r) => (
                      <tr key={r.currency} style={{ borderBottom: "1px solid rgba(50,80,140,0.14)" }}>
                        <td style={{ padding: "10px 12px", fontSize: 13, color: "#7ab0cc" }}>{r.currency}</td>
                        <td style={{ padding: "10px 12px", fontSize: 13, color: "#a0c8e8", whiteSpace: "nowrap" }}>{r.currency} {r.owed.toFixed(2)}</td>
                        <td style={{ padding: "10px 12px", fontSize: 13, color: "#a0c8e8", whiteSpace: "nowrap" }}>{r.currency} {r.paid.toFixed(2)}</td>
                        <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 700, color: r.balance > 0 ? "#e8c547" : "#7ac77a", whiteSpace: "nowrap" }}>{r.currency} {r.balance.toFixed(2)}</td>
                        <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 700, color: r.overpaid > 0 ? "#f07070" : "#3a5a70", whiteSpace: "nowrap" }}>{r.currency} {r.overpaid.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            {/* Promotor performance */}
            {promotors.length > 0 && (
              <Card style={{ marginBottom: 16 }}>
                <SectionLabel>PROMOTOR PERFORMANCE</SectionLabel>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(50,80,140,0.35)" }}>
                        {["Promotor", "Leads", "Signed / Active", "Earned", "Paid", "Balance"].map((h) => (
                          <th key={h} style={{ padding: "7px 12px", textAlign: "left", fontSize: 11, color: "#4a7090", fontWeight: 700, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
                            {h.toUpperCase()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.promotorRows.map((pr, i) => (
                        <tr key={pr.id}
                          style={{ borderBottom: i < reportData.promotorRows.length - 1 ? "1px solid rgba(50,80,140,0.14)" : "none" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(80,140,210,0.05)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <td style={{ padding: "11px 12px", fontSize: 14, fontWeight: 600, color: "#c0d8e8" }}>{pr.name}</td>
                          <td style={{ padding: "11px 12px", fontSize: 14, color: "#a0c8e8" }}>{pr.leadCount}</td>
                          <td style={{ padding: "11px 12px", fontSize: 14, fontWeight: 700, color: "#5ab0f0" }}>{pr.signedActiveCount}</td>
                          <td style={{ padding: "11px 12px", fontSize: 14, fontWeight: 700, color: "#e8c547" }}>{pr.hasViewData ? `USD ${pr.earned.toFixed(2)}` : pr.commSummary}</td>
                          <td style={{ padding: "11px 12px", fontSize: 14, fontWeight: 700, color: "#35c060" }}>{pr.hasViewData ? `USD ${pr.paid.toFixed(2)}` : "—"}</td>
                          <td style={{ padding: "11px 12px", fontSize: 14, fontWeight: 700, color: pr.hasViewData && pr.balance > 0 ? "#e8c547" : "#35c060" }}>{pr.hasViewData ? `USD ${pr.balance.toFixed(2)}` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            <Card style={{ marginBottom: 16 }}>
              <SectionLabel>MY EARNINGS</SectionLabel>

              {earningRows.length === 0 ? (
                <p style={{ fontSize: 14, color: "#3a5a70", margin: 0 }}>
                  No earnings yet.
                </p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid rgba(50,80,140,0.35)",
                      }}
                    >
                      {["Currency", "Owed", "Paid", "Balance"].map((heading) => (
                        <th
                          key={heading}
                          style={{
                            padding: "7px 12px",
                            textAlign: "left",
                            fontSize: 11,
                            color: "#4a7090",
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                          }}
                        >
                          {heading.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {earningRows.map((row) => (
                      <tr
                        key={row.currency}
                        style={{
                          borderBottom: "1px solid rgba(50,80,140,0.14)",
                        }}
                      >
                        <td
                          style={{
                            padding: "10px 12px",
                            fontSize: 13,
                            color: "#7ab0cc",
                          }}
                        >
                          {row.currency}
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            fontSize: 13,
                            color: "#a0c8e8",
                          }}
                        >
                          {row.currency} {row.owed.toFixed(2)}
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            fontSize: 13,
                            color: "#a0c8e8",
                          }}
                        >
                          {row.currency} {row.paid.toFixed(2)}
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            fontSize: 14,
                            fontWeight: 700,
                            color: row.balance > 0 ? "#e8c547" : "#7ac77a",
                          }}
                        >
                          {row.currency} {row.balance.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card style={{ marginBottom: 16 }}>
              <SectionLabel>DEMO LINKS</SectionLabel>
              <p
                style={{
                  fontSize: 13,
                  color: "#4a7090",
                  marginTop: -8,
                  marginBottom: 14,
                }}
              >
                Open or share these with prospects.
              </p>

              {demoLinks.length === 0 ? (
                <p style={{ fontSize: 14, color: "#3a5a70", margin: 0 }}>
                  No demos available yet.
                </p>
              ) : (
                demoLinks.map((demo) => (
                  <div
                    key={demo.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 0",
                      borderBottom: "1px solid rgba(50,80,140,0.18)",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#c0d8e8",
                        }}
                      >
                        {demo.name}
                      </div>
                      {demo.description && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#4a7090",
                            marginTop: 2,
                          }}
                        >
                          {demo.description}
                        </div>
                      )}
                    </div>
                    <a
                      href={demo.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: 13,
                        color: "#5ab0f0",
                        textDecoration: "none",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Open ↗
                    </a>
                  </div>
                ))
              )}
            </Card>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              <Card>
                <SectionLabel>ONBOARDING CHECKLIST</SectionLabel>

                {autoChecklist.map((item) => (
                  <div
                    key={item.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "11px 0",
                      borderBottom: "1px solid rgba(50,80,140,0.18)",
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 5,
                        border: "1.5px solid",
                        borderColor: item.done ? "#5ab0f0" : "rgba(80,130,180,0.28)",
                        background: item.done ? "#5ab0f0" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {item.done && (
                        <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                          <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: item.done ? "#3a5a70" : "#b0cce0", textDecoration: item.done ? "line-through" : "none", lineHeight: 1.4 }}>
                        {item.label}
                      </div>
                      <button
                        onClick={() => setTab(item.section)}
                        style={{ marginTop: 4, background: "none", border: "none", color: "#5ab0f0", fontSize: 12, cursor: "pointer", padding: 0 }}
                      >
                        Go to section
                      </button>
                    </div>
                  </div>
                ))}
              </Card>

              <Card>
                <SectionLabel>YOUR PROGRESS</SectionLabel>
                <div style={{ textAlign: "center", padding: "20px 0 12px" }}>
                  <div
                    style={{
                      fontSize: 54,
                      fontWeight: 800,
                      color: "#5ab0f0",
                      lineHeight: 1,
                    }}
                  >
                    {pct}%
                  </div>
                  <div style={{ fontSize: 13, color: "#3a5a70", marginTop: 6 }}>
                    {doneCount} of {totalCount} tasks complete
                  </div>
                  <div
                    style={{
                      marginTop: 18,
                      height: 7,
                      background: "rgba(80,130,180,0.12)",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: "linear-gradient(90deg, #3a9ad9, #2a7ab8)",
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {tab === "profile" && (
          <Card style={{ maxWidth: 540 }}>
            <SectionLabel>PARTNER INFORMATION</SectionLabel>
            <FieldRow label="Full Name" value={profile?.full_name} />
            <FieldRow label="Email" value={profile?.email} />
            <FieldRow label="Region" value={profile?.region} />
            <FieldRow label="Phone" value={profile?.phone} />
            <FieldRow label="Role" value={profile?.role} />
            <div
              style={{
                marginTop: 18,
                fontSize: 12,
                color: "#2a4050",
                lineHeight: 1.5,
              }}
            >
              To update your profile, contact your QR-Wegn administrator.
            </div>
          </Card>
        )}

        {tab === "training" && (
          <div>
            <Card style={{ marginBottom: 16 }}>
              <SectionLabel>TRAINING</SectionLabel>
              <h2
                style={{
                  color: "#ffffff",
                  fontSize: 20,
                  margin: "0 0 8px",
                }}
              >
                Partner Enablement
              </h2>
              <p
                style={{
                  color: "#5a8aaa",
                  fontSize: 14,
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                Use this section to understand the products, explain the value,
                show demos, and understand how commissions are earned.
              </p>
            </Card>

            <div style={{ display: "grid", gap: 14 }}>
              {training.map((item) => (
                <Card key={item.id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 16,
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: "#c0d8e8",
                          marginBottom: 6,
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "#5a8aaa",
                          lineHeight: 1.7,
                        }}
                      >
                        {item.description}
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: "#5ab0f0",
                        background: "rgba(80,160,230,0.1)",
                        border: "1px solid rgba(80,160,230,0.22)",
                        borderRadius: 20,
                        padding: "4px 10px",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.type || "guide"}
                    </span>
                  </div>

                  {item.file_url && (
                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-block",
                        marginTop: 14,
                        color: "#5ab0f0",
                        fontSize: 13,
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      Open training ↗
                    </a>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {tab === "materials" && (
          <div>
            <Card style={{ marginBottom: 16 }}>
              <SectionLabel>SALES MATERIALS</SectionLabel>
              <h2
                style={{
                  color: "#ffffff",
                  fontSize: 20,
                  margin: "0 0 8px",
                }}
              >
                Assets for Outreach
              </h2>
              <p
                style={{
                  color: "#5a8aaa",
                  fontSize: 14,
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                Use these cards for pitch sheets, scripts, social posts, and
                customer-facing materials.
              </p>
            </Card>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 14,
              }}
            >
              {materials.map((item) => (
                <Card key={item.id} style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: 26, marginBottom: 10 }}>
                    {item.type === "script"
                      ? "💬"
                      : item.type === "social"
                      ? "📣"
                      : item.type === "pitch"
                      ? "📄"
                      : "📁"}
                  </div>

                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: "#b0cce0",
                      lineHeight: 1.3,
                      marginBottom: 8,
                    }}
                  >
                    {item.title}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: "#5a8aaa",
                      lineHeight: 1.6,
                      marginBottom: 12,
                    }}
                  >
                    {item.description}
                  </div>

                  <span
                    style={{
                      display: "inline-block",
                      width: "fit-content",
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      color: "#5ab0f0",
                      background: "rgba(80,160,230,0.1)",
                      padding: "3px 9px",
                      borderRadius: 20,
                      textTransform: "uppercase",
                      marginBottom: 14,
                    }}
                  >
                    {item.type || "material"}
                  </span>

                  {item.file_url ? (
                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "block",
                        marginTop: "auto",
                        textAlign: "center",
                        padding: "8px 0",
                        borderRadius: 8,
                        background: "rgba(80,160,230,0.12)",
                        border: "1px solid rgba(80,160,230,0.25)",
                        color: "#5ab0f0",
                        fontSize: 13,
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      Open
                    </a>
                  ) : (
                    <div
                      style={{
                        marginTop: "auto",
                        fontSize: 12,
                        color: "#3a5a70",
                      }}
                    >
                      Admin can attach a file later.
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {tab === "my-promotors" && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 14,
              }}
            >
              <button
                onClick={() => { setShowRecruitForm(true); setRecruitError(""); setRecruitCredentials(null); setLoginSetupNotice(""); }}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  background: "rgba(80,160,230,0.18)",
                  color: "#5ab0f0",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                + Recruit Promotor
              </button>
            </div>

            {recruitSuccess && (
              <div
                style={{
                  background: "rgba(40,180,80,0.08)",
                  border: "1px solid rgba(40,180,80,0.22)",
                  borderRadius: 10,
                  padding: "12px 16px",
                  marginBottom: 16,
                  fontSize: 13,
                  color: "#35c060",
                }}
              >
                Promotor added successfully.
              </div>
            )}


            {promotors.length === 0 ? (
              <Card style={{ textAlign: "center", padding: "52px 24px" }}>
                <div style={{ fontSize: 36, marginBottom: 14 }}>👥</div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#b0cce0",
                    marginBottom: 8,
                  }}
                >
                  No promotors yet
                </div>
                <div style={{ fontSize: 13, color: "#4a7090" }}>
                  Use the Recruit Promotor button to add your first one.
                </div>
              </Card>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: 14,
                }}
              >
                {promotors.map((promotor) => (
                  <Card key={promotor.id}>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: "#c0d8e8",
                        marginBottom: 4,
                      }}
                    >
                      {promotor.full_name || "Unnamed Promotor"}
                    </div>
                    <div style={{ fontSize: 13, color: "#4a7090" }}>
                      {promotor.country || "No country listed"}
                    </div>
                    <div
                      style={{
                        marginTop: 12,
                        fontSize: 12,
                        color: "#5a8aaa",
                        lineHeight: 1.7,
                      }}
                    >
                      {promotor.email || "No email"}
                      <br />
                      {promotor.phone || "No phone"}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "commissions" && (() => {
          // Prefer commission_summary_with_payouts; fall back to raw aggregates
          const summaryRow = commSummary?.find((r) => !r.promotor_id) ?? commSummary?.[0] ?? null;
          const totalEarned = summaryRow
            ? Number(summaryRow.total_partner_commission || 0)
            : commissionTxns.reduce((s, tx) => s + Number(tx.partner_commission || 0), 0);
          const totalPaid = summaryRow
            ? Number(summaryRow.partner_paid || 0)
            : myPayouts.reduce((s, p) => s + Number(p.amount || 0), 0);
          const balanceDue = summaryRow
            ? Number(summaryRow.partner_balance_due ?? Math.max(0, totalEarned - totalPaid))
            : Math.max(0, totalEarned - totalPaid);

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>

              {/* Summary cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {[
                  { label: "Total Earned",  value: `USD ${totalEarned.toFixed(2)}`,  color: "#a0c8e8" },
                  { label: "Total Paid",    value: `USD ${totalPaid.toFixed(2)}`,    color: "#35c060" },
                  { label: "Balance Due",   value: `USD ${balanceDue.toFixed(2)}`,   color: balanceDue > 0 ? "#e8c547" : "#35c060" },
                ].map((s) => (
                  <Card key={s.label} style={{ padding: "18px 22px" }}>
                    <div style={{ fontSize: 11, color: "#4a7090", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{s.label}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
                  </Card>
                ))}
              </div>

              {/* Transaction table */}
              <Card style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid rgba(50,80,140,0.22)" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#4a7090", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    COMMISSION TRANSACTIONS
                  </span>
                  {commissionTxns.length > 0 && (
                    <span style={{ marginLeft: 10, fontSize: 12, color: "#5ab0f0", fontWeight: 700 }}>{commissionTxns.length}</span>
                  )}
                </div>

                {commTxnsLoading ? (
                  <div style={{ padding: "40px 20px", textAlign: "center", color: "#4a7090", fontSize: 14 }}>Loading…</div>
                ) : commissionTxns.length === 0 ? (
                  <div style={{ padding: "48px 20px", textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>💰</div>
                    <div style={{ fontSize: 14, color: "#3a5a70", fontWeight: 600 }}>No commission transactions yet.</div>
                    <div style={{ fontSize: 13, color: "#2a4050", marginTop: 6 }}>Transactions appear when leads reach Signed or Active status.</div>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(50,80,140,0.35)" }}>
                          {["Business", "Period Start", "Period End", "Subscription", "Your Commission", "Status"].map((h) => (
                            <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, color: "#4a7090", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {commissionTxns.map((tx, i) => {
                          const businessName = myLeads.find((l) => l.id === tx.lead_id)?.business_name || "—";
                          const sc = tx.status === "paid"
                            ? { color: "#35c060", bg: "rgba(40,180,80,0.12)" }
                            : tx.status === "owed"
                            ? { color: "#e8c547", bg: "rgba(232,197,71,0.12)" }
                            : { color: "#5ab0f0", bg: "rgba(100,160,220,0.18)" };
                          return (
                            <tr key={tx.id}
                              style={{ borderBottom: i < commissionTxns.length - 1 ? "1px solid rgba(50,80,140,0.14)" : "none" }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(80,140,210,0.07)"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                              <td style={{ padding: "13px 16px", fontSize: 14, fontWeight: 600, color: "#ffffff" }}>{businessName}</td>
                              <td style={{ padding: "13px 16px", fontSize: 14, color: "#b0cce0", whiteSpace: "nowrap" }}>{fmtDate(tx.period_start)}</td>
                              <td style={{ padding: "13px 16px", fontSize: 14, color: "#b0cce0", whiteSpace: "nowrap" }}>{fmtDate(tx.period_end)}</td>
                              <td style={{ padding: "13px 16px", fontSize: 14, color: "#a0c8e8", whiteSpace: "nowrap" }}>
                                {tx.subscription_amount != null ? `USD ${Number(tx.subscription_amount).toFixed(2)}` : "—"}
                              </td>
                              <td style={{ padding: "13px 16px", fontSize: 14, fontWeight: 700, color: "#e8c547", whiteSpace: "nowrap" }}>
                                {tx.partner_commission != null ? `USD ${Number(tx.partner_commission).toFixed(2)}` : "—"}
                              </td>
                              <td style={{ padding: "13px 16px" }}>
                                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: sc.bg, color: sc.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                  {tx.status || "—"}
                                </span>
                              </td>
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
        })()}

        {/* MY LEADS — list */}
        {tab === "my-leads" && !selectedLead && (
          <Card>
            <SectionLabel>MY LEADS</SectionLabel>
            {myLeads.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ fontSize: 15, color: "#3a5a70" }}>No leads yet.</div>
                <div style={{ fontSize: 13, color: "#2a4050", marginTop: 6 }}>Submit your first lead from the Submit Lead tab.</div>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(50,80,140,0.35)" }}>
                      {["Business", "Contact", "Promotor", "Status", "Date"].map((h) => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: "#4a7090", fontWeight: 700, letterSpacing: "0.08em" }}>
                          {h.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {myLeads.map((l, i) => (
                      <tr key={l.id}
                        onClick={() => setSelectedLead(l)}
                        style={{ borderBottom: i < myLeads.length - 1 ? "1px solid rgba(50,80,140,0.14)" : "none", cursor: "pointer" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(80,140,210,0.07)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 600, color: "#ffffff" }}>{l.business_name}</td>
                        <td style={{ padding: "12px 14px", fontSize: 14, color: "#b0cce0" }}>{l.contact_name || "—"}</td>
                        <td style={{ padding: "12px 14px", fontSize: 13, color: "#7ab0cc" }}>
                          {promotors.find((p) => p.id === l.submitted_by_promotor_id)?.full_name || "—"}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "rgba(100,160,220,0.18)", color: "#5ab0f0", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            {l.status || "new"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: 13, color: "#4a7090", whiteSpace: "nowrap" }}>{fmtDate(l.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* MY LEADS — detail */}
        {tab === "my-leads" && selectedLead && (() => {
          const promotorName    = promotors.find((p) => p.id === selectedLead.submitted_by_promotor_id)?.full_name || null;
          const partnerComm     = selectedLead.monthly_value != null && selectedLead.partner_pct != null
            ? `${selectedLead.currency || "USD"} ${(Number(selectedLead.monthly_value) * Number(selectedLead.partner_pct) / 100).toFixed(2)}`
            : null;
          const promotorComm    = selectedLead.monthly_value != null && selectedLead.promotor_pct != null
            ? `${selectedLead.currency || "USD"} ${(Number(selectedLead.monthly_value) * Number(selectedLead.promotor_pct) / 100).toFixed(2)}`
            : null;
          const monthlyDisplay  = selectedLead.monthly_value != null
            ? `${selectedLead.currency || "USD"} ${Number(selectedLead.monthly_value).toFixed(2)}`
            : null;

          return (
            <div style={{ maxWidth: 580 }}>
              <button
                onClick={() => setSelectedLead(null)}
                style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 18, background: "none", border: "none", cursor: "pointer", color: "#5ab0f0", fontSize: 13, fontWeight: 700, padding: 0 }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 3L5 8L10 13" stroke="#5ab0f0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back to My Leads
              </button>

              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", marginBottom: 4 }}>{selectedLead.business_name}</div>
                    <div style={{ fontSize: 13, color: "#4a7090" }}>Submitted {fmtDate(selectedLead.created_at)}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: "rgba(100,160,220,0.18)", color: "#5ab0f0", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>
                    {selectedLead.status || "new"}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  {[
                    { label: "Contact Name",         value: selectedLead.contact_name },
                    { label: "Phone",                value: selectedLead.phone },
                    { label: "Country",              value: selectedLead.country },
                    { label: "Plan",                 value: selectedLead.plan },
                    { label: "Monthly Value",        value: monthlyDisplay },
                    { label: "Promotor",             value: promotorName },
                    { label: "Partner Commission",   value: partnerComm },
                    { label: "Promotor Commission",  value: promotorComm },
                    { label: "Follow-up Date",       value: fmtDate(selectedLead.follow_up_date) === "—" ? null : fmtDate(selectedLead.follow_up_date) },
                    { label: "Submitted",            value: fmtDate(selectedLead.created_at) },
                  ].map(({ label, value }) => (
                    <FieldRow key={label} label={label} value={value} />
                  ))}

                  <div style={{ padding: "14px 0" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#4a7090", letterSpacing: "0.07em", marginBottom: 8 }}>NOTES</div>
                    <div style={{ fontSize: 14, color: selectedLead.notes ? "#c0d8e8" : "#3a5a6a", fontStyle: selectedLead.notes ? "normal" : "italic", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                      {selectedLead.notes || "No notes"}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          );
        })()}

        {tab === "leads" && (
          <Card style={{ maxWidth: 540 }}>
            <SectionLabel>SUBMIT A LEAD</SectionLabel>

            <p
              style={{
                fontSize: 13,
                color: "#4a7090",
                marginTop: -4,
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              Submit a restaurant, café, salon, barbershop, or other prospect.
            </p>

            {leadSuccess && (
              <div
                style={{
                  background: "rgba(40,180,80,0.08)",
                  border: "1px solid rgba(40,180,80,0.22)",
                  borderRadius: 10,
                  padding: "12px 16px",
                  marginBottom: 18,
                  fontSize: 13,
                  color: "#35c060",
                }}
              >
                Lead submitted successfully.
              </div>
            )}

            {leadError && (
              <div
                style={{
                  background: "rgba(220,60,60,0.08)",
                  border: "1px solid rgba(220,60,60,0.3)",
                  borderRadius: 10,
                  padding: "12px 16px",
                  marginBottom: 18,
                  fontSize: 13,
                  color: "#f07070",
                }}
              >
                {leadError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                ["business_name", "Business Name"],
                ["owner_name", "Owner / Contact Name"],
                ["phone", "Phone Number"],
                ["country", "Country"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#4a7090",
                      letterSpacing: "0.08em",
                      display: "block",
                      marginBottom: 5,
                    }}
                  >
                    {label.toUpperCase()}
                  </label>
                  <input
                    value={lead[key]}
                    onChange={(event) =>
                      setLead((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
              ))}

              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#4a7090",
                    letterSpacing: "0.08em",
                    display: "block",
                    marginBottom: 5,
                  }}
                >
                  NOTES
                </label>
                <textarea
                  value={lead.notes}
                  onChange={(event) =>
                    setLead((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              <button
                onClick={submitLead}
                disabled={leadSaving || !lead.business_name.trim()}
                style={{
                  padding: "12px 0",
                  borderRadius: 10,
                  border: "none",
                  background:
                    leadSaving || !lead.business_name.trim()
                      ? "rgba(80,140,210,0.18)"
                      : "linear-gradient(135deg, #3a9ad9, #2a7ab8)",
                  color:
                    leadSaving || !lead.business_name.trim()
                      ? "#3a5a70"
                      : "white",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor:
                    leadSaving || !lead.business_name.trim()
                      ? "default"
                      : "pointer",
                }}
              >
                {leadSaving ? "Submitting..." : "Submit Lead"}
              </button>
            </div>
          </Card>
        )}
      </div>

      {/* Recruit Promotor modal */}
      {showRecruitForm && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) { setShowRecruitForm(false); setRecruitError(""); } }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24 }}
        >
          <div style={{ background: "#0b1739", border: "1px solid rgba(50,80,140,0.4)", borderRadius: 18, padding: "32px 28px", width: "100%", maxWidth: 480, boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#ffffff" }}>Recruit Promotor</h2>
              <button
                onClick={() => { setShowRecruitForm(false); setRecruitError(""); }}
                style={{ background: "none", border: "none", color: "#4a7090", fontSize: 20, cursor: "pointer", lineHeight: 1, padding: "0 4px" }}
              >✕</button>
            </div>

            {recruitError && (
              <div style={{ background: "rgba(220,60,60,0.08)", border: "1px solid rgba(220,60,60,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#f07070" }}>
                {recruitError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              {[
                { key: "full_name",  label: "Full Name",  required: true,  type: "text"  },
                { key: "email",      label: "Email",      required: false, type: "email" },
                { key: "phone",      label: "Phone",      required: false, type: "text"  },
                { key: "country",    label: "Country",    required: false, type: "text"  },
                { key: "languages",  label: "Languages",  required: false, type: "text"  },
              ].map(({ key, label, required, type }) => (
                <div key={key}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#4a7090", letterSpacing: "0.08em", display: "block", marginBottom: 5 }}>
                    {label.toUpperCase()}{required && <span style={{ color: "#5ab0f0", marginLeft: 3 }}>*</span>}
                  </label>
                  <input
                    type={type}
                    value={recruitForm[key]}
                    onChange={(e) => setRecruitForm((f) => ({ ...f, [key]: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              ))}

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#4a7090", letterSpacing: "0.08em", display: "block", marginBottom: 5 }}>NOTES</label>
                <textarea
                  rows={3}
                  value={recruitForm.notes}
                  onChange={(e) => setRecruitForm((f) => ({ ...f, notes: e.target.value }))}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  onClick={recruitPromotor}
                  disabled={recruitSaving || !recruitForm.full_name.trim()}
                  style={{
                    flex: 1, padding: "12px 0", borderRadius: 10, border: "none",
                    background: recruitSaving || !recruitForm.full_name.trim()
                      ? "rgba(80,140,210,0.18)"
                      : "linear-gradient(135deg, #3a9ad9, #2a7ab8)",
                    color: recruitSaving || !recruitForm.full_name.trim() ? "#3a5a70" : "white",
                    fontSize: 14, fontWeight: 700,
                    cursor: recruitSaving || !recruitForm.full_name.trim() ? "default" : "pointer",
                  }}
                >
                  {recruitSaving ? "Adding..." : "Add Promotor"}
                </button>
                <button
                  onClick={() => { setShowRecruitForm(false); setRecruitError(""); }}
                  style={{ padding: "12px 20px", borderRadius: 10, border: "1px solid rgba(50,80,140,0.3)", background: "none", color: "#4a7090", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loginSetupNotice && !recruitCredentials && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, maxWidth: 380, zIndex: 220,
          background: "rgba(240,180,60,0.14)", border: "1px solid rgba(240,180,60,0.4)",
          borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 10,
          boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
        }}>
          <span style={{ fontSize: 13, color: "#f0c040", lineHeight: 1.5, flex: 1 }}>{loginSetupNotice}</span>
          <button
            onClick={() => setLoginSetupNotice("")}
            style={{ background: "none", border: "none", color: "#f0c040", fontSize: 16, cursor: "pointer", lineHeight: 1, padding: 0 }}
          >✕</button>
        </div>
      )}

      {recruitCredentials && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) { setRecruitCredentials(null); setLoginSetupNotice(""); } }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 210, padding: 24 }}
        >
          <div style={{ background: "#0b1739", border: "1px solid rgba(50,80,140,0.4)", borderRadius: 18, padding: "32px 28px", width: "100%", maxWidth: 440, boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#ffffff" }}>Promotor Created Successfully</h2>
              <button
                onClick={() => { setRecruitCredentials(null); setLoginSetupNotice(""); }}
                style={{ background: "none", border: "none", color: "#4a7090", fontSize: 20, cursor: "pointer", lineHeight: 1, padding: "0 4px" }}
              >✕</button>
            </div>

            <p style={{ fontSize: 13, color: "#7ab0cc", marginTop: 0, marginBottom: 18 }}>
              Share these one-time login credentials with the promotor. They will not be shown again.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#4a7090", letterSpacing: "0.08em", display: "block", marginBottom: 5 }}>EMAIL</label>
                <div style={{ ...inputStyle, display: "flex", alignItems: "center" }}>{recruitCredentials.email}</div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#4a7090", letterSpacing: "0.08em", display: "block", marginBottom: 5 }}>TEMPORARY PASSWORD</label>
                <div style={{ ...inputStyle, display: "flex", alignItems: "center", fontFamily: "monospace" }}>{recruitCredentials.tempPassword}</div>
              </div>
            </div>

            <button
              onClick={() => {
                const text = `Email: ${recruitCredentials.email}\nPassword: ${recruitCredentials.tempPassword}`;
                navigator.clipboard?.writeText(text).catch((e) => console.warn("copy credentials failed:", e));
              }}
              style={{
                width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #3a9ad9, #2a7ab8)",
                color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}
            >
              Copy Credentials
            </button>
          </div>
        </div>
      )}
    </div>
  );
}