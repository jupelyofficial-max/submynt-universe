"use client";

import { Flame } from "lucide-react";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { SUBSCRIPTIONS } from "@/data/subscriptions";
import { useUniverseStore } from "@/store/useUniverseStore";

const TRENDING = [...SUBSCRIPTIONS].sort((a, b) => b.popularity - a.popularity).slice(0, 3);

export function TrendingNow() {
  const select = useUniverseStore((s) => s.select);
  const sendCameraCommand = useUniverseStore((s) => s.sendCameraCommand);

  return (
    <div className="glass-panel w-56 rounded-2xl p-3 shadow-lg shadow-black/5">
      <div className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
        <Flame size={12} className="text-nebula-500" />
        Trending now
      </div>
      <div className="flex flex-col gap-1">
        {TRENDING.map((sub) => (
          <button
            key={sub.id}
            onClick={() => {
              select(sub.id);
              sendCameraCommand({ type: "focus-node", id: sub.id });
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-1.5 py-1.5 text-left transition-colors hover:bg-black/5 cursor-pointer"
          >
            <SubscriptionLogo subscription={sub} size="xs" />
            <div className="min-w-0 leading-tight">
              <div className="truncate text-xs font-semibold text-ink-0">{sub.name}</div>
              <div className="truncate text-[10px] text-ink-500">Trending in {sub.category}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
