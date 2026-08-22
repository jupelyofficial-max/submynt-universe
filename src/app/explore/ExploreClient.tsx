"use client";

import dynamic from "next/dynamic";
import { Rocket, Upload } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { FilterBar } from "@/components/filters/FilterBar";
import { BoostModal } from "@/components/submissions/BoostModal";
import { SubmitListingModal } from "@/components/submissions/SubmitListingModal";
import { NebulaBackdrop } from "@/components/universe/NebulaBackdrop";
import { SponsoredStrip } from "@/components/universe/SponsoredStrip";
import { UniverseControls } from "@/components/universe/UniverseControls";
import { EcosystemStats } from "@/components/universe/EcosystemStats";
import { LiveInsights } from "@/components/universe/LiveInsights";
import { MobileUniverse } from "@/components/universe/MobileUniverse";
import { SearchBar } from "@/components/search/SearchBar";
import { ListView } from "@/components/views/ListView";
import { ViewSwitcher } from "@/components/views/ViewSwitcher";
import { useUniverseStore } from "@/store/useUniverseStore";
import { useIsMobile } from "@/hooks/useMediaQuery";

const UniverseScene = dynamic(
  () => import("@/components/universe/UniverseScene").then((m) => m.UniverseScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 items-center justify-center text-sm text-ink-500">
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
  const setBoostModalOpen = useUniverseStore((s) => s.setBoostModalOpen);
  const setSubmitModalOpen = useUniverseStore((s) => s.setSubmitModalOpen);
  const isMobile = useIsMobile();

  useEffect(() => {
    const q = searchParams.get("q");
    const focus = searchParams.get("focus");
    if (q) setSearchQuery(q);
    if (focus) select(focus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tablet/desktop fallback toolbar (single row) — only reached below lg,
  // where TopNav's own inline toolbar is hidden. Mobile gets its own
  // dedicated multi-row toolbar below instead of this compressed into one line.
  const toolbar = (
    <div className="flex w-full max-w-[1500px] flex-wrap items-center justify-center gap-2 xl:flex-nowrap">
      <div className="w-full shrink-0 xl:w-64">
        <SearchBar compact />
      </div>
      <FilterBar className="flex-wrap xl:flex-nowrap" />
      <div className="shrink-0">
        <ViewSwitcher />
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-9 shrink-0 rounded-full border-[1.5px] border-aurora-500 bg-void-950 text-aurora-500 hover:bg-aurora-500/5"
        onClick={() => setBoostModalOpen(true)}
      >
        <Rocket size={13} />
        Boost
      </Button>
      <Button size="sm" className="h-9 shrink-0 rounded-full" onClick={() => setSubmitModalOpen(true)}>
        <Upload size={13} />
        Submit
      </Button>
    </div>
  );

  // Dedicated mobile toolbar — full-width search, horizontally-scrollable
  // filter chips, then Universe/List next to Boost/Submit — each its own row
  // instead of one row's worth of controls squeezed to illegible size.
  const mobileToolbar = (
    <div className="flex flex-col gap-2.5 border-b border-line-soft bg-void-950 p-3 md:hidden">
      <SearchBar size="lg" compact />
      <div className="overflow-x-auto no-scrollbar">
        <FilterBar className="flex-nowrap" />
      </div>
      <div className="flex items-center justify-between gap-2">
        <ViewSwitcher />
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 shrink-0 rounded-full border-[1.5px] border-aurora-500 bg-void-950 text-aurora-500 hover:bg-aurora-500/5"
            onClick={() => setBoostModalOpen(true)}
          >
            <Rocket size={13} />
            Boost
          </Button>
          <Button size="sm" className="h-9 shrink-0 rounded-full" onClick={() => setSubmitModalOpen(true)}>
            <Upload size={13} />
            Submit
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="relative flex flex-1 flex-col min-h-0 bg-void-950">
      {viewMode === "universe" && !isMobile && <NebulaBackdrop />}

      <div className="relative z-10 flex flex-1 flex-col min-h-0">
        {viewMode === "universe" ? (
          isMobile ? (
            <>
              {mobileToolbar}
              <MobileUniverse />
            </>
          ) : (
            <>
              <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center p-4 md:hidden">
                <div className="pointer-events-auto flex justify-center">{toolbar}</div>
              </div>
              <div className="flex flex-1 min-h-0">
                <UniverseScene />
              </div>
              <div className="pointer-events-none absolute bottom-4 left-4 z-30 hidden lg:block lg:bottom-6 lg:left-6">
                <div className="pointer-events-auto">
                  <EcosystemStats />
                </div>
              </div>
              <div className="pointer-events-none absolute right-4 top-20 z-30 hidden lg:block lg:right-6 lg:top-24">
                <div className="pointer-events-auto">
                  <LiveInsights />
                </div>
              </div>
              <div className="pointer-events-none absolute bottom-4 right-4 z-30 lg:bottom-6 lg:right-6">
                <UniverseControls containerRef={containerRef} />
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center lg:bottom-6">
                <div className="pointer-events-auto">
                  <SponsoredStrip />
                </div>
              </div>
            </>
          )
        ) : (
          <div className="flex flex-1 min-h-0 flex-col">
            {isMobile ? mobileToolbar : <div className="flex justify-center border-b border-line-soft p-4 md:hidden">{toolbar}</div>}
            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
              <ListView />
            </div>
          </div>
        )}
      </div>

      <BoostModal />
      <SubmitListingModal />
    </div>
  );
}
