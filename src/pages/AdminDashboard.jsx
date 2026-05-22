const STAGES = ["Identified","Contacted","Interested","Evaluating","Onboarding","Active","Stalled","Declined"];

const STAGE_COLORS = {
  Identified: { bg: "rgba(100,160,220,0.1)", color: "#2a7ab8", dot: "#5aaae0" },
  Contacted: { bg: "rgba(120,180,240,0.12)", color: "#1a6aaa", dot: "#4a9ad0" },
  Interested: { bg: "rgba(80,180,140,0.12)", color: "#1a7a5a", dot: "#3abf8a" },
  Evaluating: { bg: "rgba(240,180,60,0.12)", color: "#9a6a10", dot: "#e0a830" },
  Onboarding: { bg: "rgba(160,100,220,0.1)", color: "#6a30aa", dot: "#a060e0" },
  Active: { bg: "rgba(40,180,80,0.12)", color: "#1a7a30", dot: "#2ac860" },
  Stalled: { bg: "rgba(220,160,60,0.1)", color: "#8a5a10", dot: "#d09030" },
  Declined: { bg: "rgba(220,80,80,0.1)", color: "#8a2020", dot: "#d05050" },
};

const MOCK_PARTNERS = [
  { id: 1, name: "Teclai Habtezion", territory: "South Sudan / Uganda", stage: "Evaluating", lastContact: "2 days ago", nextFollowup: "Tomorrow", languages: ["Tigrinya","Arabic","English"] },
  { id: 2, name: "Meron Tesfaye", territory: "Minnesota / Twin Cities", stage: "Interested", lastContact: "Today", nextFollowup: "Friday", languages: ["Amharic","English"] },
  { id: 3, name: "Samuel Desta", territory: "Washington D.C.", stage: "Contacted", lastContact: "5 days ago", nextFollowup: "Overdue", languages: ["Amharic","English"] },
  { id: 4, name: "Hana Girma", territory: "Ethiopia / Addis Ababa", stage: "Identified", lastContact: "—", nextFollowup: "This week", languages: ["Amharic","Oromo"] },
  { id: 5, name: "Yonas Bekele", territory: "Kenya / Nairobi", stage: "Active", lastContact: "Yesterday", nextFollowup: "Next week", languages: ["Amharic","Swahili","English"] },
  { id: 6, name: "Feven Haile", territory: "Toronto, Canada", stage: "Onboarding", lastContact: "3 days ago", nextFollowup: "Thursday", languages: ["Tigrinya","English"] },
];

const stageCounts = STAGES.reduce((acc, s) => {
  acc[s] = MOCK_PARTNERS.filter(p => p.stage === s).length;
  return acc;
}, {});

const Card = ({ children, style = {} }) => (
  <div style={{
    background: "rgba(255,255,255,0.72)", backdropFilter: "blur(16px)",
    borderRadius: 14, border: "1px solid rgba(255,255,255,0.9)",
    boxShadow: "0 2px 16px rgba(100,160,220,0.08)", padding: "20px 22px",
    ...style
  }}>{children}</div>
);

const StageBadge = ({ stage }) => {
  const c = STAGE_COLORS[stage] || STAGE_COLORS.Identified;
  return (
    <span style={{
      background: c.bg, color: c.color, fontSize: 11, fontWeight: 600,
      padding: "3px 10px", borderRadius: 20, letterSpacing: "0.04em"
    }}>{stage}</span>
  );
};

export default function AdminDashboard({ navigate }) {
  const overdue = MOCK_PARTNERS.filter(p => p.nextFollowup === "Overdue");
  const today = MOCK_PARTNERS.filter(p => p.nextFollowup === "Tomorrow" || p.nextFollowup === "Today");

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a3a5a", margin: 0 }}>Partner Dashboard</h1>
        <p style={{ fontSize: 14, color: "#7aaac8", margin: "4px 0 0" }}>Overview of your partner pipeline and activity</p>
      </div>

      {/* Metric row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Partners", value: MOCK_PARTNERS.length, sub: "in pipeline" },
          { label: "Active", value: stageCounts["Active"] || 0, sub: "onboarding businesses" },
          { label: "Need Followup", value: overdue.length + today.length, sub: "this week" },
          { label: "In Onboarding", value: stageCounts["Onboarding"] || 0, sub: "nearly active" },
        ].map(m => (
          <Card key={m.label} style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: 11, color: "#7aaac8", letterSpacing: "0.06em", marginBottom: 6, fontWeight: 500 }}>{m.label.toUpperCase()}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#1a3a5a", lineHeight: 1 }}>{m.value}</div>
            <div style={{ fontSize: 12, color: "#9abccc", marginTop: 4 }}>{m.sub}</div>
          </Card>
        ))}
      </div>

      {/* Pipeline stages */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#7aaac8", letterSpacing: "0.08em", marginBottom: 16 }}>PIPELINE OVERVIEW</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {STAGES.map(s => {
            const c = STAGE_COLORS[s];
            const count = stageCounts[s] || 0;
            return (
              <div key={s} style={{
                background: c.bg, borderRadius: 10, padding: "10px 14px",
                display: "flex", flexDirection: "column", alignItems: "center", minWidth: 80, flex: 1
              }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: c.color }}>{count}</div>
                <div style={{ fontSize: 11, color: c.color, opacity: 0.8, textAlign: "center", marginTop: 2 }}>{s}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Follow-ups due */}
        <Card>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#7aaac8", letterSpacing: "0.08em", marginBottom: 16 }}>FOLLOW-UPS DUE</div>
          {overdue.map(p => (
            <div key={p.id} onClick={() => navigate("partner-profile", { partnerId: p.id })}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(100,160,220,0.08)", cursor: "pointer" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1a3a5a" }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "#7aaac8" }}>{p.territory}</div>
              </div>
              <span style={{ fontSize: 11, background: "rgba(220,80,80,0.1)", color: "#c03030", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>Overdue</span>
            </div>
          ))}
          {today.map(p => (
            <div key={p.id} onClick={() => navigate("partner-profile", { partnerId: p.id })}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(100,160,220,0.08)", cursor: "pointer" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1a3a5a" }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "#7aaac8" }}>{p.territory}</div>
              </div>
              <span style={{ fontSize: 11, background: "rgba(240,180,60,0.12)", color: "#9a6a10", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>Soon</span>
            </div>
          ))}
          {overdue.length === 0 && today.length === 0 && (
            <p style={{ fontSize: 13, color: "#9abccc", textAlign: "center", padding: "20px 0" }}>All caught up ✓</p>
          )}
        </Card>

        {/* Recent partners */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#7aaac8", letterSpacing: "0.08em" }}>RECENT PARTNERS</div>
            <button onClick={() => navigate("partners")} style={{ fontSize: 12, color: "#2a7ab8", background: "none", border: "none", cursor: "pointer" }}>View all →</button>
          </div>
          {MOCK_PARTNERS.slice(0, 5).map(p => (
            <div key={p.id} onClick={() => navigate("partner-profile", { partnerId: p.id })}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(100,160,220,0.08)", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: "linear-gradient(135deg, #c8e8f8, #a0ccf0)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: "#2a7ab8", flexShrink: 0
                }}>{p.name.split(" ").map(n => n[0]).join("")}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1a3a5a" }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "#9abccc" }}>{p.territory}</div>
                </div>
              </div>
              <StageBadge stage={p.stage} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

export { MOCK_PARTNERS, STAGE_COLORS, STAGES, StageBadge, Card };
