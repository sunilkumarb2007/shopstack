# ShopStack

A production-shape, multi-tenant SaaS e-commerce platform built with
**Next.js 16 (App Router, Turbopack)**, **Supabase** (Postgres, auth, storage, RLS),
**Stripe** (checkout + subscriptions + webhooks), and **Resend** (transactional
email).

Every merchant signs up, gets an isolated storefront at `/s/their-slug`,
manages their catalog from the admin dashboard, and takes payments via
Stripe. Platform subscriptions (Starter / Growth / Scale) are billed to
merchants through Stripe recurring subscriptions.

---

## Feature overview

- **Multi-tenant core**: `tenants` + `memberships` tables with Postgres RLS.
  Every `products`/`orders`/`reviews` row is scoped by `tenant_id`.
- **Auth**: email/password via Supabase Auth. Google OAuth can be enabled
  from the Supabase dashboard without any code changes (callback route is
  already wired at `/auth/callback`).
- **Storefront** (`/s/[slug]`): landing hero, featured products, catalog
  with category filters + full-text search, product detail with reviews
  and ratings.
- **Cart**: client-side, persisted per-tenant in `localStorage` via
  Zustand.
- **Checkout**: Stripe Checkout Sessions; `order_items` are revalidated
  against the DB at session-create time so clients can never dictate
  prices.
- **Webhook** (`/api/stripe/webhook`): marks orders `paid`, decrements
  inventory, sends branded Resend email receipt, and updates tenant
  subscription state.
- **Admin dashboard** (`/dashboard`): products CRUD, categories, orders
  list + detail with status transitions, reviews moderation, store
  settings, and plan management with Stripe Billing Portal.
- **Marketing site**: landing page, pricing page, explore stores page.

## Stack

| Layer        | Choice                                                 |
| ------------ | ------------------------------------------------------ |
| Runtime      | Next.js 16 App Router + React 19 + Turbopack           |
| Styling      | Tailwind CSS v4 (`@theme` syntax) + lucide-react icons |
| DB / Auth    | Supabase (Postgres + Auth + Storage)                   |
| Payments     | Stripe (Checkout + Subscriptions + Customer Portal)    |
| Email        | Resend (optional — falls back to `console.info`)       |
| State        | Zustand (cart), React 19 `useActionState` (forms)      |
| Validation   | Zod                                                    |

## Directory layout

```
src/
  actions/            Server actions (tenant, products, checkout, billing, …)
  app/
    (auth)/           Sign up / log in pages
    (marketing)/      Landing, pricing, explore
    dashboard/        Merchant admin
    s/[slug]/         Per-tenant storefront
    auth/callback     Supabase OAuth / magic-link callback
    api/stripe/webhook Stripe webhook
  components/         UI primitives + feature components
  lib/
    supabase/         server.ts, client.ts, admin.ts, middleware.ts
    cart-store.ts     Zustand cart (per-tenant)
    email.ts          Resend receipts
    stripe.ts         Lazy Stripe client
    tenant.ts         Tenant lookup helpers
  proxy.ts            Session-refresh edge proxy (Next 16 renamed from middleware.ts)
supabase/migrations/  0001_initial.sql + 0002_storage.sql
```

## Local setup

```bash
pnpm install
cp .env.example .env.local   # fill in your secrets
# Apply the SQL in supabase/migrations/ via the Supabase SQL editor
pnpm dev
```

Then open http://localhost:3000.

## Required environment variables

See `.env.example`. Summary:

| Var                                    | Required | Where it's used                        |
| -------------------------------------- | :------: | -------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             |    ✓     | Browser + server                        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`        |    ✓     | Browser + server                        |
| `SUPABASE_SERVICE_ROLE_KEY`            |    ✓     | Server-only (order creation, webhook)   |
| `STRIPE_SECRET_KEY`                    |    ✓     | Server                                  |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`   |    ✓     | Browser (not currently used in UI)      |
| `STRIPE_WEBHOOK_SECRET`                |    ✓     | Webhook signature verification          |
| `STRIPE_PRICE_STARTER/GROWTH/SCALE`    |          | Optional — fallback to ad-hoc pricing   |
| `RESEND_API_KEY`                       |          | Optional — console-logs if missing      |
| `RESEND_FROM_EMAIL`                    |          | Optional — defaults to a placeholder    |
| `NEXT_PUBLIC_APP_URL`                  |          | Used in Stripe return + email URLs      |

## Database

Apply `supabase/migrations/0001_initial.sql` and `0002_storage.sql` via the
Supabase SQL editor (or `supabase db push`). This creates:

- `profiles`, `tenants`, `memberships`
- `categories`, `products` (with tsvector for full-text search)
- `orders`, `order_items`
- `reviews`
- Storage bucket `product-images` (public read, authenticated write)
- `is_tenant_member(t)` helper and all RLS policies

## Deployment

- **Vercel** is the recommended host (free tier, native Next.js). Point
  it at this repo, add the env vars above, and set the Stripe webhook
  endpoint to `https://<your-vercel-url>/api/stripe/webhook`.
- The `STRIPE_WEBHOOK_SECRET` must match whichever endpoint is sending
  events.

## Scripts

```
pnpm dev        # next dev with Turbopack
pnpm build      # production build
pnpm start      # start the production server
pnpm lint       # eslint
```
