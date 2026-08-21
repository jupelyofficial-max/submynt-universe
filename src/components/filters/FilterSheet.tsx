"use client";

import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { Button } from "@/components/ui/Button";
import { FilterControls } from "./FilterControls";
import { useUniverseStore } from "@/store/useUniverseStore";

export function FilterSheet() {
  const isOpen = useUniverseStore((s) => s.isFilterSheetOpen);
  const setOpen = useUniverseStore((s) => s.setFilterSheetOpen);
  const clearFilters = useUniverseStore((s) => s.clearFilters);
  const activeFilterCount = useUniverseStore((s) => s.activeFilterCount());

  return (
    <ResponsiveSheet open={isOpen} onClose={() => setOpen(false)} title="Filters" desktopVariant="side">
      <FilterControls />
      <div className="sticky bottom-0 flex gap-2 border-t border-line-soft bg-void-900/90 px-5 py-4 backdrop-blur">
        <Button variant="outline" className="flex-1" onClick={clearFilters} disabled={activeFilterCount === 0}>
          Clear Filters
        </Button>
        <Button className="flex-1" onClick={() => setOpen(false)}>
          Apply Filters
        </Button>
      </div>
    </ResponsiveSheet>
  );
}
