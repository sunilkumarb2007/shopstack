function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. See .env.example`,
    );
  }
  return value;
}

export const env = {
  get SUPABASE_URL() {
    return required(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    );
  },
  get SUPABASE_ANON_KEY() {
    // Supabase renamed the anon key to "publishable key" in late 2024. We
    // accept either env var name for backward compatibility.
    return required(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
  },
  get SUPABASE_SERVICE_ROLE_KEY() {
    // Supabase renamed the service_role key to "secret key" (sb_secret_...)
    // in late 2024. We accept either env var name.
    return required(
      "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
        process.env.SUPABASE_SECRET_KEY,
    );
  },
  get STRIPE_SECRET_KEY() {
    return required("STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY);
  },
  get STRIPE_PUBLISHABLE_KEY() {
    return required(
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    );
  },
  get STRIPE_WEBHOOK_SECRET() {
    return required("STRIPE_WEBHOOK_SECRET", process.env.STRIPE_WEBHOOK_SECRET);
  },
  get RESEND_API_KEY() {
    return process.env.RESEND_API_KEY;
  },
  get RESEND_FROM_EMAIL() {
    return process.env.RESEND_FROM_EMAIL ?? "ShopStack <noreply@example.com>";
  },
  get APP_URL() {
    return (
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000")
    );
  },
};
