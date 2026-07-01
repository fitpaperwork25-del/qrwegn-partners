import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

function PortalApp() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState("info@qrwegn.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // fetch profile role (single source of truth)
  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error || !data) {
      console.log("profile fetch error:", error);
      return null;
    }

    return (data.role || "").toLowerCase();
  };

  // init session restore
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data?.session?.user;

      if (sessionUser) {
        const r = await fetchProfile(sessionUser.id);

        setUser(sessionUser);
        setRole(r);
      }

      setLoading(false);
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
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setError("Invalid login credentials");
      return;
    }

    const u = data.user;
    const r = await fetchProfile(u.id);

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

  return (
    <div style={{ padding: 20 }}>
      {normalizedRole === "admin" ? (
        <h1>Admin Dashboard</h1>
      ) : (
        <h1>Partner Portal</h1>
      )}

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