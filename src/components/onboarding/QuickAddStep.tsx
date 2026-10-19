"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { Button } from "@/components/ui/Button";
import { SUBSCRIPTIONS_BY_ID } from "@/data/subscriptions";
import { cn, formatINR, monthlyEquivalent, planCycleAmount } from "@/lib/utils";
import {
  EMPTY_SELECTION,
  applyPlan,
  buildItems,
  filterServices,
  fromMonthly,
  hasMissingPrice,
  includesText,
  monthlyTotal,
  paySeparately,
  resolveQuick,
  shortCycle,
  toggleSelection,
  viaLabel,
  type Coverage,
  type QuickItem,
  type QuickSelection,
} from "@/lib/quickAdd";
import { switchBilling, type ServiceDetailsValue } from "./ServiceDetailsCard";

const money = (n: number) => (n > 0 ? formatINR(n) : "₹0");

/** All of the add flow's selection state. Lives in the flow (not in the
 * screens) so Back from the confirm screen — or from the bundle steps — keeps it. */
export function useQuickAdd(trackedIds: ReadonlySet<string>, initialPicks: string[] = []) {
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState<QuickSelection>({ ...EMPTY_SELECTION, picks: initialPicks });
  const [details, setDetails] = useState<Record<string, ServiceDetailsValue>>({});
  const [renewDay, setRenewDay] = useState<Record<string, number>>({});

  const res = useMemo(() => resolveQuick(sel, trackedIds), [sel, trackedIds]);
  const items = useMemo(() => buildItems(res, { details, renewDay }), [res, details, renewDay]);

  return {
    query,
    setQuery,
    res,
    items,
    details,
    renewDay,
    total: monthlyTotal(items),
    tap: (id: string) => setSel((prev) => toggleSelection(prev, resolveQuick(prev, trackedIds), id)),
    paySeparately: (id: string) => setSel((prev) => paySeparately(prev, id)),
    /** Merges what the "Add from a bundle" sub-flow confirmed into the selection. */
    addFromBundles: (input: { picks: string[]; details: Record<string, ServiceDetailsValue>; fixed: Record<string, Coverage> }) => {
      setSel((prev) => ({
        picks: [...prev.picks, ...input.picks.filter((id) => !prev.picks.includes(id))],
        separate: prev.separate,
        fixed: { ...prev.fixed, ...input.fixed },
      }));
      setDetails((prev) => ({ ...prev, ...input.details }));
    },
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

function ServiceRow({
  id,
  quick,
  trackedIds,
  nested = false,
}: {
  id: string;
  quick: QuickAdd;
  trackedIds: ReadonlySet<string>;
  nested?: boolean;
}) {
  const sub = SUBSCRIPTIONS_BY_ID[id];
  if (!sub) return null;
  const tracked = trackedIds.has(id);
  const state = quick.res.state[id] ?? "none";
  const coverage = quick.res.coverage[id];
  const bundled = state === "bundled";
  const on = state === "direct" || bundled;
  const from = fromMonthly(sub);
  const includes = includesText(id);
  // A price entered through the bundle steps replaces the catalogue's "from".
  const entered = state === "direct" ? quick.details[id] : undefined;
  const priceText =
    entered && entered.priceAmount !== null
      ? ` · ${formatINR(monthlyEquivalent(entered.priceAmount, entered.billing))}/mo`
      : from !== null
        ? ` · from ${formatINR(from)}/mo`
        : "";

  return (
    <button
      type="button"
      disabled={tracked || bundled}
      aria-pressed={on}
      onClick={() => quick.tap(id)}
      className={cn(
        "flex min-h-[56px] w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors",
        nested && "ml-6 w-[calc(100%-1.5rem)]",
        tracked || bundled ? "cursor-default" : "cursor-pointer",
        tracked ? "border-black/10 opacity-50" : bundled ? "border-black/10 bg-black/[0.03] opacity-70" : on ? "border-nebula-500 bg-nebula-500/10" : "border-black/10 hover:border-black/20"
      )}
    >
      <SubscriptionLogo subscription={sub} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink-0">{sub.name}</div>
        <div className="truncate text-xs text-ink-500">
          {tracked
            ? "Already tracked"
            : bundled && coverage
              ? `Included with ${coverage.name}`
              : `${sub.category}${priceText}`}
        </div>
        {includes && !tracked && <div className="truncate text-[11px] font-medium text-nebula-400">{includes}</div>}
      </div>
      <div
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
          on ? (bundled ? "border-black/20 bg-black/20 text-white" : "border-nebula-500 bg-nebula-500 text-white") : "border-black/15"
        )}
      >
        {on && <Check size={12} />}
      </div>
    </button>
  );
}

/** The row for each included service under a selected one, recursively. */
function NestedRows({ parentId, quick, trackedIds }: { parentId: string; quick: QuickAdd; trackedIds: ReadonlySet<string> }) {
  const children = quick.items.filter((i) => i.kind === "bundled" && i.coverage?.parentId === parentId);
  return (
    <>
      {children.map((c) => (
        <div key={c.id} className="flex flex-col gap-1.5">
          <ServiceRow id={c.id} quick={quick} trackedIds={trackedIds} nested />
          <NestedRows parentId={c.id} quick={quick} trackedIds={trackedIds} />
        </div>
      ))}
    </>
  );
}

export function QuickSelectScreen({
  quick,
  trackedIds,
  showBundleLink,
  onBundle,
  onNext,
}: {
  quick: QuickAdd;
  trackedIds: ReadonlySet<string>;
  showBundleLink: boolean;
  onBundle: () => void;
  onNext: () => void;
}) {
  const pinned = useMemo(() => new Set(quick.items.map((i) => i.id)), [quick.items]);
  const rest = useMemo(() => filterServices(quick.query).filter((s) => !pinned.has(s.id)), [quick.query, pinned]);
  // Selected rows stay at the top; included rows follow the service that includes them.
  const roots = quick.items.filter((i) => i.kind === "direct" || !i.coverage || !pinned.has(i.coverage.parentId));
  const count = quick.items.length;

  return (
    <>
      <div className="max-h-[65vh] overflow-y-auto px-5 py-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-ink-400">Tap everything you pay for.</p>
            {showBundleLink && (
              <button type="button" onClick={onBundle} className="shrink-0 text-xs font-medium text-nebula-400 hover:text-nebula-500 cursor-pointer">
                Add from a bundle instead →
              </button>
            )}
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

          {roots.length > 0 && (
            <section aria-label="Selected" className="flex flex-col gap-1.5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Selected · {count}</h3>
              {roots.map((r) => (
                <div key={r.id} className="flex flex-col gap-1.5">
                  <ServiceRow id={r.id} quick={quick} trackedIds={trackedIds} />
                  <NestedRows parentId={r.id} quick={quick} trackedIds={trackedIds} />
                </div>
              ))}
            </section>
          )}

          <section aria-label="Subscriptions" className="flex flex-col gap-1.5">
            {roots.length > 0 && <h3 className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-500">All services</h3>}
            {rest.map((sub) => (
              <ServiceRow key={sub.id} id={sub.id} quick={quick} trackedIds={trackedIds} />
            ))}
            {rest.length === 0 && <p className="py-4 text-center text-sm text-ink-500">No matches.</p>}
          </section>
        </div>
      </div>

      <div className="border-t border-black/10 px-5 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-ink-0" aria-live="polite">
            {count === 0 ? "Nothing selected yet" : `${count} selected · about ${money(quick.total)}/mo`}
          </p>
          <Button onClick={onNext} disabled={count === 0}>
            Continue
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
  // Bundle-sub-flow services whose plan row isn't being added (e.g. Family).
  const loose = quick.items.filter((i) => i.kind === "bundled" && !quick.items.some((p) => p.id === i.coverage?.parentId));
  const missing = hasMissingPrice(quick.items);
  const monthly = quick.total;

  return (
    <>
      <div className="max-h-[65vh] overflow-y-auto px-5 py-4">
        <div className="flex flex-col gap-2.5">
          {direct.map((item) => (
            <DirectRow key={item.id} item={item} quick={quick} />
          ))}
          {loose.length > 0 && (
            <div className="rounded-xl border border-black/10 bg-void-900/40 p-3">
              <p className="text-xs font-semibold text-ink-0">Included with your bundles</p>
              <IncludedList items={loose} quick={quick} />
            </div>
          )}
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

      {nested.length > 0 && <IncludedList items={nested} quick={quick} />}
    </div>
  );
}

/** Services something includes, indented at ₹0 — with their own children below. */
function IncludedList({ items, quick }: { items: QuickItem[]; quick: QuickAdd }) {
  return (
    <ul className="mt-2 flex flex-col gap-1.5 border-l-2 border-nebula-500/30 pl-3">
      {items.map((c) => {
        const sub = SUBSCRIPTIONS_BY_ID[c.id];
        if (!sub || !c.coverage) return null;
        const below = quick.items.filter((i) => i.kind === "bundled" && i.coverage?.parentId === c.id);
        const plan = c.value.planName !== "Bundled" ? ` · ${c.value.planName}` : "";
        return (
          <li key={c.id}>
            <div className="flex items-start gap-2">
              <SubscriptionLogo subscription={sub} size="xs" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium leading-tight text-ink-0">{sub.name}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-ink-400">
                  <span>
                    ₹0 · {viaLabel(c.coverage)}
                    {plan}
                  </span>
                  <button type="button" onClick={() => quick.paySeparately(c.id)} className="font-medium text-nebula-400 hover:text-nebula-500 cursor-pointer">
                    I pay separately
                  </button>
                </div>
              </div>
            </div>
            {below.length > 0 && <IncludedList items={below} quick={quick} />}
          </li>
        );
      })}
    </ul>
  );
}
