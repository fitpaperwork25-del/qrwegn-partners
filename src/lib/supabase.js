import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log("[SUPABASE INIT] full import.meta.env:", import.meta.env)
console.log("[SUPABASE INIT]", { supabaseUrl, supabaseKey: supabaseKey?.slice(0, 30) })

if (!supabaseUrl || !supabaseKey) {
  console.error("[SUPABASE INIT] FATAL: URL or key is undefined — Vite did not inject .env vars")
}

export const supabase = createClient(supabaseUrl ?? "", supabaseKey ?? "", {
  auth: {
    lock: async (name, acquireTimeout, fn) => await fn(),
  },
})