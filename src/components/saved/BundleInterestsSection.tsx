"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ALL_BUNDLES } from "@/data/bundles";
import { bundleSeparateLabel } from "@/lib/bundlePricing";
import { listBundleInterests, removeBundleInterest } from "@/lib/bundleInterest";
import { useAuthStore } from "@/store/useAuthStore";

/** "Bundles you're interested in" on the Saved page — the current user's
 * bundle_interest rows, read from the DB only (nothing cached locally).
 * Hidden when signed out, while loading, on a failed lookup, or when empty. */
export function BundleInterestsSection() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  // Rows are kept per user id, so a different account never sees them.
  const [loaded, setLoaded] = useState<{ userId: string; slugs: string[] } | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void listBundleInterests(userId).then((slugs) => {
      if (!cancelled && slugs) setLoaded({ userId, slugs });
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const slugs = userId && loaded?.userId === userId ? loaded.slugs : [];
  const bundles = slugs
    .map((slug) => ALL_BUNDLES.find((b) => b.slug === slug))
    .filter((b): b is NonNullable<typeof b> => Boolean(b));

  // Gone from the list only once the delete has actually succeeded.
  async function remove(slug: string) {
    if (!userId) return;
    setRemoving(slug);
    const ok = await removeBundleInterest(userId, slug);
    setRemoving(null);
    if (ok) setLoaded((prev) => (prev && prev.userId === userId ? { userId, slugs: prev.slugs.filter((s) => s !== slug) } : prev));
  }

  if (bundles.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-ink-0">
        <Layers size={18} className="text-ink-300" />
        Bundles you&apos;re interested in
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {bundles.map((bundle) => (
          <div key={bundle.slug} className="glass-panel flex items-center gap-3 rounded-2xl p-3">
            <Link href={`/bundles/${bundle.slug}`} className="relative aspect-[3/1] w-28 shrink-0 overflow-hidden rounded-lg">
              <Image src={bundle.image} alt="" fill sizes="112px" className="object-cover" />
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/bundles/${bundle.slug}`} className="block truncate text-sm font-semibold text-ink-0 hover:underline">
                {bundle.title}
              </Link>
              <p className="truncate text-xs text-ink-400">Bought separately {bundleSeparateLabel(bundle)}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="shrink-0 text-red-400 hover:text-red-500"
              disabled={removing === bundle.slug}
              onClick={() => void remove(bundle.slug)}
            >
              {removing === bundle.slug ? "Removing…" : "Remove"}
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
