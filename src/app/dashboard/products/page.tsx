import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserTenant } from "@/lib/tenant";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductsListPage() {
  const tenant = await getCurrentUserTenant();
  if (!tenant) redirect("/dashboard/onboarding");

  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <Link href="/dashboard/products/new">
          <Button>Add product</Button>
        </Link>
      </div>

      {(products ?? []).length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No products yet.{" "}
            <Link href="/dashboard/products/new" className="underline">
              Add your first product
            </Link>{" "}
            to start selling.
          </CardContent>
        </Card>
      ) : (
        <div className="divide-y rounded-md border">
          {(products ?? []).map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/products/${p.id}`}
              className="flex items-center gap-4 p-4 hover:bg-accent"
            >
              <div className="size-14 shrink-0 overflow-hidden rounded-md bg-muted">
                {p.image_url ? (
                  <Image
                    src={p.image_url}
                    alt=""
                    width={56}
                    height={56}
                    className="size-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.name}</p>
                <p className="truncate text-xs text-muted-foreground">/{p.slug}</p>
              </div>
              <div className="hidden text-sm text-muted-foreground sm:block">
                Stock: {p.inventory}
              </div>
              <div className="text-sm font-medium">
                {formatCurrency(p.price_cents, p.currency)}
              </div>
              <Badge
                variant={
                  p.status === "published"
                    ? "success"
                    : p.status === "draft"
                    ? "secondary"
                    : "outline"
                }
              >
                {p.status}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
