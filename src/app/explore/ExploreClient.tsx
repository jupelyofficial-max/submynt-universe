"use client";

import { Upload } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { FilterBar } from "@/components/filters/FilterBar";
import { HeroCarousel } from "@/components/universe/HeroCarousel";
import { EcosystemsRow } from "@/components/universe/EcosystemsRow";
import { LifestyleBundlesRow } from "@/components/universe/LifestyleBundlesRow";
import { ProSubscriptionsRow } from "@/components/universe/ProSubscriptionsRow";
import { EducationRow } from "@/components/universe/EducationRow";
import { AIToolsRow } from "@/components/universe/AIToolsRow";
import { EntertainmentRow } from "@/components/universe/EntertainmentRow";
import { MusicRow } from "@/components/universe/MusicRow";
import { WellnessRow } from "@/components/universe/WellnessRow";
import { ProductivityRow } from "@/components/universe/ProductivityRow";
import { CreativeRow } from "@/components/universe/CreativeRow";
import { GamingRow } from "@/components/universe/GamingRow";
import { TelecomRow } from "@/components/universe/TelecomRow";
import { FAQSection } from "@/components/universe/FAQSection";
import { SubmitListingModal } from "@/components/submissions/SubmitListingModal";
import { SearchBar } from "@/components/search/SearchBar";
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

  // Dedicated mobile toolbar — Search, Categories, Price and Sort all in one
  // row below the header. Search is flexible (shrinks first, never below
  // min-w-0's content-driven floor); the three filter pills use FilterBar's
  // `compact` mode (tighter padding/font, capped+truncated label — see
  // FilterDropdown) so all four fit without wrapping. No Submit button here
  // — mobile-only, the desktop toolbar keeps it.
  const mobileToolbar = (
    <div className="flex items-center gap-1.5 overflow-x-hidden border-b border-line-soft bg-void-950 p-2.5 md:hidden">
      <div className="min-w-[64px] flex-1">
        <SearchBar compact />
      </div>
      <FilterBar className="flex-nowrap gap-1.5 shrink-0" compact />
    </div>
  );

  return (
    <div className="relative flex flex-1 flex-col bg-void-950">
      <div className="relative z-10 flex flex-1 flex-col">
        {/* Mobile only: toolbar sits directly below TopNav (the logo/header
            bar), above all content — moved from its previous spot after
            TelecomRow. Desktop/tablet keeps the fallback toolbar exactly
            where it was, unaffected. */}
        {isMobile && mobileToolbar}
        <HeroCarousel />
        <EcosystemsRow />
        <LifestyleBundlesRow />
        <EducationRow />
        <AIToolsRow />
        <EntertainmentRow />
        <MusicRow />
        <WellnessRow />
        <ProSubscriptionsRow />
        <ProductivityRow />
        <CreativeRow />
        <GamingRow />
        <TelecomRow />
        {!isMobile && <div className="flex justify-center border-b border-line-soft p-4 md:hidden">{toolbar}</div>}
        <FAQSection />
      </div>

      <SubmitListingModal />
    </div>
  );
}
