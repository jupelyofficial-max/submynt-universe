"use client";

import Link from "next/link";
import { LIFESTYLE_BUNDLES, NOT_SURE_BUNDLE_IMAGE } from "@/data/bundles";

// All 5 banners share the same real pixel dimensions (2172x724, i.e. 3:1).
// Every breakpoint uses that same 3:1 ratio, so object-cover fills every
// pixel with zero cropping. Mobile previously used a shorter aspect-[5/1]
// to save vertical space, but that crops ~40% of the image height off
// center (object-cover's default crop origin) — enough to clip the
// headline at the top and cut the price/CTA/savings pill and the
// handwritten annotation off entirely at the bottom (confirmed via
// screenshot). 3:1 everywhere trades some extra mobile height for
// guaranteed zero cropping of baked-in text/icons.
const CARDS: { key: string; image: string; alt: string; href: string }[] = [
  ...LIFESTYLE_BUNDLES.map((b) => ({ key: b.slug, image: b.image, alt: b.title, href: `/bundles/${b.slug}` })),
  { key: "not-sure", image: NOT_SURE_BUNDLE_IMAGE, alt: "Not sure which bundle is right for you?", href: "/explore" },
];

export function LifestyleBundlesRow() {
  return (
    <div className="px-4 pb-2 pt-5 lg:px-8">
      <div className="mx-auto max-w-[1340px]">
        <h2 className="mb-3 text-lg font-semibold text-ink-0">Lifestyle Subscriptions</h2>
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:gap-4 sm:grid-cols-2">
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
