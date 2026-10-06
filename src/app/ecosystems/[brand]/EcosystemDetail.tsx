"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ServiceCardGrid } from "@/components/subscriptions/ServiceCardGrid";
import { ECOSYSTEMS, ecosystemServices, type EcosystemId } from "@/data/ecosystems";
import { trackEvent } from "@/lib/events";

/** One brand's subscriptions — the bundle page layout without the banner
 * or any pricing claims. The page has already checked the brand is shown. */
export function EcosystemDetail({ id }: { id: EcosystemId }) {
  const ecosystem = ECOSYSTEMS.find((eco) => eco.id === id)!;
  const subscriptions = ecosystemServices(ecosystem);

  useEffect(() => {
    trackEvent("ecosystem_opened", { brand: id });
  }, [id]);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 lg:px-8">
      <Link href="/explore" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-0">
        <ArrowLeft size={15} />
        Back to Explore
      </Link>

      <div className="flex items-center gap-4">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white shadow-md shadow-black/5">
          <div className="relative h-[70%] w-[70%]">
            <Image src={ecosystem.logo} alt="" fill sizes="64px" className="object-contain" priority />
          </div>
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-0">{ecosystem.name} ecosystem</h1>
          <p className="mt-1 text-sm text-ink-400">
            {subscriptions.length} subscription{subscriptions.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <ServiceCardGrid subscriptions={subscriptions} />
    </div>
  );
}
