import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { SUBSCRIPTIONS } from "@/data/subscriptions";
import { getSponsoredSubscriptionIds } from "@/data/vendors";

export function SponsoredStrip({ compact }: { compact?: boolean }) {
  // Real structured vendor/sponsorship data (data/vendors.ts) — not a
  // hardcoded id list — is the single source of truth for what's sponsored.
  const items = getSponsoredSubscriptionIds()
    .map((id) => SUBSCRIPTIONS.find((s) => s.id === id))
    .filter((s) => s !== undefined);
  if (items.length === 0) return null;

  return (
    <div
      className={
        compact
          ? "glass-panel flex items-center gap-2 rounded-full px-3 py-1.5 shadow-md shadow-black/5"
          : "glass-panel flex items-center gap-3 rounded-full px-4 py-2 shadow-lg shadow-black/5"
      }
    >
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-ink-500">Sponsored</span>
      <div className={compact ? "flex items-center gap-1.5" : "flex items-center gap-2"}>
        {items.map((sub) => (
          <SubscriptionLogo
            key={sub.id}
            subscription={sub}
            size={compact ? "xs" : "sm"}
            className="opacity-85 transition-opacity hover:opacity-100"
            bare
          />
        ))}
      </div>
    </div>
  );
}
