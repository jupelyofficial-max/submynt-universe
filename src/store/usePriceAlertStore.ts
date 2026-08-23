import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PriceAlertState {
  enabled: Record<string, boolean>;
  hydrated: boolean;
  setHydrated: () => void;
  toggle: (subscriptionId: string) => void;
}

/**
 * Pure UI/state placeholder — no backend exists to actually watch prices or
 * send a notification, so this only ever flips local persisted state. The
 * toggle's own label is the only feedback; nothing here should ever claim a
 * notification was scheduled or sent.
 */
export const usePriceAlertStore = create<PriceAlertState>()(
  persist(
    (set) => ({
      enabled: {},
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      toggle: (subscriptionId) =>
        set((state) => ({ enabled: { ...state.enabled, [subscriptionId]: !state.enabled[subscriptionId] } })),
    }),
    {
      name: "submynt-price-alerts",
      skipHydration: true,
      partialize: (state) => ({ enabled: state.enabled }) as PriceAlertState,
    }
  )
);
