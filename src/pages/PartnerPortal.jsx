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
  { id: "home", label: "Home" },
  { id: "profile", label: "My Profile" },
  { id: "my-promotors", label: "My Promotors" },
  { id: "commissions", label: "Commissions" },
  { id: "training", label: "Training" },
  { id: "materials", label: "Materials" },
  { id: "leads", label: "Submit Lead" },
];

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
    type: "individual",
  });
  const [recruitSaving, setRecruitSaving] = useState(false);
  const [recruitSuccess, setRecruitSuccess] = useState(false);
  const [recruitError, setRecruitError] = useState("");
  const [showRecruitForm, setShowRecruitForm] = useState(false);
  const [myLeads, setMyLeads] = useState([]);
  const [myPayouts, setMyPayouts] = useState([]);
  const [demoLinks, setDemoLinks] = useState([]);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      loadChecklist(),
      loadPromotors(),
      loadMyLeads(),
      loadMyPayouts(),
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

  const loadMyLeads = async () => {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setMyLeads(data || []);
  };

  const loadMyPayouts = async () => {
    const { data, error } = await supabase
      .from("payouts")
      .select("*")
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

  const loadPromotors = async () => {
    const { data, error } = await supabase
      .from("promotors")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setPromotors(data || []);
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

    const { error } = await supabase.from("promotors").insert({
      partner_id: profileRow.partner_id,
      full_name: recruitForm.full_name.trim(),
      email: recruitForm.email.trim() || null,
      phone: recruitForm.phone.trim() || null,
      country: recruitForm.country.trim() || null,
      type: recruitForm.type || "individual",
      status: "active",
    });

    setRecruitSaving(false);

    if (error) {
      setRecruitError(error.message || "Failed to add promotor.");
      return;
    }

    setRecruitForm({
      full_name: "",
      email: "",
      phone: "",
      country: "",
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

  const doneCount = checklist.filter((item) => item.completed).length;
  const totalCount = checklist.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

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

                {checklist.map((item) => (
                  <div
                    key={item.item_key}
                    onClick={() => toggleCheck(item)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "11px 0",
                      borderBottom: "1px solid rgba(50,80,140,0.18)",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 5,
                        border: "1.5px solid",
                        borderColor: item.completed
                          ? "#5ab0f0"
                          : "rgba(80,130,180,0.28)",
                        background: item.completed ? "#5ab0f0" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {item.completed && (
                        <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                          <path
                            d="M1 4L4 7L10 1"
                            stroke="white"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 14,
                          color: item.completed ? "#3a5a70" : "#b0cce0",
                          textDecoration: item.completed ? "line-through" : "none",
                          lineHeight: 1.4,
                        }}
                      >
                        {item.label}
                      </div>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          setTab(item.section);
                        }}
                        style={{
                          marginTop: 4,
                          background: "none",
                          border: "none",
                          color: "#5ab0f0",
                          fontSize: 12,
                          cursor: "pointer",
                          padding: 0,
                        }}
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
                onClick={() => {
                  setShowRecruitForm((value) => !value);
                  setRecruitError("");
                }}
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
                {showRecruitForm ? "Cancel" : "+ Recruit Promotor"}
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

            {showRecruitForm && (
              <Card style={{ marginBottom: 20 }}>
                <SectionLabel>NEW PROMOTOR</SectionLabel>

                {recruitError && (
                  <div
                    style={{
                      background: "rgba(220,60,60,0.08)",
                      border: "1px solid rgba(220,60,60,0.3)",
                      borderRadius: 10,
                      padding: "10px 14px",
                      marginBottom: 14,
                      fontSize: 13,
                      color: "#f07070",
                    }}
                  >
                    {recruitError}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    ["full_name", "Full Name"],
                    ["email", "Email"],
                    ["phone", "Phone"],
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
                          marginBottom: 4,
                        }}
                      >
                        {label.toUpperCase()}
                      </label>
                      <input
                        value={recruitForm[key]}
                        onChange={(event) =>
                          setRecruitForm((form) => ({
                            ...form,
                            [key]: event.target.value,
                          }))
                        }
                        style={inputStyle}
                      />
                    </div>
                  ))}

                  <button
                    onClick={recruitPromotor}
                    disabled={recruitSaving || !recruitForm.full_name.trim()}
                    style={{
                      padding: "11px 0",
                      borderRadius: 9,
                      border: "none",
                      background:
                        recruitSaving || !recruitForm.full_name.trim()
                          ? "rgba(80,140,210,0.18)"
                          : "linear-gradient(135deg, #3a9ad9, #2a7ab8)",
                      color:
                        recruitSaving || !recruitForm.full_name.trim()
                          ? "#3a5a70"
                          : "white",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor:
                        recruitSaving || !recruitForm.full_name.trim()
                          ? "default"
                          : "pointer",
                    }}
                  >
                    {recruitSaving ? "Adding..." : "Add Promotor"}
                  </button>
                </div>
              </Card>
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

        {tab === "commissions" && (
          <Card style={{ textAlign: "center", padding: "52px 24px" }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>💰</div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#b0cce0",
                marginBottom: 8,
              }}
            >
              Commission details are calculated on the Home page.
            </div>
            <div style={{ fontSize: 13, color: "#4a7090" }}>
              Earnings are based on signed/active leads minus payouts.
            </div>
          </Card>
        )}

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
    </div>
  );
}