"use client";

import { useEffect } from "react";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import { useSubmissionsStore } from "@/store/useSubmissionsStore";
import { useSubscriptionStatusStore } from "@/store/useSubscriptionStatusStore";
import { usePriceAlertStore } from "@/store/usePriceAlertStore";
import { useDemandSignalsStore } from "@/store/useDemandSignalsStore";
import { useAuthStore } from "@/store/useAuthStore";
import { createClient } from "@/lib/supabase/client";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
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

  // Drives My Subscriptions between its two backends: signed in migrates
  // whatever's in localStorage up to Supabase and switches to it as the
  // source of truth; signed out drops back to a clean, localStorage-only
  // anonymous slate instead of leaving the previous account's list visible.
  useEffect(() => {
    if (!authHydrated || !subscriptionsHydrated) return;
    if (userId) {
      useMySubscriptionsStore.getState().syncToUser(userId);
    } else if (useMySubscriptionsStore.getState().userId) {
      useMySubscriptionsStore.getState().clearUser();
    }
  }, [userId, authHydrated, subscriptionsHydrated]);

  return <>{children}</>;
}
