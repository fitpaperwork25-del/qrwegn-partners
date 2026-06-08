import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

  const { partnerId, email, fullName } = req.body;
  if (!partnerId || !email) {
    return res.status(400).json({ error: "partnerId and email are required." });
  }

  // Duplicate check — profile already linked to this partner
  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("partner_id", partnerId)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ error: "Login already exists for this partner." });
  }

  const tempPassword = crypto.randomBytes(9).toString("base64url");

  const { data: createData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createErr) {
    const msg = createErr.message || "";

    if (
      msg.toLowerCase().includes("already registered") ||
      msg.toLowerCase().includes("already been invited") ||
      msg.toLowerCase().includes("already exists")
    ) {
      return res.status(409).json({ error: "A login already exists for this email address." });
    }

    return res.status(400).json({ error: msg });
  }

  const userId = createData.user.id;

  const profileInsert = {
    id:         userId,
    role:       "partner",
    partner_id: partnerId,
    full_name:  fullName || null,
  };

  const { error: profileErr } = await supabaseAdmin
    .from("profiles")
    .insert({ ...profileInsert, email });

  if (profileErr) {
    if (profileErr.message?.includes("email")) {
      const { error: retryErr } = await supabaseAdmin.from("profiles").insert(profileInsert);
      if (retryErr) {
        return res.status(500).json({
          error: "Auth user created but profiles insert failed: " + retryErr.message,
        });
      }
    } else {
      return res.status(500).json({
        error: "Auth user created but profiles insert failed: " + profileErr.message,
      });
    }
  }

  return res.json({ success: true, userId, tempPassword });
}
