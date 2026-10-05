import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";
import { POST_SIGNIN_COOKIE, POST_SIGNIN_TARGET } from "@/lib/auth/constants";
import { trackEvent } from "@/lib/events";

const RESUME_KEY = "submynt-resume-intent";
const RESUME_MAX_AGE_MS = 15 * 60 * 1000;
const GATE_KEY = "submynt-gate-signin";

/** The add action a signed-out user clicked, replayed once they're back
 * and their account is loaded. Mirrors setAddSubscriptionsModalOpen's args. */
export interface ResumeIntent {
  kind: "add";
  preselectId?: string | null;
  startAtBundlePick?: boolean;
}

function storeResumeIntent(resume: ResumeIntent | undefined) {
  try {
    if (resume) sessionStorage.setItem(RESUME_KEY, JSON.stringify({ ...resume, ts: Date.now() }));
    // Always overwritten/cleared so an abandoned earlier attempt can't
    // pop an add flow open after an unrelated later sign-in.
    else sessionStorage.removeItem(RESUME_KEY);
  } catch {
    // sessionStorage can be unavailable (private mode) — resume is a nicety.
  }
}

/** Reads and clears the pending add action, if any and still fresh. */
export function consumeResumeIntent(): ResumeIntent | null {
  try {
    const raw = sessionStorage.getItem(RESUME_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(RESUME_KEY);
    const parsed = JSON.parse(raw) as ResumeIntent & { ts?: number };
    if (parsed.kind !== "add") return null;
    if (typeof parsed.ts === "number" && Date.now() - parsed.ts > RESUME_MAX_AGE_MS) return null;
    return { kind: "add", preselectId: parsed.preselectId ?? null, startAtBundlePick: Boolean(parsed.startAtBundlePick) };
  } catch {
    return null;
  }
}

/** True once after a sign-in that was started from a gated action (and
 * clears the marker), so the return trip can log signin_completed_from_gate. */
export function consumeGateSignIn(): { action: string } | null {
  try {
    const action = sessionStorage.getItem(GATE_KEY);
    if (action === null) return null;
    sessionStorage.removeItem(GATE_KEY);
    return { action };
  } catch {
    return null;
  }
}

/** The one Google sign-in implementation — used by the nav Sign In button
 * and by every gated add/edit/remove action. State (signingIn/error) lives
 * in useAuthStore so the visible Sign In button reflects a sign-in started
 * from anywhere. */
export async function signInWithGoogle(options: { resume?: ResumeIntent; gate?: string } = {}): Promise<void> {
  const auth = useAuthStore.getState();
  if (auth.signingIn) return;
  auth.setSigningIn(true);
  auth.setSignInError(null);

  storeResumeIntent(options.resume);
  if (options.gate) {
    trackEvent("track_gate_shown", { action: options.gate });
    try {
      sessionStorage.setItem(GATE_KEY, options.gate);
    } catch {
      // Funnel marker only — sign-in works without it.
    }
  } else {
    // A plain Sign In click must not inherit an abandoned gate attempt.
    try {
      sessionStorage.removeItem(GATE_KEY);
    } catch {}
  }
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${POST_SIGNIN_COOKIE}=${encodeURIComponent(POST_SIGNIN_TARGET)}; Path=/; Max-Age=600; SameSite=Lax${secure}`;

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });

  if (error) {
    auth.setSigningIn(false);
    auth.setSignInError(error.message);
    return;
  }
  if (!data?.url) {
    auth.setSigningIn(false);
    auth.setSignInError("Google sign-in didn't return a redirect URL. Please try again.");
    return;
  }

  // Safety net: if navigation hasn't actually happened within 8s (blocked
  // redirect, browser extension, etc.), stop hanging silently. The Google
  // redirect is a two-hop chain (this page -> Supabase's /authorize ->
  // Google) and the address bar can show the intermediate Supabase hop
  // for a few seconds on a cold start — bail out of the fallback the
  // moment the page actually starts navigating away.
  const timeoutId = setTimeout(() => {
    useAuthStore.getState().setSigningIn(false);
    useAuthStore.getState().setSignInError("Redirect to Google didn't start. Please try again.");
  }, 8000);
  window.addEventListener("pagehide", () => clearTimeout(timeoutId));

  window.location.href = data.url;
}
