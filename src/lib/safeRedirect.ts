/** Validates a `next` redirect target is an internal relative path before
 * it's trusted for a client or server redirect — used by both
 * app/auth/callback/route.ts (server) and OnboardingClient.tsx (client),
 * since /onboarding?next=... is directly reachable on its own, not just
 * via the callback route.
 *
 * Rejects anything that isn't a bare "/"-prefixed path: "//evil.com"
 * (protocol-relative — browsers/Next's router treat this as a same-scheme
 * redirect to a *different host*), "/\evil.com" (a backslash some
 * browsers normalize into a second slash, same risk), and any absolute
 * URL (a different scheme/host outright). */
export function sanitizeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return "/explore";
  }
  return next;
}
