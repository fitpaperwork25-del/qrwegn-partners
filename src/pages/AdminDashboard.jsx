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

export default function AdminDashboard({ navigate }) {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error) setPartners(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const stageCounts = STAGES.reduce((acc, s) => {
    acc[s] = partners.filter(p => p.stage === s).length;
    return acc;
  }, {});

  const activeCount     = stageCounts["Active"] || 0;
  const onboardingCount = stageCounts["Onboarding"] || 0;
  const stalledCount    = stageCounts["Stalled"] || 0;
  const promotorCount   = partners.filter(p => p.parent_partner_id).length;
  const recentPartners  = partners.slice(0, 5);

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
          Partner Dashboard
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
          Overview of your partner pipeline and activity
        </p>
      </div>

      {/* Metric row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Partners", value: partners.length, sub: "in pipeline" },
          { label: "Active",         value: activeCount,     sub: "onboarding businesses" },
          { label: "Onboarding",     value: onboardingCount, sub: "nearly active" },
          { label: "Stalled",        value: stalledCount,    sub: "need attention" },
          { label: "My Promotors",   value: promotorCount,   sub: "sub-partners assigned" },
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
          {STAGES.map(s => {
            const c = STAGE_COLORS[s];
            const count = stageCounts[s] || 0;
            return (
              <div key={s} style={{
                background: c.bg, borderRadius: 10, padding: "10px 14px",
                display: "flex", flexDirection: "column", alignItems: "center", minWidth: 80, flex: 1
              }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: c.color }}>{count}</div>
                <div style={{ fontSize: 17, color: c.color, opacity: 0.8, textAlign: "center", marginTop: 2 }}>{s}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Stage breakdown */}
        <Card>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em", marginBottom: 16 }}>STAGE BREAKDOWN</div>
          {STAGES.filter(s => stageCounts[s] > 0).map(s => {
            const c = STAGE_COLORS[s];
            const count = stageCounts[s];
            const pct = partners.length > 0 ? Math.round(count / partners.length * 100) : 0;
            return (
              <div key={s} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 15, color: c.color, fontWeight: 500 }}>{s}</span>
                  <span style={{ fontSize: 15, color: "#7ab0cc" }}>{count} ({pct}%)</span>
                </div>
                <div style={{ height: 6, background: "rgba(100,160,220,0.12)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: c.color, borderRadius: 3, opacity: 0.7, transition: "width 0.4s" }} />
                </div>
              </div>
            );
          })}
          {partners.length === 0 && (
            <p style={{ fontSize: 16, color: "#7ab0cc", textAlign: "center", padding: "20px 0" }}>No partners yet</p>
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
