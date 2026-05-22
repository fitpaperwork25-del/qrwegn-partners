import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("outreach_materials")
      .select("*")
      .order("title");

    console.log("outreach_materials:", data, error);

    if (!error && data) {
      setMaterials(data);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-8 text-white">
        Loading materials...
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white">
            Outreach Materials
          </h1>

          <p className="text-slate-400 mt-2">
            Sales and deployment assets for partners
          </p>
        </div>

        <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold">
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
                📄
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white">
                  {material.title}
                </h3>

                <p className="text-slate-400 mt-2 max-w-md">
                  {material.description}
                </p>

                <div className="mt-4">
                  <span className="bg-slate-700 text-slate-200 text-sm px-3 py-1 rounded-full uppercase">
                    {material.type}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href={material.file_url}
                target="_blank"
                rel="noreferrer"
                className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-xl text-center font-medium"
              >
                Download
              </a>

              <button className="text-slate-400 hover:text-white">
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {materials.length === 0 && (
        <div className="text-center text-slate-400 mt-20">
          No outreach materials found.
        </div>
      )}
    </div>
  );
}