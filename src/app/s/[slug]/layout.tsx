import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";
import { CartButton } from "@/components/cart-button";

export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link
            href={`/s/${tenant.slug}`}
            className="flex items-center gap-2 font-semibold"
          >
            <span className="inline-block size-6 rounded bg-primary text-primary-foreground grid place-items-center text-xs">
              {tenant.name.charAt(0).toUpperCase()}
            </span>
            {tenant.name}
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href={`/s/${tenant.slug}/products`}
              className="text-muted-foreground hover:text-foreground"
            >
              Products
            </Link>
            <CartButton slug={tenant.slug} />
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="mt-auto border-t py-6 text-center text-xs text-muted-foreground">
        {tenant.name} · Powered by{" "}
        <Link href="/" className="underline">
          ShopStack
        </Link>
      </footer>
    </div>
  );
}
