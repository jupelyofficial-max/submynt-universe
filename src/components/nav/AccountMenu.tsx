"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Heart, LogOut, Sparkles, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import { useAuthStore } from "@/store/useAuthStore";
import { useUniverseStore } from "@/store/useUniverseStore";
import { createClient } from "@/lib/supabase/client";

/** Signed out: a labeled "Sign in" button (an icon-only trigger tested as
 * too easy to miss) that opens AuthModal's Google sign-in sheet. Signed
 * in: initial-letter avatar that opens a dropdown (same portaled/
 * positioned pattern as FilterDropdown), not the modal sheet — matches
 * the avatar->dropdown structure of the reference, styled with Submynt's
 * own tokens. */
export function AccountMenu() {
  const user = useAuthStore((s) => s.user);
  const setAuthModalOpen = useUniverseStore((s) => s.setAuthModalOpen);

  if (!user) {
    return (
      <Button variant="outline" size="sm" className="h-9 shrink-0 rounded-full" onClick={() => setAuthModalOpen(true)}>
        Sign in
      </Button>
    );
  }

  return <LoggedInMenu email={user.email ?? ""} />;
}

function LoggedInMenu({ email }: { email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const outsideRefs = useMemo(() => [triggerRef, menuRef], []);
  useOnClickOutside(outsideRefs, () => setOpen(false));

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
          {(email || "?")[0]!.toUpperCase()}
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
            <div className="truncate px-2.5 py-1.5 text-xs text-ink-500">{email}</div>
            <div className="my-1 h-px bg-black/10" />
            <MenuItem icon={<Sparkles size={14} />} label="For you" onClick={() => go("/for-you")} />
            <MenuItem icon={<Heart size={14} />} label="Saved subscriptions" onClick={() => go("/my-subscriptions")} />
            <MenuItem icon={<SlidersHorizontal size={14} />} label="Preferences" onClick={() => go("/onboarding")} />
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
