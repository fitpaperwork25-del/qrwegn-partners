import { Card } from "./AdminDashboard";

const MATERIALS = [
  { id: 1, title: "Partner Pitch Deck", type: "Pitch Deck", desc: "Full QR-Wegn vision and partner opportunity", updated: "May 19" },
  { id: 2, title: "Restaurant Onboarding Script", type: "Script", desc: "Step-by-step script for approaching restaurant owners", updated: "May 17" },
  { id: 3, title: "QR Label Kit Instructions", type: "Guide", desc: "How to print and install QR table labels", updated: "May 14" },
  { id: 4, title: "Partner Commission Sheet", type: "PDF", desc: "Revenue sharing and commission breakdown", updated: "May 19" },
  { id: 5, title: "QR-Wegn One-Pager", type: "Flyer", desc: "Single page overview for handing to businesses", updated: "May 17" },
  { id: 6, title: "Demo Booking Template", type: "Template", desc: "Email template for scheduling demo meetings", updated: "May 14" },
];

const TYPE_COLORS = {
  "Pitch Deck": { bg: "rgba(42,122,184,0.08)", color: "#2a7ab8" },
  "Script": { bg: "rgba(40,180,80,0.1)", color: "#1a7a30" },
  "Guide": { bg: "rgba(240,180,60,0.1)", color: "#9a6a10" },
  "PDF": { bg: "rgba(100,100,220,0.08)", color: "#3a3aaa" },
  "Flyer": { bg: "rgba(220,80,80,0.08)", color: "#9a2a2a" },
  "Template": { bg: "rgba(160,100,220,0.08)", color: "#6a30aa" },
};

export default function MaterialsPage() {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a3a5a", margin: 0 }}>Outreach Materials</h1>
          <p style={{ fontSize: 14, color: "#7aaac8", margin: "4px 0 0" }}>Sales and deployment assets for partners</p>
        </div>
        <button style={{
          background: "linear-gradient(135deg, #3a9ad9, #2a7ab8)", color: "white",
          border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14,
          fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px rgba(42,122,184,0.25)"
        }}>+ Add Material</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
        {MATERIALS.map(m => {
          const tc = TYPE_COLORS[m.type] || TYPE_COLORS["PDF"];
          return (
            <Card key={m.id} style={{ padding: "18px 22px", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: tc.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>◇</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1a3a5a" }}>{m.title}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, background: tc.bg, color: tc.color, padding: "2px 8px", borderRadius: 20, letterSpacing: "0.06em" }}>{m.type.toUpperCase()}</span>
                </div>
                <p style={{ fontSize: 13, color: "#7aaac8", margin: "0 0 6px" }}>{m.desc}</p>
                <span style={{ fontSize: 11, color: "#9abccc" }}>Updated {m.updated}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <button style={{ fontSize: 12, color: "#2a7ab8", background: "rgba(42,122,184,0.06)", border: "1px solid rgba(42,122,184,0.15)", borderRadius: 7, padding: "5px 12px", cursor: "pointer", fontWeight: 500 }}>Download</button>
                <button style={{ fontSize: 12, color: "#9abccc", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
