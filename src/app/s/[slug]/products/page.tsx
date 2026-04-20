import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTenantBySlug } from "@/lib/tenant";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ q?: string; category?: string }>;
}) {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const supabase = await createClient();
  const [{ data: categories }, productsResp] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("name"),
    (async () => {
      let q = supabase
        .from("products")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(60);
      if (sp.category) {
        const { data: cat } = await supabase
          .from("categories")
          .select("id")
          .eq("tenant_id", tenant.id)
          .eq("slug", sp.category)
          .maybeSingle();
        if (cat) q = q.eq("category_id", cat.id);
      }
      if (sp.q && sp.q.trim()) {
        const term = sp.q.trim();
        // Full-text search on generated tsvector, falling back to ILIKE for short queries.
        q =
          term.length >= 3
            ? q.textSearch("search", term, {
                type: "websearch",
                config: "english",
              })
            : q.ilike("name", `%${term}%`);
      }
      return await q;
    })(),
  ]);
  const products = productsResp.data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <form className="mb-6 flex items-end gap-2" action="">
        <div className="flex-1">
          <Input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Search products…"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        <CategoryChip slug={slug} label="All" active={!sp.category} />
        {(categories ?? []).map((c) => (
          <CategoryChip
            key={c.id}
            slug={slug}
            category={c.slug}
            label={c.name}
            active={sp.category === c.slug}
          />
        ))}
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground">No products match.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} tenantSlug={slug} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryChip({
  slug,
  category,
  label,
  active,
}: {
  slug: string;
  category?: string;
  label: string;
  active: boolean;
}) {
  const href = category
    ? `/s/${slug}/products?category=${category}`
    : `/s/${slug}/products`;
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full border bg-primary px-3 py-1 text-primary-foreground"
          : "rounded-full border bg-background px-3 py-1 text-muted-foreground hover:text-foreground"
      }
    >
      {label}
    </Link>
  );
}
