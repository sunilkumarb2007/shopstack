"use server";

import { redirect } from "next/navigation";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { absoluteUrl } from "@/lib/utils";
import type { Plan } from "@/lib/types/database";

// Plan → price lookup. If env price IDs are not set, Stripe Checkout will use
// ad-hoc `price_data` with our internal monthly amounts (for demos).
const PLAN_PRICES_CENTS: Record<Exclude<Plan, "free">, number> = {
  starter: 1900,
  growth: 4900,
  scale: 14900,
};

function priceIdFor(plan: Plan): string | null {
  if (plan === "starter") return process.env.STRIPE_PRICE_STARTER ?? null;
  if (plan === "growth") return process.env.STRIPE_PRICE_GROWTH ?? null;
  if (plan === "scale") return process.env.STRIPE_PRICE_SCALE ?? null;
  return null;
}

export async function upgradePlanAction(formData: FormData) {
  const plan = String(formData.get("plan") ?? "") as Plan;
  if (!plan || plan === "free" || !(plan in PLAN_PRICES_CENTS)) {
    throw new Error("Invalid plan.");
  }
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("memberships")
    .select("tenant_id, tenants(*)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const tenant = (
    membership as unknown as { tenants: { id: string; slug: string; stripe_customer_id: string | null } | null } | null
  )?.tenants;
  if (!tenant) redirect("/dashboard/onboarding");

  const stripe = getStripe();

  let customerId = tenant.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { tenant_id: tenant.id },
    });
    customerId = customer.id;
    const admin = createAdminClient();
    await admin
      .from("tenants")
      .update({ stripe_customer_id: customerId })
      .eq("id", tenant.id);
  }

  const priceId = priceIdFor(plan);
  const lineItem = priceId
    ? { price: priceId, quantity: 1 }
    : {
        price_data: {
          currency: "usd",
          product_data: { name: `ShopStack ${plan}` },
          unit_amount: PLAN_PRICES_CENTS[plan as Exclude<Plan, "free">],
          recurring: { interval: "month" as const },
        },
        quantity: 1,
      };

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [lineItem],
    success_url: absoluteUrl(`/dashboard/billing?success=1`),
    cancel_url: absoluteUrl(`/dashboard/billing`),
    metadata: { tenant_id: tenant.id, plan },
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  redirect(session.url);
}

export async function openBillingPortalAction() {
  if (!isStripeConfigured()) throw new Error("Stripe is not configured.");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("memberships")
    .select("tenants(*)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  const tenant = (
    membership as unknown as { tenants: { stripe_customer_id: string | null } | null } | null
  )?.tenants;
  if (!tenant?.stripe_customer_id) redirect("/dashboard/billing");

  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: tenant.stripe_customer_id,
    return_url: absoluteUrl(`/dashboard/billing`),
  });
  redirect(portal.url);
}
