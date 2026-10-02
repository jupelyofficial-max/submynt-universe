"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlarmClock, ArrowLeft } from "lucide-react";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { Badge } from "@/components/ui/Badge";
import { SUBSCRIPTIONS_BY_ID } from "@/data/subscriptions";
import { daysUntil, formatDate } from "@/lib/utils";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import { useSubscriptionsReady } from "@/hooks/useSubscriptionsReady";
import { useUniverseStore } from "@/store/useUniverseStore";
import type { OwnedSubscription, Subscription } from "@/types/subscription";

type EventType = "renewal" | "promo";

interface RenewalEvent {
  type: EventType;
  date: string;
  days: number;
  owned: OwnedSubscription;
  sub: Subscription;
}

type Bucket = "This week" | "This month" | "Later";
const BUCKET_ORDER: Bucket[] = ["This week", "This month", "Later"];

function bucketFor(days: number): Bucket {
  if (days <= 7) return "This week";
  if (days <= 30) return "This month";
  return "Later";
}

// Every owned subscription contributes its own renewal event; a
// promotional one with a recorded promo_end_date ALSO contributes a
// separate "Promo ends" event — the two are never merged, since a promo
// ending and the subscription renewing at full price are different dates
// that can genuinely differ (Sprint 5, US-052).
function buildEvents(owned: OwnedSubscription[]): RenewalEvent[] {
  const list: RenewalEvent[] = [];
  for (const o of owned) {
    const sub = SUBSCRIPTIONS_BY_ID[o.subscriptionId];
    if (!sub) continue;
    if (o.nextRenewal) {
      const days = daysUntil(o.nextRenewal);
      if (days >= 0) list.push({ type: "renewal", date: o.nextRenewal, days, owned: o, sub });
    }
    const accessType = o.accessType ?? "direct";
    if (accessType === "promotional" && o.promoEndDate) {
      const days = daysUntil(o.promoEndDate);
      if (days >= 0) list.push({ type: "promo", date: o.promoEndDate, days, owned: o, sub });
    }
  }
  return list.sort((a, b) => a.days - b.days);
}

export default function RenewalsPage() {
  const owned = useMySubscriptionsStore((s) => s.owned);
  const hydrated = useSubscriptionsReady();
  const select = useUniverseStore((s) => s.select);
  const router = useRouter();

  const events = useMemo(() => buildEvents(owned), [owned]);

  const buckets = useMemo(() => {
    const groups: Record<Bucket, RenewalEvent[]> = { "This week": [], "This month": [], Later: [] };
    for (const e of events) groups[bucketFor(e.days)].push(e);
    return groups;
  }, [events]);

  function openDetails(id: string) {
    select(id);
    router.push(`/explore?focus=${id}`);
  }

  const isEmpty = hydrated && events.length === 0;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 lg:px-8">
      <Link
        href="/my-subscriptions"
        className="mb-4 inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm text-ink-300 transition-colors hover:bg-black/5 hover:text-ink-0"
      >
        <ArrowLeft size={16} />
        Back
      </Link>

      <div className="mb-8 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-400">
          <AlarmClock size={20} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-0">Upcoming Renewals</h1>
          <p className="text-sm text-ink-400">{events.length > 0 ? `${events.length} upcoming` : "Nothing upcoming."}</p>
        </div>
      </div>

      {isEmpty ? (
        <div className="glass-panel flex flex-col items-center gap-3 rounded-2xl p-16 text-center">
          <p className="font-display text-lg text-ink-0">Nothing coming up</p>
          <p className="max-w-sm text-sm text-ink-400">
            Renewals and promo expiries for your tracked subscriptions will show up here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {BUCKET_ORDER.filter((b) => buckets[b].length > 0).map((bucket) => (
            <div key={bucket}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">
                {bucket} · {buckets[bucket].length}
              </h2>
              <div className="flex flex-col gap-2">
                {buckets[bucket].map((e) => (
                  <button
                    key={`${e.type}-${e.owned.ownedId}`}
                    onClick={() => openDetails(e.sub.id)}
                    className="glass-panel flex w-full items-center gap-3 rounded-2xl p-3.5 text-left transition-colors hover:bg-black/5 cursor-pointer"
                  >
                    <SubscriptionLogo subscription={e.sub} size="sm" ring />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink-0">{e.sub.name}</div>
                      <div className="truncate text-xs text-ink-500">{e.owned.planName}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <Badge tone={e.type === "promo" ? "gold" : "neutral"}>{e.type === "promo" ? "Promo ends" : "Renews"}</Badge>
                      <div className="mt-1 text-[11px] text-ink-500">{formatDate(e.date)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
