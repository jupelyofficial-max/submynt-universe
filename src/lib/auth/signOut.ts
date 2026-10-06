import { createClient } from "@/lib/supabase/client";
import { clearSignInState } from "@/lib/auth/signIn";
import { resetAnonId, trackEvent } from "@/lib/events";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import { useSubscriptionStatusStore } from "@/store/useSubscriptionStatusStore";
import { usePriceAlertStore } from "@/store/usePriceAlertStore";
import { useDemandSignalsStore } from "@/store/useDemandSignalsStore";
import { useSubmissionsStore } from "@/store/useSubmissionsStore";

/** The one sign-out implementation. Leaves nothing of this user behind for
 * whoever uses the browser next, then reloads into "/" — a full page load
 * rather than a client-side push, so every in-memory store, in-flight
 * account sync and pending sign-in timer from this session is discarded
 * too, not just the parts listed here. */
export async function signOutAndReset(): Promise<void> {
  // Logged first, while the session (and so user_id) still exists — capped
  // so a slow insert can't hold up signing out.
  await Promise.race([trackEvent("signout"), new Promise((resolve) => setTimeout(resolve, 1500))]);

  // 'local' ends only this browser's session; the default ('global') would
  // also sign the user out on every other device.
  const { error } = await createClient().auth.signOut({ scope: "local" });
  if (error) console.error("Sign-out failed:", error.message);

  clearSignInState();
  // Clears any items still held locally (e.g. adds made while the account
  // sync had failed) — they belong to this user and must never be migrated
  // into the next account that signs in here.
  useMySubscriptionsStore.getState().clearUser();
  // Saved statuses, price alerts, demand signals and listing submissions
  // are browser-local, not per-account — drop them with the user.
  for (const store of [useSubscriptionStatusStore, usePriceAlertStore, useDemandSignalsStore, useSubmissionsStore]) {
    store.persist.clearStorage();
  }
  resetAnonId();

  // Deliberately a full page load, not router.push — see above.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign("/");
}
