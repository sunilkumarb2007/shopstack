"use client";

import { useActionState, useState } from "react";
import {
  createProductAction,
  updateProductAction,
  type ProductFormState,
} from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import type { Category, Product } from "@/lib/types/database";
import { slugify } from "@/lib/utils";

export function ProductForm({
  tenantId,
  categories,
  product,
}: {
  tenantId: string;
  categories: Category[];
  product?: Product;
}) {
  const action = product
    ? (updateProductAction.bind(null, product.id) as (
        prev: ProductFormState,
        fd: FormData,
      ) => Promise<ProductFormState>)
    : (createProductAction.bind(null, tenantId) as (
        prev: ProductFormState,
        fd: FormData,
      ) => Promise<ProductFormState>);
  const [state, formAction, isPending] = useActionState<
    ProductFormState,
    FormData
  >(action, undefined);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={product?.name ?? ""}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!product && !slug) setSlug(slugify(e.target.value));
            }}
            className="mt-1"
          />
          {state?.fieldErrors?.name && (
            <p className="mt-1 text-xs text-destructive">
              {state.fieldErrors.name.join(", ")}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            required
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            className="mt-1"
          />
          {state?.fieldErrors?.slug && (
            <p className="mt-1 text-xs text-destructive">
              {state.fieldErrors.slug.join(", ")}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={product?.description ?? ""}
          className="mt-1 min-h-32"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="price">Price (USD)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={
              product ? (product.price_cents / 100).toFixed(2) : "0.00"
            }
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="inventory">Inventory</Label>
          <Input
            id="inventory"
            name="inventory"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={product?.inventory ?? 0}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            name="status"
            defaultValue={product?.status ?? "published"}
            className="mt-1"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="category_id">Category</Label>
          <Select
            id="category_id"
            name="category_id"
            defaultValue={product?.category_id ?? ""}
            className="mt-1"
          >
            <option value="">— No category —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="image_url">Image URL</Label>
          <Input
            id="image_url"
            name="image_url"
            type="url"
            defaultValue={product?.image_url ?? ""}
            placeholder="https://…"
            className="mt-1"
          />
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : product ? "Save changes" : "Create product"}
      </Button>
    </form>
  );
}
