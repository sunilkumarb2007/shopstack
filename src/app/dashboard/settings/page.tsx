import { redirect } from "next/navigation";
import { getCurrentUserTenant } from "@/lib/tenant";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const tenant = await getCurrentUserTenant();
  if (!tenant) redirect("/dashboard/onboarding");

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Store settings</h1>
        <p className="text-sm text-muted-foreground">
          Public details shown on your storefront.
        </p>
      </div>
      <SettingsForm tenant={tenant} />
    </div>
  );
}
