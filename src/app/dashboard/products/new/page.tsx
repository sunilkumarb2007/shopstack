import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserTenant } from "@/lib/tenant";
import { ProductForm } from "../product-form";

export default async function NewProductPage() {
  const tenant = await getCurrentUserTenant();
  if (!tenant) redirect("/dashboard/onboarding");

  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("name");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Add product</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        New products are published immediately and appear on your storefront.
      </p>
      <div className="mt-6">
        <ProductForm tenantId={tenant.id} categories={categories ?? []} />
      </div>
    </div>
  );
}
