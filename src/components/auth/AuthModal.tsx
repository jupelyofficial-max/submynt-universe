"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { Button } from "@/components/ui/Button";
import { useUniverseStore } from "@/store/useUniverseStore";
import { useAuthStore } from "@/store/useAuthStore";
import { createClient } from "@/lib/supabase/client";

/** Replaces the old fake-data UserProfileModal — real Supabase Auth
 * (Google OAuth) instead of a demographic form with no real identity
 * behind it. Logged out: "Sign in with Google". Logged in: account
 * summary + sign out. */
export function AuthModal() {
  const isOpen = useUniverseStore((s) => s.isAuthModalOpen);
  const close = () => useUniverseStore.getState().setAuthModalOpen(false);
  const user = useAuthStore((s) => s.user);

  return (
    <ResponsiveSheet open={isOpen} onClose={close} title={user ? "Account" : "Sign in"} desktopVariant="center" widthClassName="w-[380px]" panelVariant="solid">
      {isOpen && (user ? <AccountView email={user.email ?? ""} onClose={close} /> : <SignInPanel />)}
    </ResponsiveSheet>
  );
}

/** Google's official 4-color "G" mark — required as-is (not recolored/
 * simplified) by Google's Sign In branding guidelines. */
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}

function SignInPanel() {
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setSigningIn(true);
    setError(null);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    // On success this navigates away to Google immediately — signingIn only
    // gets reset if signInWithOAuth itself fails before that redirect.
    if (signInError) {
      setSigningIn(false);
      setError(signInError.message);
    }
  }

  return (
    <div className="flex flex-col gap-4 px-5 py-6">
      <div className="flex flex-col items-center gap-1 pb-1 text-center">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ocean-500/10 text-ocean-600">
          <User size={18} />
        </span>
        <h3 className="font-display text-base font-semibold text-ink-0">Sign in to Submynt</h3>
      </div>

      {/* Google's official button spec: white background, #747775 border,
       * #1F1F1F text, the unmodified 4-color G mark — not the app's own
       * Button component/tokens, since this one is brand-locked. */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={signingIn}
        className="flex h-10 w-full items-center justify-center gap-3 rounded-md border border-[#747775] bg-white px-3 text-sm font-medium text-[#1F1F1F] transition-colors hover:bg-[#F8F9FA] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
      >
        <GoogleLogo />
        {signingIn ? "Redirecting…" : "Sign in with Google"}
      </button>

      {error && <p className="text-center text-xs text-rose-400">{error}</p>}
    </div>
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
