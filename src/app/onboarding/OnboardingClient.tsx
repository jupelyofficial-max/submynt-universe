"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { createClient } from "@/lib/supabase/client";
import { sanitizeNextPath } from "@/lib/safeRedirect";

type Profession = "Student" | "Entrepreneur" | "Working professional";
const PROFESSIONS: Profession[] = ["Student", "Entrepreneur", "Working professional"];

// profiles.gender is a free-text column, not a DB enum (see the old
// UserProfileModal this replaces) — kept the same three options for
// consistency with the ~87 existing legacy rows in that column.
type Gender = "Female" | "Male" | "Other";
const GENDERS: Gender[] = ["Female", "Male", "Other"];

/** Optional, skippable profile step — shown once after a user's first
 * Google sign-in (see the redirect logic in app/auth/callback/route.ts),
 * and reused as the "Preferences" destination from AccountMenu for
 * returning users who want to view/edit what they already saved. Fetches
 * the existing profiles row on mount and pre-fills the form when one
 * exists, so opening this as "Preferences" shows real saved values
 * instead of a blank form that would silently overwrite them with nulls
 * on save. Writes directly to `profiles` as the authenticated user via
 * the browser Supabase client — RLS (Phase 2) scopes this to
 * auth.uid() = user_id, no server route needed. */
export function OnboardingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // /onboarding?next=... is directly reachable on its own (not just via
  // the already-sanitizing auth callback), so it's re-validated here too
  // — an unsanitized value gets handed straight to router.replace() below,
  // and Next's router hard-navigates for an absolute/protocol-relative URL.
  const next = sanitizeNextPath(searchParams.get("next"));
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  const [name, setName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("Female");
  const [profession, setProfession] = useState<Profession>("Student");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [isReturning, setIsReturning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // No session (direct nav to a stale link, or not logged in) — nothing to
  // onboard, send them back rather than showing a broken form.
  useEffect(() => {
    if (hydrated && !user) router.replace(next);
  }, [hydrated, user, next, router]);

  // Pre-fill from the existing row, if any — first-time users simply get
  // no match (maybeSingle returns null) and see the same blank form as
  // before.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("name, contact_number, age, gender, profession, location")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) {
          setLoadingExisting(false);
          return;
        }
        if (data.name) setName(data.name);
        if (data.contact_number) setContactNumber(data.contact_number);
        if (data.age !== null && data.age !== undefined) setAge(String(data.age));
        if (data.gender && GENDERS.includes(data.gender as Gender)) setGender(data.gender as Gender);
        if (data.profession && PROFESSIONS.includes(data.profession as Profession)) setProfession(data.profession as Profession);
        if (data.location) setLocation(data.location);
        setIsReturning(true);
        setLoadingExisting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        user_id: user.id,
        email: user.email,
        name,
        contact_number: contactNumber || null,
        age: age ? Number(age) : null,
        gender,
        profession,
        location: location || null,
      },
      { onConflict: "user_id" }
    );
    setSaving(false);
    if (upsertError) {
      setError(upsertError.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.replace(next), 900);
  }

  function handleSkip() {
    router.replace(next);
  }

  if (done) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-5 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-nebula-500/15 text-nebula-400">
          <Check size={26} />
        </span>
        <p className="font-display text-lg font-semibold text-ink-0">Profile saved</p>
      </div>
    );
  }

  // Avoids a flash of the blank form before the prefill fetch resolves —
  // the whole point of prefilling is that a returning user never sees an
  // empty form for their already-saved fields, even briefly.
  if (loadingExisting) {
    return <div className="flex-1" />;
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-10">
      <div className="mb-6 flex flex-col items-center gap-1 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ocean-500/10 text-ocean-600">
          <User size={20} />
        </span>
        <h1 className="font-display text-lg font-semibold text-ink-0">{isReturning ? "Your preferences" : "Tell us about you"}</h1>
        <p className="text-xs text-ink-500">{isReturning ? "Update any of these, or leave them as they are." : "Optional — skip if you’d rather not."}</p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-3">
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
          <label className="mb-1.5 block text-xs font-medium text-ink-300">Contact number</label>
          <input
            type="tel"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value.replace(/[^\d ]/g, ""))}
            inputMode="numeric"
            placeholder="70302 70302"
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
            placeholder="24"
            className="w-full rounded-xl border border-black/10 bg-void-900/70 px-3 py-2.5 text-sm text-ink-0 outline-none placeholder:text-ink-500 focus:border-ocean-500/50"
          />
        </div>

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
          <label className="mb-1.5 block text-xs font-medium text-ink-300">Gender</label>
          <div className="grid grid-cols-3 gap-1.5">
            {GENDERS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={cn(
                  "rounded-xl border px-2 py-2 text-center text-xs font-medium transition-colors cursor-pointer",
                  gender === g
                    ? "border-ocean-600 bg-ocean-500/10 text-ocean-600"
                    : "border-black/10 bg-void-900/70 text-ink-300 hover:border-black/20"
                )}
              >
                {g}
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

        {error && <p className="text-xs text-rose-400">{error}</p>}

        <div className="mt-2 flex gap-2">
          <Button type="button" variant="outline" onClick={handleSkip}>
            Skip for now
          </Button>
          <Button type="submit" size="lg" className="flex-1" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}
