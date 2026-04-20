"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartLine = {
  productId: string;
  name: string;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
  quantity: number;
  tenantSlug: string;
};

type CartState = {
  // Separate carts per tenant slug so items from different stores don't mix.
  lines: Record<string, CartLine[]>;
  add: (slug: string, line: CartLine) => void;
  remove: (slug: string, productId: string) => void;
  setQty: (slug: string, productId: string, qty: number) => void;
  clear: (slug: string) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: {},
      add: (slug, line) =>
        set((state) => {
          const existing = state.lines[slug] ?? [];
          const match = existing.find((l) => l.productId === line.productId);
          const next: CartLine[] = match
            ? existing.map((l) =>
                l.productId === line.productId
                  ? { ...l, quantity: l.quantity + line.quantity }
                  : l,
              )
            : [...existing, line];
          return { lines: { ...state.lines, [slug]: next } };
        }),
      remove: (slug, productId) =>
        set((state) => ({
          lines: {
            ...state.lines,
            [slug]: (state.lines[slug] ?? []).filter(
              (l) => l.productId !== productId,
            ),
          },
        })),
      setQty: (slug, productId, qty) =>
        set((state) => ({
          lines: {
            ...state.lines,
            [slug]: (state.lines[slug] ?? [])
              .map((l) =>
                l.productId === productId
                  ? { ...l, quantity: Math.max(0, qty) }
                  : l,
              )
              .filter((l) => l.quantity > 0),
          },
        })),
      clear: (slug) =>
        set((state) => ({ lines: { ...state.lines, [slug]: [] } })),
    }),
    {
      name: "shopstack-cart",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

export function cartSubtotalCents(lines: CartLine[] | undefined): number {
  if (!lines) return 0;
  return lines.reduce((sum, l) => sum + l.priceCents * l.quantity, 0);
}
