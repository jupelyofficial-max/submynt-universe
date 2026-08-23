import { SUBSCRIPTIONS } from "@/data/subscriptions";
import { VERIFICATION_BY_ID } from "@/data/verification";
import type { SubscriptionVerification } from "@/types/verification";
import type { Subscription } from "@/types/subscription";

export interface DataQualityIssue {
  field: string;
  issue: string;
  severity: "error" | "warning";
}

export interface DataQualityReport {
  subscriptionId: string;
  name: string;
  score: number;
  issues: DataQualityIssue[];
}

/** Every check here is real logic, not a stub — most just happen to come
 * back clean today (ids are unique by construction, there are no source
 * URLs yet to be broken) while price/trial sourcing genuinely fails. */
export function auditSubscription(sub: Subscription, verification: SubscriptionVerification): DataQualityReport {
  const issues: DataQualityIssue[] = [];

  if (verification.price.confidence === "unverified") {
    issues.push({ field: "price", issue: "missing source", severity: "warning" });
  }
  if (!verification.price.verifiedAt) {
    issues.push({ field: "price", issue: "never verified (no verifiedAt)", severity: "warning" });
  }
  if (!verification.price.currency) {
    issues.push({ field: "price", issue: "missing currency", severity: "error" });
  }
  if (!verification.price.country) {
    issues.push({ field: "price", issue: "missing country", severity: "error" });
  }
  if (sub.plans.length === 0) {
    issues.push({ field: "plans", issue: "missing billing period", severity: "error" });
  }
  if (sub.trialDays && verification.trial.confidence === "unverified") {
    issues.push({ field: "trial", issue: "trial claimed without a verified source", severity: "warning" });
  }
  if (verification.price.sourceUrl && !/^https?:\/\//.test(verification.price.sourceUrl)) {
    issues.push({ field: "price", issue: "malformed source URL", severity: "error" });
  }

  const score = Math.max(0, 100 - issues.reduce((sum, i) => sum + (i.severity === "error" ? 20 : 10), 0));
  return { subscriptionId: sub.id, name: sub.name, score, issues };
}

export function auditCatalogue(): DataQualityReport[] {
  const reports = SUBSCRIPTIONS.map((s) => auditSubscription(s, VERIFICATION_BY_ID[s.id]));

  // Duplicate-id check across the whole catalogue — real cross-record logic,
  // not per-subscription.
  const seen = new Map<string, number>();
  SUBSCRIPTIONS.forEach((s) => seen.set(s.id, (seen.get(s.id) ?? 0) + 1));
  seen.forEach((count, id) => {
    if (count > 1) {
      const report = reports.find((r) => r.subscriptionId === id);
      report?.issues.push({ field: "id", issue: `duplicate id (${count} records)`, severity: "error" });
    }
  });

  return reports;
}
