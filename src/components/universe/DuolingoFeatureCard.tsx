"use client";

import { SUBSCRIPTIONS_BY_ID } from "@/data/subscriptions";
import { useUniverseStore } from "@/store/useUniverseStore";

/** Duolingo Super's Education-row card, first item — uses a pre-made PNG
 * asset (public/subscriptions/duolingo-super-card.png, 1024x1536, 2:3) as
 * the exact visual instead of an HTML/CSS recreation. Click behavior still
 * routes through the real catalog entry, same as every other card.
 *
 * Outer button matches the other 5 cards' exact footprint (w-44/h-[179px],
 * sm:w-52) instead of sizing itself to the image. The PNG's own aspect
 * ratio (2:3, taller than this box is) means it can't fill that box without
 * cropping or stretching, so it's scaled down to fit fully inside via
 * object-contain — some empty space left/right of the image is the
 * unavoidable result of "same footprint" + "no crop/stretch" together. */
export function DuolingoFeatureCard() {
  const select = useUniverseStore((s) => s.select);
  const sub = SUBSCRIPTIONS_BY_ID["duolingo-super"];
  if (!sub) return null;

  return (
    <button
      type="button"
      onClick={() => select(sub.id)}
      className="group flex h-[179px] w-44 shrink-0 items-center justify-center overflow-hidden rounded-2xl transition-opacity hover:opacity-90 cursor-pointer sm:w-52"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- matches SubscriptionLogo's plain-<img> convention */}
      <img
        src="/subscriptions/duolingo-super-card.png"
        alt="Duolingo Super — From ₹336/mo, 7-day trial"
        className="h-full w-full object-contain"
      />
    </button>
  );
}
