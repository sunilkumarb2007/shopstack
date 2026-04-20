"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-store";

export function CartButton({ slug }: { slug: string }) {
  const count = useCart((s) =>
    (s.lines[slug] ?? []).reduce((sum, l) => sum + l.quantity, 0),
  );
  return (
    <Link
      href={`/s/${slug}/cart`}
      className="relative inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-accent"
    >
      <ShoppingCart className="size-4" />
      <span>Cart</span>
      {count > 0 && (
        <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
          {count}
        </span>
      )}
    </Link>
  );
}
