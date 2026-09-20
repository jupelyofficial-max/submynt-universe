"use client";

import { SUBSCRIPTIONS_BY_ID } from "@/data/subscriptions";
import { useUniverseStore } from "@/store/useUniverseStore";

/** Duolingo Super's Education-row card, first item — uses a pre-made PNG
 * asset (public/subscriptions/duolingo-super-card.png, 1024x1536, 2:3) as
 * the exact visual instead of an HTML/CSS recreation. Click behavior still
 * routes through the real catalog entry, same as every other card. */
export function DuolingoFeatureCard() {
  const select = useUniverseStore((s) => s.select);
  const sub = SUBSCRIPTIONS_BY_ID["duolingo-super"];
  if (!sub) return null;

  return (
    <button
      type="button"
      onClick={() => select(sub.id)}
      className="group aspect-[1024/1536] w-72 shrink-0 overflow-hidden rounded-2xl transition-opacity hover:opacity-90 cursor-pointer sm:w-80"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- matches SubscriptionLogo's plain-<img> convention */}
      <img
        src="/subscriptions/duolingo-super-card.png"
        alt="Duolingo Super — From ₹336/mo, 7-day trial"
        className="h-full w-full object-cover"
      />
    </button>
  );
}
