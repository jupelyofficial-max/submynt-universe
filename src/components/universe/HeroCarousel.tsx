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
// requested 15-20% peek; mobile uses a narrower peek (~2%, was ~6%),
// tuned together with the outer wrapper's tighter mobile padding below
// so the active card lands at ~90-94% of the viewport width with only
// a subtle sliver of the next banner showing — sm/lg unchanged.
const TRACK_PADDING_CLASS = "px-[2%] sm:px-[15%] lg:px-[18.5%]";

export function HeroCarousel() {
  const [index, setIndex] = useState(() => Math.max(0, FEATURED_IDS.indexOf(DEFAULT_ACTIVE_ID)));
  const [paused, setPaused] = useState(false);
  const select = useUniverseStore((s) => s.select);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const scrollSyncTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const touchResumeTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Set right before a setIndex call that crosses an edge (index 0 -> last,
  // or last -> 0), so the scroll effect below animates a short hop to the
  // cloned edge card instead of sliding across the entire real track.
  const wrapRef = useRef<"prev" | "next" | null>(null);

  const items = FEATURED_IDS.map((id) => SUBSCRIPTIONS_BY_ID[id]).filter((s) => s !== undefined);
  const itemCount = items.length;
  // Infinite-loop illusion: clone the last item before the first and the
  // first item after the last, so there's always a real-looking banner
  // peeking at both edges (e.g. Microsoft 365 as the leftmost real card
  // still has the cloned last banner peeking further left) instead of
  // empty space. Extended position e maps to real index e-1, except
  // e=0 (clone of the last item) and e=itemCount+1 (clone of the first).
  const extendedItems = itemCount > 0 ? [items[itemCount - 1]!, ...items, items[0]!] : [];

  useEffect(() => {
    if (paused || itemCount === 0) return;
    const id = setInterval(() => {
      goTo(index + 1);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, itemCount, index]);

  // Keep the scroll position in sync whenever `index` changes, whether
  // that came from autoplay, an arrow/dot click, or a user swipe (see
  // handleScroll below) — no-op if already centered. This scrolls only
  // the carousel's own horizontal track (trackRef.scrollTo), computed
  // manually, rather than target.scrollIntoView(): scrollIntoView walks
  // every scrollable ancestor, including the page's own <main> — with
  // the page scrolled down past the carousel (e.g. to Lifestyle
  // Subscriptions), its "nearest" vertical fallback would drag <main>
  // itself back up to the carousel every 4s on autoplay, hijacking
  // wherever the user actually is on the page.
  useEffect(() => {
    const dir = wrapRef.current;
    wrapRef.current = null;
    let target: HTMLButtonElement | null | undefined;
    if (dir === "prev") target = cardRefs.current[0];
    else if (dir === "next") target = cardRefs.current[extendedItems.length - 1];
    else target = cardRefs.current[index + 1];
    const track = trackRef.current;
    if (!track || !target) return;
    const trackRect = track.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const delta = targetRect.left + targetRect.width / 2 - (trackRect.left + trackRect.width / 2);
    if (delta === 0) return;
    track.scrollTo({ left: track.scrollLeft + delta, behavior: "smooth" });
  }, [index, extendedItems.length]);

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
      const trackRect = track.getBoundingClientRect();
      const centerX = trackRect.left + trackRect.width / 2;
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

      // Resting on a cloned edge card (from a wrap-hop or a plain user
      // swipe past the real boundary) — silently re-anchor to the real
      // equivalent (visually identical, so the jump is imperceptible)
      // so the next wrap in either direction still has a clone to hop to.
      // scrollLeft assignment still animates under CSS scroll-behavior:
      // smooth, so scroll-behavior is forced to "auto" for this one jump
      // — otherwise it's a second, long, visible slide across the track.
      if (closest === 0) {
        const real = cardRefs.current[itemCount];
        const clone = cardRefs.current[0];
        if (real && clone) {
          const delta = real.getBoundingClientRect().left - clone.getBoundingClientRect().left;
          track.style.scrollBehavior = "auto";
          track.scrollLeft += delta;
          requestAnimationFrame(() => {
            track.style.scrollBehavior = "";
          });
        }
        setIndex((i) => (i === itemCount - 1 ? i : itemCount - 1));
        return;
      }
      if (closest === extendedItems.length - 1) {
        const real = cardRefs.current[1];
        const clone = cardRefs.current[closest];
        if (real && clone) {
          const delta = real.getBoundingClientRect().left - clone.getBoundingClientRect().left;
          track.style.scrollBehavior = "auto";
          track.scrollLeft += delta;
          requestAnimationFrame(() => {
            track.style.scrollBehavior = "";
          });
        }
        setIndex((i) => (i === 0 ? i : 0));
        return;
      }

      const realIndex = closest - 1;
      setIndex((i) => (i === realIndex ? i : realIndex));
    }, 120);
  }

  function goTo(target: number) {
    const wrapped = ((target % itemCount) + itemCount) % itemCount;
    if (index === itemCount - 1 && wrapped === 0) wrapRef.current = "next";
    else if (index === 0 && wrapped === itemCount - 1) wrapRef.current = "prev";
    else wrapRef.current = null;
    setIndex(wrapped);
  }

  return (
    <div className="px-2 pt-4 sm:px-4 lg:px-8">
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
          {extendedItems.map((item, i) => {
            const banner = BANNER_IMAGE[item.id];
            const active = i === index + 1;
            const isClone = i === 0 || i === extendedItems.length - 1;
            const realIndexForClick = i === 0 ? itemCount - 1 : i === extendedItems.length - 1 ? 0 : i - 1;

            return (
              <button
                key={`slide-${i}`}
                type="button"
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                onClick={() => (active ? select(item.id) : goTo(realIndexForClick))}
                aria-label={`${item.name} — View details`}
                aria-hidden={isClone || undefined}
                tabIndex={isClone ? -1 : undefined}
                className={cn(
                  // Mobile only: locked to the nominal 1340x360 spec ratio
                  // per request. The uploaded PNGs are actually ~2048x768
                  // (~8:3, still used at sm/lg, unchanged) — object-contain
                  // below means the mismatch on mobile shows as harmless
                  // letterboxing (a little empty space on the sides), never
                  // a crop or a stretch.
                  "relative aspect-[1340/360] w-full shrink-0 snap-center overflow-hidden rounded-3xl transition-all duration-300 cursor-pointer sm:aspect-[8/3]",
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
