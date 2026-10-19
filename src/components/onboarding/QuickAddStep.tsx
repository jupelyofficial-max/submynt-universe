"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { Button } from "@/components/ui/Button";
import { SUBSCRIPTIONS_BY_ID } from "@/data/subscriptions";
import { QUICK_ADD_CHIPS } from "@/data/quickAdd";
import { cn, formatINR, planCycleAmount } from "@/lib/utils";
import {
  applyPlan,
  buildItems,
  filterServices,
  fromMonthly,
  hasMissingPrice,
  monthlyTotal,
  nextMode,
  resolveQuick,
  shortCycle,
  viaLabel,
  type QuickItem,
  type QuickMode,
} from "@/lib/quickAdd";
import { switchBilling, type ServiceDetailsValue } from "./ServiceDetailsCard";

const money = (n: number) => (n > 0 ? formatINR(n) : "₹0");

/** All of the quick add's selection state. Lives in the add flow (not in the
 * screens) so Back from screen 2 — or from the detailed flow — keeps it. */
export function useQuickAdd(trackedIds: ReadonlySet<string>) {
  const [chip, setChip] = useState("all");
  const [query, setQuery] = useState("");
  const [modes, setModes] = useState<Record<string, QuickMode>>({});
  const [details, setDetails] = useState<Record<string, ServiceDetailsValue>>({});
  const [renewDay, setRenewDay] = useState<Record<string, number>>({});

  const res = useMemo(() => resolveQuick(modes, trackedIds), [modes, trackedIds]);
  const items = useMemo(() => buildItems(res, { details, renewDay }), [res, details, renewDay]);

  function setMode(id: string, mode: QuickMode | undefined) {
    setModes((prev) => {
      const next = { ...prev };
      if (mode === undefined) delete next[id];
      else next[id] = mode;
      return next;
    });
  }

  return {
    chip,
    setChip,
    query,
    setQuery,
    res,
    items,
    details,
    renewDay,
    total: monthlyTotal(items),
    tap: (id: string) => setMode(id, nextMode(res, id)),
    payDirectly: (id: string) => setMode(id, "direct"),
    setDetail: (id: string, value: ServiceDetailsValue) => setDetails((prev) => ({ ...prev, [id]: value })),
    setDay: (id: string, day: number | undefined) =>
      setRenewDay((prev) => {
        const next = { ...prev };
        if (day === undefined) delete next[id];
        else next[id] = day;
        return next;
      }),
  };
}
export type QuickAdd = ReturnType<typeof useQuickAdd>;

// ---------------------------------------------------------------- screen 1

export function QuickSelectScreen({
  quick,
  trackedIds,
  onCategory,
  onNext,
  onFast,
  onDetailed,
}: {
  quick: QuickAdd;
  trackedIds: ReadonlySet<string>;
  onCategory: (chipId: string) => void;
  onNext: () => void;
  onFast: () => void;
  onDetailed: () => void;
}) {
  const shown = useMemo(() => filterServices(quick.chip, quick.query), [quick.chip, quick.query]);
  const count = quick.items.length;

  return (
    <>
      <div className="max-h-[65vh] overflow-y-auto px-5 py-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-ink-400">Tap everything you pay for.</p>
            <button type="button" onClick={onDetailed} className="shrink-0 text-xs font-medium text-nebula-400 hover:text-nebula-500 cursor-pointer">
              Add with details →
            </button>
          </div>

          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              value={quick.query}
              onChange={(e) => quick.setQuery(e.target.value)}
              aria-label="Search subscriptions"
              placeholder="Search subscriptions…"
              className="w-full rounded-xl border border-black/10 bg-void-900/70 py-2.5 pl-9 pr-3 text-sm text-ink-0 outline-none placeholder:text-ink-500 focus:border-aurora-500/50"
            />
          </div>

          {/* Scrolls sideways on phones; the sheet's own scroller clips it. */}
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1" role="group" aria-label="Categories">
            {QUICK_ADD_CHIPS.map((c) => {
              const active = !quick.query.trim() && quick.chip === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onCategory(c.id)}
                  className={cn(
                    "h-10 shrink-0 rounded-full border px-4 text-xs font-medium transition-colors cursor-pointer",
                    active ? "border-nebula-500 bg-nebula-500/10 text-nebula-400" : "border-black/10 text-ink-300 hover:border-black/20"
                  )}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="group" aria-label={quick.query.trim() ? "Search results" : "Subscriptions"}>
            {shown.map((sub) => {
              const tracked = trackedIds.has(sub.id);
              const state = quick.res.state[sub.id] ?? "none";
              const coverage = quick.res.coverage[sub.id];
              const on = state === "direct" || state === "bundled";
              const from = fromMonthly(sub);
              return (
                <button
                  key={sub.id}
                  type="button"
                  disabled={tracked}
                  aria-pressed={on}
                  title={sub.name}
                  onClick={() => quick.tap(sub.id)}
                  className={cn(
                    "relative flex min-h-[104px] flex-col items-center gap-1 rounded-xl border px-1.5 py-2.5 text-center transition-colors sm:px-2 sm:py-3",
                    tracked ? "cursor-default border-black/10 opacity-50" : "cursor-pointer",
                    on ? "border-nebula-500 bg-nebula-500/10" : state === "maybe" ? "border-dashed border-nebula-500/60" : !tracked && "border-black/10 hover:border-black/20"
                  )}
                >
                  <SubscriptionLogo subscription={sub} size="xs" />
                  <span className="line-clamp-2 w-full break-words text-[11px] font-medium leading-tight text-ink-0 sm:text-xs">{sub.name}</span>
                  <span className="text-[10px] leading-tight text-ink-500 sm:text-[11px]">
                    {tracked
                      ? "Already tracked"
                      : state === "bundled" && coverage
                        ? `Included with ${viaLabel(coverage).slice(4)}`
                        : state === "maybe"
                          ? "May be included in your plan — tap to confirm"
                          : from !== null
                            ? `from ${formatINR(from)}/mo`
                            : ""}
                  </span>
                  {on && (
                    <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-nebula-500 text-white">
                      <Check size={10} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {shown.length === 0 && <p className="py-4 text-center text-sm text-ink-500">No matches. Try &ldquo;Add with details&rdquo; to add it yourself.</p>}
        </div>
      </div>

      <div className="border-t border-black/10 px-5 py-3">
        <p className="mb-2 text-sm font-medium text-ink-0" aria-live="polite">
          {count === 0 ? "Nothing selected yet" : `${count} selected · about ${money(quick.total)}/mo`}
        </p>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onFast}
            disabled={count === 0}
            className="text-xs font-medium text-nebula-400 hover:text-nebula-500 disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
          >
            Add at usual prices
          </button>
          <Button onClick={onNext} disabled={count === 0}>
            Next
          </Button>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- screen 2

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const FLOW_CYCLES = [
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Annual" },
] as const;

export function QuickConfirmScreen({ quick, onBack, onConfirm }: { quick: QuickAdd; onBack: () => void; onConfirm: () => void }) {
  const direct = quick.items.filter((i) => i.kind === "direct");
  const missing = hasMissingPrice(quick.items);
  const monthly = quick.total;

  return (
    <>
      <div className="max-h-[65vh] overflow-y-auto px-5 py-4">
        <div className="flex flex-col gap-2.5">
          {direct.map((item) => (
            <DirectRow key={item.id} item={item} quick={quick} />
          ))}
        </div>
      </div>

      <div className="border-t border-black/10 px-5 py-3">
        <p className="mb-2 text-sm font-medium text-ink-0" aria-live="polite">
          Total {money(monthly)}/month · {money(monthly * 12)}/year
        </p>
        {missing && <p className="mb-2 text-xs text-red-400">Enter a price for every subscription to continue.</p>}
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onConfirm} disabled={missing || quick.items.length === 0}>
            Add {quick.items.length} subscription{quick.items.length === 1 ? "" : "s"}
          </Button>
        </div>
      </div>
    </>
  );
}

function DirectRow({ item, quick }: { item: QuickItem; quick: QuickAdd }) {
  const sub = SUBSCRIPTIONS_BY_ID[item.id];
  if (!sub) return null;
  const value = item.value;
  const day = quick.renewDay[item.id];
  // Edits start from the cheapest-plan default the first time a row is touched.
  const edit = (next: ServiceDetailsValue) => quick.setDetail(item.id, next);
  const nested = quick.items.filter((i) => i.kind === "bundled" && i.coverage?.parentId === item.id);

  return (
    <div className="rounded-xl border border-black/10 bg-void-900/40 p-3">
      <div className="flex items-center gap-2.5">
        <SubscriptionLogo subscription={sub} size="xs" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-0">{sub.name}</span>
        <div role="group" aria-label={`${sub.name} billing cycle`} className="flex shrink-0 overflow-hidden rounded-lg border border-black/10">
          {FLOW_CYCLES.map((c) => (
            <button
              key={c.value}
              type="button"
              aria-pressed={value.billing === c.value}
              onClick={() => value.billing !== c.value && edit(switchBilling(sub, value, c.value))}
              className={cn("h-8 px-2.5 text-xs font-medium cursor-pointer", value.billing === c.value ? "bg-nebula-500/15 text-nebula-400" : "text-ink-300 hover:bg-black/5")}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {sub.plans.length > 1 && (
        <div role="group" aria-label={`${sub.name} plan`} className="mt-2 flex flex-wrap gap-1.5">
          {sub.plans.map((p) => {
            const active = value.planName === p.name && value.billing === p.billing;
            return (
              <button
                key={`${p.name}-${p.billing}`}
                type="button"
                aria-pressed={active}
                onClick={() => edit(applyPlan(value, p))}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium cursor-pointer",
                  active ? "border-nebula-500 bg-nebula-500/10 text-nebula-400" : "border-black/10 text-ink-300 hover:border-black/20"
                )}
              >
                {p.name} · {formatINR(planCycleAmount(p))}/{shortCycle(p.billing)}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex items-center gap-1.5 text-xs text-ink-300">
          ₹
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={value.priceAmount ?? ""}
            placeholder="Price"
            aria-label={`${sub.name} price per ${value.billing === "annual" ? "year" : "month"}`}
            aria-invalid={value.priceAmount === null}
            onChange={(e) => edit({ ...value, priceAmount: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) })}
            className={cn(
              "h-9 w-24 rounded-lg border bg-void-900/70 px-2 text-sm text-ink-0 outline-none focus:border-aurora-500/50",
              value.priceAmount === null ? "border-red-400/60" : "border-black/10"
            )}
          />
          /{value.billing === "annual" ? "year" : "month"}
        </label>

        {value.billing === "monthly" ? (
          <label className="flex items-center gap-1.5 text-xs text-ink-300">
            Renews on day
            <select
              value={day ?? ""}
              aria-label={`${sub.name} renewal day of the month, for reminders`}
              onChange={(e) => quick.setDay(item.id, e.target.value === "" ? undefined : Number(e.target.value))}
              className="h-9 rounded-lg border border-black/10 bg-void-900/70 px-2 text-sm text-ink-0 outline-none focus:border-aurora-500/50"
            >
              <option value="">—</option>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <span className="text-ink-500">for reminders</span>
          </label>
        ) : (
          <span className="text-[11px] text-ink-500">Set the exact renewal date later from its detail panel.</span>
        )}
      </div>
      {value.priceAmount === null && (
        <p className="mt-1.5 text-[11px] text-red-400">No standard {value.billing} price for this one. Enter what you pay.</p>
      )}

      {nested.length > 0 && <NestedBundled parentId={item.id} quick={quick} depth={1} />}
    </div>
  );
}

/** Services a parent includes, indented under it at ₹0. */
function NestedBundled({ parentId, quick, depth }: { parentId: string; quick: QuickAdd; depth: number }) {
  const children = quick.items.filter((i) => i.kind === "bundled" && i.coverage?.parentId === parentId);
  return (
    <ul className="mt-2 flex flex-col gap-1.5 border-l-2 border-nebula-500/30 pl-3" style={{ marginLeft: depth > 1 ? 12 : 0 }}>
      {children.map((c) => {
        const sub = SUBSCRIPTIONS_BY_ID[c.id];
        if (!sub || !c.coverage) return null;
        return (
          <li key={c.id}>
            <div className="flex items-start gap-2">
              <SubscriptionLogo subscription={sub} size="xs" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium leading-tight text-ink-0">{sub.name}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-ink-400">
                  <span>₹0 · {viaLabel(c.coverage)}</span>
                  <button type="button" onClick={() => quick.payDirectly(c.id)} className="font-medium text-nebula-400 hover:text-nebula-500 cursor-pointer">
                    I pay separately
                  </button>
                </div>
              </div>
            </div>
            <NestedBundled parentId={c.id} quick={quick} depth={depth + 1} />
          </li>
        );
      })}
    </ul>
  );
}
