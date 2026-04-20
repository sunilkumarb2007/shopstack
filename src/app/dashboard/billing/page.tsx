import { redirect } from "next/navigation";
import { getCurrentUserTenant } from "@/lib/tenant";
import {
  upgradePlanAction,
  openBillingPortalAction,
} from "@/actions/billing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import type { Plan } from "@/lib/types/database";

const PLANS: { id: Plan; name: string; price: string; features: string[] }[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$19/mo",
    features: [
      "Unlimited products",
      "Stripe live-mode checkout",
      "3 team members",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: "$49/mo",
    features: ["Everything in Starter", "Advanced analytics", "10 team members"],
  },
  {
    id: "scale",
    name: "Scale",
    price: "$149/mo",
    features: ["Everything in Growth", "Multiple storefronts", "Unlimited team"],
  },
];

export default async function BillingPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const tenant = await getCurrentUserTenant();
  if (!tenant) redirect("/dashboard/onboarding");

  const onPaidPlan = tenant.plan !== "free";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>

      {sp.success && (
        <Card>
          <CardContent className="pt-6 text-sm text-emerald-700">
            Payment complete. Your plan will update in a few seconds once Stripe
            confirms.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Current plan</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-2xl font-semibold capitalize">{tenant.plan}</p>
            {tenant.subscription_status && (
              <Badge variant="secondary">{tenant.subscription_status}</Badge>
            )}
          </div>
          {onPaidPlan && (
            <form action={openBillingPortalAction} className="mt-4">
              <Button type="submit" variant="outline">
                Manage billing in Stripe
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <Card key={p.id}>
            <CardContent className="flex h-full flex-col gap-4 pt-6">
              <div>
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <p className="mt-1 text-2xl font-bold">{p.price}</p>
              </div>
              <ul className="flex-1 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <form action={upgradePlanAction}>
                <input type="hidden" name="plan" value={p.id} />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={tenant.plan === p.id}
                >
                  {tenant.plan === p.id ? "Current plan" : `Upgrade to ${p.name}`}
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Payments are processed securely by Stripe. You can cancel any time.
      </p>
    </div>
  );
}
