import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTenantBySlug } from "@/lib/tenant";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function StorefrontHome({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const supabase = await createClient();
  const { data: featured } = await supabase
    .from("products")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <div>
      <section className="border-b bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            {tenant.name}
          </h1>
          {tenant.description && (
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              {tenant.description}
            </p>
          )}
          <div className="mt-6">
            <Link href={`/s/${tenant.slug}/products`}>
              <Button size="lg">Shop all</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-xl font-semibold">Featured products</h2>
        {(featured ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            This store hasn&apos;t added any products yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(featured ?? []).map((p) => (
              <ProductCard key={p.id} product={p} tenantSlug={tenant.slug} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
