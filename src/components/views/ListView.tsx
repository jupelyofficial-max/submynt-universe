"use client";

import { useMemo } from "react";
import { Plus, Sparkles } from "lucide-react";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SUBSCRIPTIONS, potentialSavingsMonthly } from "@/data/subscriptions";
import { matchesFilters, matchesSearch, sortSubscriptions } from "@/lib/filterSubscriptions";
import { formatINR } from "@/lib/utils";
import { useUniverseStore } from "@/store/useUniverseStore";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";

export function ListView() {
  const searchQuery = useUniverseStore((s) => s.searchQuery);
  const filters = useUniverseStore((s) => s.filters);
  const select = useUniverseStore((s) => s.select);
  const openAddModal = useUniverseStore((s) => s.openAddModal);
  const owned = useMySubscriptionsStore((s) => s.owned);
  const ownedIds = useMemo(() => new Set(owned.map((o) => o.subscriptionId)), [owned]);

  const results = useMemo(() => {
    const filtered = SUBSCRIPTIONS.filter(
      (s) => matchesSearch(s, searchQuery) && matchesFilters(s, filters, ownedIds)
    );
    return sortSubscriptions(filtered, filters.sort, ownedIds);
  }, [searchQuery, filters, ownedIds]);

  if (results.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-24 text-center">
        <p className="font-display text-lg text-ink-0">No subscriptions match yet</p>
        <p className="text-sm text-ink-400">Try a different search term or clear a filter.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-3 px-4 py-6 sm:grid-cols-2 lg:grid-cols-3">
      {results.map((sub) => {
        const isOwned = ownedIds.has(sub.id);
        const savings = potentialSavingsMonthly(sub);
        return (
          <div
            key={sub.id}
            className="glass-panel group flex flex-col gap-3 rounded-2xl p-4 transition-colors hover:border-white/20 cursor-pointer"
            onClick={() => select(sub.id)}
          >
            <div className="flex items-start gap-3">
              <SubscriptionLogo subscription={sub} size="md" ring={isOwned} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="truncate text-sm font-semibold text-ink-0">{sub.name}</h3>
                  {sub.isNew && <Badge tone="nebula">New</Badge>}
                </div>
                <p className="mt-0.5 truncate text-xs text-ink-400">{sub.category}</p>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-sm font-semibold text-ink-0">{formatINR(sub.priceMonthly)}</div>
                {sub.priceMonthly > 0 && <div className="text-[11px] text-ink-500">/mo</div>}
              </div>
            </div>

            <p className="line-clamp-2 text-xs text-ink-400">{sub.tagline}</p>

            <div className="flex items-center gap-2 text-[11px] text-ink-500">
              <span>★ {sub.rating.toFixed(1)}</span>
              <span>·</span>
              <span>{sub.popularity}% popular</span>
              <span>·</span>
              <span>{sub.region}</span>
            </div>

            {isOwned && savings > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg bg-gold-500/10 px-2.5 py-1.5 text-[11px] text-gold-400">
                <Sparkles size={12} />
                Save {formatINR(savings)}/mo by switching
              </div>
            )}

            <div className="mt-auto flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
              <Button size="sm" variant="outline" className="flex-1" onClick={() => select(sub.id)}>
                View Details
              </Button>
              {!isOwned && (
                <Button size="sm" className="flex-1" onClick={() => openAddModal(sub.id)}>
                  <Plus size={14} />
                  Add
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
