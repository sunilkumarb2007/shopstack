"use client";

import { useState, useTransition } from "react";
import { useCart, cartSubtotalCents } from "@/lib/cart-store";
import { createCheckoutSession } from "@/actions/checkout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

export function CheckoutForm({
  tenantSlug,
  currency,
  defaultEmail,
}: {
  tenantSlug: string;
  currency: string;
  defaultEmail: string;
}) {
  const lines = useCart((s) => s.lines[tenantSlug] ?? []);
  const subtotal = cartSubtotalCents(lines);
  const [email, setEmail] = useState(defaultEmail);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) return setError("Email is required.");
    if (lines.length === 0) return setError("Your cart is empty.");
    startTransition(async () => {
      try {
        await createCheckoutSession({
          tenantSlug,
          email,
          name: name || undefined,
          lines,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Checkout failed.");
      }
    });
  };

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      <div>
        <Label htmlFor="email">Email for receipt</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="name">Name (optional)</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1"
        />
      </div>
      <div className="rounded-md border bg-secondary/50 p-3 text-sm">
        <div className="flex justify-between">
          <span>Items</span>
          <span>{lines.reduce((s, l) => s + l.quantity, 0)}</span>
        </div>
        <div className="mt-1 flex justify-between font-medium">
          <span>Total</span>
          <span>{formatCurrency(subtotal, currency)}</span>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        type="submit"
        className="w-full"
        disabled={isPending || lines.length === 0}
      >
        {isPending ? "Redirecting to Stripe…" : "Pay with Stripe"}
      </Button>
    </form>
  );
}
