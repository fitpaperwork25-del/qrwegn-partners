import { useState } from "react";

const PARTNER = {
  name: "Teclai Habtezion",
  territory: "South Sudan / Uganda",
  stage: "Evaluating",
  languages: ["Tigrinya", "Arabic", "English"],
};

const CHECKLIST = [
  { id: 1, label: "Review platform overview", done: true },
  { id: 2, label: "Watch onboarding video", done: true },
  { id: 3, label: "Read commission structure", done: false },
  { id: 4, label: "Schedule intro call with admin", done: false },
  { id: 5, label: "Identify 3 target businesses", done: false },
];

const TRAINING = [
  { id: 1, title: "QR-Wegn Platform Overview", type: "PDF", status: "completed" },
  { id: 2, title: "How to Onboard a Restaurant", type: "Video", status: "in_progress" },
  { id: 3, title: "Partner Commission Structure", type: "PDF", status: "assigned" },
  { id: 4, title: "QR Label Printing Guide", type: "PDF", status: "assigned" },
];

const MATERIALS = [
  { title: "Partner Pitch Deck", type: "Pitch Deck" },
  { title: "Restaurant Onboarding Script", type: "Script" },
  { title: "QR-Wegn One-Pager", type: "Flyer" },
];

const STATUS_STYLE = {
  completed: { bg: "rgba(40,180,80,0.1)", color: "#35c060", label: "Done" },
  in_progress: { bg: "rgba(240,180,60,0.12)", color: "#f0c040", label: "In Progress" },
  assigned: { bg: "rgba(100,160,220,0.3)", color: "#5ab0f0", label: "To Do" },
};

const Card = ({ children, style = {} }) => (
  <div style={{
    background: "rgba(10,20,45,0.95)", backdropFilter: "blur(16px)",
    borderRadius: 14, border: "1px solid rgba(50,80,140,0.4)",
    boxShadow: "0 2px 16px rgba(100,160,220,0.22)", padding: "20px 22px",
    ...style
  }}>{children}</div>
);

export default function PartnerPortal({ onLogout }) {
  const [tab, setTab] = useState("home");
  const [checks, setChecks] = useState(CHECKLIST);

  const toggle = (id) => setChecks(c => c.map(x => x.id === id ? { ...x, done: !x.done } : x));
  const doneCount = checks.filter(c => c.done).length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #050d1a 0%, #0a1525 25%, #0d1a30 50%, #081020 75%, #060e1c 100%)",
      position: "relative"
    }}>
      {/* Sky circles */}
      <div style={{ position: "fixed", top: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: "rgba(30,60,120,0.15)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: -80, left: -80, width: 400, height: 400, borderRadius: "50%", background: "rgba(20,50,100,0.12)", pointerEvents: "none", zIndex: 0 }} />

      {/* Topbar */}
      <div style={{
        background: "rgba(10,20,45,0.95)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(50,80,140,0.4)", padding: "14px 36px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100
      }}>
        <img src="/Logo.png" alt="QR-Wegn" style={{ height: 36 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 19, color: "#b0cce0", fontWeight: 500 }}>Partner Portal</span>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #1a3560, #0d2045)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, fontWeight: 700, color: "#5ab0f0" }}>
            {PARTNER.name.split(" ").map(n => n[0]).join("")}
          </div>
          <button onClick={onLogout} style={{ fontSize: 18, color: "#7ab0cc", background: "none", border: "none", cursor: "pointer" }}>Sign out</button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px", position: "relative", zIndex: 1 }}>
        {/* Welcome */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: "#ffffff", margin: 0 }}>Welcome, {PARTNER.name.split(" ")[0]}</h1>
          <p style={{ fontSize: 20, color: "#a0c8e8", margin: "4px 0 0" }}>{PARTNER.territory} Â· Partner</p>
        </div>

        {/* Status banner */}
        <div style={{
          background: "rgba(240,180,60,0.18)", border: "1px solid rgba(240,180,60,0.35)",
          borderRadius: 12, padding: "14px 20px", marginBottom: 24,
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 600, color: "#f0c040" }}>Status: Evaluating</div>
            <div style={{ fontSize: 18, color: "#f0b840", marginTop: 2 }}>Complete your onboarding checklist to become an active partner</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#f0c040" }}>{doneCount}/{checks.length}</div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "rgba(8,16,36,0.8)", borderRadius: 12, padding: 4, width: "fit-content" }}>
          {["home", "training", "materials"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer",
              background: tab === t ? "white" : "transparent",
              color: tab === t ? "#5ab0f0" : "#a0c8e8",
              fontSize: 19, fontWeight: tab === t ? 600 : 400,
              boxShadow: tab === t ? "0 1px 6px rgba(100,160,220,0.25)" : "none",
              textTransform: "capitalize", transition: "all 0.15s"
            }}>{t}</button>
          ))}
        </div>

        {tab === "home" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em", marginBottom: 16 }}>ONBOARDING CHECKLIST</div>
              {checks.map(c => (
                <div key={c.id} onClick={() => toggle(c.id)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(100,160,220,0.22)", cursor: "pointer" }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 6, border: "2px solid",
                    borderColor: c.done ? "#5ab0f0" : "rgba(100,160,220,0.3)",
                    background: c.done ? "#5ab0f0" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, transition: "all 0.15s"
                  }}>
                    {c.done && <span style={{ color: "white", fontSize: 18 }}>âœ“</span>}
                  </div>
                  <span style={{ fontSize: 19, color: c.done ? "#7ab0cc" : "#ffffff", textDecoration: c.done ? "line-through" : "none" }}>{c.label}</span>
                </div>
              ))}
            </Card>
            <Card>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em", marginBottom: 16 }}>YOUR PROGRESS</div>
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 54, fontWeight: 700, color: "#5ab0f0" }}>{Math.round(doneCount / checks.length * 100)}%</div>
                <div style={{ fontSize: 19, color: "#a0c8e8", marginTop: 4 }}>Onboarding complete</div>
                <div style={{ marginTop: 20, height: 8, background: "rgba(100,160,220,0.25)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.round(doneCount / checks.length * 100)}%`, background: "linear-gradient(90deg, #3a9ad9, #2a7ab8)", borderRadius: 4, transition: "width 0.3s" }} />
                </div>
              </div>
              <div style={{ marginTop: 20, padding: "14px", background: "rgba(80,160,230,0.12)", borderRadius: 10, fontSize: 19, color: "#b0cce0", lineHeight: 1.6 }}>
                Once you complete onboarding, you'll be able to start bringing businesses onto the QR-Wegn platform and earning commissions.
              </div>
            </Card>
          </div>
        )}

        {tab === "training" && (
          <Card>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#a0c8e8", letterSpacing: "0.08em", marginBottom: 16 }}>YOUR TRAINING</div>
            {TRAINING.map(t => {
              const sc = STATUS_STYLE[t.status];
              return (
                <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid rgba(100,160,220,0.22)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 8, background: "rgba(100,160,220,0.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                      {t.type === "Video" ? "â–·" : "â—»"}
                    </div>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 600, color: "#ffffff" }}>{t.title}</div>
                      <div style={{ fontSize: 17, color: "#7ab0cc" }}>{t.type}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 17, fontWeight: 600, background: sc.bg, color: sc.color, padding: "3px 10px", borderRadius: 20 }}>{sc.label}</span>
                    {t.status !== "completed" && (
                      <button style={{ fontSize: 18, color: "#5ab0f0", background: "rgba(80,160,230,0.15)", border: "1px solid rgba(80,160,230,0.35)", borderRadius: 7, padding: "5px 12px", cursor: "pointer" }}>Open</button>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>
        )}

        {tab === "materials" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {MATERIALS.map((m, i) => (
              <Card key={i} style={{ padding: "20px" }}>
                <div style={{ fontSize: 34, marginBottom: 12 }}>â—‡</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#ffffff", marginBottom: 6 }}>{m.title}</div>
                <div style={{ fontSize: 18, color: "#7ab0cc", marginBottom: 16 }}>{m.type}</div>
                <button style={{
                  width: "100%", padding: "8px 0", borderRadius: 8,
                  background: "rgba(80,160,230,0.18)", border: "1px solid rgba(80,160,230,0.35)",
                  color: "#5ab0f0", fontSize: 19, fontWeight: 600, cursor: "pointer"
                }}>Download</button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
