import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserTenant } from "@/lib/tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const tenant = await getCurrentUserTenant();
  if (!tenant) redirect("/dashboard/onboarding");

  const supabase = await createClient();
  const [{ count: productCount }, { count: orderCount }, { data: recentOrders }] =
    await Promise.all([
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenant.id),
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenant.id),
      supabase
        .from("orders")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const paidOrders = (recentOrders ?? []).filter(
    (o) => o.status === "paid" || o.status === "fulfilled",
  );
  const revenueCents = paidOrders.reduce((s, o) => s + o.total_cents, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back to {tenant.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Your storefront:{" "}
            <Link className="underline" href={`/s/${tenant.slug}`}>
              /s/{tenant.slug}
            </Link>
          </p>
        </div>
        <Link href="/dashboard/products/new">
          <Button>Add product</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Products" value={String(productCount ?? 0)} />
        <Stat label="Orders" value={String(orderCount ?? 0)} />
        <Stat
          label="Recent revenue"
          value={formatCurrency(revenueCents, tenant.currency)}
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold">Recent orders</h2>
          {(recentOrders ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No orders yet. Share your storefront link to get started.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground">
                  <tr className="text-left">
                    <th className="py-2 pr-4">Order #</th>
                    <th className="py-2 pr-4">Customer</th>
                    <th className="py-2 pr-4">Total</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(recentOrders ?? []).map((o) => (
                    <tr key={o.id} className="border-t">
                      <td className="py-2 pr-4 font-mono text-xs">
                        <Link
                          className="hover:underline"
                          href={`/dashboard/orders/${o.id}`}
                        >
                          {o.order_number}
                        </Link>
                      </td>
                      <td className="py-2 pr-4">{o.customer_email}</td>
                      <td className="py-2 pr-4">
                        {formatCurrency(o.total_cents, o.currency)}
                      </td>
                      <td className="py-2 capitalize">{o.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
