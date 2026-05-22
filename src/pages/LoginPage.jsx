import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("admin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setLoading(false);
      setError(loginError.message);
      return;
    }

    const userId = data.user.id;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, partner_id, full_name")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      setLoading(false);
      setError("Login succeeded, but no profile was found.");
      return;
    }

    if (profile.role !== mode) {
      setLoading(false);
      setError(`This account is registered as ${profile.role}, not ${mode}.`);
      return;
    }

    setLoading(false);
    onLogin(profile.role, profile);
  };

  const handleForgotPassword = async () => {
    if (!email) { setError("Enter your email first."); return; }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://qrwegn-partners.vercel.app",
    });
    if (resetError) { setError(resetError.message); return; }
    setResetSent(true);
    setError("");
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(160deg, #050d1a 0%, #0a1525 25%, #0d1a30 50%, #081020 75%, #060e1c 100%)",
      position: "relative", overflow: "hidden"
    }}>
      <div style={{ position: "absolute", top: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: "rgba(30,60,120,0.2)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -80, left: -80, width: 400, height: 400, borderRadius: "50%", background: "rgba(20,50,100,0.15)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "30%", left: "10%", width: 200, height: 200, borderRadius: "50%", background: "rgba(20,50,100,0.2)", pointerEvents: "none" }} />

      <div style={{
        background: "rgba(10,20,45,0.95)", backdropFilter: "blur(24px)",
        borderRadius: 20, padding: "48px 44px", width: 400,
        boxShadow: "0 8px 48px rgba(90,160,255,0.15), 0 0 0 1px rgba(90,160,255,0.1)",
        border: "1px solid rgba(90,160,255,0.15)", position: "relative", zIndex: 10
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/Logo.png" alt="QR-Wegn" style={{ width: 180, display: "block", margin: "0 auto 16px", filter: "brightness(1.1)" }} />
          <p style={{ fontSize: 16, color: "rgba(150,200,255,0.5)", margin: 0, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500 }}>
            Partner Network Portal
          </p>
        </div>

        <div style={{
          display: "flex", background: "rgba(90,160,255,0.06)", borderRadius: 10,
          padding: 4, marginBottom: 24, gap: 4,
          border: "1px solid rgba(90,160,255,0.12)"
        }}>
          {["admin", "partner"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: "9px 0", borderRadius: 8, border: "none", cursor: "pointer",
              background: mode === m ? "rgba(90,176,240,0.18)" : "transparent",
              color: mode === m ? "#7dc4ff" : "rgba(150,200,255,0.4)",
              fontSize: 15, fontWeight: mode === m ? 600 : 400,
              boxShadow: mode === m ? "inset 0 0 0 1px rgba(90,160,255,0.3)" : "none",
              transition: "all 0.15s", textTransform: "capitalize", letterSpacing: "0.02em"
            }}>{m === "admin" ? "Admin" : "Partner"}</button>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: "rgba(150,200,255,0.6)", display: "block", marginBottom: 6, fontWeight: 600, letterSpacing: "0.1em" }}>EMAIL</label>
          <input value={email} onChange={e => setEmail(e.target.value)}
            placeholder={mode === "admin" ? "info@qrwegn.com" : "partner@email.com"}
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 15,
              border: "1.5px solid rgba(90,160,255,0.2)", background: "rgba(5,12,30,0.8)",
              color: "#ffffff", outline: "none", boxSizing: "border-box",
              transition: "border-color 0.15s"
            }} />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 12, color: "rgba(150,200,255,0.6)", display: "block", marginBottom: 6, fontWeight: 600, letterSpacing: "0.1em" }}>PASSWORD</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 15,
              border: "1.5px solid rgba(90,160,255,0.2)", background: "rgba(5,12,30,0.8)",
              color: "#ffffff", outline: "none", boxSizing: "border-box"
            }} />
        </div>

        <div style={{ textAlign: "right", marginBottom: 20 }}>
          <button onClick={handleForgotPassword} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(150,200,255,0.5)", fontSize: 13, padding: 0, textDecoration: "underline"
          }}>Forgot password?</button>
        </div>

        {resetSent && (
          <p style={{ color: "#5ab0f0", fontSize: 14, marginBottom: 16 }}>
            Password reset email sent. Check your inbox.
          </p>
        )}

        {error && (
          <p style={{ color: "#ff6666", fontSize: 14, marginBottom: 16 }}>
            {error}
          </p>
        )}

        <button onClick={handleLogin} disabled={loading} style={{
          width: "100%", padding: "13px 0", borderRadius: 10, border: "none",
          background: loading ? "rgba(90,160,255,0.2)" : "linear-gradient(135deg, #3a9ad9, #2a7ab8)",
          color: "white", fontSize: 16, fontWeight: 600, cursor: loading ? "default" : "pointer",
          boxShadow: loading ? "none" : "0 4px 20px rgba(90,160,255,0.3)", transition: "all 0.2s",
          letterSpacing: "0.02em"
        }}>
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p style={{ textAlign: "center", fontSize: 13, color: "rgba(150,200,255,0.3)", marginTop: 24, marginBottom: 0, letterSpacing: "0.04em" }}>
          QR-Wegn &middot; ወግን &middot; Partner Network
        </p>
      </div>
    </div>
  );
}
