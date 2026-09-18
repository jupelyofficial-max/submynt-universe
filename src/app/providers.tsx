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

    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => useAuthStore.getState().setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => useAuthStore.getState().setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}
