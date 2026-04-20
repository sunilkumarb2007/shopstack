import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserTenant } from "@/lib/tenant";
import { deleteProductAction } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { ProductForm } from "../product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await getCurrentUserTenant();
  if (!tenant) redirect("/dashboard/onboarding");

  const supabase = await createClient();
  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", tenant.id)
      .maybeSingle(),
    supabase
      .from("categories")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("name"),
  ]);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
          <Link
            href={`/s/${tenant.slug}/products/${product.slug}`}
            className="text-xs text-muted-foreground underline"
          >
            View on storefront ↗
          </Link>
        </div>
        <form action={deleteProductAction}>
          <input type="hidden" name="productId" value={product.id} />
          <Button variant="destructive" size="sm" type="submit">
            Delete
          </Button>
        </form>
      </div>
      <div className="mt-6">
        <ProductForm
          tenantId={tenant.id}
          categories={categories ?? []}
          product={product}
        />
      </div>
    </div>
  );
}
