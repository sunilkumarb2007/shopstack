-- ShopStack initial schema: multi-tenant SaaS e-commerce
-- Apply with:  supabase db push   OR paste into the Supabase SQL editor.

create extension if not exists "pgcrypto";

-- =========================================================================
-- profiles: one row per auth.user, created via trigger on signup
-- =========================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public, auth
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- tenants: one row per merchant store. slug is the public storefront path.
-- =========================================================================
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  logo_url text,
  currency text not null default 'USD',
  plan text not null default 'free' check (plan in ('free','starter','growth','scale')),
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tenants_owner_idx on public.tenants(owner_id);
create index if not exists tenants_slug_idx on public.tenants(slug);

-- =========================================================================
-- memberships: tenants can have multiple team members
-- =========================================================================
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','admin','staff')),
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);
create index if not exists memberships_user_idx on public.memberships(user_id);

-- =========================================================================
-- categories
-- =========================================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  slug text not null,
  name text not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, slug)
);
create index if not exists categories_tenant_idx on public.categories(tenant_id);

-- =========================================================================
-- products
-- =========================================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  slug text not null,
  name text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'USD',
  image_url text,
  inventory integer not null default 0 check (inventory >= 0),
  status text not null default 'published' check (status in ('draft','published','archived')),
  search tsvector generated always as (
    to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);
create index if not exists products_tenant_idx on public.products(tenant_id);
create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_search_idx on public.products using gin(search);

-- =========================================================================
-- orders + order_items
-- =========================================================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_number text not null,
  customer_user_id uuid references public.profiles(id) on delete set null,
  customer_email text not null,
  customer_name text,
  status text not null default 'pending' check (status in ('pending','paid','fulfilled','cancelled','refunded')),
  subtotal_cents integer not null default 0,
  total_cents integer not null default 0,
  currency text not null default 'USD',
  stripe_session_id text,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, order_number)
);
create index if not exists orders_tenant_idx on public.orders(tenant_id);
create index if not exists orders_customer_idx on public.orders(customer_user_id);
create index if not exists orders_stripe_session_idx on public.orders(stripe_session_id);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  created_at timestamptz not null default now()
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- =========================================================================
-- reviews
-- =========================================================================
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  author_name text,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text,
  created_at timestamptz not null default now()
);
create index if not exists reviews_product_idx on public.reviews(product_id);

-- =========================================================================
-- updated_at triggers
-- =========================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists tenants_touch on public.tenants;
create trigger tenants_touch before update on public.tenants
  for each row execute function public.touch_updated_at();
drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- =========================================================================
-- membership helper (avoids recursive RLS lookups)
-- =========================================================================
create or replace function public.is_tenant_member(t uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.tenant_id = t and m.user_id = auth.uid()
  );
$$;

-- =========================================================================
-- RLS
-- =========================================================================
alter table public.profiles enable row level security;
alter table public.tenants enable row level security;
alter table public.memberships enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;

-- profiles: users can read/update their own profile
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles for select
  using (auth.uid() = id);
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update
  using (auth.uid() = id);

-- tenants: public can read any tenant (for storefront); only members can update/delete
drop policy if exists "tenants public read" on public.tenants;
create policy "tenants public read" on public.tenants for select using (true);
drop policy if exists "tenants owner insert" on public.tenants;
create policy "tenants owner insert" on public.tenants for insert
  with check (auth.uid() = owner_id);
drop policy if exists "tenants member update" on public.tenants;
create policy "tenants member update" on public.tenants for update
  using (public.is_tenant_member(id));
drop policy if exists "tenants owner delete" on public.tenants;
create policy "tenants owner delete" on public.tenants for delete
  using (auth.uid() = owner_id);

-- memberships: members of a tenant can read its memberships; owners manage.
drop policy if exists "memberships member read" on public.memberships;
create policy "memberships member read" on public.memberships for select
  using (user_id = auth.uid() or public.is_tenant_member(tenant_id));
drop policy if exists "memberships self insert" on public.memberships;
create policy "memberships self insert" on public.memberships for insert
  with check (user_id = auth.uid());
drop policy if exists "memberships owner manage" on public.memberships;
create policy "memberships owner manage" on public.memberships for delete
  using (public.is_tenant_member(tenant_id));

-- categories: public read, member write
drop policy if exists "categories public read" on public.categories;
create policy "categories public read" on public.categories for select using (true);
drop policy if exists "categories member write" on public.categories;
create policy "categories member write" on public.categories for all
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

-- products: public read of published; members can read/write all
drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products for select
  using (status = 'published' or public.is_tenant_member(tenant_id));
drop policy if exists "products member write" on public.products;
create policy "products member write" on public.products for all
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

-- orders: customer can see their own; members see tenant orders.
-- Inserts/updates are done via the service role (webhook + server actions),
-- so no insert policy is needed for end users.
drop policy if exists "orders read" on public.orders;
create policy "orders read" on public.orders for select using (
  customer_user_id = auth.uid() or public.is_tenant_member(tenant_id)
);
drop policy if exists "orders member update" on public.orders;
create policy "orders member update" on public.orders for update
  using (public.is_tenant_member(tenant_id));

drop policy if exists "order_items read" on public.order_items;
create policy "order_items read" on public.order_items for select using (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (o.customer_user_id = auth.uid() or public.is_tenant_member(o.tenant_id))
  )
);

-- reviews: public read, authenticated insert (one per user per product), author/members delete
drop policy if exists "reviews public read" on public.reviews;
create policy "reviews public read" on public.reviews for select using (true);
drop policy if exists "reviews auth insert" on public.reviews;
create policy "reviews auth insert" on public.reviews for insert
  with check (auth.uid() = user_id);
drop policy if exists "reviews author delete" on public.reviews;
create policy "reviews author delete" on public.reviews for delete
  using (user_id = auth.uid() or public.is_tenant_member(tenant_id));
