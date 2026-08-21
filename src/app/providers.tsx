"use client";

import { useEffect } from "react";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import { useSubmissionsStore } from "@/store/useSubmissionsStore";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useMySubscriptionsStore.persist.rehydrate();
    useMySubscriptionsStore.getState().setHydrated();
    useSubmissionsStore.persist.rehydrate();
    useSubmissionsStore.getState().setHydrated();
  }, []);

  return <>{children}</>;
}
