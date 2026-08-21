"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Scale, Search, X } from "lucide-react";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SUBSCRIPTIONS, SUBSCRIPTIONS_BY_ID } from "@/data/subscriptions";
import { formatINR } from "@/lib/utils";
import { useUniverseStore } from "@/store/useUniverseStore";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";

function useCompareIds() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ids = useMemo(() => {
    const raw = searchParams.get("ids");
    if (!raw) return [] as string[];
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter((id) => SUBSCRIPTIONS_BY_ID[id])
      .slice(0, 3);
  }, [searchParams]);

  function setIds(next: string[]) {
    const params = new URLSearchParams();
    if (next.length) params.set("ids", next.join(","));
    router.replace(`/compare${next.length ? `?${params.toString()}` : ""}`);
  }

  return { ids, setIds };
}

export function CompareClient() {
  const { ids, setIds } = useCompareIds();
  const subs = ids.map((id) => SUBSCRIPTIONS_BY_ID[id]);
  const owned = useMySubscriptionsStore((s) => s.owned);
  const ownedIds = useMemo(() => new Set(owned.map((o) => o.subscriptionId)), [owned]);
  const select = useUniverseStore((s) => s.select);
  const router = useRouter();

  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return SUBSCRIPTIONS.filter((s) => !ids.includes(s.id) && s.name.toLowerCase().includes(q)).slice(0, 6);
  }, [query, ids]);

  const cheapest = subs.length ? Math.min(...subs.map((s) => s.priceMonthly)) : 0;
  const [kept, setKept] = useState<string | null>(null);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-aurora-500/15 text-aurora-400">
          <Scale size={20} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-0">Compare subscriptions</h1>
          <p className="text-sm text-ink-400">Weigh price, plans and value side by side — up to three at a time.</p>
        </div>
      </div>

      {subs.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center">
          <p className="text-ink-300">Search for subscriptions above to start comparing.</p>
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subs.map((sub) => {
            const isOwned = ownedIds.has(sub.id);
            return (
              <div key={sub.id} className="glass-panel relative flex flex-col gap-4 rounded-2xl p-5">
                <button
                  onClick={() => setIds(ids.filter((id) => id !== sub.id))}
                  className="absolute right-3 top-3 text-ink-500 hover:text-ink-0 cursor-pointer"
                  aria-label={`Remove ${sub.name}`}
                >
                  <X size={16} />
                </button>
                <div className="flex flex-col items-center text-center gap-2">
                  <SubscriptionLogo subscription={sub} size="lg" ring={isOwned} />
                  <div>
                    <h3 className="font-display text-base font-semibold text-ink-0">{sub.name}</h3>
                    <p className="text-xs text-ink-400">{sub.category}</p>
                  </div>
                  {isOwned && <Badge tone="nebula">In your universe</Badge>}
                </div>

                <dl className="flex flex-col gap-2.5 text-sm">
                  <Row label="Price">
                    <span className="font-semibold text-ink-0">{formatINR(sub.priceMonthly)}</span>
                    {sub.priceMonthly > 0 && <span className="text-ink-500">/mo</span>}
                  </Row>
                  <Row label="Annual cost">{formatINR(sub.priceMonthly * 12)}</Row>
                  <Row label="Plans">{sub.plans.length} available</Row>
                  <Row label="Value">★ {sub.rating.toFixed(1)} · {sub.popularity}% popular</Row>
                  <Row label="Availability">{sub.region}</Row>
                  <Row label="Vs. cheapest here">
                    {sub.priceMonthly === cheapest ? (
                      <span className="text-nebula-400">Cheapest</span>
                    ) : (
                      <span className="text-gold-400">+{formatINR(sub.priceMonthly - cheapest)}/mo</span>
                    )}
                  </Row>
                </dl>

                <div className="mt-1 flex flex-col gap-2">
                  {isOwned && (
                    <Button
                      variant={kept === sub.id ? "secondary" : "primary"}
                      size="sm"
                      onClick={() => {
                        setKept(sub.id);
                        setTimeout(() => setKept(null), 1400);
                      }}
                    >
                      {kept === sub.id ? "Kept ✓" : "Keep Current"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      select(sub.id);
                      router.push(`/explore?focus=${sub.id}`);
                    }}
                  >
                    Explore Alternative
                  </Button>
                </div>
              </div>
            );
          })}

          {subs.length < 3 && (
            <div className="glass-panel flex flex-col items-center justify-center gap-3 rounded-2xl border-dashed p-5 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-ink-300">
                <Plus size={18} />
              </span>
              <p className="text-sm text-ink-400">Add another to compare</p>
            </div>
          )}
        </div>
      )}

      {subs.length < 3 && (
        <div className="glass-panel rounded-2xl p-4">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a subscription to add to comparison…"
              className="w-full rounded-xl border border-black/10 bg-void-900/70 py-2.5 pl-9 pr-3 text-sm text-ink-0 outline-none placeholder:text-ink-500 focus:border-aurora-500/50"
            />
          </div>
          {results.length > 0 && (
            <div className="mt-2 flex flex-col gap-1">
              {results.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setIds([...ids, s.id]);
                    setQuery("");
                  }}
                  className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-left hover:bg-black/5 cursor-pointer"
                >
                  <SubscriptionLogo subscription={s} size="xs" />
                  <span className="text-sm text-ink-0">{s.name}</span>
                  <span className="ml-auto text-xs text-ink-500">{formatINR(s.priceMonthly)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-line-soft pb-2 last:border-b-0 last:pb-0">
      <dt className="text-ink-500">{label}</dt>
      <dd className="flex items-center gap-1">{children}</dd>
    </div>
  );
}
