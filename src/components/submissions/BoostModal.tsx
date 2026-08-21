"use client";

import { Rocket } from "lucide-react";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { useUniverseStore } from "@/store/useUniverseStore";

export function BoostModal() {
  const isOpen = useUniverseStore((s) => s.isBoostModalOpen);
  const setOpen = useUniverseStore((s) => s.setBoostModalOpen);

  return (
    <ResponsiveSheet open={isOpen} onClose={() => setOpen(false)} title="Boost" desktopVariant="center" widthClassName="w-[420px]">
      <div className="flex flex-col items-center gap-3 px-8 py-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-aurora-500/15 text-aurora-400">
          <Rocket size={26} />
        </span>
        <p className="font-display text-lg font-semibold text-ink-0">Boosted placements — coming soon</p>
        <p className="text-sm text-ink-300">
          Providers will be able to pay to feature their subscription closer to the center of the universe and
          higher in list results. We&apos;re still building this out.
        </p>
      </div>
    </ResponsiveSheet>
  );
}
