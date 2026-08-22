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
      className="relative overflow-hidden rounded-2xl p-1.5"
      style={{
        backgroundImage: `radial-gradient(85% 75% at 50% 30%, ${cluster.color}1c, transparent 70%)`,
      }}
    >
      <div className="mb-1 flex items-start gap-1.5">
        <span className="mt-[7px] h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: cluster.color }} />
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[15px] font-semibold text-ink-0">{cluster.name}</div>
          <div className="text-[11px] text-ink-500">{subs.length} services</div>
        </div>
      </div>

      {/* Full-width square, driven by the card's own (2-column) width — the
          tier sizes in mobileClusterLayout are calibrated so this naturally
          lands real icon diameters in the ~63/44/31px range at a typical
          390px phone width. A fixed height derived independently of the
          actual column width was what caused icons to overflow/clip their
          card at 3 columns; deriving from width instead means it always
          exactly fits, by construction. */}
      <div className="relative w-full" style={{ aspectRatio: "1 / 1" }}>
        {icons.map(({ subscription, x, y, size }) => (
          <button
            key={subscription.id}
            onClick={() => select(subscription.id)}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform active:scale-90"
            style={{ left: pct(x), top: pct(y), width: pct(size), height: pct(size) }}
            aria-label={subscription.name}
          >
            {/* bare: real logo artwork with just a drop-shadow, no circular
                colored backing — the logo is the object, not a bubble
                containing it. */}
            <SubscriptionLogo subscription={subscription} size={size >= 48 ? "md" : "xs"} className="h-full w-full" bare />
          </button>
        ))}
        {overflow > 0 && (
          <div className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border border-black/10 bg-void-950/90 text-[10px] font-semibold text-ink-300 shadow-sm backdrop-blur">
            +{overflow}
          </div>
        )}
      </div>
    </div>
  );
}
