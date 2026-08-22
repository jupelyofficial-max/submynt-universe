"use client";

import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { computeMobileClusterLayout } from "@/lib/mobileClusterLayout";
import { useUniverseStore } from "@/store/useUniverseStore";
import type { CategoryCluster } from "@/lib/universeLayout";
import type { Subscription } from "@/types/subscription";

export function MobileCategoryCard({ cluster, subs }: { cluster: CategoryCluster; subs: Subscription[] }) {
  const select = useUniverseStore((s) => s.select);
  const { icons, overflow, boxSize } = computeMobileClusterLayout(subs);
  const pct = (v: number) => `${(v / boxSize) * 100}%`;

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-black/10 bg-void-950 p-1.5"
      style={{
        backgroundImage: `radial-gradient(120% 100% at 50% 0%, ${cluster.color}14, transparent 65%)`,
      }}
    >
      <div className="mb-0.5 flex items-start gap-1">
        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: cluster.color }} />
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[11px] font-semibold text-ink-0">{cluster.name}</div>
          <div className="text-[9px] text-ink-500">{subs.length} services</div>
        </div>
      </div>

      {/* A fixed, compact height (not driven by the card's width) — a
          full-width square on a narrow 3-column card is needlessly tall,
          which is what made every card way taller than the reference's
          dense, uniform grid. Square width is derived from that height via
          aspect-ratio and centered, comfortably narrower than the column. */}
      <div className="relative mx-auto" style={{ height: 108, aspectRatio: "1 / 1" }}>
        {icons.map(({ subscription, x, y, size }) => (
          <button
            key={subscription.id}
            onClick={() => select(subscription.id)}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform active:scale-90"
            style={{ left: pct(x), top: pct(y), width: pct(size), height: pct(size) }}
            aria-label={subscription.name}
          >
            <SubscriptionLogo subscription={subscription} size={size >= 48 ? "md" : "xs"} className="h-full w-full" />
          </button>
        ))}
        {overflow > 0 && (
          <div className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border border-black/10 bg-void-900 text-[9px] font-semibold text-ink-300 shadow-sm">
            +{overflow}
          </div>
        )}
      </div>
    </div>
  );
}
