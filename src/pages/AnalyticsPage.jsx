const NAVY = "#0B1739";

export default function AnalyticsPage({ navigate }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui,-apple-system,Segoe UI,sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ maxWidth: 560, width: "100%", textAlign: "center" }}>

        {/* Icon */}
        <div style={{ fontSize: 56, marginBottom: 24, lineHeight: 1 }}>📊</div>

        {/* Coming Soon badge */}
        <span style={{ display: "inline-block", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", background: "#f1f5f9", color: "#374151", padding: "5px 14px", borderRadius: 99, marginBottom: 24 }}>
          Coming Soon
        </span>

        {/* Title */}
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#111827", margin: "0 0 16px", letterSpacing: "-0.03em" }}>
          Analytics
        </h1>

        {/* Description */}
        <p style={{ fontSize: 17, color: "#374151", lineHeight: 1.7, margin: "0 0 36px" }}>
          Charts, growth trends, revenue forecasting, and promotor performance analytics are under development.
        </p>

        {/* Back button */}
        <button
          onClick={() => navigate("dashboard")}
          style={{ fontSize: 15, fontWeight: 700, padding: "12px 28px", borderRadius: 12, border: "none", background: NAVY, color: "#fff", cursor: "pointer", boxShadow: "0 2px 8px rgba(11,23,57,0.2)", transition: "opacity 0.15s" }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}
