/**
 * DEPRECATED — dead code, pending removal in a separate cleanup commit.
 *
 * Marked 2026-08-02 during WEGN Partners Repository Certification. This
 * component is not imported, routed, dynamically loaded, or otherwise
 * referenced anywhere in this repository (verified by a full
 * repository-wide reference check covering imports, routing, dynamic
 * imports, tests, build config, and deployment config). The live login
 * flow is `App.jsx` (see its `fetchProfile()`/`signIn()`) paired with
 * the presentational `LoginScreen.jsx`, which already fails closed
 * correctly on a lookup failure.
 *
 * This file's role-resolution logic below (`profileData?.role ||
 * "partner"`) does NOT reflect the live application's behavior and
 * should not be used as a reference. It is left in place, unmodified,
 * pending a dedicated cleanup commit to delete it — do not wire it back
 * into the application without first fixing that fallback.
 *
 * See wegn-master-kb/22_VALIDATION_FINDINGS_AND_INCONSISTENCY_LOG.md §2
 * and wegn-master-kb/product-registry/PARTNERS_INTEGRATION_STATUS.md
 * Issue 1 for the full corrected finding.
 */
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("admin");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setErrorText("");

    // 5-second timeout: if any query hangs, unlock the button and warn the user
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      setLoading(false);
      console.warn("LOGIN TIMEOUT: 5s exceeded — a database query is hanging");
      alert("Login is taking too long. Check your internet connection and try again.");
    }, 5000);

    try {
      console.log("LOGIN ATTEMPT:", { email, mode, passwordLength: password.length });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.log("SUPABASE AUTH ERROR:", error);
        setErrorText(error.message);
        return;
      }

      console.log("SUPABASE AUTH SUCCESS, user id:", data?.user?.id);
      const user = data?.user;

      if (!user) {
        setErrorText("Auth succeeded but no user was returned.");
        return;
      }

      let profileData = null;
      try {
        const profileFetch = supabase
          .from("profiles").select("*").eq("id", user.id).single();
        const timeout = new Promise(resolve => setTimeout(resolve, 2500));
        const result = await Promise.race([profileFetch, timeout]);
        if (result?.data) profileData = result.data;
      } catch (profileErr) {
        console.warn("profiles fetch failed, proceeding without it:", profileErr);
      }

      const userRole = profileData?.role || "partner";
      console.log("NAVIGATING as:", userRole);

      if (!timedOut) {
        onLogin(userRole, { ...profileData, email: user.email, id: user.id });
      }

    } catch (err) {
      console.error("LOGIN UNEXPECTED ERROR:", err);
      setErrorText("An unexpected error occurred. Please try again.");
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(160deg, #071426 0%, #0a1830 45%, #0d1f3d 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "rgba(40,90,150,0.22)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: -100,
          left: -100,
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "rgba(35,80,135,0.18)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          background: "rgba(10,20,45,0.88)",
          backdropFilter: "blur(24px)",
          borderRadius: 22,
          padding: "48px 44px",
          width: 400,
          boxShadow:
            "0 12px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(90,160,230,0.18)",
          border: "1px solid rgba(90,160,230,0.2)",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img
            src="/wegn-logo.png"
            alt="WEGN"
            style={{
              width: 180,
              display: "block",
              margin: "0 auto 18px",
            }}
          />

          <p
            style={{
              fontSize: 15,
              color: "#7aaac8",
              margin: 0,
              letterSpacing: "0.08em",
              fontWeight: 600,
            }}
          >
            PARTNER NETWORK PORTAL
          </p>
        </div>

        <div
          style={{
            display: "flex",
            background: "rgba(100,160,220,0.08)",
            borderRadius: 12,
            padding: 4,
            marginBottom: 24,
            gap: 4,
            border: "1px solid rgba(100,160,220,0.18)",
          }}
        >
          {["admin", "partner"].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setErrorText("");
              }}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 9,
                border: "none",
                cursor: "pointer",
                background:
                  mode === m ? "rgba(90,160,230,0.25)" : "transparent",
                color: mode === m ? "#8fd0ff" : "#6f95b8",
                fontSize: 14,
                fontWeight: mode === m ? 700 : 500,
                boxShadow:
                  mode === m
                    ? "inset 0 0 0 1px rgba(120,190,255,0.25)"
                    : "none",
                textTransform: "capitalize",
              }}
            >
              {m === "admin" ? "Admin" : "Partner"}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              fontSize: 12,
              color: "#7aaac8",
              display: "block",
              marginBottom: 6,
              fontWeight: 600,
              letterSpacing: "0.06em",
            }}
          >
            EMAIL
          </label>

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={
              mode === "admin" ? "admin@qrwegn.com" : "partner@email.com"
            }
            style={{
              width: "100%",
              padding: "13px 14px",
              borderRadius: 10,
              fontSize: 15,
              border: "1.5px solid rgba(100,160,220,0.28)",
              background: "rgba(4,12,28,0.9)",
              color: "#ffffff",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              fontSize: 12,
              color: "#7aaac8",
              display: "block",
              marginBottom: 6,
              fontWeight: 600,
              letterSpacing: "0.06em",
            }}
          >
            PASSWORD
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{
              width: "100%",
              padding: "13px 14px",
              borderRadius: 10,
              fontSize: 15,
              border: "1.5px solid rgba(100,160,220,0.28)",
              background: "rgba(4,12,28,0.9)",
              color: "#ffffff",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ textAlign: "right", marginBottom: 18 }}>
          <button
            type="button"
            onClick={() => alert("Use Supabase password recovery for now.")}
            style={{
              background: "none",
              border: "none",
              color: "#7aaac8",
              fontSize: 13,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Forgot password?
          </button>
        </div>

        {errorText && (
          <div
            style={{
              color: "#ff6b6b",
              fontSize: 14,
              marginBottom: 16,
            }}
          >
            {errorText}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading || !email.trim() || !password}
          style={{
            width: "100%",
            padding: "14px 0",
            borderRadius: 10,
            border: "none",
            background:
              loading || !email.trim() || !password
                ? "rgba(100,160,220,0.35)"
                : "linear-gradient(135deg, #3a9ad9, #2a7ab8)",
            color: "white",
            fontSize: 16,
            fontWeight: 700,
            cursor: loading || !email.trim() || !password ? "default" : "pointer",
            boxShadow: "0 6px 20px rgba(42,122,184,0.35)",
          }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "#6f95b8",
            marginTop: 22,
            marginBottom: 0,
          }}
        >
          WEGN · ወግን · Partner Network
        </p>
      </div>
    </div>
  );
}