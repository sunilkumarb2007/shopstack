"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional().or(z.literal("")),
  body: z.string().max(2000).optional().or(z.literal("")),
  author_name: z.string().max(80).optional().or(z.literal("")),
});

export type ReviewState = { error?: string; ok?: boolean } | undefined;

export async function createReviewAction(
  tenantId: string,
  productId: string,
  tenantSlug: string,
  productSlug: string,
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const parsed = reviewSchema.safeParse({
    rating: Number(formData.get("rating") ?? 5),
    title: String(formData.get("title") ?? "").trim(),
    body: String(formData.get("body") ?? "").trim(),
    author_name: String(formData.get("author_name") ?? "").trim(),
  });
  if (!parsed.success) {
    return { error: "Please provide a rating between 1 and 5." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Please sign in to leave a review." };
  }

  const { error } = await supabase.from("reviews").insert({
    tenant_id: tenantId,
    product_id: productId,
    user_id: user.id,
    author_name: parsed.data.author_name || null,
    rating: parsed.data.rating,
    title: parsed.data.title || null,
    body: parsed.data.body || null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/s/${tenantSlug}/products/${productSlug}`);
  return { ok: true };
}
