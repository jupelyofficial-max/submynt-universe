"use client";

import { SUBSCRIPTIONS_BY_ID } from "@/data/subscriptions";
import { useUniverseStore } from "@/store/useUniverseStore";

// Pre-made PNG card assets (public/subscriptions/*.png, all 1024x1536, 2:3)
// replace the old HTML/CSS cards entirely — pricing, badges and trial copy
// are baked into each image already (verified to match the real catalog
// entries below), not re-rendered here. Click-through still routes through
// the real subscription id, same as every other row.
const EDUCATION_CARDS = [
  { id: "duolingo-super", image: "/subscriptions/duolingo-super-card.png" },
  { id: "linkedin-learning", image: "/subscriptions/linkedin-learning.png" },
  { id: "coursera-plus", image: "/subscriptions/coursera-plus.png" },
  { id: "pw-pi-pro", image: "/subscriptions/pw-pi-pro.png" },
  { id: "udemy-personal-plan", image: "/subscriptions/udemy-personal.png" },
  { id: "skillshare", image: "/subscriptions/skillshare.png" },
];

export function EducationRow() {
  const select = useUniverseStore((s) => s.select);
  const items = EDUCATION_CARDS.map(({ id, image }) => ({ sub: SUBSCRIPTIONS_BY_ID[id], image })).filter(
    (item) => item.sub !== undefined
  );
  if (items.length === 0) return null;

  return (
    <div className="px-4 pb-2 pt-5 lg:px-8">
      <div className="mx-auto max-w-[1340px]">
        <h2 className="mb-3 text-lg font-semibold text-ink-0">Education</h2>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {items.map(({ sub, image }) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => select(sub.id)}
              className="aspect-[1024/1536] w-56 shrink-0 overflow-hidden rounded-2xl transition-opacity hover:opacity-90 cursor-pointer sm:w-64"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- matches SubscriptionLogo's plain-<img> convention */}
              <img src={image} alt={sub.name} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
