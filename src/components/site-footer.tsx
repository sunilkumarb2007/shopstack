import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row">
        <p>© {new Date().getFullYear()} ShopStack. Built with Next.js, Supabase and Stripe.</p>
        <div className="flex items-center gap-4">
          <Link href="/pricing">Pricing</Link>
          <Link href="/signup">Get started</Link>
          <Link href="/explore">Stores</Link>
        </div>
      </div>
    </footer>
  );
}
