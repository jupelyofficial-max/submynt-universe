import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";
import { POST_SIGNIN_COOKIE, POST_SIGNIN_TARGET } from "@/lib/auth/constants";
import { trackEvent } from "@/lib/events";

const RESUME_KEY = "submynt-resume-intent";
const RESUME_MAX_AGE_MS = 15 * 60 * 1000;
const GATE_KEY = "submynt-gate-signin";
const SOURCE_KEY = "submynt-signin-source";
const REDIRECT_WAIT_MS = 15000;

export type SignInSource = "nav" | "gate" | "other";

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

/** The source of a sign-in this tab started (and clears it), so the
 * return trip can log signin_completed exactly once. */
export function consumeSignInSource(): SignInSource | null {
  try {
    const source = sessionStorage.getItem(SOURCE_KEY);
    if (source === null) return null;
    sessionStorage.removeItem(SOURCE_KEY);
    return source as SignInSource;
  } catch {
    return null;
  }
}

/** Drops every trace of an in-progress or abandoned sign-in — pending
 * resume/gate/source markers, the post-sign-in cookie and the button's
 * progress/error state. Called on sign-out so none of it carries over to
 * whoever signs in next on this browser. */
export function clearSignInState(): void {
  try {
    sessionStorage.removeItem(RESUME_KEY);
    sessionStorage.removeItem(GATE_KEY);
    sessionStorage.removeItem(SOURCE_KEY);
  } catch {}
  document.cookie = `${POST_SIGNIN_COOKIE}=; Path=/; Max-Age=0`;
  useAuthStore.getState().setSigningIn(false);
  useAuthStore.getState().setSignInError(null);
}

function failSignIn(reason: string, message: string) {
  try {
    sessionStorage.removeItem(SOURCE_KEY);
  } catch {}
  trackEvent("signin_failed", { reason });
  useAuthStore.getState().setSigningIn(false);
  useAuthStore.getState().setSignInError(message);
}

/** The one Google sign-in implementation — used by the nav Sign In button
 * and by every gated add/edit/remove action. State (signingIn/error) lives
 * in useAuthStore so the visible Sign In button reflects a sign-in started
 * from anywhere. */
export async function signInWithGoogle(
  options: { resume?: ResumeIntent; gate?: string; source?: Exclude<SignInSource, "gate"> } = {}
): Promise<void> {
  const auth = useAuthStore.getState();
  if (auth.signingIn) return;
  auth.setSigningIn(true);
  auth.setSignInError(null);

  const source: SignInSource = options.gate ? "gate" : options.source ?? "other";
  trackEvent("signin_clicked", { source });
  try {
    sessionStorage.setItem(SOURCE_KEY, source);
  } catch {}

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

  let result;
  try {
    result = await createClient().auth.signInWithOAuth({
      provider: "google",
      // We navigate ourselves (below). Without this, supabase-js also
      // redirects on its own, and the two back-to-back navigations to the
      // same URL can cancel each other in Chromium — the page then never
      // leaves and sign-in looks like it "didn't start".
      options: { redirectTo: `${window.location.origin}/auth/callback`, skipBrowserRedirect: true },
    });
  } catch {
    failSignIn("exception", "Couldn't start Google sign-in. Please try again.");
    return;
  }
  const { data, error } = result;

  if (error) {
    failSignIn("oauth_error", error.message);
    return;
  }
  if (!data?.url) {
    failSignIn("no_url", "Google sign-in didn't return a redirect URL. Please try again.");
    return;
  }

  // Safety net, not a verdict: the redirect is a two-hop chain (this page
  // -> Supabase's /authorize -> Google), and Safari only fires pagehide
  // once Google's page actually commits — on a slow network that can take
  // a while. So wait generously, then just re-enable the button with a
  // soft nudge rather than declaring failure; the redirect may still land.
  const timeoutId = setTimeout(() => {
    trackEvent("signin_failed", { reason: "timeout" });
    useAuthStore.getState().setSigningIn(false);
    useAuthStore.getState().setSignInError("Still waiting for Google… if nothing happens, try again.");
  }, REDIRECT_WAIT_MS);
  window.addEventListener("pagehide", () => clearTimeout(timeoutId), { once: true });
  // Back from Google via the back button: the page is restored from the
  // bfcache exactly as it was left — still "Redirecting…" with the button
  // disabled. Reset it so the user can try again.
  window.addEventListener(
    "pageshow",
    (event) => {
      if (!event.persisted) return;
      clearTimeout(timeoutId);
      useAuthStore.getState().setSigningIn(false);
    },
    { once: true }
  );

  window.location.href = data.url;
}
