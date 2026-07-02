import { createClient } from "@supabase/supabase-js";

// Real health check for Platform Admin's Health Engine — every field
// below reflects an actual check performed on each request, not a
// static or fabricated value. Same response contract as wegn-store-app,
// qrbooker, and qrwegn's api/health.ts so Platform Admin can consume
// all products uniformly.
//
// version mirrors package.json's declared "0.1.0" — keep in sync if
// package.json's version changes.
const VERSION = "0.1.0";
const ENVIRONMENT = process.env.VERCEL_ENV ?? "production";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkDatabase() {
  const startedAt = Date.now();
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Supabase credentials are not configured.");
    }
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { error } = await supabase.from("partners").select("id", { count: "exact", head: true }).limit(1);
    if (error) throw error;
    return { status: "ok", latencyMs: Date.now() - startedAt };
  } catch (err) {
    return { status: "error", error: err instanceof Error ? err.message : "Database check failed." };
  }
}

async function checkAuthentication() {
  const startedAt = Date.now();
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Supabase credentials are not configured.");
    }
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) throw error;
    return { status: "ok", latencyMs: Date.now() - startedAt };
  } catch (err) {
    return { status: "error", error: err instanceof Error ? err.message : "Authentication check failed." };
  }
}

export default async function handler(req, res) {
  const startedAt = Date.now();

  // Health status only, no user/business data — safe to expose to any
  // origin so Platform Admin's browser-side Health Engine can read it
  // (a bare fetch() without this header is opaque to the browser and
  // surfaces as a generic "Failed to fetch", even when the server
  // responds successfully).
  res.setHeader("Access-Control-Allow-Origin", "*");

  // The handler executing at all is the API health signal.
  const api = { status: "ok" };
  const [database, authentication] = await Promise.all([checkDatabase(), checkAuthentication()]);

  const healthy = database.status === "ok" && authentication.status === "ok";

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "healthy" : "degraded",
    version: VERSION,
    environment: ENVIRONMENT,
    runtime: { status: "ok", checkDurationMs: Date.now() - startedAt },
    api,
    database,
    authentication,
    timestamp: new Date().toISOString(),
  });
}
