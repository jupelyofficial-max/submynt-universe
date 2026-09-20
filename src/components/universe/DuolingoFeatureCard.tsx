"use client";

import { ArrowRight, Download, Flame, Heart, Infinity as InfinityIcon, Smartphone } from "lucide-react";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { getPriceForward, SUBSCRIPTIONS_BY_ID } from "@/data/subscriptions";
import { formatINR } from "@/lib/utils";
import { useUniverseStore } from "@/store/useUniverseStore";

// Duolingo's real brand green (#58CC02) — the catalog's stored `color` field
// for this entry (#5196e3, blue) is used for its plain logo backing
// elsewhere, but this card is styled specifically to read as Duolingo, so it
// uses the brand's actual color instead.
const DUO_GREEN = "#58CC02";

const FEATURES = [
  { icon: InfinityIcon, label: "Ad-free learning" },
  { icon: Heart, label: "Unlimited hearts" },
  { icon: Download, label: "Offline lessons" },
  { icon: Smartphone, label: "All devices" },
];

/** One-off larger promo-style card for Duolingo Super specifically — every
 * other Education card stays the compact row card. Price/trial are read
 * live from the catalog (never hardcoded); only the marketing copy below
 * (description, tagline) is hand-written, same as bundle-row copy
 * elsewhere, since Subscription.tagline is a generic shared field. */
export function DuolingoFeatureCard() {
  const select = useUniverseStore((s) => s.select);
  const sub = SUBSCRIPTIONS_BY_ID["duolingo-super"];
  if (!sub) return null;

  const priceInfo = getPriceForward(sub);

  return (
    <button
      type="button"
      onClick={() => select(sub.id)}
      className="group relative flex w-72 shrink-0 flex-col gap-4 overflow-hidden rounded-2xl border p-4 text-left transition-colors hover:border-black/20 cursor-pointer sm:w-80"
      style={{
        background: `linear-gradient(160deg, ${DUO_GREEN}1a 0%, #ffffff 65%)`,
        borderColor: `${DUO_GREEN}33`,
      }}
    >
      {/* Decorative accent, not brand artwork — a soft off-canvas glow in
          Duolingo's own green, standing in for the illustration space
          without reproducing any copyrighted mascot art. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-2xl"
        style={{ background: `${DUO_GREEN}2e` }}
      />

      <div className="flex items-start justify-between gap-2">
        <span
          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold text-white"
          style={{ background: DUO_GREEN }}
        >
          <Flame size={12} className="fill-white" />
          Popular
        </span>
        {sub.trialDays && (
          <span
            className="rounded-full border px-3 py-1 text-[11px] font-semibold"
            style={{ borderColor: `${DUO_GREEN}55`, color: DUO_GREEN }}
          >
            {sub.trialDays}d trial
          </span>
        )}
      </div>

      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-black/[0.03]">
        <SubscriptionLogo subscription={sub} size="sm" bare />
      </div>

      <div>
        <h3 className="text-lg font-extrabold text-ink-0">{sub.name}</h3>
        <p className="mt-1 text-sm text-ink-500">Learn languages faster with no ads and unlimited hearts.</p>
      </div>

      {priceInfo.fromPrice !== null && (
        <div>
          {priceInfo.strikePrice !== null && <div className="text-xs text-ink-500">From</div>}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-ink-0">{formatINR(priceInfo.fromPrice)}</span>
            <span className="text-xs text-ink-500">/mo</span>
            {priceInfo.strikePrice !== null && (
              <span className="text-xs text-ink-500 line-through">{formatINR(priceInfo.strikePrice)}</span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        {FEATURES.map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1 text-center">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: `${DUO_GREEN}1a`, color: DUO_GREEN }}
            >
              <Icon size={16} />
            </div>
            <span className="text-[10px] leading-tight text-ink-500">{label}</span>
          </div>
        ))}
      </div>

      <div
        className="flex items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-bold text-white transition-opacity group-hover:opacity-90"
        style={{ background: DUO_GREEN }}
      >
        View details
        <ArrowRight size={14} />
      </div>

      <p className="text-center text-[10px] font-medium uppercase tracking-wider text-ink-500">
        Languages for a brighter world
      </p>
    </button>
  );
}
