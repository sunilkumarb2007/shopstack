"use client";

import { useActionState, useState } from "react";
import { createReviewAction, type ReviewState } from "@/actions/reviews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";

export function ReviewForm({
  tenantId,
  productId,
  tenantSlug,
  productSlug,
}: {
  tenantId: string;
  productId: string;
  tenantSlug: string;
  productSlug: string;
}) {
  const action = createReviewAction.bind(
    null,
    tenantId,
    productId,
    tenantSlug,
    productSlug,
  );
  const [state, formAction, isPending] = useActionState<ReviewState, FormData>(
    action,
    undefined,
  );
  const [rating, setRating] = useState(5);

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-md border p-4"
    >
      <h3 className="text-base font-semibold">Write a review</h3>
      <input type="hidden" name="rating" value={rating} />
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const value = i + 1;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              aria-label={`${value} stars`}
            >
              <Star
                className={
                  value <= rating
                    ? "size-6 fill-amber-500 text-amber-500"
                    : "size-6 text-muted-foreground"
                }
              />
            </button>
          );
        })}
      </div>
      <div>
        <Label htmlFor="author_name">Your name</Label>
        <Input id="author_name" name="author_name" className="mt-1" />
      </div>
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" className="mt-1" />
      </div>
      <div>
        <Label htmlFor="body">Review</Label>
        <Textarea id="body" name="body" className="mt-1" />
      </div>
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state?.ok && (
        <p className="text-sm text-emerald-600">
          Thanks for your review!
        </p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Submitting…" : "Submit review"}
      </Button>
    </form>
  );
}
