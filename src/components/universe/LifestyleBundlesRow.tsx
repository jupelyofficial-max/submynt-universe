"use client";

import Link from "next/link";
import { LIFESTYLE_BUNDLES, NOT_SURE_BUNDLE_IMAGE } from "@/data/bundles";

// All 5 banners share the same real pixel dimensions (2172x724, i.e. 3:1).
// Desktop/tablet grid cells use that same 3:1 ratio, so object-cover
// fills every pixel with zero cropping. Mobile (single column, full
// viewport width) is deliberately shorter — aspect-[5/1] — since a
// full-width card at 3:1 is much taller in absolute pixels than a
// half-width desktop grid cell at the same ratio; object-cover crops a
// little off the top/bottom at that ratio, but title, description,
// CTA button and price all sit within the artwork's central band and
// stay fully visible (verified via screenshot).
const CARDS: { key: string; image: string; alt: string; href: string }[] = [
  ...LIFESTYLE_BUNDLES.map((b) => ({ key: b.slug, image: b.image, alt: b.title, href: `/bundles/${b.slug}` })),
  { key: "not-sure", image: NOT_SURE_BUNDLE_IMAGE, alt: "Not sure which bundle is right for you?", href: "/explore" },
];

export function LifestyleBundlesRow() {
  return (
    <div className="px-4 pb-2 pt-5 lg:px-8">
      <div className="mx-auto max-w-[1340px]">
        <h2 className="mb-3 text-lg font-semibold text-ink-0">Lifestyle Subscriptions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CARDS.map((card) => (
            <Link
              key={card.key}
              href={card.href}
              aria-label={card.alt}
              className="relative aspect-[5/1] w-full overflow-hidden rounded-2xl transition-transform duration-200 hover:scale-[1.005] sm:aspect-[3/1]"
              style={{ border: "1px solid rgba(0,0,0,0.06)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- matches SubscriptionLogo's plain-<img> convention */}
              <img src={card.image} alt={card.alt} className="h-full w-full object-cover" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
