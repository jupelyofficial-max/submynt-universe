import Image from "next/image";
import Link from "next/link";

const LINK_CLASS = "text-[#111111] transition-opacity hover:opacity-70";
const HEADING_CLASS = "text-xs font-semibold uppercase tracking-wide text-ink-500";

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Explore",
    links: [
      { label: "Browse Catalog", href: "/explore" },
      { label: "My Subscriptions", href: "/my-subscriptions" },
    ],
  },
  {
    heading: "Help",
    links: [
      { label: "FAQ", href: "/explore#faq" },
      { label: "Contact", href: "mailto:venkata@submynt.com" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Affiliate Disclosure", href: "/affiliate-disclosure" },
    ],
  },
];

/** Full multi-column footer, mounted globally (layout.tsx) below every
 * page's <main> — replaces the earlier thin single-line Privacy/Terms
 * strip. safe-area-aware padding (see the old version's comment) is kept
 * on the outermost element for the same reason: a notched/gesture-nav
 * phone still needs the bottom-most content clear of the home indicator. */
export function Footer() {
  return (
    <footer className="shrink-0 border-t border-black/10 bg-white px-4 py-8 lg:px-8" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 2rem)" }}>
      <div className="mx-auto max-w-[1340px]">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/explore" className="flex items-center gap-2 shrink-0 group w-fit">
              <Image src="/brand/submynt-mark-small.svg" alt="" aria-hidden="true" width={22} height={22} unoptimized className="shrink-0" />
              <span className="font-display text-base font-bold tracking-tight">
                <span className="text-ink-0">sub</span>
                <span className="text-[#22c55e]">mynt</span>
              </span>
            </Link>
            <p className="mt-2 max-w-[22ch] text-xs leading-relaxed text-ink-500">
              Discover, compare and track every subscription in one place.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className={HEADING_CLASS}>{col.heading}</h3>
              <ul className="mt-3 flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className={`${LINK_CLASS} text-sm`}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-black/10 pt-4">
          <p className="text-xs text-ink-500">© 2026 Submynt. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
