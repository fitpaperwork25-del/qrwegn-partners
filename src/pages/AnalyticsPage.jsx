import { Card } from "./AdminDashboard";

export default function AnalyticsPage() {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#ffffff", margin: 0 }}>Analytics</h1>
        <p style={{ fontSize: 15, color: "#a0c8e8", margin: "6px 0 0" }}>
          Performance trends, growth metrics, and network insights.
        </p>
      </div>
      <Card style={{ textAlign: "center", padding: "80px 24px" }}>
        <div style={{ fontSize: 52, marginBottom: 20 }}>📊</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", margin: "0 0 12px" }}>Analytics Coming Soon</h2>
        <p style={{ color: "#7ab0cc", fontSize: 15, margin: "0 auto", maxWidth: 420, lineHeight: 1.7 }}>
          Charts, growth trends, revenue forecasting, and promotor performance analytics
          are under development.
        </p>
      </Card>
    </div>
  );
}
