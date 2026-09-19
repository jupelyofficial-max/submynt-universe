"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SUBSCRIPTIONS_BY_ID } from "@/data/subscriptions";
import { cn } from "@/lib/utils";
import { useUniverseStore } from "@/store/useUniverseStore";

// User-supplied banner images (see chat) — one 1340x360-ish JPG/PNG per
// featured subscription, uploaded to public/hero-banners/. Real
// headline/tagline/price/CTA are baked into each image; the card itself
// is the click target rather than duplicating that text on top of it.
// Microsoft 365 moved to the front so it's the peeking "previous" card
// when Netflix (the default active slide) is centered — otherwise
// there's nothing before Netflix to peek from and the left side shows
// empty whitespace instead of a card.
const FEATURED_IDS = [
  "microsoft-365",
  "netflix",
  "spotify-premium",
  "youtube-premium",
  "chatgpt-plus",
  "canva-pro",
  "linkedin-premium",
  "coursera-plus",
];
const DEFAULT_ACTIVE_ID = "netflix";

const BANNER_IMAGE: Record<string, string> = {
  netflix: "/hero-banners/netflix.png",
  "spotify-premium": "/hero-banners/spotify.png",
  "youtube-premium": "/hero-banners/youtube-premium.png",
  "chatgpt-plus": "/hero-banners/chatgpt-plus.png",
  "canva-pro": "/hero-banners/canva-pro.png",
  "linkedin-premium": "/hero-banners/linkedin-premium.png",
  "coursera-plus": "/hero-banners/coursera.png",
  "microsoft-365": "/hero-banners/microsoft-365.png",
};

const AUTO_ADVANCE_MS = 4000;
// Peek is controlled by the track's own padding alone (each side's
// padding % is the peek fraction of the full track width — the card
// itself is w-full of what padding leaves behind, so it isn't
// re-shrunk by a second, compounding percentage). sm/lg target the
// requested 15-20% peek; mobile stays narrower (~9%) so the active
// banner doesn't shrink into illegibility on small screens, since
// height is now driven by width (aspect-ratio, no crop).
const TRACK_PADDING_CLASS = "px-[9%] sm:px-[15%] lg:px-[18.5%]";

export function HeroCarousel() {
  const [index, setIndex] = useState(() => Math.max(0, FEATURED_IDS.indexOf(DEFAULT_ACTIVE_ID)));
  const [paused, setPaused] = useState(false);
  const select = useUniverseStore((s) => s.select);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const scrollSyncTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const touchResumeTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const items = FEATURED_IDS.map((id) => SUBSCRIPTIONS_BY_ID[id]).filter((s) => s !== undefined);
  const itemCount = items.length;

  useEffect(() => {
    if (paused || itemCount === 0) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % itemCount);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [paused, itemCount, index]);

  // Keep the scroll position in sync whenever `index` changes, whether
  // that came from autoplay, an arrow/dot click, or a user swipe (see
  // handleScroll below) — scrollIntoView is a no-op if already centered.
  useEffect(() => {
    cardRefs.current[index]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [index]);

  useEffect(() => {
    return () => {
      clearTimeout(scrollSyncTimeout.current);
      clearTimeout(touchResumeTimeout.current);
    };
  }, []);

  if (items.length === 0) return null;

  function handleScroll() {
    clearTimeout(scrollSyncTimeout.current);
    scrollSyncTimeout.current = setTimeout(() => {
      const track = trackRef.current;
      if (!track) return;
      const centerX = track.getBoundingClientRect().left + track.getBoundingClientRect().width / 2;
      let closest = 0;
      let closestDist = Infinity;
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.left + rect.width / 2 - centerX);
        if (dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      });
      setIndex((i) => (i === closest ? i : closest));
    }, 120);
  }

  function goTo(i: number) {
    setIndex((i + itemCount) % itemCount);
  }

  return (
    <div className="px-4 pt-4 lg:px-8">
      <div className="relative mx-auto max-w-[145rem]">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          aria-label="Previous"
          className="absolute left-1 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink-0 shadow-md backdrop-blur transition-transform hover:scale-105 cursor-pointer sm:flex lg:left-2"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          aria-label="Next"
          className="absolute right-1 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink-0 shadow-md backdrop-blur transition-transform hover:scale-105 cursor-pointer sm:flex lg:right-2"
        >
          <ChevronRight size={18} />
        </button>

        <div
          ref={trackRef}
          onScroll={handleScroll}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => {
            clearTimeout(touchResumeTimeout.current);
            setPaused(true);
          }}
          onTouchEnd={() => {
            touchResumeTimeout.current = setTimeout(() => setPaused(false), 1000);
          }}
          className={cn(
            "no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth",
            TRACK_PADDING_CLASS
          )}
        >
          {items.map((item, i) => {
            const banner = BANNER_IMAGE[item.id];
            const active = i === index;

            return (
              <button
                key={item.id}
                type="button"
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                onClick={() => (active ? select(item.id) : goTo(i))}
                aria-label={`${item.name} — View details`}
                className={cn(
                  // Container ratio matches the uploaded PNGs' actual
                  // dimensions (~2048x768, i.e. ~8:3) rather than the
                  // nominal 1340x360 spec — the real files aren't quite
                  // that ratio, and locking to 1340:360 here would
                  // pillarbox them under object-contain instead of
                  // showing the full design edge-to-edge.
                  "relative aspect-[8/3] w-full shrink-0 snap-center overflow-hidden rounded-3xl transition-all duration-300 cursor-pointer",
                  active ? "opacity-100" : "opacity-55 scale-[0.94]"
                )}
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {banner && (
                  // eslint-disable-next-line @next/next/no-img-element -- matches SubscriptionLogo's plain-<img> convention
                  <img src={banner} alt={item.name} className="h-full w-full object-contain" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show ${item.name}`}
              aria-current={i === index}
              className={cn(
                "h-2 rounded-full transition-all cursor-pointer",
                i === index ? "w-5 bg-ocean-500" : "w-2 bg-void-700 hover:bg-void-600"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
