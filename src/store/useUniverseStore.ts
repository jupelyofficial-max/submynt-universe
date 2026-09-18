import { create } from "zustand";
import type { Category, FilterState, SortOption, UserStatusFilter } from "@/types/subscription";

export type ViewMode = "universe" | "list";

/** "everyday" = every category except PREMIUM_CATEGORIES (data/categories.ts);
 * "premium" = only those. Single source of truth every catalog-consuming
 * view/component reads from the store, rather than each computing its own
 * notion of what's currently visible. */
export type CatalogMode = "everyday" | "premium";

export type CameraCommand =
  | { type: "reset" }
  | { type: "focus-node"; id: string }
  | { type: "focus-mine" }
  | { type: "discover" };

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

  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;

  /** Defaults to "everyday" — Premium is opt-in, never the default view. */
  catalogMode: CatalogMode;
  setCatalogMode: (m: CatalogMode) => void;

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
  hoveredId: string | null;
  setHovered: (id: string | null) => void;

  /** Category currently under the pointer (via a category label) — used to
   * illuminate its constellation and dim unrelated ones in the universe. */
  hoveredCategory: string | null;
  setHoveredCategory: (c: string | null) => void;

  compareIds: string[];
  addToCompare: (id: string) => void;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;

  discoverMode: boolean;
  setDiscoverMode: (v: boolean) => void;

  cameraCommand: (CameraCommand & { nonce: number }) | null;
  sendCameraCommand: (cmd: CameraCommand) => void;
}

export const useUniverseStore = create<UniverseUIState>()((set) => ({
  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),

  viewMode: "universe",
  setViewMode: (v) => set({ viewMode: v }),

  catalogMode: "everyday",
  // Clears any selected category filter on switch — a stale Everyday
  // category (e.g. "Music") left selected while switching to Premium would
  // otherwise silently filter the whole catalog down to zero results.
  setCatalogMode: (m) => set((s) => ({ catalogMode: m, filters: { ...s.filters, categories: [] } })),

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
  hoveredId: null,
  setHovered: (id) => set({ hoveredId: id }),

  hoveredCategory: null,
  setHoveredCategory: (c) => set({ hoveredCategory: c }),

  compareIds: [],
  addToCompare: (id) => set((s) => (s.compareIds.includes(id) || s.compareIds.length >= 3 ? s : { compareIds: [...s.compareIds, id] })),
  removeFromCompare: (id) => set((s) => ({ compareIds: s.compareIds.filter((c) => c !== id) })),
  clearCompare: () => set({ compareIds: [] }),

  discoverMode: false,
  setDiscoverMode: (v) => set({ discoverMode: v }),

  cameraCommand: null,
  sendCameraCommand: (cmd) =>
    set((s) => ({ cameraCommand: { ...cmd, nonce: (s.cameraCommand?.nonce ?? 0) + 1 } })),
}));
