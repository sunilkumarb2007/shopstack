import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTenantBySlug } from "@/lib/tenant";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ReviewForm } from "@/components/review-form";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Star } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}) {
  const { slug, productSlug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("slug", productSlug)
    .eq("status", "published")
    .maybeSingle();
  if (!product) notFound();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", product.id)
    .order("created_at", { ascending: false });

  const avg =
    (reviews ?? []).length > 0
      ? (reviews ?? []).reduce((s, r) => s + r.rating, 0) /
        (reviews ?? []).length
      : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-lg bg-muted">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              width={800}
              height={800}
              className="size-full object-cover"
            />
          ) : (
            <div className="grid size-full place-items-center text-muted-foreground">
              No image
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {product.name}
          </h1>
          <p className="mt-2 text-2xl font-medium">
            {formatCurrency(product.price_cents, product.currency)}
          </p>
          {avg !== null && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={
                      i < Math.round(avg)
                        ? "size-4 fill-amber-500 text-amber-500"
                        : "size-4"
                    }
                  />
                ))}
              </div>
              <span>
                {avg.toFixed(1)} · {(reviews ?? []).length} review
                {(reviews ?? []).length === 1 ? "" : "s"}
              </span>
            </div>
          )}
          <p className="mt-4 whitespace-pre-wrap text-muted-foreground">
            {product.description ?? ""}
          </p>
          <div className="mt-6">
            <AddToCartButton
              product={{
                id: product.id,
                name: product.name,
                priceCents: product.price_cents,
                currency: product.currency,
                imageUrl: product.image_url,
              }}
              tenantSlug={slug}
              disabled={product.track_inventory && product.inventory <= 0}
            />
            {product.track_inventory && product.inventory <= 0 && (
              <p className="mt-2 text-xs text-destructive">Out of stock</p>
            )}
          </div>
        </div>
      </div>

      <section className="mt-14">
        <h2 className="text-xl font-semibold">Reviews</h2>
        <div className="mt-4 grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            {(reviews ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">
                No reviews yet. Be the first!
              </p>
            )}
            {(reviews ?? []).map((r) => (
              <div key={r.id} className="rounded-md border p-4">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={
                          i < r.rating
                            ? "size-4 fill-amber-500 text-amber-500"
                            : "size-4 text-muted-foreground"
                        }
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">
                    {r.title ?? "(no title)"}
                  </span>
                </div>
                <p className="mt-2 text-sm">{r.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  — {r.author_name ?? "Customer"}, {formatDate(r.created_at)}
                </p>
              </div>
            ))}
          </div>
          <ReviewForm
            tenantId={tenant.id}
            productId={product.id}
            tenantSlug={slug}
            productSlug={productSlug}
          />
        </div>
      </section>
    </div>
  );
}
