import Link from "next/link";

// Thin, single-line strip — not a multi-column footer — so it costs the
// Universe canvas (and every other view) only ~28px of height rather than
// competing for real layout space. The only persistent, always-visible
// place /privacy is linked from; previously it was reachable only from
// inside the Submit/Perks modals, easy to miss entirely.
export function Footer() {
  return (
    <footer
      // min-h-7 (not h-7): the box grows to accommodate the safe-area inset
      // rather than compressing the existing 28px of content into it — on a
      // notched/gesture-nav phone the links sat right under the home
      // indicator, `viewportFit: "cover"` (layout.tsx) makes that whole
      // strip of the screen ours to render into but not automatically safe
      // to tap without this. A no-op on desktop (env() resolves to 0).
      className="flex min-h-7 shrink-0 items-center justify-center gap-3 border-t border-line-soft bg-void-950 px-4 text-[11px] text-ink-500"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <Link href="/privacy" className="transition-colors hover:text-ink-0">
        Privacy
      </Link>
      <span aria-hidden="true">·</span>
      <Link href="/terms" className="transition-colors hover:text-ink-0">
        Terms
      </Link>
    </footer>
  );
}
