import { useState } from "react";
import { supabase } from "../lib/supabase";

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  fontSize: 15,
  border: "1.5px solid rgba(100,160,220,0.35)",
  background: "rgba(8,16,36,0.9)",
  color: "#ffffff",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const labelStyle = {
  fontSize: 12,
  color: "#a0c8e8",
  fontWeight: 600,
  letterSpacing: "0.06em",
  display: "block",
  marginBottom: 6,
};

export default function JoinPage({ partnerId }) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    country: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [error,      setError]      = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) { setError("Full name is required."); return; }
    if (!form.email.trim())     { setError("Email is required."); return; }

    setSubmitting(true);
    setError("");

    const { error: dbError } = await supabase.from("promotors").insert({
      partner_id:   partnerId,
      full_name:    form.full_name.trim(),
      email:        form.email.trim(),
      phone:        form.phone.trim()   || null,
      country:      form.country.trim() || null,
      type:         "promotor",
      status:       "Interested",
      recruited_at: new Date().toISOString(),
    });

    setSubmitting(false);
    if (dbError) {
      setError("Submission failed: " + dbError.message);
      return;
    }

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(160deg, #080808 0%, #0a1428 100%)",
        padding: "24px",
      }}>
        <div style={{
          background: "rgba(10,20,45,0.95)",
          backdropFilter: "blur(16px)",
          borderRadius: 20,
          border: "1px solid rgba(50,80,140,0.4)",
          boxShadow: "0 8px 48px rgba(0,0,0,0.5)",
          padding: "48px 40px",
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "rgba(40,180,80,0.15)",
            border: "2px solid rgba(40,180,80,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 30, margin: "0 auto 24px",
          }}>✓</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#ffffff", margin: "0 0 16px" }}>
            Application Received
          </h2>
          <p style={{ fontSize: 16, color: "#a0c8e8", lineHeight: 1.7, margin: 0 }}>
            Thank you. Your QR-Wegn partner application has been received. We'll be in touch shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #080808 0%, #0a1428 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "32px 20px",
    }}>
      <div style={{
        background: "rgba(10,20,45,0.95)",
        backdropFilter: "blur(16px)",
        borderRadius: 20,
        border: "1px solid rgba(50,80,140,0.4)",
        boxShadow: "0 8px 48px rgba(0,0,0,0.5)",
        padding: "40px 40px 44px",
        maxWidth: 500,
        width: "100%",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/Logo.png" alt="QR-Wegn" style={{ width: 150, display: "block", margin: "0 auto 24px" }} />
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#ffffff", margin: "0 0 10px" }}>
            Join as a Partner
          </h1>
          <p style={{ fontSize: 15, color: "#a0c8e8", margin: 0, lineHeight: 1.6 }}>
            You've been referred to join the QR-Wegn partner network. Fill in your details below.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={labelStyle}>FULL NAME *</label>
            <input
              style={inputStyle}
              value={form.full_name}
              onChange={set("full_name")}
              placeholder="e.g. Meron Tesfaye"
              required
            />
          </div>

          <div>
            <label style={labelStyle}>EMAIL *</label>
            <input
              style={inputStyle}
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label style={labelStyle}>PHONE</label>
            <input
              style={inputStyle}
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              placeholder="+1 555 000 0000"
            />
          </div>

          <div>
            <label style={labelStyle}>COUNTRY</label>
            <input
              style={inputStyle}
              value={form.country}
              onChange={set("country")}
              placeholder="e.g. United States"
            />
          </div>

          <div>
            <label style={labelStyle}>NOTES</label>
            <textarea
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              rows={3}
              value={form.notes}
              onChange={set("notes")}
              placeholder="Tell us about yourself and your network..."
            />
          </div>

          {error && (
            <p style={{ color: "#f07070", fontSize: 13, margin: 0, padding: "10px 14px", background: "rgba(220,80,80,0.1)", borderRadius: 8, border: "1px solid rgba(220,80,80,0.25)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "13px 0", borderRadius: 10, border: "none",
              background: submitting ? "rgba(80,160,230,0.4)" : "linear-gradient(135deg, #3a9ad9, #2a7ab8)",
              color: "#ffffff", fontSize: 16, fontWeight: 700,
              cursor: submitting ? "default" : "pointer",
              boxShadow: submitting ? "none" : "0 4px 14px rgba(60,150,220,0.35)",
              transition: "all 0.15s",
            }}
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}
