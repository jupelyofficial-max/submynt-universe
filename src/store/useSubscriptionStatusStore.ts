import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SubscriptionStatus = "considering" | "trial" | "cancelled";

interface SubscriptionStatusState {
  statuses: Record<string, SubscriptionStatus>;
  hydrated: boolean;
  setHydrated: () => void;
  setStatus: (subscriptionId: string, status: SubscriptionStatus) => void;
  clearStatus: (subscriptionId: string) => void;
}

/**
 * A lightweight, independent "declared interest" signal — deliberately NOT
 * the same thing as useMySubscriptionsStore's real ownership (which drives
 * filters, sorting, renewal tracking, and the WebGL "has savings" badge).
 * Clicking a status here never assumes a purchase; "Currently subscribed"
 * in the picker is just this store's own status, not a write into the real
 * owned-subscriptions record. The beginning of a future management
 * experience, not a replacement for the existing one.
 */
export const useSubscriptionStatusStore = create<SubscriptionStatusState>()(
  persist(
    (set) => ({
      statuses: {},
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      setStatus: (subscriptionId, status) =>
        set((state) => ({ statuses: { ...state.statuses, [subscriptionId]: status } })),
      clearStatus: (subscriptionId) =>
        set((state) => {
          const next = { ...state.statuses };
          delete next[subscriptionId];
          return { statuses: next };
        }),
    }),
    {
      name: "submynt-subscription-status",
      skipHydration: true,
      partialize: (state) => ({ statuses: state.statuses }) as SubscriptionStatusState,
    }
  )
);
