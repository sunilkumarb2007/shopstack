import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserTenant } from "@/lib/tenant";
import { updateOrderStatusAction } from "@/actions/orders";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await getCurrentUserTenant();
  if (!tenant) redirect("/dashboard/onboarding");

  const supabase = await createClient();
  const [{ data: order }, { data: items }] = await Promise.all([
    supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", tenant.id)
      .maybeSingle(),
    supabase.from("order_items").select("*").eq("order_id", id),
  ]);
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Order <span className="font-mono text-lg">#{order.order_number}</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Placed {formatDate(order.created_at)} by {order.customer_email}
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge
              variant={
                order.status === "paid" || order.status === "fulfilled"
                  ? "success"
                  : order.status === "pending"
                  ? "warning"
                  : "secondary"
              }
            >
              {order.status}
            </Badge>
          </div>
          <form action={updateOrderStatusAction} className="flex items-end gap-2">
            <input type="hidden" name="id" value={order.id} />
            <Select name="status" defaultValue={order.status}>
              <option value="pending">pending</option>
              <option value="paid">paid</option>
              <option value="fulfilled">fulfilled</option>
              <option value="cancelled">cancelled</option>
              <option value="refunded">refunded</option>
            </Select>
            <Button type="submit" size="sm">
              Update
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-base font-semibold">Items</h2>
          <table className="mt-4 w-full text-sm">
            <tbody>
              {(items ?? []).map((i) => (
                <tr key={i.id} className="border-b">
                  <td className="py-2">{i.name}</td>
                  <td className="py-2 text-center">× {i.quantity}</td>
                  <td className="py-2 text-right">
                    {formatCurrency(
                      i.unit_price_cents * i.quantity,
                      order.currency,
                    )}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="pt-4 text-right font-medium" colSpan={2}>
                  Total
                </td>
                <td className="pt-4 text-right font-medium">
                  {formatCurrency(order.total_cents, order.currency)}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
