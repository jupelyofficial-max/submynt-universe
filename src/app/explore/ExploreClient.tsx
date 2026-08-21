"use client";

import dynamic from "next/dynamic";
import { SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { FilterSheet } from "@/components/filters/FilterSheet";
import { NebulaBackdrop } from "@/components/universe/NebulaBackdrop";
import { UniverseControls } from "@/components/universe/UniverseControls";
import { SearchBar } from "@/components/search/SearchBar";
import { ListView } from "@/components/views/ListView";
import { ViewSwitcher } from "@/components/views/ViewSwitcher";
import { useUniverseStore } from "@/store/useUniverseStore";

const UniverseScene = dynamic(
  () => import("@/components/universe/UniverseScene").then((m) => m.UniverseScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 items-center justify-center text-sm text-ink-400">
        Charting the universe…
      </div>
    ),
  }
);

export function ExploreClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const setSearchQuery = useUniverseStore((s) => s.setSearchQuery);
  const select = useUniverseStore((s) => s.select);
  const viewMode = useUniverseStore((s) => s.viewMode);
  const setFilterSheetOpen = useUniverseStore((s) => s.setFilterSheetOpen);
  const activeFilterCount = useUniverseStore((s) => s.activeFilterCount());

  useEffect(() => {
    const q = searchParams.get("q");
    const focus = searchParams.get("focus");
    if (q) setSearchQuery(q);
    if (focus) select(focus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={containerRef} className="relative flex flex-1 flex-col min-h-0 bg-void-950">
      {viewMode === "universe" && <NebulaBackdrop />}

      <div className="relative z-10 flex flex-1 flex-col min-h-0">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col items-center gap-3 p-4 lg:p-6">
          <div className="pointer-events-auto w-full max-w-2xl">
            <SearchBar compact={viewMode === "list"} />
          </div>
          <div className="pointer-events-auto flex items-center gap-2">
            <ViewSwitcher />
            <Button variant="secondary" size="md" className="relative" onClick={() => setFilterSheetOpen(true)}>
              <SlidersHorizontal size={15} />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-aurora-500 px-1 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {viewMode === "universe" ? (
          <div className="flex flex-1 min-h-0">
            <UniverseScene />
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pt-40">
            <ListView />
          </div>
        )}

        {viewMode === "universe" && (
          <div className="pointer-events-none absolute bottom-4 right-4 z-20 lg:bottom-6 lg:right-6">
            <UniverseControls containerRef={containerRef} />
          </div>
        )}
      </div>

      <FilterSheet />
    </div>
  );
}
