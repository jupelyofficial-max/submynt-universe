"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Compass, Telescope } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CATEGORIES } from "@/data/categories";
import { SUBSCRIPTIONS } from "@/data/subscriptions";

const HomePreviewScene = dynamic(
  () => import("@/components/home/HomePreviewScene").then((m) => m.HomePreviewScene),
  { ssr: false }
);

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      <section className="relative flex flex-1 flex-col overflow-hidden bg-void-950">
        <div className="absolute inset-0">
          <HomePreviewScene />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 text-center">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/5 px-3.5 py-1.5 text-xs font-medium text-ink-300">
            <Telescope size={13} className="text-aurora-400" />
            {SUBSCRIPTIONS.length}+ subscriptions charted across {CATEGORIES.length} categories
          </span>
          <h1 className="font-display text-4xl font-semibold leading-[1.08] text-ink-0 sm:text-5xl lg:text-6xl">
            Stop paying Subscriptions
            <br />
            that you <span className="text-gradient-aurora">forgot about.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-ink-300 sm:text-lg">
            Discover everything you pay for — every service, one map, no bank login required.
          </p>
          <div className="mt-8">
            <Link href="/explore">
              <Button size="lg" className="w-full sm:w-auto">
                <Telescope size={17} />
                Explore the Universe
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="relative z-10 shrink-0 border-t border-line-soft px-4 py-4">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-2 overflow-x-auto no-scrollbar">
          <div className="flex shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-500">
            <Compass size={14} />
            Categories
          </div>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/explore?q=${encodeURIComponent(cat)}`}
              className="shrink-0 rounded-full border border-black/10 bg-black/[0.03] px-3.5 py-1.5 text-xs whitespace-nowrap text-ink-300 transition-colors hover:border-black/20 hover:text-ink-0"
            >
              {cat}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
