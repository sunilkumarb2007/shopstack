"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  slug: z.string().min(1).max(96).regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional().or(z.literal("")),
  price_cents: z.number().int().nonnegative(),
  inventory: z.number().int().nonnegative(),
  category_id: z.string().uuid().optional().or(z.literal("")),
  image_url: z.string().url().optional().or(z.literal("")),
  status: z.enum(["draft", "published", "archived"]),
});

export type ProductFormState =
  | { error?: string; fieldErrors?: Record<string, string[]> }
  | undefined;

function parseProductForm(formData: FormData) {
  const price = Math.round(
    Number(String(formData.get("price") ?? "0").replace(/[^0-9.]/g, "")) * 100,
  );
  const inventory = Number(formData.get("inventory") ?? 0);
  const name = String(formData.get("name") ?? "").trim();
  return productSchema.safeParse({
    name,
    slug:
      slugify(String(formData.get("slug") ?? "")) ||
      slugify(name),
    description: String(formData.get("description") ?? "").trim(),
    price_cents: Number.isFinite(price) ? price : 0,
    inventory: Number.isFinite(inventory) ? inventory : 0,
    category_id: String(formData.get("category_id") ?? ""),
    image_url: String(formData.get("image_url") ?? "").trim(),
    status: (String(formData.get("status") ?? "published") as
      | "draft"
      | "published"
      | "archived"),
  });
}

export async function createProductAction(
  tenantId: string,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const supabase = await createClient();
  const { error, data } = await supabase
    .from("products")
    .insert({
      tenant_id: tenantId,
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      price_cents: parsed.data.price_cents,
      inventory: parsed.data.inventory,
      category_id: parsed.data.category_id || null,
      image_url: parsed.data.image_url || null,
      status: parsed.data.status,
    })
    .select("id")
    .single();
  if (error) {
    return { error: error.message };
  }
  revalidatePath("/dashboard/products");
  redirect(`/dashboard/products/${data.id}`);
}

export async function updateProductAction(
  productId: string,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      price_cents: parsed.data.price_cents,
      inventory: parsed.data.inventory,
      category_id: parsed.data.category_id || null,
      image_url: parsed.data.image_url || null,
      status: parsed.data.status,
    })
    .eq("id", productId);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/products");
  revalidatePath(`/dashboard/products/${productId}`);
  return {};
}

export async function deleteProductAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  if (!productId) return;
  const supabase = await createClient();
  await supabase.from("products").delete().eq("id", productId);
  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function createCategoryAction(
  tenantId: string,
  formData: FormData,
) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const supabase = await createClient();
  await supabase.from("categories").insert({
    tenant_id: tenantId,
    name,
    slug: slugify(name),
  });
  revalidatePath("/dashboard/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("categories").delete().eq("id", id);
  revalidatePath("/dashboard/categories");
}
