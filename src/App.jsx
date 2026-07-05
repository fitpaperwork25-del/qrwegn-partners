import { useEffect, useRef, useState } from "react";
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
import PartnerProfile from "./pages/PartnerProfile";
import TrainingPage from "./pages/TrainingPage";
import PromotorPortal from "./pages/PromotorPortal";
import PartnerPortal from "./pages/PartnerPortal";
import ViewAsBanner from "./components/ViewAsBanner";
import LoginScreen from "./components/LoginScreen";

function PortalApp() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState("info@qrwegn.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Forgot-password (login screen only) — distinct from the recovery-link
  // screen's own recoveryMessage/recoveryError below, which covers a
  // different step (setting the new password after clicking the emailed
  // link, not requesting that email in the first place).
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
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
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);
  // Admin "view as" — in-memory only, never persisted. Admin's own auth
  // session is never touched; this just swaps which portal renders.
  const [viewAs, setViewAs] = useState(null); // { type: 'partner'|'promotor', id, name } | null
  // Ordering guard for the auth listener — same class of fix as the
  // await-signOut-before-clearing-state fix in 47fe395. supabase.js's
  // no-op `lock` override means concurrent supabase.auth.* operations are
  // never serialized, so a stale "no session" event (e.g. a background
  // refresh-token failure for an old session already in storage) can
  // land after signIn() has already set a fresh, valid user. Once signIn()
  // confirms a valid user, this ref marks that sign-in authoritative so
  // the listener ignores any stale no-session event until an explicit
  // logout() clears it — it is never cleared by the listener itself.
  const freshSignInRef = useRef(false);

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
          // Ignore a stale "no session" event that arrives after a fresh
          // sign-in already succeeded (see freshSignInRef above) — only an
          // explicit logout() may clear a confirmed session.
          if (freshSignInRef.current) return;
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

    // Mark this sign-in authoritative before the profile lookup, so any
    // stale "no session" event racing in behind it gets ignored.
    freshSignInRef.current = true;

    let r = null;
    try {
      r = await fetchProfile(u.id);
    } catch (e) {
      console.error("[SIGNIN] fetchProfile threw", e);
    }

    setUser(u);
    setRole(r);
  };

  // Forgot password — sends a real Supabase recovery email to whatever
  // address is currently typed into the login form. Landing back on this
  // same origin with the emailed link is already handled by the
  // recoveryMode/type=recovery detection above and updatePassword() below.
  const sendPasswordReset = async () => {
    setResetMessage("");
    setResetError("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setResetError("Enter your email above, then click Forgot password?");
      return;
    }

    setResetLoading(true);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: window.location.origin,
      });

      if (resetErr) {
        setResetError(resetErr.message || "Could not send reset email. Try again.");
        return;
      }

      setResetMessage("Password reset email sent. Check your inbox.");
    } catch (e) {
      setResetError(e?.message || "Could not send reset email. Try again.");
    } finally {
      setResetLoading(false);
    }
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

  // Real admin navigation — replaces the earlier no-op stub.
  const navigate = (to, params) => {
    if (params?.partnerId) setSelectedPartnerId(params.partnerId);
    setPage(to);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("[LOGOUT] signOut error:", e);
    }
    // Explicit, user-initiated logout is the only thing allowed to clear
    // the fresh-sign-in guard (see freshSignInRef above).
    freshSignInRef.current = false;
    setUser(null);
    setRole(null);
    setPage("dashboard");
    setViewAs(null);
  };

  const startViewAs = (type, id, name) => setViewAs({ type, id, name });
  const exitViewAs = () => setViewAs(null);

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
      <LoginScreen
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        error={error}
        onSignIn={signIn}
        onForgotPassword={sendPasswordReset}
        resetMessage={resetMessage}
        resetError={resetError}
        resetLoading={resetLoading}
      />
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

    // Read-only "view as" — admin's own session/role is untouched above.
    // Renders the target portal directly with a viewAs*Id override and
    // readOnly=true so it never resolves scope from this admin's session.
    if (viewAs) {
      const viewedProfile = { full_name: viewAs.name };
      return (
        <>
          <ViewAsBanner type={viewAs.type} name={viewAs.name} onExit={exitViewAs} />
          {viewAs.type === "partner" ? (
            <PartnerPortal profile={viewedProfile} onLogout={exitViewAs} viewAsPartnerId={viewAs.id} readOnly />
          ) : (
            <PromotorPortal profile={viewedProfile} onLogout={exitViewAs} viewAsPromotorId={viewAs.id} readOnly />
          )}
        </>
      );
    }

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
        {page === "partners" && <PartnersPage navigate={navigate} onViewAs={startViewAs} />}
        {page === "partner-profile" && <PartnerProfile partnerId={selectedPartnerId} navigate={navigate} onViewAs={startViewAs} />}
        {page === "clients" && <ClientsPage />}
        {page === "commissions" && <CommissionsPage />}
        {page === "payouts" && <PayoutsPage />}
        {page === "training" && <TrainingPage />}
        {page === "materials" && <MaterialsPage />}
        {page === "notifications" && <NotificationsPage />}
      </AdminLayout>
    );
  }

  // Promotor/partner routing restored — matches last known-good App.jsx
  // (commit dd7b17b), lost when admin routing was restored in 3c28410
  // from that same snapshot without carrying these branches forward.
  if (normalizedRole === "promotor") {
    const profile = { email: user?.email, full_name: user?.email };
    return <PromotorPortal profile={profile} onLogout={logout} />;
  }

  if (normalizedRole === "partner") {
    const profile = { email: user?.email, full_name: user?.email };
    return <PartnerPortal profile={profile} onLogout={logout} />;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Partner Portal</h1>

      <p>Logged in as: {user.email}</p>
      <p>Role: {normalizedRole || "undefined"}</p>

      <button
        onClick={logout}
        style={{ marginTop: 20 }}
      >
        Sign Out
      </button>
    </div>
  );
}

export default PortalApp;