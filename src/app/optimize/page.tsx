"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Compass, Gauge, Repeat, Scale, Sparkles } from "lucide-react";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { Button } from "@/components/ui/Button";
import { SUBSCRIPTIONS_BY_ID, bestSavingsAlternative } from "@/data/subscriptions";
import { formatINR } from "@/lib/utils";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import { useUniverseStore } from "@/store/useUniverseStore";

export default function OptimizePage() {
  const owned = useMySubscriptionsStore((s) => s.owned);
  const hydrated = useMySubscriptionsStore((s) => s.hydrated);
  const openAddModal = useUniverseStore((s) => s.openAddModal);
  const select = useUniverseStore((s) => s.select);
  const toggleUserStatus = useUniverseStore((s) => s.toggleUserStatus);
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  const breakdown = useMemo(() => {
    return owned
      .map((o) => {
        const sub = SUBSCRIPTIONS_BY_ID[o.subscriptionId];
        if (!sub) return null;
        const alt = bestSavingsAlternative(sub);
        const savings = alt ? Math.max(0, o.priceMonthly - alt.priceMonthly) : 0;
        return { owned: o, sub, alt, savings };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.savings - a.savings);
  }, [owned]);

  const totalMonthly = owned.reduce((sum, o) => sum + o.priceMonthly, 0);
  const totalAnnual = totalMonthly * 12;
  const potentialMonthly = breakdown.reduce((sum, b) => sum + b.savings, 0);
  const opportunities = breakdown.filter((b) => b.savings > 0);
  const optimized = breakdown.filter((b) => b.savings === 0);

  function focusInExplore(id: string) {
    select(id);
    router.push(`/explore?focus=${id}`);
  }

  if (hydrated && owned.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-500/15 text-gold-400">
          <Gauge size={26} />
        </span>
        <h1 className="font-display text-2xl font-semibold text-ink-0">Nothing to optimize yet</h1>
        <p className="text-sm text-ink-400">
          Add your subscriptions and we&apos;ll surface real savings across your universe.
        </p>
        <Button onClick={() => openAddModal()}>Add Subscription</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-500/15 text-gold-400">
          <Gauge size={20} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-0">Your subscription universe</h1>
          <p className="text-sm text-ink-400">A clear picture of what you spend, and where it can shrink.</p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="You spend" value={`${formatINR(totalMonthly)}/mo`} sub={`${formatINR(totalAnnual)}/yr`} />
        <StatCard
          label="Potential optimization"
          value={`${formatINR(potentialMonthly)}/mo`}
          sub={`${formatINR(potentialMonthly * 12)}/yr`}
          tone="gold"
        />
        <StatCard label="Subscriptions tracked" value={String(owned.length)} sub={`${opportunities.length} with savings`} />
      </div>

      <div className="mb-10 flex flex-wrap gap-2">
        <Button
          onClick={() => document.getElementById("breakdown")?.scrollIntoView({ behavior: "smooth" })}
          disabled={opportunities.length === 0}
        >
          <Sparkles size={16} />
          Optimize
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            toggleUserStatus("potential-savings");
            router.push("/explore");
          }}
        >
          <Compass size={16} />
          Explore Alternatives
        </Button>
        <Button
          variant="outline"
          disabled={opportunities.length === 0}
          onClick={() => opportunities[0] && focusInExplore(opportunities[0].sub.id)}
        >
          <Repeat size={16} />
          Switch Plan
        </Button>
        <Button variant="ghost" onClick={() => setDismissed(true)}>
          Keep Everything
        </Button>
      </div>

      {dismissed && (
        <div className="mb-8 flex items-center gap-2 rounded-xl border border-nebula-500/25 bg-nebula-500/[0.06] px-4 py-3 text-sm text-nebula-400">
          <Check size={16} />
          Good call — everything stays exactly as it is.
        </div>
      )}

      {opportunities.length > 0 && (
        <div id="breakdown" className="mb-10">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">Ways to save</h2>
          <div className="flex flex-col gap-3">
            {opportunities.map(({ owned: o, sub, alt, savings }) => (
              <div key={o.ownedId} className="glass-panel flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-3">
                  <SubscriptionLogo subscription={sub} size="md" ring />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-ink-0">{sub.name}</div>
                    <div className="text-xs text-ink-500">
                      Currently {formatINR(o.priceMonthly)}/mo · {o.planName}
                    </div>
                  </div>
                </div>
                {alt && (
                  <div className="flex items-center gap-2 rounded-xl bg-gold-500/10 px-3 py-2 text-xs text-gold-400">
                    <Sparkles size={14} />
                    Switch to <span className="font-semibold text-ink-0">{alt.name}</span> and save{" "}
                    <span className="font-semibold">{formatINR(savings)}/mo</span>
                  </div>
                )}
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" onClick={() => alt && focusInExplore(alt.id)}>
                    Switch Plan
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => focusInExplore(sub.id)}>
                    <Scale size={14} />
                    Compare
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {optimized.length > 0 && (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">Already optimized</h2>
          <div className="flex flex-col gap-2">
            {optimized.map(({ owned: o, sub }) => (
              <div key={o.ownedId} className="flex items-center gap-3 rounded-xl bg-black/[0.03] px-4 py-3">
                <SubscriptionLogo subscription={sub} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink-0">{sub.name}</div>
                  <div className="text-xs text-ink-500">{formatINR(o.priceMonthly)}/mo</div>
                </div>
                <span className="text-xs font-medium text-nebula-400">Best value</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "gold";
}) {
  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-ink-500">{label}</div>
      <div className={`mt-1.5 font-display text-2xl font-semibold ${tone === "gold" ? "text-gold-400" : "text-ink-0"}`}>
        {value}
      </div>
      <div className="mt-0.5 text-xs text-ink-500">{sub}</div>
    </div>
  );
}
