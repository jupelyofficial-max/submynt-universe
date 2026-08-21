"use client";

import {
  BILLING_LABELS,
  BILLING_OPTIONS,
  CATEGORIES,
  PRICE_BANDS,
  REGION_OPTIONS,
  SORT_LABELS,
  SORT_OPTIONS,
  USER_STATUS_LABELS,
} from "@/data/categories";
import { cn } from "@/lib/utils";
import { useUniverseStore } from "@/store/useUniverseStore";
import type { UserStatusFilter } from "@/types/subscription";

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

const USER_STATUS_OPTIONS = Object.keys(USER_STATUS_LABELS) as UserStatusFilter[];

export function FilterControls() {
  const filters = useUniverseStore((s) => s.filters);
  const toggleCategory = useUniverseStore((s) => s.toggleCategory);
  const toggleBilling = useUniverseStore((s) => s.toggleBilling);
  const togglePriceBand = useUniverseStore((s) => s.togglePriceBand);
  const toggleUserStatus = useUniverseStore((s) => s.toggleUserStatus);
  const toggleRegion = useUniverseStore((s) => s.toggleRegion);
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
      <Section title="User status">
        {USER_STATUS_OPTIONS.map((opt) => (
          <Chip key={opt} active={filters.userStatus.includes(opt)} onClick={() => toggleUserStatus(opt)}>
            {USER_STATUS_LABELS[opt]}
          </Chip>
        ))}
      </Section>
      <Section title="Category">
        {CATEGORIES.map((cat) => (
          <Chip key={cat} active={filters.categories.includes(cat)} onClick={() => toggleCategory(cat)}>
            {cat}
          </Chip>
        ))}
      </Section>
      <Section title="Billing">
        {BILLING_OPTIONS.map((opt) => (
          <Chip key={opt} active={filters.billing.includes(opt)} onClick={() => toggleBilling(opt)}>
            {BILLING_LABELS[opt]}
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
      <Section title="Region">
        {REGION_OPTIONS.map((region) => (
          <Chip key={region} active={filters.regions.includes(region)} onClick={() => toggleRegion(region)}>
            {region}
          </Chip>
        ))}
      </Section>
    </div>
  );
}
