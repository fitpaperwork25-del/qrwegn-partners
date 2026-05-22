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
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
    if (resetError) { setError(resetError.message); return; }
    setResetSent(true);
    setError("");
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(160deg, #c8e8f8 0%, #dbeeff 25%, #e8f4fd 50%, #d4ecfb 75%, #eaf6ff 100%)",
      position: "relative", overflow: "hidden"
    }}>
      <div style={{ position: "absolute", top: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: "rgba(180,220,255,0.25)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -80, left: -80, width: 400, height: 400, borderRadius: "50%", background: "rgba(160,210,250,0.2)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "30%", left: "10%", width: 200, height: 200, borderRadius: "50%", background: "rgba(200,230,255,0.3)", pointerEvents: "none" }} />

      <div style={{
        background: "rgba(255,255,255,0.75)", backdropFilter: "blur(24px)",
        borderRadius: 20, padding: "48px 44px", width: 400,
        boxShadow: "0 8px 48px rgba(100,160,220,0.15), 0 2px 8px rgba(100,160,220,0.08)",
        border: "1px solid rgba(255,255,255,0.9)", position: "relative", zIndex: 10
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/Logo.png" alt="QR-Wegn" style={{ width: 180, display: "block", margin: "0 auto 16px" }} />
          <p style={{ fontSize: 14, color: "#7aaac8", margin: 0, letterSpacing: "0.04em" }}>
            Partner Network Portal
          </p>
        </div>

        <div style={{
          display: "flex", background: "rgba(100,160,220,0.08)", borderRadius: 10,
          padding: 4, marginBottom: 24, gap: 4
        }}>
          {["admin", "partner"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
              background: mode === m ? "white" : "transparent",
              color: mode === m ? "#2a7ab8" : "#7aaac8",
              fontSize: 13, fontWeight: mode === m ? 600 : 400,
              boxShadow: mode === m ? "0 1px 4px rgba(100,160,220,0.15)" : "none",
              transition: "all 0.15s", textTransform: "capitalize"
            }}>{m === "admin" ? "Admin" : "Partner"}</button>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: "#7aaac8", display: "block", marginBottom: 6, fontWeight: 500, letterSpacing: "0.06em" }}>EMAIL</label>
          <input value={email} onChange={e => setEmail(e.target.value)}
            placeholder={mode === "admin" ? "info@qrwegn.com" : "partner@email.com"}
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 14,
              border: "1.5px solid rgba(100,160,220,0.2)", background: "rgba(255,255,255,0.8)",
              color: "#1a3a5a", outline: "none", boxSizing: "border-box"
            }} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12, color: "#7aaac8", display: "block", marginBottom: 6, fontWeight: 500, letterSpacing: "0.06em" }}>PASSWORD</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 14,
              border: "1.5px solid rgba(100,160,220,0.2)", background: "rgba(255,255,255,0.8)",
              color: "#1a3a5a", outline: "none", boxSizing: "border-box"
            }} />
        </div>

        <div style={{ textAlign: "right", marginTop: -10, marginBottom: 16 }}>
          <button onClick={handleForgotPassword} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#7aaac8", fontSize: 12, padding: 0, textDecoration: "underline"
          }}>Forgot password?</button>
        </div>

        {resetSent && (
          <p style={{ color: "#2a7ab8", fontSize: 13, marginBottom: 16 }}>
            Password reset email sent. Check your inbox.
          </p>
        )}

        {error && (
          <p style={{ color: "#b00020", fontSize: 13, marginBottom: 16 }}>
            {error}
          </p>
        )}

        <button onClick={handleLogin} disabled={loading} style={{
          width: "100%", padding: "13px 0", borderRadius: 10, border: "none",
          background: loading ? "rgba(100,160,220,0.4)" : "linear-gradient(135deg, #3a9ad9, #2a7ab8)",
          color: "white", fontSize: 15, fontWeight: 600, cursor: loading ? "default" : "pointer",
          boxShadow: "0 4px 16px rgba(42,122,184,0.3)", transition: "all 0.2s",
          letterSpacing: "0.02em"
        }}>
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p style={{ textAlign: "center", fontSize: 12, color: "#9abccc", marginTop: 20, marginBottom: 0 }}>
          QR-Wegn · ወግን · Partner Network
        </p>
      </div>
    </div>
  );
}