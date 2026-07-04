import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useSupabaseQuery } from "../hooks/useSupabaseQuery";
import { STAGE_COLORS, STAGES, StageBadge, Card } from "./AdminDashboard";

const EMPTY_FORM = {
  full_name: "", email: "", phone: "", territory: "",
  languages: "", source: "", stage: "Identified",
  market_tier: "entry", commission_rate: 20, parent_partner_id: "",
};

export default function PartnersPage({ navigate, onViewAs }) {
  const [view, setView] = useState("list");
  const [filterStage, setFilterStage] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const { data, loading, error, refetch } = useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }, []);

  const partners = data || [];

  const handleSave = async () => {
    if (!form.full_name.trim()) { setFormError("Full name is required."); return; }
    setSaving(true);
    setFormError("");

    const languages = form.languages
      ? form.languages.split(",").map(l => l.trim()).filter(Boolean)
      : [];

    const { error } = await supabase.from("partners").insert({
      full_name: form.full_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      territory: form.territory.trim() || null,
      languages,
      source: form.source.trim() || null,
      stage: form.stage,
      market_tier: form.market_tier,
      commission_rate: Number(form.commission_rate),
      parent_partner_id: form.parent_partner_id || null,
    });

    setSaving(false);
    if (error) { setFormError(error.message); return; }
    setShowModal(false);
    setForm(EMPTY_FORM);
    refetch();
  };

  // Promotor hierarchy
  const promotorsByParent = partners.reduce((acc, p) => {
    if (!p.parent_partner_id) return acc;
    if (!acc[p.parent_partner_id]) acc[p.parent_partner_id] = [];
    acc[p.parent_partner_id].push(p);
    return acc;
  }, {});
  const parentPartners = partners.filter(p => promotorsByParent[p.id]);
  const totalPromotors = partners.filter(p => p.parent_partner_id).length;

  const filtered = partners.filter(p => {
    const matchStage = filterStage === "All" || p.stage === filterStage;
    const name = p.full_name || "";
    const territory = p.territory || "";
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) ||
      territory.toLowerCase().includes(search.toLowerCase());
    return matchStage && matchSearch;
  });

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 15,
    border: "1.5px solid rgba(100,160,220,0.35)", background: "rgba(8,16,36,0.95)",
    color: "#ffffff", outline: "none", boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: 12, color: "#a0c8e8", fontWeight: 600,
    letterSpacing: "0.06em", display: "block", marginBottom: 5,
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: "#ffffff", margin: 0 }}>Partners</h1>
          <p style={{ fontSize: 20, color: "#a0c8e8", margin: "4px 0 0" }}>{partners.length} total partners in pipeline</p>
        </div>
        <button onClick={() => { setForm(EMPTY_FORM); setFormError(""); setShowModal(true); }} style={{
          background: "linear-gradient(135deg, #3a9ad9, #2a7ab8)", color: "white",
          border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 20,
          fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px rgba(80,160,230,0.4)"
        }}>+ Add Partner</button>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search partners..."
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 10, fontSize: 20,
            border: "1.5px solid rgba(100,160,220,0.35)", background: "rgba(8,16,36,0.9)",
            color: "#ffffff", outline: "none"
          }} />
        <select value={filterStage} onChange={e => setFilterStage(e.target.value)}
          style={{
            padding: "10px 14px", borderRadius: 10, fontSize: 19,
            border: "1.5px solid rgba(100,160,220,0.35)", background: "rgba(8,16,36,0.9)",
            color: "#ffffff", outline: "none"
          }}>
          <option>All</option>
          {STAGES.map(s => <option key={s}>{s}</option>)}
        </select>
        <div style={{ display: "flex", background: "rgba(8,16,36,0.85)", borderRadius: 10, border: "1px solid rgba(100,160,220,0.32)" }}>
          {["list", "board"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              background: view === v ? "rgba(80,160,230,0.22)" : "transparent",
              color: view === v ? "#5ab0f0" : "#7ab0cc", fontSize: 19, fontWeight: view === v ? 600 : 400,
              textTransform: "capitalize"
            }}>{v}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#a0c8e8", fontSize: 18 }}>Loading partners...</div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#f07070", fontSize: 18 }}>
          Could not load partners. {error.message}
        </div>
      ) : view === "list" ? (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(100,160,220,0.3)" }}>
                {["Partner", "Territory", "Languages", "Stage", "Source", "Commission", ""].map(h => (
                  <th key={h} style={{ padding: "12px 18px", textAlign: "left", fontSize: 17, color: "#a0c8e8", fontWeight: 600, letterSpacing: "0.06em" }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "40px 18px", textAlign: "center", color: "#7ab0cc", fontSize: 18 }}>No partners found</td></tr>
              ) : filtered.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(100,160,220,0.22)" : "none", transition: "background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(100,160,220,0.04)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "linear-gradient(135deg, #1a3560, #0d2045)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 19, fontWeight: 700, color: "#5ab0f0", flexShrink: 0
                      }}>{(p.full_name || "?").split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                      <span
                        onClick={() => navigate("partner-profile", { partnerId: p.id })}
                        style={{ fontSize: 20, fontWeight: 600, color: "#7dc4ff", cursor: "pointer" }}>
                        {p.full_name}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 18px", fontSize: 19, color: "#b0cce0" }}>{p.territory || "—"}</td>
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {(p.languages || []).map(l => (
                        <span key={l} style={{ fontSize: 17, background: "rgba(100,160,220,0.22)", color: "#90bcd8", padding: "2px 7px", borderRadius: 20 }}>{l}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: "14px 18px" }}><StageBadge stage={p.stage || "Identified"} /></td>
                  <td style={{ padding: "14px 18px", fontSize: 19, color: "#a0c8e8" }}>{p.source || "—"}</td>
                  <td style={{ padding: "14px 18px", fontSize: 19, color: "#a0c8e8" }}>{p.commission_rate}%</td>
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <button onClick={() => navigate("partner-profile", { partnerId: p.id })}
                        style={{ fontSize: 18, color: "#5ab0f0", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                        View →
                      </button>
                      {onViewAs && (
                        <button onClick={() => onViewAs("partner", p.id, p.full_name)}
                          style={{ fontSize: 15, color: "#e8c547", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                          View Portal
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
          {STAGES.filter(s => s !== "Declined").map(stage => {
            const c = STAGE_COLORS[stage];
            const stagePartners = filtered.filter(p => p.stage === stage);
            return (
              <div key={stage} style={{ minWidth: 200, flex: "0 0 200px" }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: c.color, letterSpacing: "0.08em", marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                  <span>{stage.toUpperCase()}</span>
                  <span style={{ background: c.bg, padding: "1px 8px", borderRadius: 20 }}>{stagePartners.length}</span>
                </div>
                {stagePartners.map(p => (
                  <div key={p.id} onClick={() => navigate("partner-profile", { partnerId: p.id })}
                    style={{
                      background: "rgba(10,20,45,0.95)", borderRadius: 10, padding: "12px 14px",
                      marginBottom: 8, cursor: "pointer", border: "1px solid rgba(50,80,140,0.4)",
                      boxShadow: "0 1px 8px rgba(100,160,220,0.22)"
                    }}>
                    <div style={{ fontSize: 19, fontWeight: 600, color: "#ffffff", marginBottom: 4 }}>{p.full_name}</div>
                    <div style={{ fontSize: 17, color: "#a0c8e8" }}>{p.territory || "—"}</div>
                  </div>
                ))}
                {stagePartners.length === 0 && (
                  <div style={{ fontSize: 18, color: "#40607a", textAlign: "center", padding: "20px 0", background: "rgba(8,16,36,0.5)", borderRadius: 10, border: "1px dashed rgba(100,160,220,0.35)" }}>
                    Empty
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Team Members / Promotor Hierarchy */}
      <div style={{ marginTop: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#ffffff", margin: 0 }}>Team Members</h2>
            <p style={{ fontSize: 13, color: "#5a8aaa", margin: "3px 0 0" }}>{totalPromotors} promotor{totalPromotors !== 1 ? "s" : ""} across {parentPartners.length} partner{parentPartners.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <Card style={{ padding: 0, overflow: "hidden" }}>
          {parentPartners.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#4a7090", fontSize: 14 }}>
              No team hierarchy yet. Assign a parent partner when adding a promotor.
            </div>
          ) : parentPartners.map(parent => {
            const team = promotorsByParent[parent.id] || [];
            return (
              <div key={parent.id} style={{ borderBottom: "1px solid rgba(50,80,140,0.25)" }}>
                {/* Parent row */}
                <div style={{ padding: "12px 20px", background: "rgba(80,130,200,0.07)", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%",
                    background: "linear-gradient(135deg, #1a3560, #0d2045)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, color: "#5ab0f0", flexShrink: 0,
                  }}>
                    {(parent.full_name || "?").split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <span
                    onClick={() => navigate("partner-profile", { partnerId: parent.id })}
                    style={{ fontSize: 14, fontWeight: 700, color: "#7dc4ff", cursor: "pointer" }}>
                    {parent.full_name}
                  </span>
                  <span style={{ fontSize: 12, color: "#5ab0f0", background: "rgba(80,160,230,0.12)", border: "1px solid rgba(80,160,230,0.22)", padding: "2px 9px", borderRadius: 20, fontWeight: 600 }}>
                    {team.length} promotor{team.length !== 1 ? "s" : ""}
                  </span>
                  <span style={{ fontSize: 12, color: "#4a7090", marginLeft: "auto" }}>{parent.territory || ""}</span>
                </div>

                {/* Promotor table */}
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "rgba(50,80,140,0.08)" }}>
                      {["Name", "Email", "Territory", "Commission", "Stage"].map(h => (
                        <th key={h} style={{ padding: "8px 20px", textAlign: "left", fontSize: 11, color: "#4a7090", fontWeight: 700, letterSpacing: "0.08em" }}>
                          {h.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {team.map(p => (
                      <tr key={p.id}
                        onClick={() => navigate("partner-profile", { partnerId: p.id })}
                        style={{ borderTop: "1px solid rgba(50,80,140,0.18)", cursor: "pointer", transition: "background 0.1s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(80,140,210,0.05)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "11px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(80,160,230,0.4)", flexShrink: 0 }} />
                            <span style={{ fontSize: 14, fontWeight: 600, color: "#ffffff" }}>{p.full_name}</span>
                          </div>
                        </td>
                        <td style={{ padding: "11px 20px", fontSize: 13, color: "#6a9ab8" }}>{p.email || "—"}</td>
                        <td style={{ padding: "11px 20px", fontSize: 13, color: "#6a9ab8" }}>{p.territory || "—"}</td>
                        <td style={{ padding: "11px 20px", fontSize: 13, color: "#6a9ab8" }}>{p.commission_rate != null ? `${p.commission_rate}%` : "—"}</td>
                        <td style={{ padding: "11px 20px" }}><StageBadge stage={p.stage || "Identified"} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </Card>
      </div>

      {/* Add Partner Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{
            background: "#0d1a35", border: "1px solid rgba(90,160,255,0.2)", borderRadius: 16,
            padding: "32px 36px", width: 520, maxHeight: "90vh", overflowY: "auto",
            boxShadow: "0 24px 80px rgba(0,0,0,0.6)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", margin: 0 }}>Add Partner</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "#7ab0cc", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>FULL NAME *</label>
                <input style={inputStyle} value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="e.g. Meron Tesfaye" />
              </div>
              <div>
                <label style={labelStyle}>EMAIL</label>
                <input style={inputStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
              </div>
              <div>
                <label style={labelStyle}>PHONE</label>
                <input style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 555 000 0000" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>TERRITORY</label>
                <input style={inputStyle} value={form.territory} onChange={e => setForm(f => ({ ...f, territory: e.target.value }))} placeholder="e.g. Minnesota / Twin Cities" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>LANGUAGES (comma-separated)</label>
                <input style={inputStyle} value={form.languages} onChange={e => setForm(f => ({ ...f, languages: e.target.value }))} placeholder="e.g. Amharic, English" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>SOURCE</label>
                <input style={inputStyle} value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} placeholder="e.g. Referral, Event, Social" />
              </div>
              <div>
                <label style={labelStyle}>STAGE</label>
                <select style={inputStyle} value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}>
                  {STAGES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>MARKET TIER</label>
                <select style={inputStyle} value={form.market_tier} onChange={e => setForm(f => ({ ...f, market_tier: e.target.value }))}>
                  <option value="entry">Entry</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>COMMISSION RATE (%)</label>
                <input style={inputStyle} type="number" min={0} max={100} value={form.commission_rate} onChange={e => setForm(f => ({ ...f, commission_rate: e.target.value }))} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>PARENT PARTNER (optional)</label>
                <select style={inputStyle} value={form.parent_partner_id} onChange={e => setForm(f => ({ ...f, parent_partner_id: e.target.value }))}>
                  <option value="">— None (top-level partner) —</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}{p.territory ? ` · ${p.territory}` : ""}</option>
                  ))}
                </select>
              </div>
            </div>

            {formError && (
              <p style={{ color: "#ff6666", fontSize: 14, marginTop: 16, marginBottom: 0 }}>{formError}</p>
            )}

            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button onClick={() => setShowModal(false)} style={{
                flex: 1, padding: "12px 0", borderRadius: 10, border: "1px solid rgba(100,160,220,0.3)",
                background: "transparent", color: "#a0c8e8", fontSize: 16, cursor: "pointer"
              }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{
                flex: 2, padding: "12px 0", borderRadius: 10, border: "none",
                background: saving ? "rgba(80,160,230,0.4)" : "linear-gradient(135deg, #3a9ad9, #2a7ab8)",
                color: "white", fontSize: 16, fontWeight: 600, cursor: saving ? "default" : "pointer"
              }}>{saving ? "Saving..." : "Save Partner"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
