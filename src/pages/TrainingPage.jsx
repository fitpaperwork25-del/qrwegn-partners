import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Card } from "./AdminDashboard";

const BUCKET = "partner-materials";

const emptyForm = {
  title: "",
  description: "",
  type: "pdf",
  files: [],
};

export default function TrainingPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("training_materials")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setMaterials(data);

    setLoading(false);
  };

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

      const path = `training/${Date.now()}-${Math.random()
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
        .from("training_materials")
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
    loadMaterials();
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;

    const { error } = await supabase
      .from("training_materials")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Delete failed: " + error.message);
      return;
    }

    loadMaterials();
  };

  const typeIcon = (type) => {
    if (type === "video") return "▶";
    return "📄";
  };

  if (loading) {
    return <div style={{ color: "#ffffff" }}>Loading training materials...</div>;
  }

  return (
    <div>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Training Materials</h1>
          <p style={s.subtitle}>
            Manage and assign training content to partners
          </p>
        </div>

        <button style={s.uploadButton} onClick={openAdd}>
          + Upload Material
        </button>
      </div>

      <div style={s.grid}>
        {materials.map((m) => (
          <Card key={m.id} style={s.card}>
            <div style={s.topRow}>
              <div style={s.icon}>{typeIcon(m.type)}</div>

              <span style={s.badge}>
                {(m.type || "file").toUpperCase()}
              </span>
            </div>

            <div style={s.cardTitle}>{m.title}</div>

            <div style={s.description}>
              {m.description || "No description added."}
            </div>

            <div style={s.actions}>
              <a
                href={m.file_url}
                target="_blank"
                rel="noreferrer"
                style={s.linkButton}
              >
                Open
              </a>

              <button
                style={s.deleteButton}
                onClick={() => handleDelete(m.id, m.title)}
              >
                Delete
              </button>
            </div>
          </Card>
        ))}
      </div>

      {materials.length === 0 && (
        <div style={s.empty}>No training materials found.</div>
      )}

      {modalOpen && (
        <div style={s.overlay} onClick={closeModal}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Upload Training Material</h2>

            <form onSubmit={handleSubmit} style={s.form}>
              <div style={s.field}>
                <label style={s.label}>Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Partner Training Quick Start"
                  style={s.input}
                />
              </div>

              <div style={s.field}>
                <label style={s.label}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Brief description"
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
                  <option value="video">Video</option>
                  <option value="doc">Doc</option>
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
                  <p style={s.fileCount}>
                    {form.files.length} file(s) selected
                  </p>
                )}
              </div>

              {error && <p style={s.errorText}>{error}</p>}

              <div style={s.modalButtons}>
                <button type="submit" disabled={saving} style={s.submitButton}>
                  {saving ? "Uploading..." : "Upload"}
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
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: 700,
    color: "#ffffff",
    margin: 0,
  },
  subtitle: {
    fontSize: 20,
    color: "#a0c8e8",
    margin: "4px 0 0",
  },
  uploadButton: {
    background: "linear-gradient(135deg, #3a9ad9, #2a7ab8)",
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "10px 20px",
    fontSize: 20,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(80,160,230,0.4)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: 14,
  },
  card: {
    padding: "18px 20px",
  },
  topRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "rgba(80,160,230,0.18)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    flexShrink: 0,
  },
  badge: {
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "#5ab0f0",
    background: "rgba(80,160,230,0.18)",
    padding: "2px 7px",
    borderRadius: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: "#ffffff",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#7ab0cc",
    marginBottom: 14,
    lineHeight: 1.5,
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  linkButton: {
    fontSize: 18,
    color: "#5ab0f0",
    textDecoration: "none",
    fontWeight: 500,
  },
  deleteButton: {
    fontSize: 18,
    color: "#ff4d6d",
    background: "none",
    border: "none",
    cursor: "pointer",
  },
  empty: {
    color: "#a0c8e8",
    fontSize: 18,
    marginTop: 30,
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