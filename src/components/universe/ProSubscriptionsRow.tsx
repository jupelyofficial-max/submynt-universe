"use client";

import Link from "next/link";
import { NOT_SURE_BUNDLE_IMAGE, PRO_BUNDLES } from "@/data/bundles";

// Mirrors LifestyleBundlesRow.tsx exactly (same banner pixel dimensions,
// same 2x2 grid, sizing, spacing and responsive behavior) — see that
// file's comment for the aspect-ratio/object-cover rationale.
const CARDS: { key: string; image: string; alt: string; href: string }[] = [
  ...PRO_BUNDLES.map((b) => ({ key: b.slug, image: b.image, alt: b.title, href: `/bundles/${b.slug}` })),
  { key: "not-sure", image: NOT_SURE_BUNDLE_IMAGE, alt: "Not sure which bundle is right for you?", href: "/explore" },
];

export function ProSubscriptionsRow() {
  return (
    <div className="px-4 pb-2 pt-5 lg:px-8">
      <div className="mx-auto max-w-[1340px]">
        <h2 className="mb-3 text-lg font-semibold text-ink-0">Pro Subscriptions</h2>
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
