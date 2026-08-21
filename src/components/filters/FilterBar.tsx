"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FilterDropdown } from "./FilterDropdown";
import { BILLING_LABELS, BILLING_OPTIONS, CATEGORIES, REGION_OPTIONS, USER_STATUS_LABELS } from "@/data/categories";
import { cn } from "@/lib/utils";
import { useUniverseStore } from "@/store/useUniverseStore";
import type { UserStatusFilter } from "@/types/subscription";

const USER_STATUS_OPTIONS = Object.keys(USER_STATUS_LABELS) as UserStatusFilter[];

export function FilterBar({ className }: { className?: string }) {
  const filters = useUniverseStore((s) => s.filters);
  const toggleCategory = useUniverseStore((s) => s.toggleCategory);
  const toggleBilling = useUniverseStore((s) => s.toggleBilling);
  const toggleRegion = useUniverseStore((s) => s.toggleRegion);
  const toggleUserStatus = useUniverseStore((s) => s.toggleUserStatus);
  const setCategories = useUniverseStore((s) => s.setCategories);
  const setBilling = useUniverseStore((s) => s.setBilling);
  const setRegions = useUniverseStore((s) => s.setRegions);
  const setUserStatus = useUniverseStore((s) => s.setUserStatus);
  const setFilterSheetOpen = useUniverseStore((s) => s.setFilterSheetOpen);
  const moreCount = filters.priceBands.length;

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
        label="Regions"
        options={REGION_OPTIONS.map((r) => ({ value: r, label: r }))}
        selected={filters.regions}
        onToggle={toggleRegion}
        onClear={() => setRegions([])}
      />
      <FilterDropdown
        label="Cost type"
        options={BILLING_OPTIONS.map((b) => ({ value: b, label: BILLING_LABELS[b] }))}
        selected={filters.billing}
        onToggle={toggleBilling}
        onClear={() => setBilling([])}
      />
      <FilterDropdown
        label="Status"
        options={USER_STATUS_OPTIONS.map((u) => ({ value: u, label: USER_STATUS_LABELS[u] }))}
        selected={filters.userStatus}
        onToggle={toggleUserStatus}
        onClear={() => setUserStatus([])}
      />
      <Button variant="secondary" size="md" className="relative rounded-full" onClick={() => setFilterSheetOpen(true)}>
        <SlidersHorizontal size={14} />
        More
        {moreCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-aurora-500 px-1 text-[10px] font-bold text-white">
            {moreCount}
          </span>
        )}
      </Button>
    </div>
  );
}
