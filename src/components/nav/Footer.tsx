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
                  <linearGradient id="footerTop" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FF5A3C" /><stop offset="30%" stopColor="#3B3BF5" />
                  <stop offset="65%" stopColor="#38A8D8" /><stop offset="100%" stopColor="#4ADE80" /></linearGradient>
                  <linearGradient id="footerBot" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF5A3C" /><stop offset="35%" stopColor="#3B3BF5" />
                  <stop offset="75%" stopColor="#38A8D8" /><stop offset="100%" stopColor="#4ADE80" /></linearGradient>
                  <linearGradient id="footerTri" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FF5A3C" /><stop offset="50%" stopColor="#3B3BF5" /><stop offset="100%" stopColor="#4ADE80" /></linearGradient>
                <filter id="footerGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                </defs>
                <g transform="translate(120 120) scale(0.86) translate(-120 -124)" filter="url(#footerGlow)">
                <g transform="rotate(-15 120 74)"><rect x="10" y="26" width="220" height="96" rx="48" fill="none" stroke="url(#footerTop)" strokeWidth="3.2" opacity="1.00" /><rect x="17.5" y="33.5" width="205" height="81" rx="40.5" fill="none" stroke="url(#footerTop)" strokeWidth="3.2" opacity="0.92" /><rect x="25" y="41" width="190" height="66" rx="33" fill="none" stroke="url(#footerTop)" strokeWidth="3.2" opacity="0.84" /><rect x="32.5" y="48.5" width="175" height="51" rx="25.5" fill="none" stroke="url(#footerTop)" strokeWidth="3.2" opacity="0.76" /><rect x="40" y="56" width="160" height="36" rx="18" fill="none" stroke="url(#footerTop)" strokeWidth="3.2" opacity="0.68" /><rect x="47.5" y="63.5" width="145" height="21" rx="10.5" fill="none" stroke="url(#footerTop)" strokeWidth="3.2" opacity="0.60" /></g>
                <g><rect x="14" y="126" width="212" height="96" rx="48" fill="none" stroke="url(#footerBot)" strokeWidth="3.2" opacity="1.00" /><rect x="21.5" y="133.5" width="197" height="81" rx="40.5" fill="none" stroke="url(#footerBot)" strokeWidth="3.2" opacity="0.92" /><rect x="29" y="141" width="182" height="66" rx="33" fill="none" stroke="url(#footerBot)" strokeWidth="3.2" opacity="0.84" /><rect x="36.5" y="148.5" width="167" height="51" rx="25.5" fill="none" stroke="url(#footerBot)" strokeWidth="3.2" opacity="0.76" /><rect x="44" y="156" width="152" height="36" rx="18" fill="none" stroke="url(#footerBot)" strokeWidth="3.2" opacity="0.68" /><rect x="51.5" y="163.5" width="137" height="21" rx="10.5" fill="none" stroke="url(#footerBot)" strokeWidth="3.2" opacity="0.60" /></g>
                <path d="M 55 152 L 185 152 L 120 118 Z" fill="url(#footerTri)" />
                </g>
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
