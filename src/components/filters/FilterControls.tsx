"use client";

import { PRICE_BANDS, SORT_LABELS, SORT_OPTIONS } from "@/data/categories";
import { cn } from "@/lib/utils";
import { useUniverseStore } from "@/store/useUniverseStore";

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
        active
          ? "bg-aurora-500/20 border-aurora-500/50 text-aurora-400"
          : "bg-white/5 border-white/10 text-ink-300 hover:text-ink-0 hover:border-white/20"
      )}
    >
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-4 border-b border-line-soft last:border-b-0">
      <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-ink-500">{title}</h4>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

export function FilterControls() {
  const filters = useUniverseStore((s) => s.filters);
  const togglePriceBand = useUniverseStore((s) => s.togglePriceBand);
  const setSort = useUniverseStore((s) => s.setSort);

  return (
    <div className="px-5">
      <Section title="Sort by">
        {SORT_OPTIONS.map((opt) => (
          <Chip key={opt} active={filters.sort === opt} onClick={() => setSort(opt)}>
            {SORT_LABELS[opt]}
          </Chip>
        ))}
      </Section>
      <Section title="Price">
        {PRICE_BANDS.map((band) => (
          <Chip key={band.id} active={filters.priceBands.includes(band.id)} onClick={() => togglePriceBand(band.id)}>
            {band.label}
          </Chip>
        ))}
      </Section>
    </div>
  );
}
