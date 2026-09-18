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
    useMySubscriptionsStore.persist.rehydrate();
    useMySubscriptionsStore.getState().setHydrated();
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

  return <>{children}</>;
}
