import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import AdminDashboard from "./pages/AdminDashboard";

function PortalApp() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState("info@qrwegn.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      async (_event, session) => {
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

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

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

  // Administrator routing restored (Phase 1): render the real
  // AdminDashboard instead of the placeholder heading. Its internal
  // navigate() prop only drives sub-views within its own partner
  // pipeline (partners list / partner profile) — not yet wired to any
  // other module, so a no-op keeps this a minimal, safe change.
  if (normalizedRole === "admin") {
    return <AdminDashboard navigate={() => {}} />;
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