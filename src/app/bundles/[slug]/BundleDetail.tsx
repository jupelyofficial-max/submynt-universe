"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SUBSCRIPTIONS_BY_ID } from "@/data/subscriptions";
import type { LifestyleBundle } from "@/data/bundles";
import { BundleBanner } from "@/components/bundles/BundleBanner";
import { ServiceCardGrid } from "@/components/subscriptions/ServiceCardGrid";
import { bundleSeparateLabel } from "@/lib/bundlePricing";
import { hasBundleInterest, registerBundleInterest } from "@/lib/bundleInterest";
import { consumeBundleInterestIntent, signInWithGoogle } from "@/lib/auth/signIn";
import { useAuthStore } from "@/store/useAuthStore";

export function BundleDetail({ bundle }: { bundle: LifestyleBundle }) {
  const subscriptions = bundle.subscriptionIds.map((id) => SUBSCRIPTIONS_BY_ID[id]).filter((s) => s !== undefined);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 lg:px-8">
      <Link href="/explore" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-0">
        <ArrowLeft size={15} />
        Back to Explore
      </Link>

      <div className="overflow-hidden rounded-3xl">
        {/* next/image: same ~1.7MB PNG as the /explore card, but here it's
            the whole width of the page and right at the top — likely this
            route's LCP element, hence `priority`. Real 2172x724 intrinsic
            size (not `fill`) so w-full/h-auto scales it responsively
            without a wrapping aspect-ratio box. */}
        <BundleBanner bundle={bundle} sizes="100vw" priority intrinsic />
      </div>

      <div className="mt-6">
        <h1 className="font-display text-2xl font-bold text-ink-0">{bundle.title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-400">{bundle.tagline}</p>
        {/* There's no bundle price yet — this is the honest number: what
            these services cost bought one by one (cheapest plan each). */}
        <p className="mt-3 text-sm text-ink-300">
          Bought separately: <span className="font-semibold text-ink-0">{bundleSeparateLabel(bundle)}</span>
        </p>
        <BundleInterestButton bundleSlug={bundle.slug} />
      </div>

      <ServiceCardGrid subscriptions={subscriptions} />
    </div>
  );
}

/** "Notify me when bundle pricing launches." Signed in: saves interest and
 * shows "on the list". Signed out: the usual sign-in gate, returning to
 * this page, where the pending interest is registered automatically. */
function BundleInterestButton({ bundleSlug }: { bundleSlug: string }) {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const hydrated = useAuthStore((s) => s.hydrated);
  // The account that's on the list for this bundle — derived per user, so
  // signing out (or switching account) never shows someone else's state.
  const [joinedBy, setJoinedBy] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const joined = userId !== null && joinedBy === userId;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    // Back from a sign-in started by this button → register it now;
    // otherwise just look up whether they already are on the list.
    const check = consumeBundleInterestIntent(bundleSlug)
      ? registerBundleInterest(userId, bundleSlug)
      : hasBundleInterest(userId, bundleSlug);
    void check.then((on) => {
      if (!cancelled && on) setJoinedBy(userId);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, bundleSlug]);

  async function handleClick() {
    if (!userId) {
      void signInWithGoogle({
        resume: { kind: "bundle_interest", bundleSlug },
        gate: "bundle_interest",
        returnTo: `/bundles/${bundleSlug}`,
      });
      return;
    }
    setSaving(true);
    const ok = await registerBundleInterest(userId, bundleSlug);
    setSaving(false);
    if (ok) setJoinedBy(userId);
  }

  if (joined) {
    return (
      <p className="mt-3 inline-flex items-center gap-3 text-sm font-medium text-ink-0" role="status">
        You&apos;re on the list ✓
        <Link href="/saved-subscriptions" className="text-xs font-normal text-ink-400 underline-offset-2 hover:text-ink-0 hover:underline">
          View in Saved
        </Link>
      </p>
    );
  }
  return (
    <div className="mt-3">
      <Button size="sm" onClick={() => void handleClick()} disabled={!hydrated || saving}>
        I&apos;m interested — notify me when bundle pricing launches
      </Button>
    </div>
  );
}
