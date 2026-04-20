import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { CheckoutForm } from "./checkout-form";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        You&apos;ll be redirected to Stripe to complete payment.
      </p>
      <CheckoutForm
        tenantSlug={slug}
        currency={tenant.currency}
        defaultEmail={user?.email ?? ""}
      />
      <p className="mt-4 text-xs text-muted-foreground">
        Using Stripe test mode? You can pay with card number
        <code className="mx-1 rounded bg-muted px-1">4242 4242 4242 4242</code>,
        any future expiry, and any CVC.
      </p>
    </div>
  );
}
