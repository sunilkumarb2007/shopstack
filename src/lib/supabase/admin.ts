import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

// Service-role client. Server-only. Bypasses RLS — use with care.
export function createAdminClient() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
