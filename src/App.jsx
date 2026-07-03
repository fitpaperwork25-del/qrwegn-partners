import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLayout from "./components/AdminLayout";
import LightDashboard from "./pages/LightDashboard";
import LeadsPage from "./pages/LeadsPage";
import ClientsPage from "./pages/ClientsPage";
import CommissionsPage from "./pages/CommissionsPage";
import PayoutsPage from "./pages/PayoutsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ReportsPage from "./pages/ReportsPage";
import NotificationsPage from "./pages/NotificationsPage";
import MaterialsPage from "./pages/MaterialsPage";
import PartnersPage from "./pages/PartnersPage";
import TrainingPage from "./pages/TrainingPage";

function PortalApp() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState("info@qrwegn.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Checked synchronously on first render — the Supabase client begins
  // processing a type=recovery URL immediately at module load (before
  // this component's useEffect can register an onAuthStateChange
  // listener), so waiting for that event alone can miss it. This direct
  // URL check can't miss the timing race; the event listener below
  // stays as a secondary safety net.
  const [recoveryMode, setRecoveryMode] = useState(() => {
    const hash = window.location.hash || "";
    const search = window.location.search || "";
    return hash.includes("type=recovery") || search.includes("type=recovery");
  });
  const [newPassword, setNewPassword] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  // Admin page router — restored from the last known-good App.jsx
  // (commit dd7b17b) so admin navigation reaches the real pages again,
  // instead of the no-op stub from the earlier routing-only restoration.
  const [page, setPage] = useState("dashboard");

  // fetch profile role (single source of truth)
  const fetchProfile = async (userId) => {
    const { data, error, status, statusText } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    console.log("[PROFILE FETCH]", { userId, data, error, status, statusText });

    if (error || !data) {
      console.log("profile fetch error:", error);
      return null;
    }

    return (data.role || "").toLowerCase();
  };

  // init session restore
  useEffect(() => {
    const fallback = setTimeout(() => {
      console.log("[INIT] getSession() timed out — clearing loading state");
      setLoading(false);
    }, 3000);

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const sessionUser = data?.session?.user;

        console.log("[INIT] getSession() resolved", { hasSession: !!sessionUser });

        if (sessionUser) {
          const r = await fetchProfile(sessionUser.id);
          setUser(sessionUser);
          setRole(r);
        }
      } catch (e) {
        console.error("[INIT ERROR]", e);
      } finally {
        clearTimeout(fallback);
        setLoading(false);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          setRecoveryMode(true);
          setLoading(false);
          return;
        }

        const sessionUser = session?.user;

        if (!sessionUser) {
          setUser(null);
          setRole(null);
          return;
        }

        const r = await fetchProfile(sessionUser.id);

        setUser(sessionUser);
        setRole(r);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // login
  const signIn = async () => {
    console.log("SIGNIN START");

    setError("");

    console.log("SIGNIN CALLING SUPABASE");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setError("Invalid login credentials");
      return;
    }

    const u = data.user;

    let r = null;
    try {
      r = await fetchProfile(u.id);
    } catch (e) {
      console.error("[SIGNIN] fetchProfile threw", e);
    }

    setUser(u);
    setRole(r);
  };

  // Recovery-link password update
  const updatePassword = async () => {
    setRecoveryError("");
    setRecoveryMessage("");

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setRecoveryError(error.message || "Could not update password.");
        return;
      }

      // Stay on this screen so the success message is actually visible —
      // recoveryMode is intentionally left true here (previously cleared
      // in this same update, which tore down the branch that displays
      // this message before it could ever be seen).
      setRecoveryMessage("Password updated. You can now sign in with your new password.");
      setNewPassword("");
      await supabase.auth.signOut();
    } catch (e) {
      setRecoveryError(e?.message || "Could not update password.");
    }
  };

  // Real admin navigation — replaces the earlier no-op stub. Only
  // handles a plain page switch for now; Partners/Partner Profile
  // (which used a partnerId param) are not part of this restoration.
  const navigate = (to) => {
    setPage(to);
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setPage("dashboard");
    supabase.auth.signOut().catch(e => console.error("[LOGOUT] signOut error:", e));
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  // SET NEW PASSWORD SCREEN (recovery link) — checked before the normal
  // login/dashboard branches so a recovery session is never routed into
  // the regular app.
  if (recoveryMode) {
    return (
      <div style={{ maxWidth: 400, margin: "80px auto" }}>
        <h2>Set New Password</h2>

        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="new password"
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />

        {recoveryError && (
          <div style={{ color: "red", marginBottom: 10 }}>{recoveryError}</div>
        )}
        {recoveryMessage && (
          <div style={{ color: "green", marginBottom: 10 }}>{recoveryMessage}</div>
        )}

        <button onClick={updatePassword} style={{ width: "100%", padding: 10 }}>
          Set Password
        </button>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!user) {
    return (
      <div style={{ maxWidth: 400, margin: "80px auto" }}>
        <h2>QR-Wegn Login</h2>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email"
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />

        {error && (
          <div style={{ color: "red", marginBottom: 10 }}>{error}</div>
        )}

        <button onClick={signIn} style={{ width: "100%", padding: 10 }}>
          Sign In
        </button>
      </div>
    );
  }

  // ROUTING FIX (core fix)
  const normalizedRole = (role || "").toLowerCase();

  // Administrator routing restored, Phase 2: real navigate() and the
  // full set of existing admin pages, matching the last known-good
  // App.jsx (commit dd7b17b) before the dashboard was stripped.
  // AdminDashboard.jsx itself is left unused, matching its real status
  // at that point in history (superseded by LightDashboard, but never
  // deleted). Partner/promoter routing below is untouched.
  if (normalizedRole === "admin") {
    const profile = { email: user?.email, full_name: user?.email };

    if (page === "analytics") {
      return <AnalyticsPage navigate={navigate} />;
    }
    if (page === "reports") {
      return <ReportsPage navigate={navigate} />;
    }
    if (page === "dashboard") {
      return <LightDashboard navigate={navigate} onLogout={logout} profile={profile} />;
    }

    return (
      <AdminLayout page={page} navigate={navigate} onLogout={logout} profile={profile}>
        {page === "leads" && <LeadsPage navigate={navigate} />}
        {page === "partners" && <PartnersPage navigate={navigate} />}
        {page === "clients" && <ClientsPage />}
        {page === "commissions" && <CommissionsPage />}
        {page === "payouts" && <PayoutsPage />}
        {page === "training" && <TrainingPage />}
        {page === "materials" && <MaterialsPage />}
        {page === "notifications" && <NotificationsPage />}
      </AdminLayout>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Partner Portal</h1>

      <p>Logged in as: {user.email}</p>
      <p>Role: {normalizedRole || "undefined"}</p>

      <button
        onClick={() => supabase.auth.signOut()}
        style={{ marginTop: 20 }}
      >
        Sign Out
      </button>
    </div>
  );
}

export default PortalApp;