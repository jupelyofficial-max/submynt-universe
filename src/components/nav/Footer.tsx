import Link from "next/link";

// Thin, single-line strip — not a multi-column footer — so it costs the
// Universe canvas (and every other view) only ~28px of height rather than
// competing for real layout space. The only persistent, always-visible
// place /privacy is linked from; previously it was reachable only from
// inside the Submit/Perks modals, easy to miss entirely.
export function Footer() {
  return (
    <footer className="flex h-7 shrink-0 items-center justify-center border-t border-line-soft bg-void-950 px-4 text-[11px] text-ink-500">
      <Link href="/privacy" className="transition-colors hover:text-ink-0">
        Privacy
      </Link>
    </footer>
  );
}
