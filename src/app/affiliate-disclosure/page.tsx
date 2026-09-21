import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Affiliate Disclosure — SUBMYNT",
  description: "How Submynt handles outbound provider links and commercial partnerships.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-semibold text-ink-0">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-ink-300">{children}</div>
    </section>
  );
}

export default function AffiliateDisclosurePage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-2xl font-semibold text-ink-0">Affiliate Disclosure</h1>
      <p className="mt-2 text-sm text-ink-500">Last updated September 20, 2026</p>

      <p className="mt-6 text-sm leading-relaxed text-ink-300">
        Submynt is a discovery and comparison catalogue, not a store — we don&apos;t process purchases
        ourselves. This page explains where outbound links take you and how that relates to how Submynt
        operates.
      </p>

      <Section title="Outbound links">
        <p>
          &quot;Visit Provider&quot; and similar links on a subscription&apos;s page take you to that
          provider&apos;s own site to sign up or subscribe directly. Submynt isn&apos;t a party to that
          transaction, and the provider&apos;s own terms and pricing apply from that point on.
        </p>
      </Section>

      <Section title="Commercial partnerships">
        <p>
          Submynt is currently free to browse and compare, and we don&apos;t charge users directly. We don&apos;t
          run an active affiliate or commission program today. If that changes, we&apos;ll disclose it here first
          — and any commercial partnership will never affect the prices, ratings, or rankings shown in the
          catalogue.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about this disclosure? Email{" "}
          <a href="mailto:venkata@submynt.com" className="text-aurora-500 underline underline-offset-2">
            venkata@submynt.com
          </a>
          .
        </p>
      </Section>
    </div>
  );
}
