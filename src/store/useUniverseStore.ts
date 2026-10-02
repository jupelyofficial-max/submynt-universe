import { create } from "zustand";
import type { Category, FilterState, SortOption, UserStatusFilter } from "@/types/subscription";

const EMPTY_FILTERS: FilterState = {
  categories: [],
  billing: [],
  priceBands: [],
  userStatus: [],
  regions: [],
  sort: "popular",
};

function toggleInArray<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export type DetailTab = "overview" | "plans" | "alternatives";

interface UniverseUIState {
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  filters: FilterState;
  toggleCategory: (c: Category) => void;
  togglePriceBand: (id: string) => void;
  toggleUserStatus: (u: UserStatusFilter) => void;
  setCategories: (c: Category[]) => void;
  setPriceBands: (p: string[]) => void;
  setSort: (s: SortOption) => void;

  isSubmitModalOpen: boolean;
  setSubmitModalOpen: (v: boolean) => void;

  /** The "Track Subscriptions" onboarding/bulk-add flow. `preselectId`
   * lets a single-subscription entry point (e.g. Saved subscriptions'
   * "I have this" button) open the modal with that one service already
   * selected, skipping straight to the details step. */
  isAddSubscriptionsModalOpen: boolean;
  addSubscriptionsPreselectId: string | null;
  /** True when this open should start at the bundle-first "pick your
   * bundles" step instead of the normal welcome/select flow — the empty
   * state's primary CTA uses this; the modal's own "Add from a bundle"
   * button inside the normal flow reaches the same step without this. */
  addSubscriptionsStartAtBundlePick: boolean;
  setAddSubscriptionsModalOpen: (v: boolean, preselectId?: string | null, startAtBundlePick?: boolean) => void;

  selectedId: string | null;
  select: (id: string | null) => void;

  /** Deep-links DetailPanel to a specific tab on open (e.g. Sprint 4's
   * "Explore Alternative" CTA landing directly on Alternatives instead of
   * Overview) — reuses the existing panel/tabs rather than a new view.
   * DetailPanel consumes and clears this once it applies it. */
  pendingDetailTab: DetailTab | null;
  selectWithTab: (id: string, tab: DetailTab) => void;
  clearPendingDetailTab: () => void;

  compareIds: string[];
  addToCompare: (id: string) => void;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;

  discoverMode: boolean;
  setDiscoverMode: (v: boolean) => void;
}

export const useUniverseStore = create<UniverseUIState>()((set) => ({
  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),

  filters: EMPTY_FILTERS,
  toggleCategory: (c) =>
    set((s) => ({ filters: { ...s.filters, categories: toggleInArray(s.filters.categories, c) } })),
  togglePriceBand: (id) =>
    set((s) => ({ filters: { ...s.filters, priceBands: toggleInArray(s.filters.priceBands, id) } })),
  toggleUserStatus: (u) =>
    set((s) => ({ filters: { ...s.filters, userStatus: toggleInArray(s.filters.userStatus, u) } })),
  setCategories: (categories) => set((s) => ({ filters: { ...s.filters, categories } })),
  setPriceBands: (priceBands) => set((s) => ({ filters: { ...s.filters, priceBands } })),
  setSort: (sort) => set((s) => ({ filters: { ...s.filters, sort } })),

  isSubmitModalOpen: false,
  setSubmitModalOpen: (v) => set({ isSubmitModalOpen: v }),

  isAddSubscriptionsModalOpen: false,
  addSubscriptionsPreselectId: null,
  addSubscriptionsStartAtBundlePick: false,
  setAddSubscriptionsModalOpen: (v, preselectId = null, startAtBundlePick = false) =>
    set({
      isAddSubscriptionsModalOpen: v,
      addSubscriptionsPreselectId: v ? preselectId : null,
      addSubscriptionsStartAtBundlePick: v ? startAtBundlePick : false,
    }),

  selectedId: null,
  select: (id) => set({ selectedId: id }),

  pendingDetailTab: null,
  selectWithTab: (id, tab) => set({ selectedId: id, pendingDetailTab: tab }),
  clearPendingDetailTab: () => set({ pendingDetailTab: null }),

  compareIds: [],
  addToCompare: (id) => set((s) => (s.compareIds.includes(id) || s.compareIds.length >= 3 ? s : { compareIds: [...s.compareIds, id] })),
  removeFromCompare: (id) => set((s) => ({ compareIds: s.compareIds.filter((c) => c !== id) })),
  clearCompare: () => set({ compareIds: [] }),

  discoverMode: false,
  setDiscoverMode: (v) => set({ discoverMode: v }),
}));
