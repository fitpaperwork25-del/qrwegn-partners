const SUPABASE_FUNCTION_URL =
  "https://ijlgbljeuhlrehutyifn.supabase.co/functions/v1/send-pending-notifications";

// TODO: once CRON_SECRET is set in Vercel env vars, require
// "Authorization: Bearer <CRON_SECRET>" here to restrict this route to
// Vercel Cron-triggered requests only.

export default async function handler(req, res) {
  try {
    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(502).json({ error: "send-pending-notifications failed", detail: data });
    }

    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Unknown error" });
  }
}
