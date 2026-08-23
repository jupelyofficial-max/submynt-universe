import { AlertTriangle, CircleDashed, ShieldAlert, ShieldCheck } from "lucide-react";
import { computeVerificationState } from "@/lib/verification/freshness";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { VerifiedField } from "@/types/verification";

/**
 * Four real states, four distinct treatments — never let UNVERIFIED or
 * STALE read as confidently as VERIFIED. Color system: green = verified,
 * amber = caution/unverified, matching the app-wide convention — UNVERIFIED
 * is amber rather than alarmingly red since it's the expected state for
 * every record in today's catalogue, not an error condition.
 */
export function VerificationBadge({ field, freshnessDays }: { field: VerifiedField<unknown>; freshnessDays: number }) {
  const state = computeVerificationState(field, freshnessDays);

  const config = {
    VERIFIED: {
      icon: ShieldCheck,
      tone: "border-nebula-500/30 bg-nebula-500/10 text-nebula-500",
      title: "✓ Verified by Submynt",
      subtitle: field.verifiedAt ? `Official source · Verified ${formatDate(field.verifiedAt)}` : "Official source",
    },
    PARTIALLY_VERIFIED: {
      icon: ShieldAlert,
      tone: "border-gold-500/30 bg-gold-500/10 text-gold-400",
      title: "◐ Partially verified",
      subtitle: field.verifiedAt ? `Some details unconfirmed · Verified ${formatDate(field.verifiedAt)}` : "Some details unconfirmed",
    },
    STALE: {
      icon: AlertTriangle,
      tone: "border-gold-500/30 bg-gold-500/10 text-gold-400",
      title: "⚠ Price may have changed",
      subtitle: field.verifiedAt ? `Last verified ${formatDate(field.verifiedAt)}` : "Verification expired",
    },
    UNVERIFIED: {
      icon: CircleDashed,
      tone: "border-gold-500/30 bg-gold-500/10 text-gold-500",
      title: "Unverified",
      subtitle: "Submynt demo data — no source on file",
    },
  }[state];

  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-2 rounded-xl border px-2.5 py-1.5", config.tone)}>
      <Icon size={14} className="shrink-0" />
      <div className="min-w-0 leading-tight">
        <div className="text-xs font-semibold">{config.title}</div>
        <div className="text-[10px] opacity-80 truncate">{config.subtitle}</div>
      </div>
    </div>
  );
}
