// Restored from commit dd7b17b (last known-good App.jsx before 65b8cfa
// stripped the dashboard) — unchanged, no logic modified.
function AdminLayout({ children, page, navigate, onLogout, profile }) {
  const navItems = [
    { id: "dashboard",   label: "Dashboard",   icon: "⊞" },
    { id: "leads",       label: "Leads",       icon: "◈" },
    { id: "partners",    label: "Partners",    icon: "◇" },
    { id: "clients",     label: "Clients",     icon: "◉" },
    { id: "commissions", label: "Commissions", icon: "◎" },
    { id: "payouts",     label: "Payouts",     icon: "⊙" },
    { id: "training",    label: "Training",    icon: "◎" },
    { id: "analytics",   label: "Analytics",   icon: "▦" },
    { id: "reports",     label: "Reports",     icon: "◧" },
    { id: "materials",      label: "Resources",      icon: "◇" },
    { id: "notifications",  label: "Notifications",  icon: "◈" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080808" }}>
      <aside style={{
        width: 220, background: "#0B1739",
        borderRight: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 100,
        boxShadow: "2px 0 24px rgba(0,0,0,0.3)"
      }}>
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <img src="/Logo.png" alt="QR-Wegn" style={{ width: 140, display: "block" }} />
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 8, letterSpacing: "0.08em", fontWeight: 500 }}>
            PARTNER NETWORK
          </div>
        </div>

        <nav style={{ flex: 1, padding: "16px 12px" }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => navigate(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                background: page === item.id ? "rgba(255,255,255,0.12)" : "transparent",
                color: page === item.id ? "#ffffff" : "rgba(255,255,255,0.5)",
                fontSize: 14, fontWeight: page === item.id ? 600 : 400,
                marginBottom: 4, textAlign: "left", transition: "all 0.15s"
              }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Signed in as</div>
          <div style={{ fontSize: 13, color: "#ffffff", fontWeight: 600 }}>
            {profile?.full_name || "Admin"}
          </div>
          <button onClick={onLogout} style={{
            marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.4)", background: "none",
            border: "none", cursor: "pointer", padding: 0
          }}>Sign out →</button>
        </div>
      </aside>

      <main style={{ marginLeft: 220, flex: 1, padding: "32px 36px" }}>
        {children}
      </main>
    </div>
  );
}

export default AdminLayout;
