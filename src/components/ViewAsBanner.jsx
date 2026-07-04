// Read-only "view as" indicator. Rendered by App.jsx above the impersonated
// portal — never mounted by the portals themselves. Exiting only clears
// in-memory viewAs state; the admin's own auth session is never touched.
function ViewAsBanner({ type, name, onExit }) {
  const label = type === "partner" ? "Partner" : "Promotor";

  return (
    <div
      style={{
        background: "#e8c547",
        color: "#1a1400",
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        flexWrap: "wrap",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      <span>
        Viewing as {name || "Unknown"} ({label}) — read-only, no actions available
      </span>
      <button
        onClick={onExit}
        style={{
          padding: "5px 14px",
          borderRadius: 8,
          border: "1px solid rgba(0,0,0,0.35)",
          background: "rgba(0,0,0,0.08)",
          color: "#1a1400",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Exit view
      </button>
    </div>
  );
}

export default ViewAsBanner;
