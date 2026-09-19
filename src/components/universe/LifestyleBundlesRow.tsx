"use client";

import Link from "next/link";
import { LIFESTYLE_BUNDLES, NOT_SURE_BUNDLE_IMAGE } from "@/data/bundles";

// All 5 banners share the same real pixel dimensions (2172x724, i.e. 3:1)
// — verified directly rather than assumed — so a single aspect-ratio box
// with object-contain shows each one fully, uncropped, unstretched.
const CARDS: { key: string; image: string; alt: string; href: string }[] = [
  ...LIFESTYLE_BUNDLES.map((b) => ({ key: b.slug, image: b.image, alt: b.title, href: `/bundles/${b.slug}` })),
  { key: "not-sure", image: NOT_SURE_BUNDLE_IMAGE, alt: "Not sure which bundle is right for you?", href: "/explore" },
];

export function LifestyleBundlesRow() {
  return (
    <div className="px-4 pb-2 pt-5 lg:px-8">
      <div className="mx-auto max-w-[92rem]">
        <h2 className="mb-3 text-lg font-semibold text-ink-0">Lifestyle Subscriptions</h2>
        <div className="mx-auto flex max-w-[1340px] flex-col gap-3">
          {CARDS.map((card) => (
            <Link
              key={card.key}
              href={card.href}
              aria-label={card.alt}
              className="relative aspect-[3/1] w-full overflow-hidden rounded-2xl transition-transform duration-200 hover:scale-[1.005]"
              style={{ border: "1px solid rgba(0,0,0,0.06)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- matches SubscriptionLogo's plain-<img> convention */}
              <img src={card.image} alt={card.alt} className="h-full w-full object-contain" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
