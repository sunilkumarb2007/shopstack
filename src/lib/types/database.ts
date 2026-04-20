// Lightweight Supabase type surface. We intentionally type the tables as loose
// Row/Insert/Update bags because the @supabase/supabase-js generic is very
// picky about shape — a full `supabase gen types` output can replace this
// file later without any callsite changes.

export type Plan = "free" | "starter" | "growth" | "scale";
export type OrderStatus =
  | "pending"
  | "paid"
  | "fulfilled"
  | "cancelled"
  | "refunded";
export type ProductStatus = "draft" | "published" | "archived";
export type Role = "owner" | "admin" | "staff";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  currency: string;
  plan: Plan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export type Membership = {
  id: string;
  tenant_id: string;
  user_id: string;
  role: Role;
  created_at: string;
};

export type Category = {
  id: string;
  tenant_id: string;
  slug: string;
  name: string;
  created_at: string;
};

export type Product = {
  id: string;
  tenant_id: string;
  category_id: string | null;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  image_url: string | null;
  inventory: number;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  tenant_id: string;
  order_number: string;
  customer_user_id: string | null;
  customer_email: string;
  customer_name: string | null;
  status: OrderStatus;
  subtotal_cents: number;
  total_cents: number;
  currency: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  quantity: number;
  unit_price_cents: number;
  created_at: string;
};

export type Review = {
  id: string;
  tenant_id: string;
  product_id: string;
  user_id: string | null;
  author_name: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
};
