"use client";

import { useEffect } from "react";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import { useSubmissionsStore } from "@/store/useSubmissionsStore";
import { useSubscriptionStatusStore } from "@/store/useSubscriptionStatusStore";
import { usePriceAlertStore } from "@/store/usePriceAlertStore";
import { useDemandSignalsStore } from "@/store/useDemandSignalsStore";
import { useProfileSubmissionStore } from "@/store/useProfileSubmissionStore";

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
    useProfileSubmissionStore.persist.rehydrate();
    useProfileSubmissionStore.getState().setHydrated();
  }, []);

  return <>{children}</>;
}
