import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/events";

// Table from supabase/bundle_interest.sql. Every call fails gracefully —
// a missing table (SQL not run yet) or a network error only logs a console
// warning; the caller just leaves the button as it was.

/** Whether this user already asked to be notified about this bundle. */
export async function hasBundleInterest(userId: string, bundleSlug: string): Promise<boolean> {
  try {
    const { data, error } = await createClient()
      .from("bundle_interest")
      .select("id")
      .eq("user_id", userId)
      .eq("bundle_slug", bundleSlug)
      .maybeSingle();
    if (error) {
      console.warn(`bundle_interest: lookup failed (${error.message})`);
      return false;
    }
    return Boolean(data);
  } catch (e) {
    console.warn("bundle_interest: lookup failed", e);
    return false;
  }
}

/** Records interest (idempotent — a repeat is a no-op) and logs
 * bundle_interest once it's saved. Returns whether it was saved. */
export async function registerBundleInterest(userId: string, bundleSlug: string): Promise<boolean> {
  try {
    const { error } = await createClient()
      .from("bundle_interest")
      .upsert({ user_id: userId, bundle_slug: bundleSlug }, { onConflict: "user_id,bundle_slug", ignoreDuplicates: true });
    if (error) {
      console.warn(`bundle_interest: not saved (${error.message})`);
      return false;
    }
    trackEvent("bundle_interest", { bundle_slug: bundleSlug, source: "bundle_page" });
    return true;
  } catch (e) {
    console.warn("bundle_interest: not saved", e);
    return false;
  }
}
