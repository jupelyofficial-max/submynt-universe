"use client";

import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { computeMobileClusterLayout } from "@/lib/mobileClusterLayout";
import { useUniverseStore } from "@/store/useUniverseStore";
import type { CategoryCluster } from "@/lib/universeLayout";
import type { Subscription } from "@/types/subscription";

// Real logo artwork, on a clean near-white tile with a hairline shadow —
// not the saturated color-gradient "orb" SubscriptionLogo defaults to
// elsewhere in the app. The logo itself is the hero; the tile just gives it
// enough depth to read as a real icon. Left as an explicit override (rather
// than changing SubscriptionLogo's default) so desktop's List/Detail views,
// which use the same component, are untouched.
const LOGO_STYLE: React.CSSProperties = {
  background: "#fdfbf7",
  boxShadow: "0 1px 2px rgba(20,15,8,0.14), 0 0 0 1px rgba(20,15,8,0.06)",
};

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
      <div className="mb-0.5 flex items-start gap-1">
        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: cluster.color }} />
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[11px] font-semibold text-ink-0">{cluster.name}</div>
          <div className="text-[9px] text-ink-500">{subs.length} services</div>
        </div>
      </div>

      {/* Full-width square, driven by the card's own (2-column) width — the
          tier sizes in mobileClusterLayout are calibrated so this naturally
          lands real icon diameters in the ~56/38/27px range at a typical
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
            <SubscriptionLogo subscription={subscription} size={size >= 48 ? "md" : "xs"} className="h-full w-full" style={LOGO_STYLE} />
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
