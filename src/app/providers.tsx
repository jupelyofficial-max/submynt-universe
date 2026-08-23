"use client";

import { useEffect } from "react";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import { useSubmissionsStore } from "@/store/useSubmissionsStore";
import { usePerksStore } from "@/store/usePerksStore";
import { useSubscriptionStatusStore } from "@/store/useSubscriptionStatusStore";
import { usePriceAlertStore } from "@/store/usePriceAlertStore";
import { useDemandSignalsStore } from "@/store/useDemandSignalsStore";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useMySubscriptionsStore.persist.rehydrate();
    useMySubscriptionsStore.getState().setHydrated();
    useSubmissionsStore.persist.rehydrate();
    useSubmissionsStore.getState().setHydrated();
    usePerksStore.persist.rehydrate();
    usePerksStore.getState().setHydrated();
    useSubscriptionStatusStore.persist.rehydrate();
    useSubscriptionStatusStore.getState().setHydrated();
    usePriceAlertStore.persist.rehydrate();
    usePriceAlertStore.getState().setHydrated();
    useDemandSignalsStore.persist.rehydrate();
    useDemandSignalsStore.getState().setHydrated();
  }, []);

  return <>{children}</>;
}
