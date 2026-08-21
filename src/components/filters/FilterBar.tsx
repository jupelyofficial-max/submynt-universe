"use client";

import { FilterDropdown } from "./FilterDropdown";
import { CATEGORIES, PRICE_BANDS, SORT_LABELS, SORT_OPTIONS, USER_STATUS_LABELS } from "@/data/categories";
import { cn } from "@/lib/utils";
import { useUniverseStore } from "@/store/useUniverseStore";
import type { UserStatusFilter } from "@/types/subscription";

const USER_STATUS_OPTIONS = Object.keys(USER_STATUS_LABELS) as UserStatusFilter[];

export function FilterBar({ className }: { className?: string }) {
  const filters = useUniverseStore((s) => s.filters);
  const toggleCategory = useUniverseStore((s) => s.toggleCategory);
  const togglePriceBand = useUniverseStore((s) => s.togglePriceBand);
  const toggleUserStatus = useUniverseStore((s) => s.toggleUserStatus);
  const setCategories = useUniverseStore((s) => s.setCategories);
  const setPriceBands = useUniverseStore((s) => s.setPriceBands);
  const setUserStatus = useUniverseStore((s) => s.setUserStatus);
  const setSort = useUniverseStore((s) => s.setSort);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <FilterDropdown
        label="Categories"
        options={CATEGORIES.map((c) => ({ value: c, label: c }))}
        selected={filters.categories}
        onToggle={toggleCategory}
        onClear={() => setCategories([])}
      />
      <FilterDropdown
        label="Price"
        options={PRICE_BANDS.map((band) => ({ value: band.id, label: band.label }))}
        selected={filters.priceBands}
        onToggle={togglePriceBand}
        onClear={() => setPriceBands([])}
      />
      <FilterDropdown
        label="Sort"
        options={SORT_OPTIONS.map((opt) => ({ value: opt, label: SORT_LABELS[opt] }))}
        selected={[filters.sort]}
        onToggle={setSort}
      />
      <FilterDropdown
        label="Status"
        options={USER_STATUS_OPTIONS.map((u) => ({ value: u, label: USER_STATUS_LABELS[u] }))}
        selected={filters.userStatus}
        onToggle={toggleUserStatus}
        onClear={() => setUserStatus([])}
      />
    </div>
  );
}
