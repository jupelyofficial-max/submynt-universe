import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BillingCycle, OwnedSubscription } from "@/types/subscription";

interface AddInput {
  subscriptionId: string;
  planName: string;
  priceMonthly: number;
  billing: BillingCycle;
  nextRenewal: string;
  /** Set true when this add is triggered by the top-of-panel Heart button
   * on a not-yet-owned subscription, so "keep" and "add" happen as one
   * action instead of a dead click. */
  kept?: boolean;
}

interface MySubscriptionsState {
  owned: OwnedSubscription[];
  hydrated: boolean;
  setHydrated: () => void;
  add: (input: AddInput) => void;
  remove: (ownedId: string) => void;
  toggleKept: (ownedId: string) => void;
  isOwned: (subscriptionId: string) => boolean;
  getOwned: (subscriptionId: string) => OwnedSubscription | undefined;
}

export const useMySubscriptionsStore = create<MySubscriptionsState>()(
  persist(
    (set, get) => ({
      owned: [],
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      add: (input) =>
        set((state) => ({
          owned: [
            ...state.owned.filter((o) => o.subscriptionId !== input.subscriptionId),
            {
              ownedId: `${input.subscriptionId}-${Date.now()}`,
              addedAt: new Date().toISOString(),
              ...input,
            },
          ],
        })),
      remove: (ownedId) => set((state) => ({ owned: state.owned.filter((o) => o.ownedId !== ownedId) })),
      toggleKept: (ownedId) =>
        set((state) => ({
          owned: state.owned.map((o) => (o.ownedId === ownedId ? { ...o, kept: !o.kept } : o)),
        })),
      isOwned: (subscriptionId) => get().owned.some((o) => o.subscriptionId === subscriptionId),
      getOwned: (subscriptionId) => get().owned.find((o) => o.subscriptionId === subscriptionId),
    }),
    {
      name: "submynt-my-subscriptions",
      skipHydration: true,
      partialize: (state) => ({ owned: state.owned }) as MySubscriptionsState,
    }
  )
);
