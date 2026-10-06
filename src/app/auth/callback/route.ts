import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
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

const LEGACY_FIELDS = "name,age,gender,location,profession,contact_number";
// Each legacy-prefill request gets this long before sign-in moves on
// without it (straight to onboarding, as before this feature).
const LEGACY_TIMEOUT_MS = 2500;

type LegacyProfile = {
  name: string;
  age: number | null;
  gender: string | null;
  location: string | null;
  profession: string | null;
  contact_number: string | null;
};

/** The email Google itself verified for this sign-in, lowercased — null
 * unless the account has a Google identity whose verified email is the
 * account's email. Deliberately not user_metadata.email_verified: the
 * project's email/password sign-up auto-confirms, so that flag would let
 * anyone claim a legacy profile by signing up with someone else's email. */
function googleVerifiedEmail(user: User): string | null {
  const google = user.identities?.find((i) => i.provider === "google");
  const email = typeof google?.identity_data?.email === "string" ? google.identity_data.email.trim().toLowerCase() : "";
  if (!email || google?.identity_data?.email_verified !== true) return null;
  return email === (user.email ?? "").trim().toLowerCase() ? email : null;
}

/** A pre-Google profile row with this email, most recent first. Read with
 * the service role — RLS hides rows of other user_ids — server-side only,
 * and only these profile fields come back; nothing here reaches the client
 * except as this user's own new profile. Never modifies the legacy row. */
async function findLegacyProfile(email: string, excludeUserId: string): Promise<LegacyProfile | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // PostgREST treats * as a wildcard and there's no way to escape it.
  if (!url || !key || email.includes("*")) return null;
  // ilike for a case-insensitive match, with its own wildcards escaped so
  // it's still an exact match (emails often contain "_").
  const exact = email.replace(/[\\%_]/g, (c) => `\\${c}`);
  const params = new URLSearchParams({
    select: LEGACY_FIELDS,
    email: `ilike.${exact}`,
    user_id: `neq.${excludeUserId}`,
    name: "not.is.null",
    order: "updated_at.desc",
    limit: "1",
  });
  try {
    const res = await fetch(`${url}/rest/v1/profiles?${params}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(LEGACY_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as LegacyProfile[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/** First Google sign-in of someone who already had a profile before the
 * move to Google sign-in: give the new account a copy of it (insert only —
 * never overwrites, and the legacy row is left untouched) so they're
 * treated as returning instead of facing a blank onboarding form. Written
 * as the user themselves (RLS), not with the service role. */
async function adoptLegacyProfile(supabase: Awaited<ReturnType<typeof createClient>>, user: User): Promise<boolean> {
  const email = googleVerifiedEmail(user);
  if (!email) return false;
  const legacy = await findLegacyProfile(email, user.id);
  if (!legacy) return false;
  const { error } = await supabase
    .from("profiles")
    .insert({ user_id: user.id, email: user.email, ...legacy })
    .abortSignal(AbortSignal.timeout(LEGACY_TIMEOUT_MS));
  if (error) console.error("auth callback: copying legacy profile failed", error.message);
  return !error;
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
    // Best effort only: any failure here (lookup/insert error, timeout,
    // anything thrown) falls through to the normal onboarding redirect —
    // it must never block sign-in or surface an error.
    let adopted = false;
    if (!profile) {
      try {
        adopted = await adoptLegacyProfile(supabase, data.user);
      } catch (e) {
        console.error("auth callback: legacy profile prefill skipped", e instanceof Error ? e.message : e);
      }
    }
    if (adopted) return redirectClearingCookie(`${origin}${next}`);
    return redirectClearingCookie(`${origin}/onboarding?next=${encodeURIComponent(next)}`);
  }

  return redirectClearingCookie(`${origin}${next}`);
}
