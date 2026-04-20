-- Add an opt-in `track_inventory` flag to products.
--
-- Rationale: the `inventory` column defaults to 0, so a strict "inventory <= 0
-- means out of stock" rule makes every newly created product unpurchasable.
-- The semantics we actually want:
--   track_inventory = false  → unlimited stock (inventory column is ignored)
--   track_inventory = true   → inventory is the source of truth; reaching 0
--                              means out of stock
-- Default is `false` so merchants can list products without thinking about
-- stock; they explicitly opt in to tracking when they need it.

alter table public.products
  add column if not exists track_inventory boolean not null default false;

-- Teach the atomic decrement RPC to respect the flag. Products that don't
-- track inventory are left untouched.
create or replace function public.decrement_inventory(
  p_product_id uuid,
  p_qty integer
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products
    set inventory = greatest(0, inventory - p_qty),
        updated_at = now()
  where id = p_product_id
    and track_inventory = true;
end;
$$;

revoke all on function public.decrement_inventory(uuid, integer) from public;
grant execute on function public.decrement_inventory(uuid, integer) to service_role;
