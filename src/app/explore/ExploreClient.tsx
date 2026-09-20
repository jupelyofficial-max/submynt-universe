"use client";

import { Upload } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { FilterBar, SortDropdown } from "@/components/filters/FilterBar";
import { HeroCarousel } from "@/components/universe/HeroCarousel";
import { EcosystemsRow } from "@/components/universe/EcosystemsRow";
import { LifestyleBundlesRow } from "@/components/universe/LifestyleBundlesRow";
import { EducationRow } from "@/components/universe/EducationRow";
import { AIToolsRow } from "@/components/universe/AIToolsRow";
import { EntertainmentRow } from "@/components/universe/EntertainmentRow";
import { MusicRow } from "@/components/universe/MusicRow";
import { WellnessRow } from "@/components/universe/WellnessRow";
import { ProductivityRow } from "@/components/universe/ProductivityRow";
import { CreativeRow } from "@/components/universe/CreativeRow";
import { GamingRow } from "@/components/universe/GamingRow";
import { TelecomRow } from "@/components/universe/TelecomRow";
import { SubmitListingModal } from "@/components/submissions/SubmitListingModal";
import { SearchBar } from "@/components/search/SearchBar";
import { ListView } from "@/components/views/ListView";
import { useUniverseStore } from "@/store/useUniverseStore";
import { useIsMobile } from "@/hooks/useMediaQuery";

export function ExploreClient() {
  const searchParams = useSearchParams();
  const setSearchQuery = useUniverseStore((s) => s.setSearchQuery);
  const select = useUniverseStore((s) => s.select);
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
      <Button size="sm" className="h-9 shrink-0 rounded-full" onClick={() => setSubmitModalOpen(true)}>
        <Upload size={13} />
        Submit
      </Button>
    </div>
  );

  // Dedicated mobile toolbar. Search shares a row with the Categories/Price
  // chips (both h-9, align cleanly) instead of each getting its own
  // full-width row — three stacked rows read as more chrome than content
  // above the fold. Sort ("Popular" etc.) moves to row 2, next to Submit.
  const mobileToolbar = (
    <div className="flex flex-col gap-2 border-b border-line-soft bg-void-950 p-2.5 md:hidden">
      <div className="flex items-center gap-2">
        <div className="w-[38%] min-w-[130px] shrink-0">
          <SearchBar compact />
        </div>
        <div className="min-w-0 flex-1 overflow-x-auto no-scrollbar">
          <FilterBar className="flex-nowrap" hideSort />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto no-scrollbar">
          <SortDropdown />
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" className="h-9 shrink-0 rounded-full" onClick={() => setSubmitModalOpen(true)}>
            <Upload size={13} />
            Submit
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative flex flex-1 flex-col bg-void-950">
      <div className="relative z-10 flex flex-1 flex-col">
        <HeroCarousel />
        <EcosystemsRow />
        <LifestyleBundlesRow />
        <EducationRow />
        <AIToolsRow />
        <EntertainmentRow />
        <MusicRow />
        <WellnessRow />
        <ProductivityRow />
        <CreativeRow />
        <GamingRow />
        <TelecomRow />
        <div className="flex flex-1 min-h-0 flex-col">
          {isMobile ? mobileToolbar : <div className="flex justify-center border-b border-line-soft p-4 md:hidden">{toolbar}</div>}
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
            <ListView />
          </div>
        </div>
      </div>

      <SubmitListingModal />
    </div>
  );
}
