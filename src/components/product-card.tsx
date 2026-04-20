import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils";

export function ProductCard({
  product,
  tenantSlug,
}: {
  product: Product;
  tenantSlug: string;
}) {
  return (
    <Link
      href={`/s/${tenantSlug}/products/${product.slug}`}
      className="group rounded-lg border bg-card transition-colors hover:bg-accent"
    >
      <div className="aspect-square overflow-hidden rounded-t-lg bg-muted">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            width={400}
            height={400}
            className="size-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-xs text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium">{product.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatCurrency(product.price_cents, product.currency)}
        </p>
      </div>
    </Link>
  );
}
