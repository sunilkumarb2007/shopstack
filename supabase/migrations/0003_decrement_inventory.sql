-- Atomic inventory decrement to prevent lost updates under concurrent
-- Stripe webhook deliveries. Previously the webhook did a read-modify-write
-- in JS which could oversell when two completions for the same product
-- landed simultaneously.

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
  where id = p_product_id;
end;
$$;

revoke all on function public.decrement_inventory(uuid, integer) from public;
grant execute on function public.decrement_inventory(uuid, integer) to service_role;
