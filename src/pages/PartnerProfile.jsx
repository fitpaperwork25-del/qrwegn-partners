<select
  value={partner.stage || "Identified"}
  onChange={async (e) => {
    const newStage = e.target.value;

    setPartner(prev => ({
      ...prev,
      stage: newStage,
    }));

    const { error } = await supabase
      .from("partners")
      .update({ stage: newStage })
      .eq("id", partner.id);

    if (error) {
      alert("Stage save failed: " + error.message);
    }
  }}
  style={{
    padding: "7px 12px",
    borderRadius: 8,
    fontSize: 14,
    border: "1.5px solid rgba(100,160,220,0.35)",
    background: "rgba(8,16,36,0.95)",
    color: "#ffffff",
    outline: "none",
    cursor: "pointer"
  }}
>
  {STAGES.map(s => (
    <option key={s}>{s}</option>
  ))}
</select>