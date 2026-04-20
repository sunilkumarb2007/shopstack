"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

const onboardSchema = z.object({
  name: z.string().min(2, "Store name is too short").max(80),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(48)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and dashes"),
  description: z.string().max(500).optional().or(z.literal("")),
});

export type CreateStoreState =
  | { error?: string; fieldErrors?: Record<string, string[]> }
  | undefined;

export async function createStoreAction(
  _prev: CreateStoreState,
  formData: FormData,
): Promise<CreateStoreState> {
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const parsed = onboardSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    slug: slugify(rawSlug) || slugify(String(formData.get("name") ?? "")),
    description: String(formData.get("description") ?? "").trim(),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  // Use the admin client to create the tenant + membership atomically,
  // avoiding RLS edge cases on the very first insert.
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("tenants")
    .select("id")
    .eq("slug", parsed.data.slug)
    .maybeSingle();
  if (existing) {
    return { fieldErrors: { slug: ["That slug is already taken."] } };
  }

  const { data: tenant, error: insertErr } = await admin
    .from("tenants")
    .insert({
      slug: parsed.data.slug,
      name: parsed.data.name,
      description: parsed.data.description || null,
      owner_id: user.id,
    })
    .select("*")
    .single();
  if (insertErr || !tenant) {
    return { error: insertErr?.message ?? "Failed to create store." };
  }

  const { error: membershipErr } = await admin.from("memberships").insert({
    tenant_id: tenant.id,
    user_id: user.id,
    role: "owner",
  });
  if (membershipErr) {
    return { error: membershipErr.message };
  }

  // Seed some default categories so the dashboard isn't empty.
  await admin.from("categories").insert([
    { tenant_id: tenant.id, slug: "apparel", name: "Apparel" },
    { tenant_id: tenant.id, slug: "accessories", name: "Accessories" },
    { tenant_id: tenant.id, slug: "home", name: "Home" },
  ]);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

const updateStoreSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional().or(z.literal("")),
  currency: z.string().length(3),
});

export async function updateStoreAction(
  tenantId: string,
  _prev: CreateStoreState,
  formData: FormData,
): Promise<CreateStoreState> {
  const parsed = updateStoreSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    currency: String(formData.get("currency") ?? "USD")
      .toUpperCase()
      .trim(),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenants")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      currency: parsed.data.currency,
    })
    .eq("id", tenantId);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return {};
}
