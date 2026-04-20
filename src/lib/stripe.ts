import Stripe from "stripe";

// Lazy singleton so importing this file doesn't throw when env vars aren't set
// (e.g. during build on Vercel before secrets are configured).
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  _stripe = new Stripe(key, {
    appInfo: { name: "ShopStack", version: "0.1.0" },
  });
  return _stripe;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
