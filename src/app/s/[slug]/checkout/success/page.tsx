import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { ClearCartOnMount } from "./clear-cart";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ session_id?: string }>;
}) {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  let order: {
    order_number: string;
    total_cents: number;
    currency: string;
    status: string;
  } | null = null;
  if (sp.session_id) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("orders")
      .select("order_number, total_cents, currency, status")
      .eq("stripe_session_id", sp.session_id)
      .maybeSingle();
    order = data ?? null;
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <ClearCartOnMount slug={slug} />
      <Card>
        <CardContent className="space-y-4 pt-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Thank you!</h1>
          <p className="text-sm text-muted-foreground">
            Your order is being processed. You&apos;ll get an email receipt as
            soon as Stripe confirms the payment.
          </p>
          {order && (
            <div className="rounded-md bg-secondary/60 p-3 text-left text-sm">
              <p>
                Order{" "}
                <span className="font-mono font-medium">
                  #{order.order_number}
                </span>
              </p>
              <p>
                Total:{" "}
                <span className="font-medium">
                  {formatCurrency(order.total_cents, order.currency)}
                </span>
              </p>
              <p>
                Status: <span className="capitalize">{order.status}</span>
              </p>
            </div>
          )}
          <Link href={`/s/${tenant.slug}/products`}>
            <Button className="w-full">Continue shopping</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
