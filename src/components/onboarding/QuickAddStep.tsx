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

/** Everything a selected service brings with it (its children, and theirs). */
function includedUnder(rootId: string, items: QuickItem[]): QuickItem[] {
  const out: QuickItem[] = [];
  const seen = new Set<string>([rootId]);
  const walk = (parentId: string) => {
    for (const i of items) {
      if (i.kind !== "bundled" || i.coverage?.parentId !== parentId || seen.has(i.id)) continue;
      seen.add(i.id);
      out.push(i);
      walk(i.id);
    }
  };
  walk(rootId);
  return out;
}

/** The "＋ included  [logo Name] …" line inside a selected parent's card. */
function IncludedChips({ items }: { items: QuickItem[] }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span aria-hidden="true" className="text-sm font-semibold text-[var(--af-green-ink)]">
        ＋
      </span>
      <span className="text-xs font-semibold text-[var(--af-green-ink)]">included</span>
      {items.map((c) => {
        const sub = SUBSCRIPTIONS_BY_ID[c.id];
        if (!sub) return null;
        return (
          <span
            key={c.id}
            className="inline-flex items-center gap-1 rounded-full border border-[var(--af-green)]/40! bg-[var(--af-card)] py-0.5 pl-1 pr-2 text-xs font-medium text-[var(--af-green-ink)]"
          >
            <SubscriptionLogo subscription={sub} size="xs" bare style={{ width: 16, height: 16, fontSize: 7 }} />
            {sub.name}
          </span>
        );
      })}
    </div>
  );
}

function ServiceCard({
  id,
  quick,
  trackedIds,
  included = [],
}: {
  id: string;
  quick: QuickAdd;
  trackedIds: ReadonlySet<string>;
  included?: QuickItem[];
}) {
  const sub = SUBSCRIPTIONS_BY_ID[id];
  if (!sub) return null;
  const tracked = trackedIds.has(id);
  const on = (quick.res.state[id] ?? "none") === "direct";
  const from = fromMonthly(sub);
  const includes = includesText(id);
  // A price entered through the bundle steps replaces the catalogue's "from".
  const entered = on ? quick.details[id] : undefined;
  const price =
    entered && entered.priceAmount !== null ? { label: "", amount: monthlyEquivalent(entered.priceAmount, entered.billing) } : from !== null ? { label: "from", amount: from } : null;

  return (
    <button
      type="button"
      disabled={tracked}
      aria-pressed={on}
      onClick={() => quick.tap(id)}
      className={cn(
        "af-shadow flex w-full flex-col rounded-2xl text-left transition-colors",
        on ? "border-2 border-[var(--af-green)]! bg-[var(--af-green-tint)] p-[11px]" : "border border-[var(--af-border)]! bg-[var(--af-card)] p-3",
        tracked ? "cursor-default" : "cursor-pointer",
        !on && !tracked && "hover:border-[var(--af-meta)]!"
      )}
    >
      <div className="flex w-full items-center gap-3">
        <SubscriptionLogo subscription={sub} size="sm" className={tracked ? "grayscale" : undefined} />
        <div className="min-w-0 flex-1">
          <div className={cn("text-base font-semibold leading-snug", tracked ? "text-[var(--af-meta)]" : "text-[var(--af-ink)]")}>{sub.name}</div>
          <span className="mt-1 inline-flex rounded-full bg-[var(--af-pill-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--af-pill-ink)]">{sub.category}</span>
          {includes && !on && !tracked && <div className="mt-1 text-xs text-[var(--af-meta)]">{includes}</div>}
        </div>
        <div className="flex shrink-0 flex-col items-end leading-none">
          {tracked ? (
            <span className="text-xs font-medium text-[var(--af-meta)]">Already tracked</span>
          ) : (
            price && (
              <>
                <span className="mb-0.5 h-3 text-[10px] font-medium uppercase tracking-wide text-[var(--af-meta)]">{price.label}</span>
                <span className="text-[17px] font-bold text-[var(--af-ink)]">
                  {formatINR(price.amount)}
                  <span className="text-sm font-semibold">/mo</span>
                </span>
              </>
            )
          )}
        </div>
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
            on ? "bg-[var(--af-green-solid)] text-white" : "border-2 border-[var(--af-border)]!"
          )}
        >
          {on && <Check size={14} strokeWidth={3} />}
        </span>
      </div>
      {on && included.length > 0 && <IncludedChips items={included} />}
    </button>
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
  // Included services live inside their parent's card — never as rows of
  // their own while it's selected — and don't count as "selected".
  const pinned = useMemo(() => new Set(quick.items.map((i) => i.id)), [quick.items]);
  const rest = useMemo(() => filterServices(quick.query).filter((s) => !pinned.has(s.id)), [quick.query, pinned]);
  const direct = quick.items.filter((i) => i.kind === "direct");
  const orphans = useMemo(() => {
    const covered = new Set(direct.flatMap((d) => includedUnder(d.id, quick.items).map((i) => i.id)));
    return quick.items.filter((i) => i.kind === "bundled" && !covered.has(i.id));
  }, [direct, quick.items]);
  const included = quick.items.length - direct.length;

  return (
    <>
      <div className="max-h-[65vh] overflow-y-auto px-5 py-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-[var(--af-meta)]">Tap everything you pay for.</p>
            {showBundleLink && (
              <button type="button" onClick={onBundle} className="shrink-0 text-xs font-semibold text-[var(--af-green-ink)] hover:underline cursor-pointer">
                Add from a bundle instead →
              </button>
            )}
          </div>

          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--af-meta)]" />
            <input
              value={quick.query}
              onChange={(e) => quick.setQuery(e.target.value)}
              aria-label="Search subscriptions"
              placeholder="Search subscriptions…"
              className="w-full rounded-xl border border-[var(--af-border)]! bg-[var(--af-search)] py-2.5 pl-9 pr-3 text-sm text-[var(--af-ink)] outline-none placeholder:text-[var(--af-meta)] focus:border-[var(--af-green)]!"
            />
          </div>

          {(direct.length > 0 || orphans.length > 0) && (
            <section aria-label="Selected" className="flex flex-col gap-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--af-meta)]">Selected · {direct.length}</h3>
              {direct.map((r) => (
                <ServiceCard key={r.id} id={r.id} quick={quick} trackedIds={trackedIds} included={includedUnder(r.id, quick.items)} />
              ))}
              {orphans.length > 0 && (
                <div className="af-shadow rounded-2xl border border-[var(--af-border)]! bg-[var(--af-card)] p-3">
                  <p className="text-xs font-semibold text-[var(--af-ink)]">Included with your bundles</p>
                  <IncludedChips items={orphans} />
                </div>
              )}
            </section>
          )}

          <section aria-label="Subscriptions" className="flex flex-col gap-2">
            {(direct.length > 0 || orphans.length > 0) && <h3 className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--af-meta)]">All services</h3>}
            {rest.map((sub) => (
              <ServiceCard key={sub.id} id={sub.id} quick={quick} trackedIds={trackedIds} />
            ))}
            {rest.length === 0 && <p className="py-4 text-center text-sm text-[var(--af-meta)]">No matches.</p>}
          </section>
        </div>
      </div>

      <div className="border-t border-[var(--af-border)]! bg-[var(--af-bg)] px-5 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0" aria-live="polite">
            {quick.items.length === 0 ? (
              <span className="text-sm font-medium text-[var(--af-ink)]">Nothing selected yet</span>
            ) : (
              <>
                <span className="block text-[15px] font-bold text-[var(--af-ink)]">
                  {direct.length} subscription{direct.length === 1 ? "" : "s"} · {money(quick.total)}/mo
                </span>
                {included > 0 && <span className="block text-xs font-semibold text-[var(--af-green-ink)]">+{included} included</span>}
              </>
            )}
          </p>
          <Button onClick={onNext} disabled={quick.items.length === 0}>
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
            <div className="rounded-xl border border-[var(--af-border)]! bg-[var(--af-card)] af-shadow p-3">
              <p className="text-xs font-semibold text-[var(--af-ink)]">Included with your bundles</p>
              <IncludedList items={loose} quick={quick} />
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-[var(--af-border)]! bg-[var(--af-bg)] px-5 py-3">
        <p className="mb-2 text-sm font-medium text-[var(--af-ink)]" aria-live="polite">
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
    <div className="rounded-xl border border-[var(--af-border)]! bg-[var(--af-card)] af-shadow p-3">
      <div className="flex items-center gap-2.5">
        <SubscriptionLogo subscription={sub} size="xs" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--af-ink)]">{sub.name}</span>
        <div role="group" aria-label={`${sub.name} billing cycle`} className="flex shrink-0 overflow-hidden rounded-lg border border-[var(--af-border)]!">
          {FLOW_CYCLES.map((c) => (
            <button
              key={c.value}
              type="button"
              aria-pressed={value.billing === c.value}
              onClick={() => value.billing !== c.value && edit(switchBilling(sub, value, c.value))}
              className={cn("h-8 px-2.5 text-xs font-medium cursor-pointer", value.billing === c.value ? "bg-[var(--af-green-tint)] text-[var(--af-green-ink)]" : "text-[var(--af-meta)] hover:bg-[var(--af-pill-bg)]")}
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
                  active ? "border-[var(--af-green)]! bg-[var(--af-green-tint)] text-[var(--af-green-ink)]" : "border-[var(--af-border)]! text-[var(--af-meta)] hover:border-[var(--af-meta)]!"
                )}
              >
                {p.name} · {formatINR(planCycleAmount(p))}/{shortCycle(p.billing)}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex items-center gap-1.5 text-xs text-[var(--af-meta)]">
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
              "h-9 w-24 rounded-lg border bg-[var(--af-card)] px-2 text-sm text-[var(--af-ink)] outline-none focus:border-[var(--af-green)]!",
              value.priceAmount === null ? "border-red-500!" : "border-[var(--af-border)]!"
            )}
          />
          /{value.billing === "annual" ? "year" : "month"}
        </label>

        {value.billing === "monthly" ? (
          <label className="flex items-center gap-1.5 text-xs text-[var(--af-meta)]">
            Renews on day
            <select
              value={day ?? ""}
              aria-label={`${sub.name} renewal day of the month, for reminders`}
              onChange={(e) => quick.setDay(item.id, e.target.value === "" ? undefined : Number(e.target.value))}
              className="h-9 rounded-lg border border-[var(--af-border)]! bg-[var(--af-card)] px-2 text-sm text-[var(--af-ink)] outline-none focus:border-[var(--af-green)]!"
            >
              <option value="">—</option>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <span className="text-[var(--af-meta)]">for reminders</span>
          </label>
        ) : (
          <span className="text-[11px] text-[var(--af-meta)]">Set the exact renewal date later from its detail panel.</span>
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
    <ul className="mt-2 flex flex-col gap-1.5 border-l-2 border-[var(--af-green)]/40! pl-3">
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
                <div className="text-xs font-medium leading-tight text-[var(--af-ink)]">{sub.name}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-[var(--af-meta)]">
                  <span>
                    ₹0 · {viaLabel(c.coverage)}
                    {plan}
                  </span>
                  <button type="button" onClick={() => quick.paySeparately(c.id)} className="font-medium text-[var(--af-green-ink)] hover:underline cursor-pointer">
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
