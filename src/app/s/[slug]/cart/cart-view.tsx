"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart, cartSubtotalCents } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export function CartView({
  tenantSlug,
  currency,
}: {
  tenantSlug: string;
  currency: string;
}) {
  const lines = useCart((s) => s.lines[tenantSlug] ?? []);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const subtotal = cartSubtotalCents(lines);

  if (lines.length === 0) {
    return (
      <div className="mt-8 space-y-3 text-sm text-muted-foreground">
        <p>Your cart is empty.</p>
        <Link href={`/s/${tenantSlug}/products`} className="underline">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="divide-y rounded-md border">
        {lines.map((l) => (
          <div key={l.productId} className="flex items-center gap-4 p-4">
            <div className="size-16 shrink-0 overflow-hidden rounded-md bg-muted">
              {l.imageUrl ? (
                <Image
                  src={l.imageUrl}
                  alt=""
                  width={64}
                  height={64}
                  className="size-full object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{l.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(l.priceCents, l.currency)}
              </p>
            </div>
            <input
              type="number"
              min={1}
              value={l.quantity}
              onChange={(e) =>
                setQty(tenantSlug, l.productId, Number(e.target.value))
              }
              className="h-9 w-16 rounded-md border border-input px-2 text-center text-sm"
            />
            <div className="w-24 text-right text-sm font-medium">
              {formatCurrency(l.priceCents * l.quantity, l.currency)}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => remove(tenantSlug, l.productId)}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-end gap-2">
        <p className="text-lg">
          Subtotal:{" "}
          <span className="font-semibold">
            {formatCurrency(subtotal, currency)}
          </span>
        </p>
        <Link href={`/s/${tenantSlug}/checkout`}>
          <Button size="lg">Checkout</Button>
        </Link>
      </div>
    </div>
  );
}
