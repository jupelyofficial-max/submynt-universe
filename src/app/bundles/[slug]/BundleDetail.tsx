"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { Button } from "@/components/ui/Button";
import { SUBSCRIPTIONS_BY_ID, getPriceForward } from "@/data/subscriptions";
import type { LifestyleBundle } from "@/data/bundles";
import { formatINR, formatPrice } from "@/lib/utils";
import { useUniverseStore } from "@/store/useUniverseStore";

export function BundleDetail({ bundle }: { bundle: LifestyleBundle }) {
  const select = useUniverseStore((s) => s.select);
  const subscriptions = bundle.subscriptionIds.map((id) => SUBSCRIPTIONS_BY_ID[id]).filter((s) => s !== undefined);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 lg:px-8">
      <Link href="/explore" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-0">
        <ArrowLeft size={15} />
        Back to Explore
      </Link>

      <div className="overflow-hidden rounded-3xl">
        {/* eslint-disable-next-line @next/next/no-img-element -- matches SubscriptionLogo's plain-<img> convention */}
        <img src={bundle.image} alt={bundle.title} className="h-auto w-full" />
      </div>

      <div className="mt-6">
        <h1 className="font-display text-2xl font-bold text-ink-0">{bundle.title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-400">{bundle.tagline}</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {subscriptions.map((sub) => {
          const priceInfo = getPriceForward(sub);
          return (
            <div
              key={sub.id}
              className="glass-panel group flex flex-col gap-3 rounded-2xl p-4 transition-colors hover:border-black/20 cursor-pointer"
              onClick={() => select(sub.id)}
            >
              <div className="flex items-start gap-3">
                <SubscriptionLogo subscription={sub} size="md" bare />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-ink-0">{sub.name}</h3>
                  <p className="mt-0.5 truncate text-xs text-ink-400">{sub.category}</p>
                </div>
                <div className="shrink-0 text-right">
                  {priceInfo.fromPrice === null ? (
                    <div className="text-sm font-bold text-ink-0">{formatPrice(sub.priceMonthly, sub.priceLabel)}</div>
                  ) : (
                    <>
                      <div className="text-sm font-bold text-ink-0">
                        {priceInfo.strikePrice !== null && "From "}
                        {formatINR(priceInfo.fromPrice)}
                      </div>
                      {priceInfo.fromPrice > 0 && <div className="text-[11px] text-ink-500">/mo</div>}
                    </>
                  )}
                </div>
              </div>

              <p className="line-clamp-2 text-xs text-ink-400">{sub.tagline}</p>

              <Button
                size="sm"
                variant="outline"
                className="mt-auto w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  select(sub.id);
                }}
              >
                View Details
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
