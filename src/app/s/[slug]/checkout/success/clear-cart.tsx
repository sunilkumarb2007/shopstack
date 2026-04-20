"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-store";

export function ClearCartOnMount({ slug }: { slug: string }) {
  const clear = useCart((s) => s.clear);
  useEffect(() => {
    clear(slug);
  }, [slug, clear]);
  return null;
}
