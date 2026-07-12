import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Same super-admin identity check already used by api/create-partner-login.js
// and api/create-promotor-login.js — this app's existing admin access
// convention, not a new one. Uses the service-role key to bypass RLS
// intentionally (no leads.INSERT policy exists for admins, and none is
// added by this endpoint — see the Ecosystem Registry / lead-eligible
// investigation, 2026-07-12).
const ADMIN_EMAIL = "info@qrwegn.com";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const token = (req.headers.authorization || "").replace("Bearer ", "");
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { business_name, contact_name, phone, country, product, notes } = req.body || {};

  if (!business_name || !String(business_name).trim()) {
    return res.status(400).json({ error: "business_name is required." });
  }

  // product is required here, not optional-with-fallback like the Partner
  // Portal's submitLead() — the Admin Add Lead form is designed to block
  // submission entirely (with a visible error) rather than silently omit
  // a product when the lead-eligible-products endpoint is unavailable, so
  // this endpoint enforces that same rule server-side rather than trusting
  // the client alone. No product *names* are hardcoded or validated
  // against a fixed list here — any non-empty string the (admin-only,
  // already-authorized) caller sends is accepted as-is, exactly like
  // business_name/contact_name/etc. below.
  if (!product || !String(product).trim()) {
    return res.status(400).json({ error: "product is required." });
  }

  const insertPayload = {
    business_name: String(business_name).trim(),
    contact_name: contact_name ? String(contact_name).trim() : null,
    phone: phone ? String(phone).trim() : null,
    country: country ? String(country).trim() : null,
    product: String(product).trim(),
    notes: notes ? String(notes).trim() : null,
  };

  const { data, error } = await supabaseAdmin
    .from("leads")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) {
    return res.status(500).json({ error: error.message || "Failed to create lead." });
  }

  return res.json({ success: true, id: data.id });
}
