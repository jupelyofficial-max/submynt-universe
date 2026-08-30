import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — SUBMYNT",
  description: "What Submynt collects, why, how long it's kept, and how to request deletion.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-semibold text-ink-0">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-ink-300">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-3xl font-medium tracking-tight text-ink-0 sm:text-4xl">Privacy Policy</h1>
      <p className="mt-2 text-sm text-ink-500">Last updated August 30, 2026</p>

      <p className="mt-6 text-sm leading-relaxed text-ink-300">
        Submynt&apos;s Universe/List catalogue is a public browsing experience — no account, no sign-in. This
        policy covers the two places the app asks you for anything personal: submitting a subscription for
        review, and requesting free-trial perks.
      </p>

      <Section title="What we collect">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <span className="text-ink-0">Submit a subscription:</span> your email address, so we can follow up
            about your submission if needed.
          </li>
          <li>
            <span className="text-ink-0">Get free subscriptions (Perks):</span> your email and phone number, to
            send you curated free trials and perks.
          </li>
        </ul>
        <p>Both are entered by you, voluntarily, and only when you open that specific form.</p>
      </Section>

      <Section title="How it's stored">
        <p>
          Submynt has no backend server or database behind these two forms today — what you enter is saved only
          in your own browser&apos;s local storage, on your own device. It is never transmitted to us or to any
          third party. We couldn&apos;t see it even if we wanted to.
        </p>
      </Section>

      <Section title="Retention and deletion">
        <p>
          Since this data lives only in your browser, you can remove it yourself at any time — clearing your
          browser&apos;s site data for submynt.com deletes it immediately, completely, with nothing left on our
          end to also delete.
        </p>
        <p>
          If you&apos;ve contacted us directly by email about a submission or a perks request, that email
          exists in our inbox like any other correspondence — email our Grievance Officer below to request we
          delete it, and we&apos;ll confirm once it&apos;s done, typically within 30 days.
        </p>
      </Section>

      <Section title="What we don't do">
        <p>
          We never sell your data. We don&apos;t require a bank account or card to browse, submit a listing, or
          request perks. We don&apos;t send communication beyond what each form above describes.
        </p>
      </Section>

      <Section title="Grievance Officer">
        <p>
          For any complaint or question about how your personal data is handled, contact our Grievance Officer:{" "}
          <a href="mailto:jupely.official@gmail.com" className="text-aurora-500 underline underline-offset-2">
            jupely.official@gmail.com
          </a>
          . We aim to acknowledge every complaint within 7 days and resolve it within 30.
        </p>
        <p>
          <a
            href="mailto:jupely.official@gmail.com?subject=Data%20Deletion%20Request&body=Please%20delete%20any%20correspondence%20you%20have%20from%20me.%0A%0AName%3A%20%0AEmail%3A%20%0A"
            className="mt-2 inline-flex items-center rounded-full bg-ink-0 px-4 py-2 text-xs font-semibold text-void-950 transition-colors hover:bg-ink-100"
          >
            Request Deletion
          </a>
        </p>
      </Section>

      <p className="mt-10 text-xs text-ink-500">
        Submynt is in early access. This policy will be expanded as new features — including any account,
        server-side storage, or payment integrations — are introduced, and you&apos;ll always be asked for
        explicit consent before anything new is connected.
      </p>
    </div>
  );
}
