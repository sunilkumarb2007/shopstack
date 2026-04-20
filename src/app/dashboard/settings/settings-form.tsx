"use client";

import { useActionState } from "react";
import { updateStoreAction, type CreateStoreState } from "@/actions/tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Tenant } from "@/lib/types/database";

export function SettingsForm({ tenant }: { tenant: Tenant }) {
  const action = updateStoreAction.bind(null, tenant.id);
  const [state, formAction, isPending] = useActionState<
    CreateStoreState,
    FormData
  >(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="name">Store name</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={tenant.name}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={tenant.description ?? ""}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="currency">Currency (ISO 4217)</Label>
        <Input
          id="currency"
          name="currency"
          defaultValue={tenant.currency}
          maxLength={3}
          className="mt-1 uppercase"
        />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
