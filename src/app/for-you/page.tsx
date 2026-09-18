"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import { SUBSCRIPTIONS, SUBSCRIPTIONS_BY_ID } from "@/data/subscriptions";
import { filterByCatalogMode } from "@/lib/filterSubscriptions";
import { getRecommendation } from "@/lib/recommendations";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import { useUniverseStore } from "@/store/useUniverseStore";

const RESULT_COUNT = 12;

/** Personalized picks across the whole (catalogMode-scoped) catalogue —
 * reuses the same getRecommendation scoring engine DetailPanel's single
 * "Recommended for you" card already uses, just applied to every
 * not-yet-owned subscription instead of one. Driven by
 * useMySubscriptionsStore's local `owned` list, same as everywhere else
 * "owned" is read in this app — not gated on being signed in, even though
 * the only nav entry point to this page (AccountMenu) is. */
export default function ForYouPage() {
  const router = useRouter();
  const select = useUniverseStore((s) => s.select);
  const sendCameraCommand = useUniverseStore((s) => s.sendCameraCommand);
  const catalogMode = useUniverseStore((s) => s.catalogMode);
  const owned = useMySubscriptionsStore((s) => s.owned);

  const results = useMemo(() => {
    const ownedIds = new Set(owned.map((o) => o.subscriptionId));
    const ownedSubscriptions = owned
      .map((o) => SUBSCRIPTIONS_BY_ID[o.subscriptionId])
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
    const candidates = filterByCatalogMode(SUBSCRIPTIONS, catalogMode).filter((s) => !ownedIds.has(s.id));

    return candidates
      .map((sub) => getRecommendation(sub, { ownedSubscriptions }))
      .sort((a, b) => b.score - a.score)
      .slice(0, RESULT_COUNT);
  }, [owned, catalogMode]);

  function openInUniverse(id: string) {
    select(id);
    sendCameraCommand({ type: "focus-node", id });
    router.push(`/explore?focus=${id}`);
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
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-aurora-500/15 text-aurora-400">
          <Sparkles size={20} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-0">For You</h1>
          <p className="text-sm text-ink-400">Personalized picks based on what you already track.</p>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="glass-panel flex flex-col items-center gap-3 rounded-2xl p-16 text-center">
          <p className="font-display text-lg text-ink-0">Nothing to recommend yet</p>
          <p className="max-w-sm text-sm text-ink-400">Switch catalogs or check back once there&apos;s more here to compare against.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((result) => (
            <RecommendationCard
              key={result.subscription.id}
              result={result}
              onExplore={() => openInUniverse(result.subscription.id)}
              onCompare={() => router.push(`/compare?ids=${result.subscription.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
