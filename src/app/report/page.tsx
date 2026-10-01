"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, FileText, Gem, Layers, PiggyBank, Wallet } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/Badge";
import { SUBSCRIPTIONS_BY_ID } from "@/data/subscriptions";
import { daysUntil, formatDate, formatINR, formatOwnedPrice } from "@/lib/utils";
import { computeSubmyntScore, type Recommendation } from "@/lib/submyntScore";
import { computeMonthlySpend, computePotentialAnnualSavings, computeTotalValue, type OwnedItem } from "@/lib/subscriptionStats";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import type { AccessType } from "@/types/subscription";

const ACCESS_TYPE_LABELS: Record<AccessType, string> = {
  direct: "Direct",
  bundled: "Bundled",
  promotional: "Promotional",
  family: "Family",
  free: "Free",
};

const RECOMMENDATION_LABELS: Record<Recommendation, string> = {
  keep: "Keep",
  optimize: "Optimize",
  reassess: "Reassess",
};

const RECOMMENDATION_TONES: Record<Recommendation, "neutral" | "aurora" | "gold" | "nebula" | "danger"> = {
  keep: "nebula",
  optimize: "gold",
  reassess: "danger",
};

const RENEWING_SOON_DAYS = 30;

// A snapshot of the current portfolio, generated fresh each time this page
// is opened — not a stored month-over-month history (no such data exists
// yet; adding one would mean new schema, out of scope this sprint).
export default function MonthlyReportPage() {
  const owned = useMySubscriptionsStore((s) => s.owned);
  const [copied, setCopied] = useState(false);

  const items: OwnedItem[] = useMemo(
    () =>
      owned
        .map((o) => ({ owned: o, sub: SUBSCRIPTIONS_BY_ID[o.subscriptionId] }))
        .filter((x): x is OwnedItem => Boolean(x.sub)),
    [owned]
  );

  const monthLabel = useMemo(() => new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date()), []);

  const monthlySpend = useMemo(() => computeMonthlySpend(items), [items]);
  const totalValue = useMemo(() => computeTotalValue(items), [items]);
  const potentialAnnualSavings = useMemo(() => computePotentialAnnualSavings(items), [items]);

  // Reuses Sprint 4's usage_frequency field — "unused" means the user
  // themselves recorded Rarely/Never, not a guess.
  const unusedItems = useMemo(
    () => items.filter((x) => x.owned.usageFrequency === "rarely" || x.owned.usageFrequency === "never"),
    [items]
  );
  const unusedMonthlyCost = useMemo(
    () => unusedItems.filter((x) => (x.owned.accessType ?? "direct") === "direct").reduce((sum, x) => sum + x.owned.priceMonthly, 0),
    [unusedItems]
  );

  const renewingSoon = useMemo(
    () =>
      items
        .filter((x) => { const d = daysUntil(x.owned.nextRenewal); return d >= 0 && d <= RENEWING_SOON_DAYS; })
        .sort((a, b) => new Date(a.owned.nextRenewal).getTime() - new Date(b.owned.nextRenewal).getTime()),
    [items]
  );

  // Reuses Sprint 4's computeSubmyntScore verbatim — no new scoring logic.
  const scored = useMemo(
    () => items.map((x) => ({ ...x, result: computeSubmyntScore(x.sub, x.owned.accessType ?? "direct", x.owned.usageFrequency) })),
    [items]
  );
  const reassessItems = useMemo(() => scored.filter((x) => x.result.recommendation === "reassess"), [scored]);

  function buildReportText(): string {
    const lines = [
      `Submynt Monthly Report — ${monthLabel}`,
      "",
      `${items.length} services tracked`,
      `Monthly spend: ${formatINR(monthlySpend)}/mo`,
      `Total value: ${formatINR(totalValue)}/mo`,
      `Potential annual savings: ${formatINR(potentialAnnualSavings)}`,
      "",
    ];
    if (unusedItems.length > 0) {
      lines.push(`Rarely/never used (${unusedItems.length}):`);
      for (const x of unusedItems) lines.push(`  - ${x.sub.name} (${formatOwnedPrice(x.owned.priceMonthly, x.owned.accessType ?? "direct")}/mo)`);
      lines.push("");
    }
    if (reassessItems.length > 0) {
      lines.push(`Worth reassessing (${reassessItems.length}):`);
      for (const x of reassessItems) lines.push(`  - ${x.sub.name}: ${x.result.reasons.join(", ")}`);
      lines.push("");
    }
    if (renewingSoon.length > 0) {
      lines.push(`Renewing in the next ${RENEWING_SOON_DAYS} days (${renewingSoon.length}):`);
      for (const x of renewingSoon) lines.push(`  - ${x.sub.name} on ${formatDate(x.owned.nextRenewal)}`);
    }
    return lines.join("\n");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildReportText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can be denied/unavailable — the report still
      // reads fine on-screen, nothing else depends on this succeeding.
    }
  }

  const isEmpty = items.length === 0;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 lg:px-8">
      <Link
        href="/my-subscriptions"
        className="mb-4 inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm text-ink-300 transition-colors hover:bg-black/5 hover:text-ink-0"
      >
        <ArrowLeft size={16} />
        Back
      </Link>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-nebula-500/15 text-nebula-400">
            <FileText size={20} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink-0">Monthly Report</h1>
            <p className="text-sm text-ink-400">{monthLabel}</p>
          </div>
        </div>
        {!isEmpty && (
          <button
            onClick={handleCopy}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-black/10 px-3 text-sm text-ink-200 transition-colors hover:bg-black/5 cursor-pointer"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy report"}
          </button>
        )}
      </div>

      {isEmpty ? (
        <div className="glass-panel flex flex-col items-center gap-3 rounded-2xl p-16 text-center">
          <p className="font-display text-lg text-ink-0">Nothing to report yet</p>
          <p className="max-w-sm text-sm text-ink-400">Track a subscription first and this report fills in automatically.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={<Layers size={16} />} label="Services" value={String(items.length)} />
            <StatCard icon={<Wallet size={16} />} label="Monthly spend" value={`${formatINR(monthlySpend)}/mo`} />
            <StatCard icon={<Gem size={16} />} label="Total value" value={`${formatINR(totalValue)}/mo`} />
            <StatCard icon={<PiggyBank size={16} />} label="Potential annual savings" value={formatINR(potentialAnnualSavings)} />
          </div>

          {unusedItems.length > 0 && (
            <ReportSection title={`Rarely or never used (${unusedItems.length})`}>
              <p className="mb-3 text-xs text-ink-500">
                You marked these as rarely/never used
                {unusedMonthlyCost > 0 ? ` — ${formatINR(unusedMonthlyCost)}/mo going toward things you don't use much.` : "."}
              </p>
              <div className="flex flex-col gap-1.5">
                {unusedItems.map((x) => (
                  <div key={x.owned.ownedId} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-ink-0">{x.sub.name}</span>
                    <span className="text-ink-400">
                      {formatOwnedPrice(x.owned.priceMonthly, x.owned.accessType ?? "direct")}
                      {x.owned.priceMonthly > 0 ? "/mo" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </ReportSection>
          )}

          {reassessItems.length > 0 && (
            <ReportSection title={`Worth reassessing (${reassessItems.length})`}>
              <div className="flex flex-col gap-2">
                {reassessItems.map((x) => (
                  <div key={x.owned.ownedId} className="rounded-lg border border-black/10 px-2.5 py-2">
                    <div className="mb-0.5 flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-ink-0">{x.sub.name}</span>
                      <Badge tone={RECOMMENDATION_TONES[x.result.recommendation]}>{RECOMMENDATION_LABELS[x.result.recommendation]}</Badge>
                    </div>
                    <p className="text-[11px] text-ink-500">{x.result.reasons.join(" · ")}</p>
                  </div>
                ))}
              </div>
            </ReportSection>
          )}

          {renewingSoon.length > 0 && (
            <ReportSection title={`Renewing in the next ${RENEWING_SOON_DAYS} days (${renewingSoon.length})`}>
              <div className="flex flex-col gap-1.5">
                {renewingSoon.map((x) => (
                  <div key={x.owned.ownedId} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-1.5 text-ink-0">
                      {(x.owned.accessType ?? "direct") !== "direct" && (
                        <Badge tone="neutral">{ACCESS_TYPE_LABELS[x.owned.accessType ?? "direct"]}</Badge>
                      )}
                      {x.sub.name}
                    </span>
                    <span className="text-ink-400">{formatDate(x.owned.nextRenewal)}</span>
                  </div>
                ))}
              </div>
            </ReportSection>
          )}
        </div>
      )}
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-panel rounded-2xl p-4">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-500">{title}</h2>
      {children}
    </div>
  );
}
