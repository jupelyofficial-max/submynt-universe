"use client";

import { useEffect, useState } from "react";
import { SUBSCRIPTIONS_BY_ID, getPriceForward } from "@/data/subscriptions";
import { cn, formatINR } from "@/lib/utils";
import { useUniverseStore } from "@/store/useUniverseStore";

// User-specified picks (see chat), not auto-selected — Bloomberg Terminal
// in particular is a deliberate contrast case (real ~₹2.2L/mo pricing).
// Its real catalog data is a genuine numeric price, not one of the
// Research & Data category's null-priced "Contact for pricing" entries
// (Gartner/Forrester/IDC/etc.) — shown here as a real price, not
// "Contact for pricing", to avoid displaying a fabricated price label
// for an entry that actually has one.
const FEATURED_IDS = ["netflix", "chatgpt-plus", "spotify-premium", "bloomberg-terminal"];

// Deterministic bar heights (%) — same values as the design reference's
// own generator script, just produced once here instead of at runtime.
const WAVEFORM_HEIGHTS = [30, 55, 40, 70, 45, 60, 35, 80, 50, 65, 40, 75, 55, 30, 60, 45];
const CANDLE_HEIGHTS = [40, 60, 35, 70, 50, 80, 45, 65, 55, 75, 40, 60, 50, 85, 45];

interface SlideArt {
  bgClass: string;
  logoMark: string;
  logoBg: string;
  headline: string;
  tagline: string;
}

const SLIDE_ART: Record<string, SlideArt> = {
  netflix: {
    bgClass: "hero-netflix",
    logoMark: "N",
    logoBg: "rgba(255,255,255,0.15)",
    headline: "Netflix",
    tagline: "Movies, series and specials on demand",
  },
  "chatgpt-plus": {
    bgClass: "hero-chatgpt",
    logoMark: "◇",
    logoBg: "rgba(255,255,255,0.12)",
    headline: "ChatGPT Plus",
    tagline: "Smarter answers, faster, every day",
  },
  "spotify-premium": {
    bgClass: "hero-spotify",
    logoMark: "♪",
    logoBg: "rgba(29,185,84,0.25)",
    headline: "Spotify Premium",
    tagline: "Streaming sound, everywhere you go",
  },
  "bloomberg-terminal": {
    bgClass: "hero-bloomberg",
    logoMark: "B",
    logoBg: "rgba(255,255,255,0.12)",
    headline: "Bloomberg Terminal",
    tagline: "Real-time markets, news and analytics",
  },
};

const AUTO_ADVANCE_MS = 4000;

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const select = useUniverseStore((s) => s.select);

  const items = FEATURED_IDS.map((id) => SUBSCRIPTIONS_BY_ID[id]).filter((s) => s !== undefined);
  const itemCount = items.length;

  useEffect(() => {
    if (paused || itemCount === 0) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % itemCount);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [paused, itemCount, index]);

  if (items.length === 0) return null;

  const sub = items[Math.min(index, items.length - 1)]!;
  const art = SLIDE_ART[sub.id];
  if (!art) return null;
  const priceInfo = getPriceForward(sub);

  return (
    <div className="px-4 pt-4 lg:px-8">
      <div
        className={cn(
          "relative mx-auto flex h-64 w-full max-w-6xl items-end overflow-hidden rounded-3xl p-6 sm:h-72 lg:h-80 lg:p-10",
          art.bgClass
        )}
        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {sub.id === "bloomberg-terminal" && <div className="hero-ticker-line" aria-hidden />}

        {sub.id === "spotify-premium" && (
          <div
            className="pointer-events-none absolute inset-0 flex items-end justify-end gap-1.5 py-0 pr-0 opacity-55"
            aria-hidden
          >
            {WAVEFORM_HEIGHTS.map((h, i) => (
              <span key={i} className="w-1.5 rounded-t-sm bg-[#1DB954]" style={{ height: `${h}%` }} />
            ))}
          </div>
        )}

        {sub.id === "bloomberg-terminal" && (
          <div
            className="pointer-events-none absolute inset-0 flex items-end justify-end gap-2 px-6 py-8 opacity-50"
            aria-hidden
          >
            {CANDLE_HEIGHTS.map((h, i) => (
              <span
                key={i}
                className={cn("w-1.5 rounded-sm", i % 2 === 0 ? "bg-[#26c281]" : "bg-[#e5484d]")}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        )}

        <div
          className="absolute left-6 top-6 z-[2] flex h-9 w-9 items-center justify-center rounded-[10px] text-base font-extrabold text-white lg:left-8 lg:top-8"
          style={{ background: art.logoBg }}
        >
          {art.logoMark}
        </div>

        <div className="relative z-[2] min-w-0 flex-1">
          <div className="font-display text-2xl font-extrabold tracking-tight text-white lg:text-4xl">
            {art.headline}
          </div>
          <p className="mt-1.5 max-w-md text-sm text-white/70 lg:text-base">{art.tagline}</p>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-lg font-bold text-white lg:text-xl">
              {priceInfo.strikePrice !== null && "From "}
              {formatINR(priceInfo.fromPrice ?? sub.priceMonthly ?? 0)}
              <span className="text-sm font-medium text-white/60">/mo</span>
            </span>
            {priceInfo.strikePrice !== null && (
              <span className="text-sm text-white/50 line-through">{formatINR(priceInfo.strikePrice)}</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => select(sub.id)}
            className="mt-5 inline-flex h-10 items-center rounded-full bg-white px-5 text-sm font-bold text-black transition-transform hover:scale-[1.02] cursor-pointer"
          >
            View details
          </button>
        </div>

        <div className="absolute bottom-4 right-6 z-[2] flex items-center gap-1.5 lg:bottom-6 lg:right-8">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show ${item.name}`}
              aria-current={i === index}
              className={cn(
                "h-2 rounded-full transition-all cursor-pointer",
                i === index ? "w-5 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
