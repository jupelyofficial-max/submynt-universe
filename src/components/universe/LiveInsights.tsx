"use client";

import { AnimatePresence, motion } from "framer-motion";
import { GraduationCap, Lightbulb } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { SUBSCRIPTIONS } from "@/data/subscriptions";
import { useUniverseStore } from "@/store/useUniverseStore";
import { cn } from "@/lib/utils";
import type { Subscription } from "@/types/subscription";

type Tab = "top5" | "students" | "tips";

const TABS: { id: Tab; label: string }[] = [
  { id: "top5", label: "Top 5" },
  { id: "students", label: "Students" },
  { id: "tips", label: "Tips" },
];

// A wider candidate pool than the 5 shown — every reshuffle draws a fresh
// 5 from here, so the list visibly changes over time without ever surfacing
// something genuinely unpopular.
const TOP_POOL = [...SUBSCRIPTIONS].sort((a, b) => b.popularity - a.popularity).slice(0, 14);

const FREE_FOR_STUDENTS = [...SUBSCRIPTIONS]
  .filter((s) => s.priceMonthly === 0)
  .sort((a, b) => b.popularity - a.popularity)
  .slice(0, 5);

const TIPS = [
  "Cancel a free trial a day early — billing usually starts at midnight, not the hour you signed up.",
  "Annual plans typically save 15–20% over paying the same subscription monthly.",
  "Family or duo plans often work out cheaper per person than separate individual accounts.",
  "Check My Subscriptions for potential-savings alerts before any renewal goes through.",
];

/** Deterministic shuffle keyed by a rotating seed — changes every reshuffle
 * without relying on Math.random, so it stays stable within a single render. */
function pickFive(seed: number): Subscription[] {
  const arr = [...TOP_POOL];
  let s = seed || 1;
  function rand() {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, 5);
}

function InsightRow({ sub, badge, onClick }: { sub: Subscription; badge?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-xl px-1.5 py-1.5 text-left transition-colors hover:bg-black/5 cursor-pointer"
    >
      <SubscriptionLogo subscription={sub} size="xs" bare />
      <div className="min-w-0 flex-1 leading-tight">
        <div className="truncate text-xs font-semibold text-ink-0">{sub.name}</div>
        <div className="truncate text-[10px] text-ink-500">{sub.category}</div>
      </div>
      {badge && (
        <span className="shrink-0 rounded-full bg-aurora-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-aurora-500">
          {badge}
        </span>
      )}
    </button>
  );
}

export function LiveInsights() {
  const select = useUniverseStore((s) => s.select);
  const sendCameraCommand = useUniverseStore((s) => s.sendCameraCommand);
  const [tab, setTab] = useState<Tab>("top5");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 9000);
    return () => clearInterval(interval);
  }, []);

  const top5 = useMemo(() => pickFive(tick + 1), [tick]);

  function focusItem(id: string) {
    select(id);
    sendCameraCommand({ type: "focus-node", id });
  }

  return (
    <div className="glass-panel w-60 rounded-2xl p-3 shadow-lg shadow-black/5">
      <div className="mb-2 flex items-center gap-0.5 rounded-full bg-black/5 p-0.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded-full py-1 text-[10px] font-semibold transition-colors cursor-pointer",
              tab === t.id ? "bg-white text-ink-0 shadow-sm" : "text-ink-500 hover:text-ink-0"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "top5" && (
        <>
          <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Live
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={tick}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col gap-1"
            >
              {top5.map((sub) => (
                <InsightRow key={sub.id} sub={sub} onClick={() => focusItem(sub.id)} />
              ))}
            </motion.div>
          </AnimatePresence>
        </>
      )}

      {tab === "students" && (
        <>
          <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
            <GraduationCap size={12} className="text-aurora-500" />
            Free for students
          </div>
          <div className="flex flex-col gap-1">
            {FREE_FOR_STUDENTS.map((sub) => (
              <InsightRow key={sub.id} sub={sub} badge="Free" onClick={() => focusItem(sub.id)} />
            ))}
          </div>
        </>
      )}

      {tab === "tips" && (
        <>
          <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
            <Lightbulb size={12} className="text-aurora-500" />
            Useful pointers
          </div>
          <ul className="flex flex-col gap-2.5 px-1 pb-0.5">
            {TIPS.map((tip) => (
              <li key={tip} className="flex gap-1.5 text-[11px] leading-snug text-ink-300">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-500" />
                {tip}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
