"use client";

import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { computeMobileClusterLayout } from "@/lib/mobileClusterLayout";
import { useUniverseStore } from "@/store/useUniverseStore";
import type { CategoryCluster } from "@/lib/universeLayout";
import type { Subscription } from "@/types/subscription";

const CARD_HEIGHT = 148;

export function MobileCategoryCard({ cluster, subs }: { cluster: CategoryCluster; subs: Subscription[] }) {
  const select = useUniverseStore((s) => s.select);
  const { icons, overflow, boxSize } = computeMobileClusterLayout(subs);
  const scale = Math.min(1, (CARD_HEIGHT - 8) / boxSize);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-black/10 bg-void-950 p-3"
      style={{
        backgroundImage: `radial-gradient(120% 100% at 50% 0%, ${cluster.color}14, transparent 65%)`,
      }}
    >
      <div className="mb-1.5 flex items-start gap-1.5">
        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: cluster.color }} />
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[13px] font-semibold text-ink-0">{cluster.name}</div>
          <div className="text-[10px] text-ink-500">{subs.length} services</div>
        </div>
      </div>

      <div className="relative mx-auto flex items-center justify-center" style={{ height: CARD_HEIGHT }}>
        <div
          className="relative shrink-0"
          style={{ width: boxSize * scale, height: boxSize * scale }}
        >
          {icons.map(({ subscription, x, y, size }) => (
            <button
              key={subscription.id}
              onClick={() => select(subscription.id)}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform active:scale-90"
              style={{ left: x * scale, top: y * scale }}
              aria-label={subscription.name}
            >
              <SubscriptionLogo
                subscription={subscription}
                size={size >= 48 ? "md" : "xs"}
                style={{ width: size * scale, height: size * scale }}
              />
            </button>
          ))}
          {overflow > 0 && (
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-black/10 bg-void-900 text-[10px] font-semibold text-ink-300 shadow-sm">
              +{overflow}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
