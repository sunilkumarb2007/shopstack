import { redirect } from "next/navigation";
import { getCurrentUserTenant } from "@/lib/tenant";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const existing = await getCurrentUserTenant();
  if (existing) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Create your store
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Give your store a name and a URL slug. Your storefront will live at
          <code className="mx-1 rounded bg-muted px-1 py-0.5">/s/your-slug</code>.
        </p>
      </div>
      <OnboardingForm />
    </div>
  );
}
