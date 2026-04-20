import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserTenant } from "@/lib/tenant";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Star } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const tenant = await getCurrentUserTenant();
  if (!tenant) redirect("/dashboard/onboarding");

  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, products(name, slug)")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Reviews</h1>
      {(reviews ?? []).length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No reviews yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(reviews ?? []).map((r) => {
            const product = (
              r as unknown as {
                products: { name: string; slug: string } | null;
              }
            ).products;
            return (
              <Card key={r.id}>
                <CardContent className="space-y-2 pt-6">
                  <div className="flex items-center gap-2 text-sm">
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
                    <span className="font-medium">
                      {r.title ?? "(untitled)"}
                    </span>
                    <span className="text-muted-foreground">
                      · {formatDate(r.created_at)}
                    </span>
                  </div>
                  <p className="text-sm">{r.body}</p>
                  <p className="text-xs text-muted-foreground">
                    by {r.author_name ?? "Customer"} on{" "}
                    {product ? (
                      <Link
                        className="underline"
                        href={`/s/${tenant.slug}/products/${product.slug}`}
                      >
                        {product.name}
                      </Link>
                    ) : (
                      "a product"
                    )}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
