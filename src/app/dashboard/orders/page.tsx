import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserTenant } from "@/lib/tenant";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const tenant = await getCurrentUserTenant();
  if (!tenant) redirect("/dashboard/onboarding");
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
      {(orders ?? []).length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No orders yet.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr className="text-left">
                <th className="p-3">Order #</th>
                <th className="p-3">Date</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(orders ?? []).map((o) => (
                <tr key={o.id} className="border-t hover:bg-accent">
                  <td className="p-3 font-mono text-xs">
                    <Link
                      href={`/dashboard/orders/${o.id}`}
                      className="hover:underline"
                    >
                      {o.order_number}
                    </Link>
                  </td>
                  <td className="p-3">{formatDate(o.created_at)}</td>
                  <td className="p-3">{o.customer_email}</td>
                  <td className="p-3">
                    {formatCurrency(o.total_cents, o.currency)}
                  </td>
                  <td className="p-3">
                    <Badge
                      variant={
                        o.status === "paid" || o.status === "fulfilled"
                          ? "success"
                          : o.status === "pending"
                          ? "warning"
                          : o.status === "cancelled" || o.status === "refunded"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {o.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
