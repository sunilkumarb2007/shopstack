import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// OAuth / magic-link callback. Exchanges the `code` param for a session.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next") ?? "/dashboard";
  // Open-redirect guard. A simple `startsWith('/')` check isn't enough because
  // the WHATWG URL parser normalises `\` to `/`, so `/%5Cevil.com` parses to
  // `http://evil.com/`. Parse against the request origin and only accept the
  // result if the resolved origin is unchanged — otherwise fall back to the
  // dashboard.
  let next = "/dashboard";
  try {
    const resolved = new URL(requestedNext, url);
    if (resolved.origin === url.origin) {
      next = resolved.pathname + resolved.search + resolved.hash;
    }
  } catch {
    // Malformed URL — keep the default.
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, url),
      );
    }
  }
  return NextResponse.redirect(new URL(next, url));
}
