import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserTenant } from "@/lib/tenant";
import {
  createCategoryAction,
  deleteCategoryAction,
} from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const tenant = await getCurrentUserTenant();
  if (!tenant) redirect("/dashboard/onboarding");

  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("name");

  const createForTenant = createCategoryAction.bind(null, tenant.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>

      <Card>
        <CardContent className="pt-6">
          <form action={createForTenant} className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="name">New category</Label>
              <Input
                id="name"
                name="name"
                placeholder="Apparel"
                className="mt-1"
                required
              />
            </div>
            <Button type="submit">Add</Button>
          </form>
        </CardContent>
      </Card>

      <div className="divide-y rounded-md border">
        {(categories ?? []).map((c) => (
          <div key={c.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-muted-foreground">/{c.slug}</p>
            </div>
            <form action={deleteCategoryAction}>
              <input type="hidden" name="id" value={c.id} />
              <Button variant="ghost" size="sm" type="submit">
                Delete
              </Button>
            </form>
          </div>
        ))}
        {(categories ?? []).length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">
            No categories yet.
          </p>
        )}
      </div>
    </div>
  );
}
