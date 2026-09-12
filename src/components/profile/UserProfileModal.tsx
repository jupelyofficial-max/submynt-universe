"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, User } from "lucide-react";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useUniverseStore } from "@/store/useUniverseStore";

type Profession = "Student" | "Entrepreneur" | "Working professional";
const PROFESSIONS: Profession[] = ["Student", "Entrepreneur", "Working professional"];

export function UserProfileModal() {
  const isOpen = useUniverseStore((s) => s.isProfileModalOpen);
  const close = () => useUniverseStore.getState().setProfileModalOpen(false);

  return (
    <ResponsiveSheet open={isOpen} onClose={close} title="User Profile" desktopVariant="center" widthClassName="w-[420px]" panelVariant="solid">
      {isOpen && <ProfileForm onClose={close} />}
    </ResponsiveSheet>
  );
}

function ProfileForm({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [age, setAge] = useState("");
  const [profession, setProfession] = useState<Profession>("Student");
  const [location, setLocation] = useState("");

  const [consent, setConsent] = useState(false);
  const [consentTouched, setConsentTouched] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  function goNext(e: React.FormEvent) {
    e.preventDefault();
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      setConsentTouched(true);
      return;
    }
    setSubmitting(true);
    setError(false);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, contactNumber, age, profession, location }),
      });
      if (!res.ok) throw new Error("request failed");
      setSuccess(true);
      setTimeout(onClose, 1400);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-8 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-nebula-500/15 text-nebula-400">
          <Check size={26} />
        </span>
        <p className="font-display text-lg font-semibold text-ink-0">Profile saved</p>
        <p className="text-sm text-ink-300">Thanks — we&apos;ve got your details.</p>
        <Link
          href="/my-subscriptions"
          onClick={onClose}
          className="mt-1 text-xs font-medium text-ocean-600 underline underline-offset-2"
        >
          Go to My Subscriptions
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Thin progress bar + "Question X of 2" */}
      <div className="px-5 pt-4">
        <div className="h-1 w-full overflow-hidden rounded-full bg-black/5">
          <div
            className="h-full rounded-full bg-ocean-600 transition-all duration-300"
            style={{ width: step === 1 ? "50%" : "100%" }}
          />
        </div>
        <div className="mt-1.5 text-[11px] font-medium text-ink-500">Question {step} of 2</div>
      </div>

      {step === 1 ? (
        <form onSubmit={goNext} className="flex flex-col gap-3 px-5 py-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ocean-500/10 text-ocean-600">
              <User size={20} />
            </span>
            <h3 className="font-display text-lg font-semibold text-ink-0">Tell us about you</h3>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-300">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl border border-black/10 bg-void-900/70 px-3 py-2.5 text-sm text-ink-0 outline-none placeholder:text-ink-500 focus:border-ocean-500/50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-black/10 bg-void-900/70 px-3 py-2.5 text-sm text-ink-0 outline-none placeholder:text-ink-500 focus:border-ocean-500/50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-300">Contact number</label>
            <input
              type="tel"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full rounded-xl border border-black/10 bg-void-900/70 px-3 py-2.5 text-sm text-ink-0 outline-none placeholder:text-ink-500 focus:border-ocean-500/50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-300">Age</label>
            <input
              type="number"
              min={0}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl border border-black/10 bg-void-900/70 px-3 py-2.5 text-sm text-ink-0 outline-none placeholder:text-ink-500 focus:border-ocean-500/50"
            />
          </div>

          <Button type="submit" size="lg" className="mt-1">
            Continue
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-5 py-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-300">I am a</label>
            <div className="grid grid-cols-3 gap-1.5">
              {PROFESSIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProfession(p)}
                  className={cn(
                    "rounded-xl border px-2 py-2 text-center text-xs font-medium transition-colors cursor-pointer",
                    profession === p
                      ? "border-ocean-600 bg-ocean-500/10 text-ocean-600"
                      : "border-black/10 bg-void-900/70 text-ink-300 hover:border-black/20"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-300">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City"
              className="w-full rounded-xl border border-black/10 bg-void-900/70 px-3 py-2.5 text-sm text-ink-0 outline-none placeholder:text-ink-500 focus:border-ocean-500/50"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => { setConsent(e.target.checked); setConsentTouched(true); }}
              className={`mt-0.5 h-4 w-4 shrink-0 rounded border-black/20 text-ocean-600 focus:ring-ocean-500/40 ${
                consentTouched && !consent ? "border-rose-400" : ""
              }`}
            />
            <span className="text-xs text-ink-300">
              I consent to Submynt storing this profile information. See our{" "}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-ocean-600 underline underline-offset-2">
                Privacy Policy
              </a>
              .
            </span>
          </label>
          {consentTouched && !consent && (
            <p className="-mt-2 text-xs text-rose-400">Please agree to continue.</p>
          )}
          {error && (
            <p className="-mt-2 text-xs text-rose-400">Something went wrong on our end — please try again.</p>
          )}

          <div className="mt-1 flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="submit" size="lg" className="flex-1" disabled={submitting}>
              {submitting ? "Saving…" : "Submit"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
