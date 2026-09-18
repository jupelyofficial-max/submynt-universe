import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Refreshes the Supabase auth session cookie on every request. This is
 * `proxy.ts`, NOT `middleware.ts` — Next.js 16 deprecated and renamed the
 * middleware file convention to `proxy` (export name changed too); this
 * repo is on 16.3.1, so the file must be named and exported this way for
 * Next to pick it up at all. Functionally this is exactly what every
 * @supabase/ssr "middleware.ts" example does, just under the new name. */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Fail OPEN, not closed: this runs on every single request site-wide (see
  // matcher below), so a missing/misconfigured env var must never take the
  // whole app down — worst case here is a visitor's session just doesn't
  // get refreshed, not a 500 on every page.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // Touching getUser() is what actually triggers a token refresh when the
  // access token has expired — required, not just a read.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Exclude static assets and image optimization so the proxy doesn't run
  // (and doesn't need a cookie round-trip) on every icon/font/CSS request.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
