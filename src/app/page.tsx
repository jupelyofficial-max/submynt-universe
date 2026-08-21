"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Compass, Gauge, Plus, Scale, Telescope } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CATEGORIES } from "@/data/categories";
import { SUBSCRIPTIONS } from "@/data/subscriptions";
import { useUniverseStore } from "@/store/useUniverseStore";

const HomePreviewScene = dynamic(
  () => import("@/components/home/HomePreviewScene").then((m) => m.HomePreviewScene),
  { ssr: false }
);

const PILLARS = [
  {
    icon: Telescope,
    title: "Discover",
    body: "Every subscription you could pay for, mapped as one living universe — search, filter and drift through it.",
    href: "/explore",
    cta: "Explore the universe",
  },
  {
    icon: Scale,
    title: "Compare",
    body: "Put alternatives side by side — price, plans, value and availability — before you commit to anything.",
    href: "/compare",
    cta: "Start comparing",
  },
  {
    icon: Gauge,
    title: "Optimize",
    body: "See exactly what you spend, what it could cost instead, and where real savings are hiding.",
    href: "/optimize",
    cta: "See your savings",
  },
];

export default function HomePage() {
  const openAddModal = useUniverseStore((s) => s.openAddModal);

  return (
    <div className="flex flex-1 flex-col">
      <section className="relative flex min-h-[92vh] flex-col overflow-hidden">
        <div className="absolute inset-0">
          <HomePreviewScene />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_58%_46%_at_center,rgba(11,9,6,0.82)_0%,rgba(11,9,6,0.45)_60%,rgba(11,9,6,0.4)_75%,rgba(11,9,6,0.98)_100%)]" />

        <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 text-center">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-ink-200">
            <Telescope size={13} className="text-aurora-400" />
            {SUBSCRIPTIONS.length}+ subscriptions charted across {CATEGORIES.length} categories
          </span>
          <h1 className="font-display text-4xl font-semibold leading-[1.08] text-ink-0 sm:text-5xl lg:text-6xl">
            Your subscriptions
            <br />
            have a <span className="text-gradient-aurora">universe.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-ink-300 sm:text-lg">
            Discover, compare and optimize everything you pay for — every service, one map, no bank login required.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/explore">
              <Button size="lg" className="w-full sm:w-auto">
                <Telescope size={17} />
                Explore the Universe
              </Button>
            </Link>
            <Button size="lg" variant="secondary" onClick={() => openAddModal()}>
              <Plus size={17} />
              Add Your Subscriptions
            </Button>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-16 w-full max-w-5xl px-4 pb-20 sm:-mt-24">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PILLARS.map((pillar) => (
            <Link
              key={pillar.title}
              href={pillar.href}
              className="glass-panel group flex flex-col gap-3 rounded-2xl p-6 transition-colors hover:border-white/20"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-aurora-500/15 text-aurora-400">
                <pillar.icon size={20} />
              </span>
              <h3 className="font-display text-lg font-semibold text-ink-0">{pillar.title}</h3>
              <p className="flex-1 text-sm text-ink-400">{pillar.body}</p>
              <span className="text-sm font-medium text-aurora-400 group-hover:text-aurora-300">
                {pillar.cta} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-24">
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
          <Compass size={14} />
          Every category has a sector in the universe
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/explore?q=${encodeURIComponent(cat)}`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs text-ink-300 transition-colors hover:border-white/20 hover:text-ink-0"
            >
              {cat}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
