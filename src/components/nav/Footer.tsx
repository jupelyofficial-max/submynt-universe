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
              <svg width="22" height="22" viewBox="0 0 240 240" className="shrink-0" aria-hidden="true">
                <defs>
                  <linearGradient id="footerLogoGreen" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0EA672" />
                    <stop offset="100%" stopColor="#5EEAA0" />
                  </linearGradient>
                  <linearGradient id="footerLogoBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#1D4ED8" />
                  </linearGradient>
                </defs>
                <rect x="10" y="26" width="220" height="96" rx="48" fill="url(#footerLogoGreen)" transform="rotate(-15 120 74)" />
                <rect x="14" y="126" width="212" height="96" rx="48" fill="url(#footerLogoBlue)" />
                <path d="M 55 118 L 185 118 L 120 152 Z" fill="#0B1F5C" />
              </svg>
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
