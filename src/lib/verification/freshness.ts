import type { VerificationState, VerifiedField } from "@/types/verification";

/** How long each kind of field stays trustworthy after its last verification. */
export const FRESHNESS_DAYS = {
  price: 7,
  trial: 7,
  availability: 7,
  plans: 30,
  description: 30,
  category: 90,
  logo: 90,
} as const;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * A field with no verifiedAt has never been checked against a source —
 * that's UNVERIFIED, not STALE (STALE means it WAS verified and has since
 * aged out). Nothing in today's catalogue can reach STALE, because nothing
 * has ever been verified in the first place; this becomes meaningful the
 * moment a real verification pipeline starts populating verifiedAt.
 */
export function computeVerificationState(
  field: VerifiedField<unknown> | undefined,
  freshnessDays: number
): VerificationState {
  if (!field || !field.verifiedAt) return "UNVERIFIED";
  const ageDays = (Date.now() - new Date(field.verifiedAt).getTime()) / MS_PER_DAY;
  if (ageDays > freshnessDays) return "STALE";
  return field.confidence === "high" ? "VERIFIED" : "PARTIALLY_VERIFIED";
}
