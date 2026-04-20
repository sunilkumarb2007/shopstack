import { createClient } from "@/lib/supabase/server";
import type { Tenant } from "@/lib/types/database";

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("getTenantBySlug error", error);
    return null;
  }
  return data ?? null;
}

export async function getCurrentUserTenant(): Promise<Tenant | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Pick the first tenant the user is a member of (most common single-store case).
  const { data, error } = await supabase
    .from("memberships")
    .select("tenants(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("getCurrentUserTenant error", error);
    return null;
  }
  // PostgREST returns the joined row as an object (since we limited to 1).
  const joined = data as unknown as { tenants: Tenant | null } | null;
  return joined?.tenants ?? null;
}

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
