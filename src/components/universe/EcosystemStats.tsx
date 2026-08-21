import { Globe2 } from "lucide-react";
import { SUBSCRIPTIONS } from "@/data/subscriptions";

export function EcosystemStats() {
  const categoryCount = new Set(SUBSCRIPTIONS.map((s) => s.category)).size;

  return (
    <div className="glass-panel flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lg shadow-black/5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-aurora-500/10 text-aurora-500">
        <Globe2 size={17} />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-ink-0">{SUBSCRIPTIONS.length}+ Subscriptions</div>
        <div className="text-[11px] text-ink-500">Across {categoryCount} categories</div>
      </div>
    </div>
  );
}
