import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useSupabaseQuery } from "../hooks/useSupabaseQuery";

const BUCKET = "partner-materials";

const emptyForm = {
  title: "",
  description: "",
  type: "pdf",
  files: [],
};

export default function MaterialsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { data, loading, error: loadError, refetch } = useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from("sales_materials")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }, []);

  const materials = data || [];

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
  };

  const openAdd = () => {
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setError("");
  };

  const getFileBaseName = (fileName) => {
    return fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!form.files || form.files.length === 0) {
      setError("Please select at least one file.");
      return;
    }

    setSaving(true);
    setError("");

    for (const file of form.files) {
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");

      const path = `materials/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false });

      if (uploadError) {
        setError("File upload failed: " + uploadError.message);
        setSaving(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path);

      const finalTitle =
        form.files.length === 1
          ? form.title.trim()
          : `${form.title.trim()} - ${getFileBaseName(file.name)}`;

      const { error: insertError } = await supabase
        .from("sales_materials")
        .insert({
          title: finalTitle,
          description: form.description.trim(),
          type: form.type,
          file_url: urlData.publicUrl,
        });

      if (insertError) {
        setError("Database insert failed: " + insertError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setModalOpen(false);
    setForm(emptyForm);
    refetch();
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;

    const { error } = await supabase
      .from("sales_materials")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Delete failed: " + error.message);
      return;
    }

    refetch();
  };

  const typeIcon = (type) => {
    if (type === "video") return "🎥";
    if (type === "doc") return "📝";
    if (type === "script") return "💬";
    if (type === "social") return "📣";
    if (type === "pitch") return "📄";
    return "📄";
  };

  if (loading) {
    return <div style={s.page}>Loading materials...</div>;
  }

  if (loadError) {
    return <div style={s.page}>Could not load materials. {loadError.message}</div>;
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Sales Materials</h1>
          <p style={s.subtitle}>Sales and deployment assets for partners</p>
        </div>

        <button style={s.addButton} onClick={openAdd}>
          + Add Material
        </button>
      </div>

      <div style={s.grid}>
        {materials.map((m) => (
          <div key={m.id} style={s.card}>
            <div style={s.left}>
              <div style={s.icon}>{typeIcon(m.type)}</div>

              <div>
                <h3 style={s.cardTitle}>{m.title}</h3>
                <p style={s.description}>{m.description}</p>

                <span style={s.badge}>
                  {(m.type || "file").toUpperCase()}
                </span>
              </div>
            </div>

            <div style={s.actions}>
              {m.file_url && (
                <a
                  href={m.file_url}
                  target="_blank"
                  rel="noreferrer"
                  style={s.downloadButton}
                >
                  Open
                </a>
              )}

              <button
                style={s.deleteButton}
                onClick={() => handleDelete(m.id, m.title)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {materials.length === 0 && (
        <div style={s.empty}>No sales materials found.</div>
      )}

      {modalOpen && (
        <div style={s.overlay} onClick={closeModal}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Add Material</h2>

            <form onSubmit={handleSubmit} style={s.form}>
              <div style={s.field}>
                <label style={s.label}>Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Restaurant Sales Flyer"
                  style={s.input}
                />
              </div>

              <div style={s.field}>
                <label style={s.label}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Brief description of this material"
                  rows={3}
                  style={{ ...s.input, resize: "none" }}
                />
              </div>

              <div style={s.field}>
                <label style={s.label}>Type</label>
                <select
                  value={form.type}
                  onChange={(e) => set("type", e.target.value)}
                  style={s.input}
                >
                  <option value="pdf">PDF</option>
                  <option value="pitch">Pitch</option>
                  <option value="script">Script</option>
                  <option value="social">Social</option>
                  <option value="doc">Doc</option>
                  <option value="video">Video</option>
                </select>
              </div>

              <div style={s.field}>
                <label style={s.label}>Files</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) =>
                    set("files", Array.from(e.target.files || []))
                  }
                  style={{ color: "#e2e8f0" }}
                />

                {form.files.length > 0 && (
                  <p style={s.fileCount}>{form.files.length} file(s) selected</p>
                )}
              </div>

              {error && <p style={s.errorText}>{error}</p>}

              <div style={s.modalButtons}>
                <button type="submit" disabled={saving} style={s.submitButton}>
                  {saving ? "Uploading..." : "Add Material"}
                </button>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  style={s.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: {
    padding: "32px 40px",
    minHeight: "100vh",
    color: "#ffffff",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "32px",
    gap: "24px",
  },
  title: {
    fontSize: "40px",
    fontWeight: 800,
    margin: 0,
    color: "#ffffff",
  },
  subtitle: {
    marginTop: "8px",
    color: "#9abccc",
    fontSize: "18px",
  },
  addButton: {
    background: "#2a7ab8",
    color: "#ffffff",
    padding: "14px 32px",
    borderRadius: "14px",
    fontWeight: 700,
    fontSize: "16px",
    cursor: "pointer",
    border: "none",
    boxShadow: "0 10px 24px rgba(42,122,184,0.35)",
    whiteSpace: "nowrap",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(520px, 1fr))",
    gap: "24px",
  },
  card: {
    background: "#0B1739",
    border: "1px solid rgba(154,188,204,0.18)",
    borderRadius: "24px",
    padding: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "24px",
    boxShadow: "0 18px 35px rgba(0,0,0,0.25)",
    maxWidth: "650px",
  },
  left: {
    display: "flex",
    gap: "18px",
    alignItems: "flex-start",
  },
  icon: {
    width: "56px",
    height: "56px",
    borderRadius: "18px",
    background: "#12264f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: "24px",
    fontWeight: 800,
    color: "#ffffff",
    margin: 0,
  },
  description: {
    color: "#9abccc",
    marginTop: "10px",
    maxWidth: "420px",
    fontSize: "16px",
    lineHeight: 1.5,
  },
  badge: {
    display: "inline-block",
    marginTop: "14px",
    background: "rgba(122,170,200,0.18)",
    color: "#7aaac8",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 800,
    letterSpacing: "0.08em",
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    alignItems: "flex-end",
    flexShrink: 0,
  },
  downloadButton: {
    background: "#2a7ab8",
    color: "#ffffff",
    padding: "8px 16px",
    borderRadius: "999px",
    textDecoration: "none",
    fontWeight: 700,
    textAlign: "center",
    whiteSpace: "nowrap",
  },
  deleteButton: {
    background: "transparent",
    border: "none",
    color: "#ff4d6d",
    cursor: "pointer",
    fontSize: "16px",
  },
  empty: {
    textAlign: "center",
    color: "#9abccc",
    marginTop: "80px",
    fontSize: "18px",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#0B1739",
    border: "1px solid rgba(154,188,204,0.2)",
    borderRadius: "24px",
    padding: "36px",
    width: "100%",
    maxWidth: "480px",
  },
  modalTitle: {
    fontSize: "24px",
    fontWeight: 800,
    color: "#ffffff",
    marginBottom: "24px",
    marginTop: 0,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    color: "#9abccc",
    fontSize: "14px",
    fontWeight: 600,
  },
  input: {
    background: "#12264f",
    border: "1px solid rgba(154,188,204,0.2)",
    borderRadius: "10px",
    padding: "12px 16px",
    color: "#ffffff",
    fontSize: "15px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  fileCount: {
    color: "#9abccc",
    fontSize: "14px",
    margin: 0,
  },
  errorText: {
    color: "#ff4d6d",
    fontSize: "14px",
    margin: 0,
  },
  modalButtons: {
    display: "flex",
    gap: "12px",
    marginTop: "8px",
  },
  submitButton: {
    flex: 1,
    background: "#2a7ab8",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    padding: "14px",
    fontWeight: 700,
    fontSize: "15px",
    cursor: "pointer",
  },
  cancelButton: {
    flex: 1,
    background: "#1e3a5f",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    padding: "14px",
    fontWeight: 700,
    fontSize: "15px",
    cursor: "pointer",
  },
};