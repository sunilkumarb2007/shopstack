"use server";

import { redirect } from "next/navigation";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/utils";
import type { CartLine } from "@/lib/cart-store";

// Called from the storefront checkout page. Creates an order row (pending) and
// a Stripe Checkout Session, then redirects the browser to Stripe.
export async function createCheckoutSession(input: {
  tenantSlug: string;
  lines: CartLine[];
  email: string;
  name?: string;
}) {
  if (!isStripeConfigured()) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in your environment.",
    );
  }
  if (!input.lines.length) throw new Error("Cart is empty.");
  if (!input.email) throw new Error("Email is required.");

  const admin = createAdminClient();

  const { data: tenant, error: tenantErr } = await admin
    .from("tenants")
    .select("*")
    .eq("slug", input.tenantSlug)
    .maybeSingle();
  if (tenantErr || !tenant) throw new Error("Store not found.");

  // Revalidate prices/inventory against the DB (never trust client cart).
  const productIds = input.lines.map((l) => l.productId);
  const { data: products } = await admin
    .from("products")
    .select("*")
    .in("id", productIds)
    .eq("tenant_id", tenant.id);
  if (!products || products.length === 0)
    throw new Error("No valid products in cart.");

  type OrderItemRow = {
    product_id: string;
    name: string;
    quantity: number;
    unit_price_cents: number;
  };
  const items: OrderItemRow[] = [];
  let subtotal = 0;
  for (const line of input.lines) {
    const p = products.find((pp) => pp.id === line.productId);
    if (!p || p.status !== "published") continue;
    // Products without inventory tracking are treated as unlimited stock.
    // Products that track inventory are clamped to the available amount
    // (and skipped entirely if they're out of stock).
    const qty = p.track_inventory
      ? Math.min(line.quantity, Math.max(0, p.inventory))
      : line.quantity;
    if (qty <= 0) continue;
    items.push({
      product_id: p.id,
      name: p.name,
      quantity: qty,
      unit_price_cents: p.price_cents,
    });
    subtotal += p.price_cents * qty;
  }
  if (items.length === 0) throw new Error("No items available to purchase.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const orderNumber = `${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, "0")}`;

  const { data: order, error: orderErr } = await admin
    .from("orders")
    .insert({
      tenant_id: tenant.id,
      order_number: orderNumber,
      customer_user_id: user?.id ?? null,
      customer_email: input.email,
      customer_name: input.name ?? null,
      status: "pending",
      subtotal_cents: subtotal,
      total_cents: subtotal,
      currency: tenant.currency,
    })
    .select("*")
    .single();
  if (orderErr || !order) throw new Error(orderErr?.message ?? "Failed to create order.");

  await admin.from("order_items").insert(
    items.map((i) => ({
      order_id: order.id,
      product_id: i.product_id,
      name: i.name,
      quantity: i.quantity,
      unit_price_cents: i.unit_price_cents,
    })),
  );

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.email,
    line_items: items.map((i) => ({
      price_data: {
        currency: tenant.currency.toLowerCase(),
        product_data: { name: i.name },
        unit_amount: i.unit_price_cents,
      },
      quantity: i.quantity,
    })),
    success_url: absoluteUrl(
      `/s/${tenant.slug}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    ),
    cancel_url: absoluteUrl(`/s/${tenant.slug}/cart`),
    metadata: {
      order_id: order.id,
      tenant_id: tenant.id,
    },
  });

  await admin
    .from("orders")
    .update({ stripe_session_id: session.id })
    .eq("id", order.id);

  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  redirect(session.url);
}
