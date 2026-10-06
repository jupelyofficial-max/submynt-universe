"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, X } from "lucide-react";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { Button } from "@/components/ui/Button";
import { SUBSCRIPTIONS_BY_ID } from "@/data/subscriptions";
import { formatPrice } from "@/lib/utils";
import { useSubscriptionStatusStore } from "@/store/useSubscriptionStatusStore";
import { useUniverseStore } from "@/store/useUniverseStore";
import { BundleInterestsSection } from "@/components/saved/BundleInterestsSection";

// "Interested in" — subscriptions marked "considering", the same signal the
// Heart button on a subscription's detail panel toggles. Deliberately
// separate from Track Subscriptions (useMySubscriptionsStore/owned_subscriptions,
// what a user actually pays for) — saving something here never creates a
// real tracked record.
export default function SavedSubscriptionsPage() {
  const statuses = useSubscriptionStatusStore((s) => s.statuses);
  const hydrated = useSubscriptionStatusStore((s) => s.hydrated);
  const clearStatus = useSubscriptionStatusStore((s) => s.clearStatus);
  const select = useUniverseStore((s) => s.select);
  const router = useRouter();

  const items = useMemo(
    () =>
      Object.entries(statuses)
        .filter(([, status]) => status === "considering")
        .map(([id]) => SUBSCRIPTIONS_BY_ID[id])
        .filter((s): s is NonNullable<typeof s> => Boolean(s)),
    [statuses]
  );

  function openDetails(id: string) {
    select(id);
    router.push(`/explore?focus=${id}`);
  }

  function trackIt(id: string) {
    useUniverseStore.getState().setAddSubscriptionsModalOpen(true, id, false, "saved");
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 lg:px-8">
      <Link
        href="/explore"
        className="mb-4 inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm text-ink-300 transition-colors hover:bg-black/5 hover:text-ink-0"
      >
        <ArrowLeft size={16} />
        Back
      </Link>

      <div className="mb-8 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-400">
          <Heart size={20} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-0">Saved Subscriptions</h1>
          <p className="text-sm text-ink-400">
            {items.length > 0 ? `${items.length} saved` : "Subscriptions you're interested in show up here."}
          </p>
        </div>
      </div>

      {hydrated && items.length === 0 ? (
        <div className="glass-panel flex flex-col items-center gap-3 rounded-2xl p-16 text-center">
          <p className="font-display text-lg text-ink-0">Nothing saved yet</p>
          <p className="max-w-sm text-sm text-ink-400">
            Tap the heart on anything you&apos;re considering — it&apos;ll show up here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((sub) => (
            <div key={sub.id} className="glass-panel flex flex-col gap-3 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <SubscriptionLogo subscription={sub} size="md" ring />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-ink-0">{sub.name}</h3>
                  <p className="text-xs text-ink-400">{sub.category}</p>
                </div>
                <div className="shrink-0 text-right text-sm font-semibold text-ink-0">
                  {formatPrice(sub.priceMonthly, sub.priceLabel)}
                </div>
              </div>

              <div className="mt-auto flex gap-2 pt-1">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => openDetails(sub.id)}>
                  View Details
                </Button>
                <Button size="sm" className="flex-1" onClick={() => trackIt(sub.id)}>
                  I have this
                </Button>
                <Button size="sm" variant="ghost" className="text-red-300 hover:text-red-200" onClick={() => clearStatus(sub.id)}>
                  <X size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <BundleInterestsSection />
    </div>
  );
}
