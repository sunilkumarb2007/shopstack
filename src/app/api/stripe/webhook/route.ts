import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderReceipt } from "@/lib/email";
import { env } from "@/lib/env";
import { absoluteUrl } from "@/lib/utils";

export const runtime = "nodejs";

type CheckoutOrder = {
  id: string;
  tenant_id: string;
  order_number: string;
  customer_email: string;
  customer_name: string | null;
  total_cents: number;
  subtotal_cents: number;
  currency: string;
};

type OrderWithTenant = CheckoutOrder & {
  tenants: { slug: string; name: string; currency: string } | null;
};

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const admin = createAdminClient();

  // Subscription sessions: update tenant plan.
  if (session.mode === "subscription") {
    const tenantId = session.metadata?.tenant_id;
    const plan = session.metadata?.plan;
    if (tenantId && plan) {
      await admin
        .from("tenants")
        .update({
          plan,
          stripe_subscription_id:
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription?.id ?? null,
          subscription_status: "active",
        })
        .eq("id", tenantId);
    }
    return;
  }

  // One-time payment: mark the order paid, send receipt.
  const { data: order } = await admin
    .from("orders")
    .select(
      "id, tenant_id, order_number, customer_email, customer_name, total_cents, subtotal_cents, currency, tenants(slug, name, currency)",
    )
    .eq("stripe_session_id", session.id)
    .maybeSingle();
  const typed = order as unknown as OrderWithTenant | null;
  if (!typed) return;

  await admin
    .from("orders")
    .update({
      status: "paid",
      stripe_payment_intent_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
    })
    .eq("id", typed.id);

  // Decrement inventory per line item.
  const { data: items } = await admin
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", typed.id);
  for (const item of items ?? []) {
    if (!item.product_id) continue;
    const { data: product } = await admin
      .from("products")
      .select("inventory")
      .eq("id", item.product_id)
      .maybeSingle();
    if (!product) continue;
    await admin
      .from("products")
      .update({
        inventory: Math.max(0, product.inventory - item.quantity),
      })
      .eq("id", item.product_id);
  }

  const { data: receiptItems } = await admin
    .from("order_items")
    .select("name, quantity, unit_price_cents")
    .eq("order_id", typed.id);

  await sendOrderReceipt({
    to: typed.customer_email,
    orderNumber: typed.order_number,
    storeName: typed.tenants?.name ?? "Your store",
    currency: typed.currency,
    items: (receiptItems ?? []).map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unitPriceCents: i.unit_price_cents,
    })),
    subtotalCents: typed.subtotal_cents,
    totalCents: typed.total_cents,
    orderUrl: absoluteUrl(
      `/s/${typed.tenants?.slug ?? ""}/checkout/success?session_id=${session.id}`,
    ),
  });
}

async function handleSubscriptionUpdated(
  sub: Stripe.Subscription,
): Promise<void> {
  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("stripe_subscription_id", sub.id)
    .maybeSingle();
  if (!tenant) return;
  await admin
    .from("tenants")
    .update({
      subscription_status: sub.status,
      plan:
        sub.status === "active" || sub.status === "trialing"
          ? (sub.metadata?.plan ?? undefined)
          : "free",
    })
    .eq("id", tenant.id);
}

export async function POST(request: NextRequest) {
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }
  const secret = env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured" },
      { status: 500 },
    );
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      { error: `Webhook signature failed: ${message}` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionUpdated(event.data.object);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error("Webhook handler error", event.type, err);
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
