import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeNextPath } from "@/lib/safeRedirect";

/** OAuth callback — Supabase redirects here with a `code` param after
 * Google sends the user back. Sets the auth cookies via the server
 * client's cookie adapter, then routes first-time users to the optional
 * demographic step and everyone else back to where they came from (or
 * /explore by default). */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeNextPath(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}/explore`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    // Logged server-side for diagnosis — not exposed to the client via the
    // redirect URL, which would leak internal Supabase error details.
    console.error("auth callback: exchangeCodeForSession failed", error?.message ?? "no user in exchange response");
    return NextResponse.redirect(`${origin}/explore?auth_error=1`);
  }

  // First login = no profiles row with a name yet for this user_id (the
  // FK to auth.users didn't exist for legacy rows, but new rows created
  // by this flow always use the real auth.uid() — see Phase 2 SQL).
  const { data: profile } = await supabase.from("profiles").select("name").eq("user_id", data.user.id).maybeSingle();

  if (!profile?.name) {
    return NextResponse.redirect(`${origin}/onboarding?next=${encodeURIComponent(next)}`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
