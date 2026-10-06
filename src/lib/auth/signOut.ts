import { createClient } from "@/lib/supabase/client";
import { TIMED_OUT, withTimeout } from "@/lib/timeout";
import { clearSignInState } from "@/lib/auth/signIn";
import { resetAnonId, trackEvent } from "@/lib/events";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import { useSubscriptionStatusStore } from "@/store/useSubscriptionStatusStore";
import { usePriceAlertStore } from "@/store/usePriceAlertStore";
import { useDemandSignalsStore } from "@/store/useDemandSignalsStore";
import { useSubmissionsStore } from "@/store/useSubmissionsStore";

const EVENT_TIMEOUT_MS = 1500;
const SIGN_OUT_TIMEOUT_MS = 3000;

/** Removes this browser's Supabase session without asking the auth client:
 * the sb-<ref>-auth-token cookies (incl. chunked .0/.1 parts and the PKCE
 * code verifier; @supabase/ssr writes them readable by JS) and any legacy
 * sb-* localStorage keys. Used when auth.signOut() can't complete. */
function clearLocalAuthSession() {
  for (const part of document.cookie.split(";")) {
    const name = part.split("=")[0]?.trim();
    if (name && name.startsWith("sb-") && name.includes("-auth-token")) {
      document.cookie = `${name}=; Path=/; Max-Age=0`;
    }
  }
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("sb-")) localStorage.removeItem(key);
    }
  } catch {}
}

/** The one sign-out implementation. Leaves nothing of this user behind for
 * whoever uses the browser next, then reloads into "/" — a full page load
 * rather than a client-side push, so every in-memory store, in-flight
 * account sync and pending sign-in timer from this session is discarded
 * too, not just the parts listed here. */
export async function signOutAndReset(): Promise<void> {
  // Logged first, while the session (and so user_id) still exists — capped
  // so a slow insert can't hold up signing out.
  if ((await withTimeout(trackEvent("signout"), EVENT_TIMEOUT_MS)) === TIMED_OUT) {
    console.error(`[sign-out] signout event not sent within ${EVENT_TIMEOUT_MS}ms — continuing`);
  }

  // 'local' ends only this browser's session; the default ('global') would
  // also sign the user out on every other device. Capped: every Supabase
  // auth operation in a tab runs one at a time, so one that never settles
  // (e.g. a token refresh request that hangs) would otherwise leave
  // signOut() — and this whole sign-out — waiting forever. If it can't
  // finish, the local session is removed directly instead; sign-out
  // always completes.
  try {
    const result = await withTimeout(createClient().auth.signOut({ scope: "local" }), SIGN_OUT_TIMEOUT_MS);
    if (result === TIMED_OUT) {
      console.error(`[sign-out] auth.signOut() didn't finish within ${SIGN_OUT_TIMEOUT_MS}ms — clearing the local session directly`);
      clearLocalAuthSession();
    } else if (result.error) {
      console.error("[sign-out] auth.signOut() failed — clearing the local session directly:", result.error.message);
      clearLocalAuthSession();
    }
  } catch (e) {
    console.error("[sign-out] auth.signOut() threw — clearing the local session directly:", e);
    clearLocalAuthSession();
  }

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
