import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADMIN_EMAIL = "info@qrwegn.com";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // Identify the caller
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { promotorId, email, fullName } = req.body;
  if (!promotorId || !email) {
    return res.status(400).json({ error: "promotorId and email are required." });
  }

  // Authorize: super-admin, or the partner who owns this promotor
  if (user.email !== ADMIN_EMAIL) {
    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role, partner_id")
      .eq("id", user.id)
      .single();

    const { data: promotorRow } = await supabaseAdmin
      .from("promotors")
      .select("partner_id")
      .eq("id", promotorId)
      .single();

    const isOwningPartner =
      callerProfile?.role === "partner" &&
      callerProfile?.partner_id &&
      callerProfile.partner_id === promotorRow?.partner_id;

    if (!isOwningPartner) {
      return res.status(403).json({ error: "Forbidden" });
    }
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

  let userId    = null;
  let loginLink = null;

  // Primary path — invite by email (sends login link automatically)
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

    // Rate-limit fallback: create user directly then generate a login link to share manually
    if (msg.toLowerCase().includes("rate limit")) {
      const { data: createData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

      if (createErr) {
        return res.status(400).json({ error: "Rate limited and fallback user creation failed: " + createErr.message });
      }

      userId = createData.user.id;

      // Generate a magic link the admin can copy and send manually
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo: "https://qrwegn-partners.vercel.app" },
      });

      loginLink = linkData?.properties?.action_link || null;
    } else {
      return res.status(400).json({ error: msg });
    }
  } else {
    userId = inviteData.user.id;
  }

  // Insert profiles row (shared for both paths)
  const profileInsert = {
    id:          userId,
    role:        "promotor",
    promotor_id: promotorId,
    full_name:   fullName || null,
  };

  const { error: profileErr } = await supabaseAdmin
    .from("profiles")
    .insert({ ...profileInsert, email });

  if (profileErr) {
    // Retry without email if that column doesn't exist in the schema
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

  return res.json({ success: true, userId, loginLink });
}
