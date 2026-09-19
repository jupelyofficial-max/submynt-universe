"use client";

import Link from "next/link";
import { LIFESTYLE_BUNDLES, NOT_SURE_BUNDLE_IMAGE } from "@/data/bundles";

// All 5 banners share the same real pixel dimensions (2172x724, i.e. 3:1).
// The grid cell box uses that same 3:1 ratio (not the much-shorter
// 67/9 used previously), so object-cover fills every pixel of the
// cell with zero cropping — the banner's own ratio already matches
// the cell, so nothing outside the frame gets cut, including the
// title text and CTA button near the edges. Both cards in a row stay
// equal height since every cell shares the same width and ratio.
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
              className="relative aspect-[3/1] w-full overflow-hidden rounded-2xl transition-transform duration-200 hover:scale-[1.005]"
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
