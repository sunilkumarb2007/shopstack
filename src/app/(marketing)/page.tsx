import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    title: "Multi-tenant by design",
    body: "Every merchant gets their own branded storefront at /s/your-store with products, orders, and analytics isolated by row-level security.",
  },
  {
    title: "Stripe checkout out of the box",
    body: "Sell with Stripe the same day you sign up — test mode is enabled by default so you can run end-to-end test charges instantly.",
  },
  {
    title: "Product catalog & search",
    body: "Full-text search powered by Postgres, categories, inventory tracking, draft/publish status, and optimized product imagery.",
  },
  {
    title: "Reviews & ratings",
    body: "Let customers leave 1–5 star reviews. Aggregated ratings appear on product pages and your store homepage.",
  },
  {
    title: "Order management",
    body: "Track every order from pending to fulfilled. Customers automatically receive branded email receipts via Resend.",
  },
  {
    title: "Subscriptions & billing",
    body: "Tiered monthly plans (Starter, Growth, Scale) via Stripe subscriptions. Upgrade or cancel without ever leaving your dashboard.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 text-center md:py-32">
        <span className="mb-4 inline-block rounded-full border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          Multi-tenant SaaS e-commerce
        </span>
        <h1 className="text-balance text-4xl font-bold tracking-tight md:text-6xl">
          Launch your store in minutes, scale it for years.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
          ShopStack gives every merchant a ready-to-sell storefront, an admin
          dashboard, Stripe checkout, email receipts, reviews, and subscription
          billing — all on one stack.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup">
            <Button size="lg">Start free — no card required</Button>
          </Link>
          <Link href="/pricing">
            <Button variant="outline" size="lg">
              See pricing
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Free plan includes up to 25 products and Stripe test-mode checkout.
        </p>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-secondary/30 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-semibold tracking-tight">
            Everything you need to sell online
          </h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Built with Next.js, Supabase, and Stripe — the same tools modern
            SaaS is built on.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title}>
                <CardContent className="pt-6">
                  <h3 className="text-base font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Your store could be live today.
          </h2>
          <p className="mt-2 text-muted-foreground">
            Create an account, pick a slug, add your first product, and share
            your storefront link with the world.
          </p>
          <div className="mt-6">
            <Link href="/signup">
              <Button size="lg">Create my store</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
