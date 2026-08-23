import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DemandCounters {
  views: number;
  comparisons: number;
  clickThroughs: number;
}

type DemandKind = keyof DemandCounters;

interface DemandSignalsState {
  bySubscription: Record<string, DemandCounters>;
  hydrated: boolean;
  setHydrated: () => void;
  record: (subscriptionId: string, kind: DemandKind) => void;
}

const EMPTY_COUNTERS: DemandCounters = { views: 0, comparisons: 0, clickThroughs: 0 };

/**
 * Anonymous, per-subscription aggregate counters only — never keyed by user
 * or containing any personal/identifying data. This is a local stand-in for
 * what would eventually be server-side aggregate demand intelligence (item
 * 27): total views, comparison activity, and click-throughs per
 * subscription, the kind of category/product-level signal a vendor
 * dashboard could show without exposing anything about who generated it.
 */
export const useDemandSignalsStore = create<DemandSignalsState>()(
  persist(
    (set) => ({
      bySubscription: {},
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      record: (subscriptionId, kind) =>
        set((state) => {
          const current = state.bySubscription[subscriptionId] ?? EMPTY_COUNTERS;
          return {
            bySubscription: {
              ...state.bySubscription,
              [subscriptionId]: { ...current, [kind]: current[kind] + 1 },
            },
          };
        }),
    }),
    {
      name: "submynt-demand-signals",
      skipHydration: true,
      partialize: (state) => ({ bySubscription: state.bySubscription }) as DemandSignalsState,
    }
  )
);
