import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_ADDRESS   = "QR-Wegn Partners <info@qrwegn.com>";

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl        = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey       = Deno.env.get("RESEND_API_KEY")!;

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY secret is not set." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: rows, error: fetchError } = await supabase
      .from("notification_logs")
      .select("id, recipient_email, subject, body")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error("Failed to fetch notification_logs:", fetchError.message);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!rows || rows.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, failed: 0, message: "No pending notifications." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sent   = 0;
    let failed = 0;

    for (const row of rows) {
      let success = false;

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
          success = true;
        } else {
          const errBody = await res.text();
          console.error(`Resend rejected ${row.id}: ${res.status} ${errBody}`);
        }
      } catch (sendErr) {
        console.error(`Network error sending ${row.id}:`, sendErr);
      }

      const patch = success
        ? { status: "sent",   sent_at: new Date().toISOString() }
        : { status: "failed"                                      };

      const { error: updateError } = await supabase
        .from("notification_logs")
        .update(patch)
        .eq("id", row.id);

      if (updateError) {
        console.error(`Failed to update row ${row.id}:`, updateError.message);
      }

      if (success) sent++; else failed++;
    }

    console.log(`send-pending-notifications: sent=${sent} failed=${failed}`);

    return new Response(
      JSON.stringify({ sent, failed, total: rows.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
