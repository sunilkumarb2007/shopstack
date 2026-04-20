"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-store";

export function AddToCartButton({
  product,
  tenantSlug,
  disabled,
}: {
  product: {
    id: string;
    name: string;
    priceCents: number;
    currency: string;
    imageUrl: string | null;
  };
  tenantSlug: string;
  disabled?: boolean;
}) {
  const add = useCart((s) => s.add);
  const router = useRouter();
  const [added, setAdded] = useState(false);

  return (
    <div className="flex gap-2">
      <Button
        disabled={disabled}
        onClick={() => {
          add(tenantSlug, {
            productId: product.id,
            name: product.name,
            priceCents: product.priceCents,
            currency: product.currency,
            imageUrl: product.imageUrl,
            quantity: 1,
            tenantSlug,
          });
          setAdded(true);
          setTimeout(() => setAdded(false), 1200);
        }}
      >
        {added ? "Added ✓" : "Add to cart"}
      </Button>
      <Button
        variant="outline"
        disabled={disabled}
        onClick={() => {
          add(tenantSlug, {
            productId: product.id,
            name: product.name,
            priceCents: product.priceCents,
            currency: product.currency,
            imageUrl: product.imageUrl,
            quantity: 1,
            tenantSlug,
          });
          router.push(`/s/${tenantSlug}/checkout`);
        }}
      >
        Buy now
      </Button>
    </div>
  );
}
