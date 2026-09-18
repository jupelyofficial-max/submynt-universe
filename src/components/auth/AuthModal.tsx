"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, Mail, User } from "lucide-react";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { Button } from "@/components/ui/Button";
import { useUniverseStore } from "@/store/useUniverseStore";
import { useAuthStore } from "@/store/useAuthStore";
import { createClient } from "@/lib/supabase/client";

/** Replaces the old fake-data UserProfileModal — passwordless magic-link
 * auth (Supabase Auth) instead of a demographic form with no real identity
 * behind it. Logged out: email + "Send magic link". Logged in: account
 * summary + sign out. */
export function AuthModal() {
  const isOpen = useUniverseStore((s) => s.isAuthModalOpen);
  const close = () => useUniverseStore.getState().setAuthModalOpen(false);
  const user = useAuthStore((s) => s.user);

  return (
    <ResponsiveSheet open={isOpen} onClose={close} title={user ? "Account" : "Sign in"} desktopVariant="center" widthClassName="w-[380px]" panelVariant="solid">
      {isOpen && (user ? <AccountView email={user.email ?? ""} onClose={close} /> : <SignInForm />)}
    </ResponsiveSheet>
  );
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setSending(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-8 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-nebula-500/15 text-nebula-400">
          <Mail size={26} />
        </span>
        <p className="font-display text-lg font-semibold text-ink-0">Check your email</p>
        <p className="text-sm text-ink-300">
          We sent a sign-in link to <span className="font-medium text-ink-0">{email}</span>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-5 py-5">
      <div className="flex flex-col items-center gap-1 pb-1 text-center">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ocean-500/10 text-ocean-600">
          <User size={18} />
        </span>
        <h3 className="font-display text-base font-semibold text-ink-0">Sign in to Submynt</h3>
        <p className="text-xs text-ink-500">No password — we&apos;ll email you a sign-in link.</p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-300">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoFocus
          className="w-full rounded-xl border border-black/10 bg-void-900/70 px-3 py-2.5 text-sm text-ink-0 outline-none placeholder:text-ink-500 focus:border-ocean-500/50"
        />
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}

      <Button type="submit" size="lg" disabled={sending}>
        {sending ? "Sending…" : "Send magic link"}
      </Button>
    </form>
  );
}

function AccountView({ email, onClose }: { email: string; onClose: () => void }) {
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setSigningOut(false);
    onClose();
  }

  return (
    <div className="flex flex-col items-center gap-3 px-8 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ocean-500/10 text-ocean-600">
        <User size={24} />
      </span>
      <p className="font-display text-base font-semibold text-ink-0">{email}</p>
      <Link href="/onboarding" onClick={onClose} className="text-xs font-medium text-ocean-600 underline underline-offset-2">
        Update profile details
      </Link>
      <Button variant="outline" onClick={handleSignOut} disabled={signingOut} className="mt-2 w-full">
        <LogOut size={14} />
        {signingOut ? "Signing out…" : "Sign out"}
      </Button>
    </div>
  );
}
