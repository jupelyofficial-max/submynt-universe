import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeNextPath } from "@/lib/safeRedirect";
import { POST_SIGNIN_COOKIE } from "@/lib/auth/constants";

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) {
      try {
        return decodeURIComponent(rest.join("="));
      } catch {
        return null;
      }
    }
  }
  return null;
}

function redirectClearingCookie(url: string): NextResponse {
  const response = NextResponse.redirect(url);
  response.cookies.set(POST_SIGNIN_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}

/** OAuth callback — Supabase redirects here with a `code` param after
 * Google sends the user back. Sets the auth cookies via the server
 * client's cookie adapter, then routes first-time users to the optional
 * demographic step and everyone else back to where they came from (or
 * /explore by default). */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // An explicit ?next= wins; otherwise fall back to the target a Track
  // Subscriptions sign-in left in a short-lived cookie (see
  // lib/auth/constants.ts). Both go through the same sanitizer.
  const cookieNext = readCookie(request.headers.get("cookie"), POST_SIGNIN_COOKIE);
  const next = sanitizeNextPath(searchParams.get("next") ?? cookieNext);

  if (!code) {
    return redirectClearingCookie(`${origin}/explore`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    // Logged server-side for diagnosis — not exposed to the client via the
    // redirect URL, which would leak internal Supabase error details.
    console.error("auth callback: exchangeCodeForSession failed", error?.message ?? "no user in exchange response");
    return redirectClearingCookie(`${origin}/explore?auth_error=1`);
  }

  // First login = no profiles row with a name yet for this user_id (the
  // FK to auth.users didn't exist for legacy rows, but new rows created
  // by this flow always use the real auth.uid() — see Phase 2 SQL).
  const { data: profile } = await supabase.from("profiles").select("name").eq("user_id", data.user.id).maybeSingle();

  if (!profile?.name) {
    return redirectClearingCookie(`${origin}/onboarding?next=${encodeURIComponent(next)}`);
  }

  return redirectClearingCookie(`${origin}${next}`);
}
