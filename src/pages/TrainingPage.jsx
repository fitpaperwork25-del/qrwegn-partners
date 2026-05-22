import { Card } from "./AdminDashboard";

const MATERIALS = [
  { id: 1, title: "QR-Wegn Platform Overview", type: "PDF", size: "2.4 MB", uploaded: "May 14", assigned: 4 },
  { id: 2, title: "How to Onboard a Restaurant", type: "Video", size: "45 MB", uploaded: "May 14", assigned: 3 },
  { id: 3, title: "Partner Commission Structure", type: "PDF", size: "0.8 MB", uploaded: "May 17", assigned: 2 },
  { id: 4, title: "QR Label Printing Guide", type: "PDF", size: "1.2 MB", uploaded: "May 17", assigned: 2 },
  { id: 5, title: "Staff Dashboard Walkthrough", type: "Video", size: "38 MB", uploaded: "May 19", assigned: 1 },
  { id: 6, title: "Customer Scan Experience", type: "Video", size: "22 MB", uploaded: "May 19", assigned: 1 },
];

export default function TrainingPage() {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a3a5a", margin: 0 }}>Training Materials</h1>
          <p style={{ fontSize: 14, color: "#7aaac8", margin: "4px 0 0" }}>Manage and assign training content to partners</p>
        </div>
        <button style={{
          background: "linear-gradient(135deg, #3a9ad9, #2a7ab8)", color: "white",
          border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14,
          fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px rgba(42,122,184,0.25)"
        }}>+ Upload Material</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {MATERIALS.map(m => (
          <Card key={m.id} style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: m.type === "Video" ? "rgba(160,100,220,0.1)" : "rgba(42,122,184,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, flexShrink: 0
              }}>{m.type === "Video" ? "▷" : "◻"}</div>
              <div>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                  color: m.type === "Video" ? "#6a30aa" : "#2a7ab8",
                  background: m.type === "Video" ? "rgba(160,100,220,0.1)" : "rgba(42,122,184,0.08)",
                  padding: "2px 7px", borderRadius: 20
                }}>{m.type.toUpperCase()}</span>
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1a3a5a", marginBottom: 4 }}>{m.title}</div>
            <div style={{ fontSize: 12, color: "#9abccc", marginBottom: 14 }}>{m.size} · Uploaded {m.uploaded}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#7aaac8" }}>{m.assigned} partners assigned</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ fontSize: 12, color: "#2a7ab8", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>Assign</button>
                <button style={{ fontSize: 12, color: "#9abccc", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
