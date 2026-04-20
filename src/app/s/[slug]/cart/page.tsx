import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";
import { CartView } from "./cart-view";

export default async function CartPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Your cart</h1>
      <CartView tenantSlug={slug} currency={tenant.currency} />
    </div>
  );
}
