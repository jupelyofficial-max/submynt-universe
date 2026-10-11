"use client";

import { useEffect } from "react";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import { useSubmissionsStore } from "@/store/useSubmissionsStore";
import { useSubscriptionStatusStore } from "@/store/useSubscriptionStatusStore";
import { usePriceAlertStore } from "@/store/usePriceAlertStore";
import { useDemandSignalsStore } from "@/store/useDemandSignalsStore";
import { useAuthStore } from "@/store/useAuthStore";
import { createClient } from "@/lib/supabase/client";
import { consumeGateSignIn, consumeSignInSource } from "@/lib/auth/signIn";
import { trackEvent } from "@/lib/events";
import { captureFirstTouch } from "@/lib/attribution";

const LAST_VISIT_PREFIX = "submynt-last-visit:";
const VISIT_LOGGED_PREFIX = "submynt-visit-logged:";
const DAY_MS = 24 * 60 * 60 * 1000;

/** return_visit, at most once per browser session per signed-in user:
 * days since this user's previous page load in this browser. The very
 * first visit here only records the timestamp. Keyed by user id, so one
 * user's history is never attributed to another on a shared browser. */
function logReturnVisit(userId: string) {
  try {
    const now = Date.now();
    const last = Number(localStorage.getItem(LAST_VISIT_PREFIX + userId));
    localStorage.setItem(LAST_VISIT_PREFIX + userId, String(now));
    if (sessionStorage.getItem(VISIT_LOGGED_PREFIX + userId)) return;
    sessionStorage.setItem(VISIT_LOGGED_PREFIX + userId, "1");
    if (last > 0) trackEvent("return_visit", { days_since_last: Math.floor((now - last) / DAY_MS) });
  } catch {}
}

/** signin_completed for a sign-in this tab started (see signInWithGoogle),
 * once — the source marker is consumed here. New = the account was
 * created by this very sign-in. */
function logSignInCompleted() {
  const source = consumeSignInSource();
  if (!source) return;
  const user = useAuthStore.getState().user;
  const created = Date.parse(user?.created_at ?? "");
  const lastSignIn = Date.parse(user?.last_sign_in_at ?? "");
  const isNewUser = Number.isFinite(created) && Number.isFinite(lastSignIn) && Math.abs(lastSignIn - created) < 60_000;
  trackEvent("signin_completed", { source, is_new_user: isNewUser });
}

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    captureFirstTouch();

    // Awaited (unlike the other stores' fire-and-forget rehydrate calls
    // below) so any pre-sign-in localStorage items are actually loaded
    // into `owned` before the auth-driven sync effect can read them for
    // migration — otherwise a fast sign-in could race ahead of rehydrate
    // and migrate nothing.
    (async () => {
      await useMySubscriptionsStore.persist.rehydrate();
      useMySubscriptionsStore.getState().setHydrated();
    })();
    useSubmissionsStore.persist.rehydrate();
    useSubmissionsStore.getState().setHydrated();
    useSubscriptionStatusStore.persist.rehydrate();
    useSubscriptionStatusStore.getState().setHydrated();
    usePriceAlertStore.persist.rehydrate();
    usePriceAlertStore.getState().setHydrated();
    useDemandSignalsStore.persist.rehydrate();
    useDemandSignalsStore.getState().setHydrated();

    // /auth/callback sends a failed code exchange here as ?auth_error=1 —
    // otherwise a silent failure. Log it, surface it on the Sign In
    // button, and drop the param so a reload doesn't repeat it.
    const url = new URL(window.location.href);
    if (url.searchParams.has("auth_error")) {
      consumeSignInSource();
      trackEvent("signin_failed", { reason: "callback" });
      useAuthStore.getState().setSignInError("Sign-in didn't complete. Please try again.");
      url.searchParams.delete("auth_error");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }

    // Fail open, not closed: if the Supabase env vars aren't set (e.g. not
    // yet added to this deploy target), the rest of the app must still
    // render — auth just stays signed-out rather than crashing after
    // hydration. useAuthStore.hydrated flips true either way so UI never
    // hangs on a "checking session" state.
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      useAuthStore.getState().setSession(null);
      return;
    }

    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => useAuthStore.getState().setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => useAuthStore.getState().setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const userId = useAuthStore((s) => s.user?.id ?? null);
  const authHydrated = useAuthStore((s) => s.hydrated);
  const subscriptionsHydrated = useMySubscriptionsStore((s) => s.hydrated);

  // Drives My Subscriptions between its two backends: signed in merges
  // whatever's in localStorage into the account (see syncToUser — union,
  // account wins, local cleared once merged) and switches to Supabase as
  // the source of truth; signed out drops back to a clean, localStorage-
  // only anonymous slate instead of leaving the previous account's list
  // visible.
  useEffect(() => {
    if (!authHydrated || !subscriptionsHydrated) return;
    if (userId) {
      logSignInCompleted();
      logReturnVisit(userId);
      void useMySubscriptionsStore
        .getState()
        .syncToUser(userId)
        .then(() => {
          const gate = consumeGateSignIn();
          if (gate) trackEvent("signin_completed_from_gate", { action: gate.action });
        });
    } else {
      const subs = useMySubscriptionsStore.getState();
      if (subs.userId) subs.clearUser();
      else if (subs.syncFailed) useMySubscriptionsStore.setState({ syncFailed: false });
    }
  }, [userId, authHydrated, subscriptionsHydrated]);

  return <>{children}</>;
}
