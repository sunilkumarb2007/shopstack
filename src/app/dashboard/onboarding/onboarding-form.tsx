"use client";

import { useActionState, useState } from "react";
import { createStoreAction, type CreateStoreState } from "@/actions/tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/utils";

export function OnboardingForm() {
  const [state, formAction, isPending] = useActionState<
    CreateStoreState,
    FormData
  >(createStoreAction, undefined);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="name">Store name</Label>
        <Input
          id="name"
          name="name"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slug) setSlug(slugify(e.target.value));
          }}
          className="mt-1"
          placeholder="Acme Goods"
        />
        {state?.fieldErrors?.name && (
          <p className="mt-1 text-xs text-destructive">
            {state.fieldErrors.name.join(", ")}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="slug">Store URL slug</Label>
        <div className="mt-1 flex items-stretch rounded-md border border-input">
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            /s/
          </span>
          <Input
            id="slug"
            name="slug"
            required
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            className="border-0 focus-visible:ring-0"
            placeholder="acme-goods"
          />
        </div>
        {state?.fieldErrors?.slug && (
          <p className="mt-1 text-xs text-destructive">
            {state.fieldErrors.slug.join(", ")}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          name="description"
          className="mt-1"
          placeholder="We sell hand-crafted goods."
        />
      </div>
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating…" : "Create store"}
      </Button>
    </form>
  );
}
