import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserTenant } from "@/lib/tenant";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const tenant = await getCurrentUserTenant();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="inline-block size-6 rounded bg-primary text-primary-foreground grid place-items-center text-xs">
                S
              </span>
              ShopStack
            </Link>
            {tenant && (
              <span className="hidden text-sm text-muted-foreground md:inline">
                Managing{" "}
                <Link
                  href={`/s/${tenant.slug}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {tenant.name}
                </Link>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user.email}
            </span>
            <form action="/auth/signout" method="post">
              <Button variant="outline" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="flex flex-col gap-1 text-sm">
            <NavLink href="/dashboard" label="Overview" />
            <NavLink href="/dashboard/products" label="Products" />
            <NavLink href="/dashboard/categories" label="Categories" />
            <NavLink href="/dashboard/orders" label="Orders" />
            <NavLink href="/dashboard/reviews" label="Reviews" />
            <NavLink href="/dashboard/billing" label="Billing" />
            <NavLink href="/dashboard/settings" label="Settings" />
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      {label}
    </Link>
  );
}
