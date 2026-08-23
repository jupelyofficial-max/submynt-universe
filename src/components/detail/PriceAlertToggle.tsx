"use client";

import { Bell, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePriceAlertStore } from "@/store/usePriceAlertStore";

/** Capability 11 — pure UI/state, no backend to actually watch prices yet.
 * The enabled state is the only feedback; nothing here claims a
 * notification will be sent. */
export function PriceAlertToggle({ subscriptionId }: { subscriptionId: string }) {
  const enabled = usePriceAlertStore((s) => Boolean(s.enabled[subscriptionId]));
  const toggle = usePriceAlertStore((s) => s.toggle);

  return (
    <button
      onClick={() => toggle(subscriptionId)}
      aria-pressed={enabled}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
        enabled
          ? "border-aurora-500/40 bg-aurora-500/10 text-aurora-500"
          : "border-black/10 text-ink-300 hover:border-black/20"
      )}
    >
      {enabled ? <BellRing size={13} /> : <Bell size={13} />}
      {enabled ? "Alert enabled" : "Alert me if price drops"}
    </button>
  );
}
