import Image from "next/image";
import Link from "next/link";
import { shownEcosystems } from "@/data/ecosystems";

export function EcosystemsRow() {
  const ecosystems = shownEcosystems();

  if (ecosystems.length === 0) return null;

  return (
    <div className="px-4 pb-2 pt-5 lg:px-8">
      <div className="mx-auto max-w-[92rem]">
        <h2 className="mb-3 text-lg font-semibold text-ink-0">Subscription Ecosystems</h2>
        <div className="flex items-center justify-center gap-4 overflow-x-auto no-scrollbar pb-1 sm:gap-7">
          {/* Each brand opens its own page, /ecosystems/[brand]. */}
          {ecosystems.map((eco) => (
            <Link
              key={eco.id}
              href={`/ecosystems/${eco.id}`}
              aria-label={`${eco.name} subscriptions`}
              className="group flex shrink-0 flex-col items-center gap-2 cursor-pointer"
            >
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-md shadow-black/5 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:shadow-black/10 group-active:translate-y-0 sm:h-24 sm:w-24">
                {/* next/image: source files are ~0.8-1MB despite rendering
                    at 64-96px — auto-resize matters a lot here. Above the
                    fold on /explore, but small enough not to need
                    `priority` (hero carousel is the real LCP candidate). */}
                <div className="relative h-[70%] w-[70%]">
                  <Image src={eco.logo} alt="" fill sizes="96px" className="object-contain" draggable={false} />
                </div>
              </div>
              <span className="text-xs font-medium text-ink-400 transition-colors group-hover:text-ink-0">{eco.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
