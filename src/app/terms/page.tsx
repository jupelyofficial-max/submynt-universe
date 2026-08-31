import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — SUBMYNT",
  description: "The terms covering Submynt's catalogue, submissions, and perks requests.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-semibold text-ink-0">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-ink-300">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-3xl font-medium tracking-tight text-ink-0 sm:text-4xl">Terms of Service</h1>
      <p className="mt-2 text-sm text-ink-500">Last updated August 31, 2026</p>

      <p className="mt-6 text-sm leading-relaxed text-ink-300">
        By using Submynt, you agree to the terms below. Submynt is in early access — these terms will evolve
        as the product does, and we&apos;ll flag material changes.
      </p>

      <Section title="The service">
        <p>
          Submynt is a discovery and comparison catalogue for subscription services — browse the Universe or
          List view, compare plans, and search across categories. There&apos;s no account or sign-in: &quot;My
          Subscriptions&quot; is a personal list you build, saved only in your own browser, not on any Submynt
          server.
        </p>
      </Section>

      <Section title="Accuracy of information">
        <p>
          Prices, plans, ratings, and popularity figures in the catalogue are aggregated and, for many
          entries, illustrative rather than live pricing pulled from each provider in real time. Always check
          the provider&apos;s own site before subscribing. &quot;Get Deal&quot; and similar links take you to a
          third party&apos;s own site, governed by their own terms — Submynt isn&apos;t a party to that
          transaction.
        </p>
      </Section>

      <Section title="Not financial advice">
        <p>
          Spend totals, savings estimates, and &quot;alternatives&quot; comparisons Submynt shows you are
          informational only, based on catalogue data. They are not financial advice.
        </p>
      </Section>

      <Section title="Submitting a listing">
        <p>
          If you submit a subscription for review, we may edit details for consistency with the rest of the
          catalogue, and we don&apos;t guarantee every submission gets added.
        </p>
      </Section>

      <Section title="Perks and free trials">
        <p>
          Free trials and perks surfaced through Submynt are curated by us but fulfilled by the third-party
          provider — availability, eligibility, and terms are set by them, not Submynt.
        </p>
      </Section>

      <Section title="Availability">
        <p>
          As an early-access product, Submynt is offered on a best-effort basis without a guaranteed uptime
          commitment.
        </p>
      </Section>

      <Section title="Changes">
        <p>We may update these terms as Submynt adds features. Material changes will be reflected here.</p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about these terms? Email{" "}
          <a href="mailto:jupely.official@gmail.com" className="text-aurora-500 underline underline-offset-2">
            jupely.official@gmail.com
          </a>
          .
        </p>
      </Section>
    </div>
  );
}
