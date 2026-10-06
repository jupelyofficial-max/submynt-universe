import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/events";
import { TIMED_OUT, withTimeout } from "@/lib/timeout";

// Table from supabase/bundle_interest.sql. Every call fails gracefully and
// visibly: a missing table, a network error or a request stuck behind a
// stalled auth client (see signOut.ts) logs console.error and returns false
// within REQUEST_TIMEOUT_MS, so the button never stays stuck.
const REQUEST_TIMEOUT_MS = 8000;

/** Whether this user already asked to be notified about this bundle. */
export async function hasBundleInterest(userId: string, bundleSlug: string): Promise<boolean> {
  try {
    const result = await withTimeout(
      createClient().from("bundle_interest").select("id").eq("user_id", userId).eq("bundle_slug", bundleSlug).maybeSingle(),
      REQUEST_TIMEOUT_MS
    );
    if (result === TIMED_OUT) {
      console.error(`[bundle_interest] lookup for "${bundleSlug}" didn't finish within ${REQUEST_TIMEOUT_MS}ms`);
      return false;
    }
    if (result.error) {
      console.error(`[bundle_interest] lookup for "${bundleSlug}" failed: ${result.error.message}`);
      return false;
    }
    return Boolean(result.data);
  } catch (e) {
    console.error(`[bundle_interest] lookup for "${bundleSlug}" threw:`, e);
    return false;
  }
}

/** Records interest (idempotent — a repeat is a no-op) and logs
 * bundle_interest once it's saved. Returns whether it was saved. */
export async function registerBundleInterest(userId: string, bundleSlug: string): Promise<boolean> {
  try {
    const result = await withTimeout(
      createClient()
        .from("bundle_interest")
        .upsert({ user_id: userId, bundle_slug: bundleSlug }, { onConflict: "user_id,bundle_slug", ignoreDuplicates: true }),
      REQUEST_TIMEOUT_MS
    );
    if (result === TIMED_OUT) {
      console.error(`[bundle_interest] save for "${bundleSlug}" didn't finish within ${REQUEST_TIMEOUT_MS}ms`);
      return false;
    }
    if (result.error) {
      console.error(`[bundle_interest] save for "${bundleSlug}" failed: ${result.error.message}`);
      return false;
    }
    trackEvent("bundle_interest", { bundle_slug: bundleSlug, source: "bundle_page" });
    return true;
  } catch (e) {
    console.error(`[bundle_interest] save for "${bundleSlug}" threw:`, e);
    return false;
  }
}

/** The bundle slugs this user is interested in, newest first — or null if
 * the lookup failed (callers then show nothing rather than a wrong list). */
export async function listBundleInterests(userId: string): Promise<string[] | null> {
  try {
    const result = await withTimeout(
      createClient().from("bundle_interest").select("bundle_slug").eq("user_id", userId).order("created_at", { ascending: false }),
      REQUEST_TIMEOUT_MS
    );
    if (result === TIMED_OUT) {
      console.error(`[bundle_interest] list didn't finish within ${REQUEST_TIMEOUT_MS}ms`);
      return null;
    }
    if (result.error) {
      console.error(`[bundle_interest] list failed: ${result.error.message}`);
      return null;
    }
    return (result.data ?? []).map((row) => row.bundle_slug as string);
  } catch (e) {
    console.error("[bundle_interest] list threw:", e);
    return null;
  }
}

/** Deletes this user's interest in a bundle and logs bundle_interest_removed.
 * Returns true only if a row was actually deleted: under RLS a delete with
 * no matching policy "succeeds" while deleting nothing, so the deleted rows
 * are read back and an empty result counts as a failure. */
export async function removeBundleInterest(userId: string, bundleSlug: string): Promise<boolean> {
  try {
    const result = await withTimeout(
      createClient().from("bundle_interest").delete().eq("user_id", userId).eq("bundle_slug", bundleSlug).select("id"),
      REQUEST_TIMEOUT_MS
    );
    if (result === TIMED_OUT) {
      console.error(`[bundle_interest] remove for "${bundleSlug}" didn't finish within ${REQUEST_TIMEOUT_MS}ms`);
      return false;
    }
    if (result.error) {
      console.error(`[bundle_interest] remove for "${bundleSlug}" failed: ${result.error.message}`);
      return false;
    }
    if (!result.data || result.data.length === 0) {
      console.error(
        `[bundle_interest] remove for "${bundleSlug}" deleted nothing — is the delete policy (supabase/bundle_interest_delete.sql) in place?`
      );
      return false;
    }
    trackEvent("bundle_interest_removed", { bundle_slug: bundleSlug, source: "saved" });
    return true;
  } catch (e) {
    console.error(`[bundle_interest] remove for "${bundleSlug}" threw:`, e);
    return false;
  }
}
