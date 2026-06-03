import { Card } from "./AdminDashboard";

export default function ReportsPage() {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#ffffff", margin: 0 }}>Reports</h1>
        <p style={{ fontSize: 15, color: "#a0c8e8", margin: "6px 0 0" }}>
          Exportable commission statements, payout summaries, and pipeline reports.
        </p>
      </div>
      <Card style={{ textAlign: "center", padding: "80px 24px" }}>
        <div style={{ fontSize: 52, marginBottom: 20 }}>📋</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", margin: "0 0 12px" }}>Reports Coming Soon</h2>
        <p style={{ color: "#7ab0cc", fontSize: 15, margin: "0 auto", maxWidth: 420, lineHeight: 1.7 }}>
          Downloadable PDF and CSV reports for commissions, payouts, and lead pipeline
          are under development.
        </p>
      </Card>
    </div>
  );
}
