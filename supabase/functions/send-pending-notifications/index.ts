import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_ADDRESS   = "WEGN Partners <info@qrwegn.com>";

Deno.serve(async (req: Request): Promise<Response> => {
  // OPTIONS must be handled before touching any env vars or Supabase
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabaseUrl        = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey       = Deno.env.get("RESEND_API_KEY");

    // Path 1 — missing API key: mark nothing as failed, just return error
    if (!resendApiKey) {
      return json({ error: "RESEND_API_KEY not configured" }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: rows, error: fetchError } = await supabase
      .from("notification_logs")
      .select("id, recipient_email, subject, body")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(50);

    if (fetchError) {
      return json({ error: `DB fetch failed: ${fetchError.message}` }, 500);
    }

    if (!rows || rows.length === 0) {
      return json({ sent: 0, failed: 0, message: "No pending notifications." });
    }

    let sent        = 0;
    let failed      = 0;
    const updateErrors: string[] = [];

    for (const row of rows) {
      // errorMessage is always a non-empty string before the DB write
      let success      = false;
      let errorMessage = "Unknown error";   // never empty — ensures DB always receives a real value

      // ── Attempt Resend delivery ─────────────────────────────────────────
      try {
        const res = await fetch(RESEND_API_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from:    FROM_ADDRESS,
            to:      [row.recipient_email],
            subject: row.subject,
            html:    row.body,
          }),
        });

        if (res.ok) {
          success      = true;
          errorMessage = "";   // cleared on success — written as null below
        } else {
          // Path 2 — Resend non-2xx: capture full response body
          const errBody    = await res.text();
          errorMessage     = `Resend ${res.status}: ${errBody}`;
          console.error(`[${row.id}] Resend rejected: ${errorMessage}`);
        }
      } catch (sendErr) {
        // Path 3 — network / fetch exception
        errorMessage = `Exception: ${String(sendErr)}`;
        console.error(`[${row.id}] Fetch threw: ${errorMessage}`);
      }

      // ── Write result back to DB ─────────────────────────────────────────
      // .select() forces PostgREST to read the columns back, which surfaces
      // any schema-cache mismatch as an explicit error instead of silent drop.
      const patch = success
        ? { status: "sent",   sent_at: new Date().toISOString(), error_message: null }
        : { status: "failed", error_message: errorMessage };

      const { data: updated, error: updateError } = await supabase
        .from("notification_logs")
        .update(patch)
        .eq("id", row.id)
        .select("id, status, error_message")
        .single();

      if (updateError) {
        // Surface update errors in the response — if error_message column is
        // missing from PostgREST schema cache this will now be explicit.
        const msg = `DB update failed for ${row.id}: ${updateError.message}`;
        console.error(msg);
        updateErrors.push(msg);
      } else {
        // Verify the write actually landed
        const savedError = updated?.error_message;
        if (!success && !savedError) {
          const msg = `[${row.id}] error_message was not persisted — PostgREST schema cache may be stale`;
          console.error(msg);
          updateErrors.push(msg);
        }
      }

      if (success) sent++; else failed++;
    }

    console.log(`send-pending-notifications: sent=${sent} failed=${failed}`);

    return json({ sent, failed, total: rows.length, updateErrors });

  } catch (err) {
    console.error("Unhandled error:", err);
    return json({ error: `Exception: ${String(err)}` }, 500);
  }
});
