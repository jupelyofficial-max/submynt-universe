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

  selectedId: string | null;
  select: (id: string | null) => void;

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

  selectedId: null,
  select: (id) => set({ selectedId: id }),

  compareIds: [],
  addToCompare: (id) => set((s) => (s.compareIds.includes(id) || s.compareIds.length >= 3 ? s : { compareIds: [...s.compareIds, id] })),
  removeFromCompare: (id) => set((s) => ({ compareIds: s.compareIds.filter((c) => c !== id) })),
  clearCompare: () => set({ compareIds: [] }),

  discoverMode: false,
  setDiscoverMode: (v) => set({ discoverMode: v }),
}));
