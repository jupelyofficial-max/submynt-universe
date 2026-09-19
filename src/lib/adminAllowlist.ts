/** Server-only admin allowlist — a hardcoded array rather than an
 * is_admin column in `profiles`, on purpose:
 *   - No DB migration or grants/RLS surface to get wrong (this project has
 *     twice this session shipped with `profiles` access silently broken
 *     from a missed grant — an admin gate has no room for that failure
 *     mode: wrong-by-default there means "nobody is admin", not "everyone
 *     is").
 *   - A column is data a future bug (a bad default, a stray upsert, a
 *     client-side write path) could flip; this can only change via a
 *     code review and a deploy.
 *   - One admin today. If this grows into several admins with real
 *     turnover, that's the point to reconsider a table — not before.
 *
 * Only ever imported from server-only modules (Server Components, Route
 * Handlers) — never from a "use client" file, so this list (and the fact
 * that it's a single hardcoded address) never reaches the client bundle. */
const ADMIN_EMAILS = ["jupely.official@gmail.com"];

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}
