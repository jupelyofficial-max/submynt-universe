"use client";

import { FilterDropdown } from "./FilterDropdown";
import { CATEGORIES, PRICE_BANDS, SORT_LABELS, SORT_OPTIONS } from "@/data/categories";
import { cn } from "@/lib/utils";
import { useUniverseStore } from "@/store/useUniverseStore";

// Split out so the mobile toolbar can place Sort ("Popular" etc.) in a
// different row than Categories/Price without duplicating the dropdown wiring.
export function SortDropdown() {
  const sort = useUniverseStore((s) => s.filters.sort);
  const setSort = useUniverseStore((s) => s.setSort);

  return (
    <FilterDropdown
      label="Sort"
      options={SORT_OPTIONS.map((opt) => ({ value: opt, label: SORT_LABELS[opt] }))}
      selected={[sort]}
      onToggle={setSort}
    />
  );
}

export function FilterBar({ className, hideSort }: { className?: string; hideSort?: boolean }) {
  const filters = useUniverseStore((s) => s.filters);
  const toggleCategory = useUniverseStore((s) => s.toggleCategory);
  const togglePriceBand = useUniverseStore((s) => s.togglePriceBand);
  const setCategories = useUniverseStore((s) => s.setCategories);
  const setPriceBands = useUniverseStore((s) => s.setPriceBands);

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
      {!hideSort && <SortDropdown />}
    </div>
  );
}
