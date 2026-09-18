"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { useUniverseStore } from "@/store/useUniverseStore";
import { useAuthStore } from "@/store/useAuthStore";
import { createClient } from "@/lib/supabase/client";

/** Sign-in sheet only — the logged-in case (account summary, sign out) is
 * AccountMenu's dropdown (nav/AccountMenu.tsx), not this modal. Only ever
 * opened while signed out, but auto-closes itself if a session appears
 * while it happens to be open (e.g. a stale tab), rather than assuming
 * that can't happen. */
export function AuthModal() {
  const isOpen = useUniverseStore((s) => s.isAuthModalOpen);
  const close = () => useUniverseStore.getState().setAuthModalOpen(false);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (isOpen && user) close();
  }, [isOpen, user]);

  return (
    <ResponsiveSheet open={isOpen} onClose={close} title="Sign in" desktopVariant="center" widthClassName="w-[380px]" panelVariant="solid">
      {isOpen && <SignInPanel />}
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
    // signInWithOAuth is documented to redirect the browser itself when
    // skipBrowserRedirect isn't set — in practice that didn't fire (the
    // button hung on "Redirecting…" forever on the live site), and the
    // previous version of this code discarded `data` entirely, so there
    // was no fallback and no way to ever see it fail. Navigating via
    // data.url explicitly removes the dependency on that implicit
    // behavior; a timeout below is the fallback if even this doesn't fire.
    const { data, error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    if (signInError) {
      setSigningIn(false);
      setError(signInError.message);
      return;
    }

    if (!data?.url) {
      setSigningIn(false);
      setError("Google sign-in didn't return a redirect URL. Please try again.");
      return;
    }

    // Safety net: if navigation hasn't actually happened within 5s (blocked
    // redirect, browser extension, etc.), stop showing "Redirecting…"
    // forever and surface it instead of hanging silently. Never fires on
    // the normal path — the page unloads before the timer completes.
    setTimeout(() => {
      setSigningIn(false);
      setError("Redirect to Google didn't start. Please try again.");
    }, 5000);

    window.location.href = data.url;
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
