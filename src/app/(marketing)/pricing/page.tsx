import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For makers just getting their first store off the ground.",
    features: [
      "Up to 25 products",
      "Stripe test-mode checkout",
      "Reviews & ratings",
      "Email receipts",
      "1 team member",
    ],
    cta: "Start free",
    href: "/signup",
  },
  {
    id: "starter",
    name: "Starter",
    price: "$19",
    period: "/ month",
    description: "For new merchants ready to take real orders.",
    features: [
      "Unlimited products",
      "Stripe live-mode checkout",
      "Custom domain (bring your own)",
      "3 team members",
      "Email support",
    ],
    cta: "Upgrade to Starter",
    href: "/dashboard/billing",
    highlight: true,
  },
  {
    id: "growth",
    name: "Growth",
    price: "$49",
    period: "/ month",
    description: "For stores doing real volume every month.",
    features: [
      "Everything in Starter",
      "Advanced analytics",
      "Abandoned cart recovery",
      "10 team members",
      "Priority support",
    ],
    cta: "Upgrade to Growth",
    href: "/dashboard/billing",
  },
  {
    id: "scale",
    name: "Scale",
    price: "$149",
    period: "/ month",
    description: "For multi-brand merchants and high-traffic stores.",
    features: [
      "Everything in Growth",
      "Multiple storefronts",
      "Unlimited team members",
      "Dedicated account manager",
      "Custom SLAs",
    ],
    cta: "Upgrade to Scale",
    href: "/dashboard/billing",
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Simple, honest pricing
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Start for free. Upgrade when you&apos;re ready for live payments and
          a team. Cancel any time.
        </p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={
              plan.highlight
                ? "relative border-primary shadow-md"
                : "relative"
            }
          >
            {plan.highlight && (
              <span className="absolute -top-3 left-4 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                Most popular
              </span>
            )}
            <CardContent className="flex h-full flex-col gap-6 pt-6">
              <div>
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>
              <ul className="flex-1 space-y-2 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href={plan.href}>
                <Button
                  className="w-full"
                  variant={plan.highlight ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
