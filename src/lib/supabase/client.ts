"use client";

import { createBrowserClient } from "@supabase/ssr";

// Both env vars are NEXT_PUBLIC_ so they're inlined at build time and safe to
// read in a 'use client' module. We accept either the legacy `anon_key` or
// the current `publishable_key` name.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!,
  );
}
