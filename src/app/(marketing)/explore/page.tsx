import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const supabase = await createClient();
  const { data: tenants } = await supabase
    .from("tenants")
    .select("slug, name, description, logo_url")
    .order("created_at", { ascending: false })
    .limit(48);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Explore stores</h1>
      <p className="mt-2 text-muted-foreground">
        A sample of merchants using ShopStack.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(tenants ?? []).map((t) => (
          <Link key={t.slug} href={`/s/${t.slug}`}>
            <Card className="h-full transition-colors hover:bg-accent">
              <CardContent className="pt-6">
                <h3 className="text-base font-semibold">{t.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {t.description ?? `Visit the ${t.name} storefront.`}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  /s/{t.slug}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {(tenants ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">
            No stores yet. <Link href="/signup" className="underline">Be the first.</Link>
          </p>
        )}
      </div>
    </div>
  );
}
