"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Orbit, Sparkles, Trash2 } from "lucide-react";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { Button } from "@/components/ui/Button";
import { SUBSCRIPTIONS_BY_ID, potentialSavingsMonthly } from "@/data/subscriptions";
import { formatDate, formatINR } from "@/lib/utils";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import { useUniverseStore } from "@/store/useUniverseStore";

export default function MySubscriptionsPage() {
  const owned = useMySubscriptionsStore((s) => s.owned);
  const hydrated = useMySubscriptionsStore((s) => s.hydrated);
  const remove = useMySubscriptionsStore((s) => s.remove);
  const select = useUniverseStore((s) => s.select);
  const sendCameraCommand = useUniverseStore((s) => s.sendCameraCommand);
  const router = useRouter();

  const totalMonthly = owned.reduce((sum, o) => sum + o.priceMonthly, 0);

  const items = useMemo(
    () =>
      owned
        .map((o) => ({ owned: o, sub: SUBSCRIPTIONS_BY_ID[o.subscriptionId] }))
        .filter((x) => x.sub)
        .sort((a, b) => new Date(a.owned.nextRenewal).getTime() - new Date(b.owned.nextRenewal).getTime()),
    [owned]
  );

  function openInUniverse(id: string) {
    select(id);
    sendCameraCommand({ type: "focus-node", id });
    router.push(`/explore?focus=${id}`);
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-nebula-500/15 text-nebula-400">
            <Orbit size={20} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink-0">My Subscriptions</h1>
            <p className="text-sm text-ink-400">
              {owned.length > 0 ? `${owned.length} tracked · ${formatINR(totalMonthly)}/mo` : "Nothing tracked yet."}
            </p>
          </div>
        </div>
      </div>

      {hydrated && items.length === 0 ? (
        <div className="glass-panel flex flex-col items-center gap-3 rounded-2xl p-16 text-center">
          <p className="font-display text-lg text-ink-0">Your universe is empty for now</p>
          <p className="max-w-sm text-sm text-ink-400">Your tracked subscriptions will show up here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ owned: o, sub }) => {
            const savings = potentialSavingsMonthly(sub);
            return (
              <div key={o.ownedId} className="glass-panel flex flex-col gap-3 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <SubscriptionLogo subscription={sub} size="md" ring />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-ink-0">{sub.name}</h3>
                    <p className="text-xs text-ink-400">{o.planName}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-semibold text-ink-0">{formatINR(o.priceMonthly)}</div>
                    <div className="text-[11px] text-ink-500">/mo</div>
                  </div>
                </div>

                <div className="text-xs text-ink-500">Renews {formatDate(o.nextRenewal)}</div>

                {savings > 0 && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-gold-500/10 px-2.5 py-1.5 text-[11px] text-gold-400">
                    <Sparkles size={12} />
                    Save {formatINR(savings)}/mo — see Optimize
                  </div>
                )}

                <div className="mt-auto flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openInUniverse(sub.id)}>
                    View Details
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-300 hover:text-red-200" onClick={() => remove(o.ownedId)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
