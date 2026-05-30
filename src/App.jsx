import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import PartnersPage from "./pages/PartnersPage";
import PartnerProfile from "./pages/PartnerProfile";
import TrainingPage from "./pages/TrainingPage";
import MaterialsPage from "./pages/MaterialsPage";
import PartnerPortal from "./pages/PartnerPortal";

export default function App() {
  const [page, setPage] = useState(
    window.location.hash.includes("type=recovery") ? "reset-password" : "login"
  );
  const [role, setRole] = useState(null);
  const [profile, setProfile] = useState(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);

  // Restore session on page reload
  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) return;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return;
      const user = session.user;

      let profileData = null;
      try {
        const profileFetch = supabase
          .from("profiles").select("*").eq("id", user.id).single();
        const timeout = new Promise(resolve => setTimeout(resolve, 2500));
        const result = await Promise.race([profileFetch, timeout]);
        if (result?.data) profileData = result.data;
      } catch (e) {
        console.warn("session-restore profiles fetch failed:", e);
      }

      const userRole = profileData?.role || "admin";
      setRole(userRole);
      setProfile({ ...profileData, email: user.email, id: user.id });
      setPage(userRole === "admin" ? "dashboard" : "partner-portal");
    });
  }, []);

  const navigate = (to, params = {}) => {
    setPage(to);
    if (params.partnerId) setSelectedPartnerId(params.partnerId);
  };

  // Profile is already fetched in LoginPage — just set state
  const login = (userRole, profileData) => {
    setRole(userRole);
    setProfile(profileData);
    setPage(userRole === "admin" ? "dashboard" : "partner-portal");
  };

  const logout = () => {
    setRole(null);
    setProfile(null);
    setSelectedPartnerId(null);
    setPage("login");
    supabase.auth.signOut().catch(e => console.warn("signOut error:", e));
  };

  if (page === "reset-password") return <ResetPasswordPage setPage={setPage} />;
  if (page === "login") return <LoginPage onLogin={login} />;

  if (role === "partner") {
    return <PartnerPortal profile={profile} onLogout={logout} />;
  }

  return (
    <AdminLayout page={page} navigate={navigate} onLogout={logout} profile={profile}>
      {page === "dashboard" && <AdminDashboard navigate={navigate} />}
      {page === "partners" && <PartnersPage navigate={navigate} />}
      {page === "partner-profile" && <PartnerProfile partnerId={selectedPartnerId} navigate={navigate} />}
      {page === "training" && <TrainingPage />}
      {page === "materials" && <MaterialsPage />}
    </AdminLayout>
  );
}

function ResetPasswordPage({ setPage }) {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const updatePassword = async () => {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Password updated. You can now sign in.");
      setTimeout(() => setPage("login"), 1200);
    }

    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#080808",
    }}>
      <div style={{
        background: "#111111",
        borderRadius: 20,
        padding: "42px",
        width: 400,
        boxShadow: "0 8px 48px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}>
        <img src="/Logo.png" alt="QR-Wegn" style={{ width: 170, display: "block", margin: "0 auto 20px" }} />

        <h2 style={{ color: "#F0EDE8", textAlign: "center" }}>Set New Password</h2>

        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="New password"
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 10,
            fontSize: 14,
            background: "#080808",
            border: "1.5px solid rgba(255,255,255,0.08)",
            color: "#F0EDE8",
            boxSizing: "border-box",
            marginBottom: 16,
            outline: "none",
          }}
        />

        <button onClick={updatePassword} disabled={loading} style={{
          width: "100%",
          padding: "13px 0",
          borderRadius: 10,
          border: "none",
          background: "#E8C547",
          color: "#080808",
          fontSize: 15,
          fontWeight: 700,
          cursor: "pointer",
        }}>
          {loading ? "Updating..." : "Update Password"}
        </button>

        {message && (
          <p style={{ marginTop: 16, color: "#666666", fontSize: 13, textAlign: "center" }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

function AdminLayout({ children, page, navigate, onLogout, profile }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "partners", label: "Partners", icon: "◈" },
    { id: "training", label: "Training", icon: "◎" },
    { id: "materials", label: "Materials", icon: "◇" },
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