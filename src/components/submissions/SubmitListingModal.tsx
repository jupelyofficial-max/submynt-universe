"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { Button } from "@/components/ui/Button";
import { CATEGORIES, REGION_OPTIONS } from "@/data/categories";
import { useSubmissionsStore } from "@/store/useSubmissionsStore";
import { useUniverseStore } from "@/store/useUniverseStore";
import type { Category, Region } from "@/types/subscription";

export function SubmitListingModal() {
  const isOpen = useUniverseStore((s) => s.isSubmitModalOpen);
  const close = () => useUniverseStore.getState().setSubmitModalOpen(false);

  return (
    <ResponsiveSheet open={isOpen} onClose={close} title="Submit a subscription" desktopVariant="center" widthClassName="w-[480px]">
      {isOpen && <SubmitListingForm onClose={close} />}
    </ResponsiveSheet>
  );
}

function SubmitListingForm({ onClose }: { onClose: () => void }) {
  const addSubmission = useSubmissionsStore((s) => s.add);

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [tagline, setTagline] = useState("");
  const [priceMonthly, setPriceMonthly] = useState(0);
  const [region, setRegion] = useState<Region>(REGION_OPTIONS[0]);
  const [contactEmail, setContactEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [consentTouched, setConsentTouched] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      setConsentTouched(true);
      return;
    }
    addSubmission({ name, website, category, tagline, priceMonthly, region, contactEmail });
    setSuccess(true);
    setTimeout(onClose, 1200);
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-8 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-nebula-500/15 text-nebula-400">
          <Check size={26} />
        </span>
        <p className="font-display text-lg font-semibold text-ink-0">Thanks — we&apos;ll take a look</p>
        <p className="text-sm text-ink-300">{name} has been submitted for review.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-5">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-300">Subscription name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Linear"
          required
          className="w-full rounded-xl border border-black/10 bg-void-900/70 px-3 py-2.5 text-sm text-ink-0 outline-none placeholder:text-ink-500 focus:border-aurora-500/50"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-300">Website</label>
        <input
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://"
          required
          className="w-full rounded-xl border border-black/10 bg-void-900/70 px-3 py-2.5 text-sm text-ink-0 outline-none placeholder:text-ink-500 focus:border-aurora-500/50"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-300">Tagline</label>
        <input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="One line describing what it does"
          required
          className="w-full rounded-xl border border-black/10 bg-void-900/70 px-3 py-2.5 text-sm text-ink-0 outline-none placeholder:text-ink-500 focus:border-aurora-500/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-300">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full rounded-xl border border-black/10 bg-void-900/70 px-3 py-2.5 text-sm text-ink-0 outline-none focus:border-aurora-500/50"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-300">Region</label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value as Region)}
            className="w-full rounded-xl border border-black/10 bg-void-900/70 px-3 py-2.5 text-sm text-ink-0 outline-none focus:border-aurora-500/50"
          >
            {REGION_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-300">Starting price (₹/month)</label>
          <input
            type="number"
            min={0}
            value={priceMonthly}
            onChange={(e) => setPriceMonthly(Number(e.target.value))}
            className="w-full rounded-xl border border-black/10 bg-void-900/70 px-3 py-2.5 text-sm text-ink-0 outline-none focus:border-aurora-500/50"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-300">Your email</label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="you@company.com"
            required
            className="w-full rounded-xl border border-black/10 bg-void-900/70 px-3 py-2.5 text-sm text-ink-0 outline-none placeholder:text-ink-500 focus:border-aurora-500/50"
          />
        </div>
      </div>

      {/* Data-processing consent — its own affirmative action, not
          pre-checked, purpose stated inline (not just implied by the form
          existing). Separate from the "reviewed before adding" note below,
          which is about the listing itself, not personal-data consent. */}
      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => { setConsent(e.target.checked); setConsentTouched(true); }}
          className={`mt-0.5 h-4 w-4 shrink-0 rounded border-black/20 text-aurora-500 focus:ring-aurora-500/40 ${
            consentTouched && !consent ? "border-rose-400" : ""
          }`}
        />
        <span className="text-xs text-ink-300">
          I consent to Submynt using my email to review this submission and follow up if needed. See our{" "}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-aurora-500 underline underline-offset-2">
            Privacy Policy
          </a>
          .
        </span>
      </label>
      {consentTouched && !consent && (
        <p className="-mt-2 text-xs text-rose-400">Please agree to continue.</p>
      )}

      <Button type="submit" size="lg" className="mt-1">
        Submit for review
      </Button>
      <p className="text-center text-[11px] text-ink-500">
        Submissions are reviewed before they&apos;re added to the universe.
      </p>
    </form>
  );
}
