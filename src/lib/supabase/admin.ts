import { createClient } from "@supabase/supabase-js";

const FALLBACK_SUPABASE_URL = "https://tquyodwsyppwbpvkaunn.supabase.co";
const FALLBACK_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxdXlvZHdzeXBwd2JwdmthdW5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTU3MTM5MCwiZXhwIjoyMDg3MTQ3MzkwfQ.URVgIsMcVKUfkUoc3kIxqviHpyCbtxI3e_-vc-do_1A";
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxdXlvZHdzeXBwd2JwdmthdW5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NzEzOTAsImV4cCI6MjA4NzE0NzM5MH0.1o6RYfeL_7YlIeUkl4jFsCm2JCQ2mB2F9o5wLv30xWU";

// Service-role Supabase client for secure backend operations (bypasses RLS)
export function createAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    FALLBACK_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    FALLBACK_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    FALLBACK_ANON_KEY;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
