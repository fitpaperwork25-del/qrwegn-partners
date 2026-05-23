import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const EMPTY_FORM = { title: "", description: "", type: "pdf", file: null };

function typeIcon(type) {
  return type === "video" ? "🎥" : "📄";
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // material object or null

  const loadMaterials = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("outreach_materials")
      .select("*")
      .order("title");
    console.log("outreach_materials:", data, error);
    if (!error && data) setMaterials(data);
    setLoading(false);
  };

  useEffect(() => { loadMaterials(); }, []);

  const handleDelete = async (material) => {
    if (!window.confirm(`Delete "${material.title}"?`)) return;
    await supabase.from("outreach_materials").delete().eq("id", material.id);
    loadMaterials();
  };

  if (loading) {
    return <div className="p-8 text-white">Loading materials...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white">Outreach Materials</h1>
          <p className="text-slate-400 mt-2">Sales and deployment assets for partners</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold"
        >
          + Add Material
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {materials.map((material) => (
          <div
            key={material.id}
            className="bg-[#0B1739] border border-slate-800 rounded-3xl p-6 flex items-start justify-between"
          >
            <div className="flex gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl">
                {typeIcon(material.type)}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{material.title}</h3>
                <p className="text-slate-400 mt-2 max-w-md">{material.description}</p>
                <div className="mt-4">
                  <span className="bg-slate-700 text-slate-200 text-sm px-3 py-1 rounded-full uppercase">
                    {material.type}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 ml-4 shrink-0">
              <a
                href={material.file_url}
                target="_blank"
                rel="noreferrer"
                className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-xl text-center font-medium"
              >
                Download
              </a>
              <button
                onClick={() => setEditTarget(material)}
                className="text-slate-400 hover:text-white text-center"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(material)}
                className="text-red-400 hover:text-red-300 text-center"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {materials.length === 0 && (
        <div className="text-center text-slate-400 mt-20">No outreach materials found.</div>
      )}

      {showAdd && (
        <MaterialModal
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); loadMaterials(); }}
        />
      )}

      {editTarget && (
        <MaterialModal
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); loadMaterials(); }}
        />
      )}
    </div>
  );
}

function MaterialModal({ initial = null, onClose, onSaved }) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState(
    initial
      ? { title: initial.title, description: initial.description, type: initial.type, file: null }
      : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!isEdit && !form.file) { setError("Please select a file."); return; }

    setSaving(true);

    let file_url = isEdit ? initial.file_url : null;

    if (form.file) {
      const ext = form.file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("partner-materials")
        .upload(path, form.file, { upsert: false });

      if (uploadError) {
        setError(`Upload failed: ${uploadError.message}`);
        setSaving(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("partner-materials")
        .getPublicUrl(path);
      file_url = urlData.publicUrl;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      file_url,
    };

    let dbError;
    if (isEdit) {
      ({ error: dbError } = await supabase
        .from("outreach_materials")
        .update(payload)
        .eq("id", initial.id));
    } else {
      ({ error: dbError } = await supabase
        .from("outreach_materials")
        .insert(payload));
    }

    if (dbError) {
      setError(`Save failed: ${dbError.message}`);
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0B1739] border border-slate-700 rounded-3xl p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold text-white mb-6">
          {isEdit ? "Edit Material" : "Add Material"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-slate-400 text-sm mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Partner Sales Deck"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-sm mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Brief description of this material"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-sm mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pdf">PDF</option>
              <option value="video">Video</option>
              <option value="doc">Doc</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 text-sm mb-1">
              File {isEdit && <span className="text-slate-500">(leave empty to keep existing)</span>}
            </label>
            <input
              type="file"
              onChange={(e) => set("file", e.target.files[0] || null)}
              className="w-full text-slate-300 file:bg-slate-700 file:text-white file:border-0 file:rounded-lg file:px-4 file:py-2 file:mr-3 file:cursor-pointer"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 mt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white py-3 rounded-xl font-semibold"
            >
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Material"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white py-3 rounded-xl font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
