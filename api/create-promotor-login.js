import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADMIN_EMAIL = "fitpaperwork25@gmail.com";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // Verify caller is the super-admin
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || user?.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { promotorId, email, fullName } = req.body;
  if (!promotorId || !email) {
    return res.status(400).json({ error: "promotorId and email are required." });
  }

  // Duplicate check — profile already linked to this promotor
  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("promotor_id", promotorId)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ error: "Login already exists for this promotor." });
  }

  // Invite user — creates auth record and sends invite email with a login link
  const { data: inviteData, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    email,
    {
      data: { full_name: fullName },
      redirectTo: "https://qrwegn-partners.vercel.app",
    }
  );

  if (inviteErr) {
    const msg = inviteErr.message || "";
    if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already been invited")) {
      return res.status(409).json({ error: "A login already exists for this email address." });
    }
    return res.status(400).json({ error: msg });
  }

  // Insert profiles row linking this auth user to the promotor record
  const profileInsert = {
    id:          inviteData.user.id,
    role:        "promotor",
    promotor_id: promotorId,
    full_name:   fullName || null,
  };

  // Include email only if the column exists — safe to try; error is caught below
  const { error: profileErr } = await supabaseAdmin
    .from("profiles")
    .insert({ ...profileInsert, email });

  if (profileErr) {
    // Retry without email if that column doesn't exist
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

  return res.json({ success: true, userId: inviteData.user.id });
}
