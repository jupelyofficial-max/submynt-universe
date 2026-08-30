"use client";

import { useState } from "react";
import { Check, Gift } from "lucide-react";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { usePerksStore, type PerksUserType } from "@/store/usePerksStore";
import { useUniverseStore } from "@/store/useUniverseStore";

const USER_TYPES: { value: PerksUserType; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "entrepreneur", label: "Entrepreneur" },
  { value: "professional", label: "Working professional" },
];

export function PerksModal() {
  const isOpen = useUniverseStore((s) => s.isPerksModalOpen);
  const close = () => useUniverseStore.getState().setPerksModalOpen(false);

  return (
    <ResponsiveSheet open={isOpen} onClose={close} title="Free subscriptions" desktopVariant="center" widthClassName="w-[420px]">
      {isOpen && <PerksForm onClose={close} />}
    </ResponsiveSheet>
  );
}

function PerksForm({ onClose }: { onClose: () => void }) {
  const addLead = usePerksStore((s) => s.add);

  const [userType, setUserType] = useState<PerksUserType>("student");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [consentTouched, setConsentTouched] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      setConsentTouched(true);
      return;
    }
    addLead({ userType, email, phone });
    setSuccess(true);
    setTimeout(onClose, 1400);
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-8 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-nebula-500/15 text-nebula-400">
          <Check size={26} />
        </span>
        <p className="font-display text-lg font-semibold text-ink-0">You&apos;re on the list</p>
        <p className="text-sm text-ink-300">We&apos;ll email you free trials and perks picked for you.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-aurora-500/15 text-aurora-500">
          <Gift size={20} />
        </span>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-aurora-500">Submynt Perks</div>
        <h3 className="font-display text-lg font-semibold text-ink-0">Get free subscriptions</h3>
        <p className="text-sm text-ink-300">Curated free trials and perks, picked for people like you.</p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-300">I am a</label>
        <div className="grid grid-cols-3 gap-1.5">
          {USER_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setUserType(t.value)}
              className={cn(
                "rounded-xl border px-2 py-2 text-center text-xs font-medium transition-colors cursor-pointer",
                userType === t.value
                  ? "border-aurora-500 bg-aurora-500/10 text-aurora-500"
                  : "border-black/10 bg-void-900/70 text-ink-300 hover:border-black/20"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-300">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="w-full rounded-xl border border-black/10 bg-void-900/70 px-3 py-2.5 text-sm text-ink-0 outline-none placeholder:text-ink-500 focus:border-aurora-500/50"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-300">Phone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 98765 43210"
          required
          className="w-full rounded-xl border border-black/10 bg-void-900/70 px-3 py-2.5 text-sm text-ink-0 outline-none placeholder:text-ink-500 focus:border-aurora-500/50"
        />
      </div>

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
          I consent to Submynt using my email and phone number to send me curated free trials and perks. See our{" "}
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
        Get free subscriptions
      </Button>
      <p className="text-center text-[11px] text-ink-500">Free · no spam · unsubscribe anytime</p>
    </form>
  );
}
