"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Heart, LogOut, ShieldCheck, Sparkles, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import { useAuthStore } from "@/store/useAuthStore";
import { createClient } from "@/lib/supabase/client";

/** Signed out: a labeled "Sign in" button that calls signInWithOAuth
 * directly — no confirmation modal in between, since that extra step
 * (AuthModal, now removed) just added friction before the real Google
 * redirect. Signed in: initial-letter avatar that opens a dropdown (same
 * portaled/positioned pattern as FilterDropdown), styled with Submynt's
 * own tokens. */
export function AccountMenu() {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <SignInButton />;
  }

  // Google's OAuth response already carries the account's display name in
  // user_metadata (full_name, or name as a fallback for some providers) —
  // no extra profiles fetch needed just for the avatar initial/label.
  const name = (user.user_metadata?.full_name as string | undefined) ?? (user.user_metadata?.name as string | undefined);
  return <LoggedInMenu email={user.email ?? ""} name={name} />;
}

function SignInButton() {
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const [errorPos, setErrorPos] = useState({ top: 0, right: 0 });
  const outsideRefs = useMemo(() => [triggerRef, errorRef], []);
  useOnClickOutside(outsideRefs, () => setError(null));

  useLayoutEffect(() => {
    if (!error) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setErrorPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
  }, [error]);

  async function handleGoogleSignIn() {
    setSigningIn(true);
    setError(null);
    const supabase = createClient();
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

    // Safety net: if navigation hasn't actually happened within 8s (blocked
    // redirect, browser extension, etc.), stop hanging silently. The Google
    // redirect is a two-hop chain (this page -> Supabase's /authorize ->
    // Google) and the address bar can show the intermediate Supabase hop
    // for a few seconds on a cold start — bail out of the fallback the
    // moment the page actually starts navigating away instead of firing a
    // false "didn't start" error mid-redirect.
    const timeoutId = setTimeout(() => {
      setSigningIn(false);
      setError("Redirect to Google didn't start. Please try again.");
    }, 8000);
    window.addEventListener("pagehide", () => clearTimeout(timeoutId));

    window.location.href = data.url;
  }

  return (
    <>
      <div ref={triggerRef} className="shrink-0">
        {/* bg-[#22c55e] — same hex the "mynt" wordmark uses (TopNav.tsx) and
            the removed Universe/List switcher used to use, not a theme
            token. ink-0 text (not white) for contrast on this green — white
            measures ~2.0-2.3:1 against it (WCAG AA needs 4.5:1), ink-0
            measures ~7.9-8.9:1. */}
        <Button
          variant="outline"
          size="sm"
          className="h-9 rounded-full border-transparent bg-[#22c55e] text-ink-0 hover:bg-[#22c55e]/90"
          onClick={handleGoogleSignIn}
          disabled={signingIn}
        >
          {signingIn ? "Redirecting…" : "Sign in"}
        </Button>
      </div>

      {error &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={errorRef}
            style={{ position: "fixed", top: errorPos.top, right: errorPos.right }}
            className="z-50 w-64 rounded-xl border border-red-500/20 bg-void-900 p-3 text-xs text-rose-400 shadow-xl shadow-black/40"
          >
            {error}
          </div>,
          document.body
        )}
    </>
  );
}

function LoggedInMenu({ email, name }: { email: string; name?: string }) {
  const initial = (name || email || "?")[0]!.toUpperCase();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [isAdmin, setIsAdmin] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const outsideRefs = useMemo(() => [triggerRef, menuRef], []);
  useOnClickOutside(outsideRefs, () => setOpen(false));

  // Server-checked rather than derived from anything already on hand
  // client-side — keeps the admin allowlist itself out of the client
  // bundle. A signed-in non-admin just never sees this state flip.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/check")
      .then((res) => res.json())
      .then((json: { isAdmin: boolean }) => {
        if (!cancelled) setIsAdmin(json.isAdmin);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Right-edge-anchored (not left, like FilterDropdown) — this trigger sits
  // at the far right of the nav, so a left-aligned menu would overflow off
  // the viewport.
  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) setMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  async function handleSignOut() {
    setOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-label="Account"
        aria-expanded={open}
        className="h-10 w-10 flex shrink-0 items-center justify-center rounded-xl hover:bg-black/5 transition-colors cursor-pointer"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ocean-600 text-xs font-semibold text-white">
          {initial}
        </span>
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: menuPos.top, right: menuPos.right }}
            className="z-50 w-56 overflow-hidden rounded-xl border border-black/10 bg-void-900 p-1.5 shadow-xl shadow-black/40"
          >
            <div className="px-2.5 py-1.5">
              {name && <div className="truncate text-xs font-medium text-ink-0">{name}</div>}
              <div className="truncate text-xs text-ink-500">{email}</div>
            </div>
            <div className="my-1 h-px bg-black/10" />
            <MenuItem icon={<Sparkles size={14} />} label="For you" onClick={() => go("/for-you")} />
            <MenuItem icon={<Heart size={14} />} label="Saved subscriptions" onClick={() => go("/my-subscriptions")} />
            <MenuItem icon={<SlidersHorizontal size={14} />} label="Preferences" onClick={() => go("/onboarding")} />
            {isAdmin && (
              <>
                <div className="my-1 h-px bg-black/10" />
                <MenuItem icon={<ShieldCheck size={14} />} label="Admin console" onClick={() => go("/admin")} />
              </>
            )}
            <div className="my-1 h-px bg-black/10" />
            <MenuItem icon={<LogOut size={14} />} label="Sign out" onClick={handleSignOut} tone="danger" />
          </div>,
          document.body
        )}
    </>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  tone?: "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer",
        tone === "danger" ? "text-red-400 hover:bg-red-500/10" : "text-ink-200 hover:bg-black/5"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
