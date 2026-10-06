import { createBrowserClient } from "@supabase/ssr";

// Every request the browser client makes — PostgREST and auth alike — gets
// at most this long. supabase-js has no request timeout of its own, and
// auth-js shares one in-flight token refresh between every caller that
// needs a session (`refreshingDeferred`; within 90s of expiry that is every
// getSession(), i.e. every DB request and signOut). So one refresh request
// that never settles — e.g. a stale connection right after Safari resumes a
// background tab — used to leave every write in the tab waiting forever.
// Bounded, it fails as a retryable network error and everything continues.
const REQUEST_TIMEOUT_MS = 10_000;

function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    const path = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url).pathname;
    console.error(`[supabase] ${path} didn't respond within ${REQUEST_TIMEOUT_MS}ms — aborted`);
    controller.abort(new DOMException("Supabase request timed out", "TimeoutError"));
  }, REQUEST_TIMEOUT_MS);
  // Keep honoring a caller's own abort signal alongside the timeout.
  const outer = init.signal;
  if (outer) {
    if (outer.aborted) controller.abort(outer.reason);
    else outer.addEventListener("abort", () => controller.abort(outer.reason), { once: true });
  }
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

/** Browser-side Supabase client for Google OAuth sign-in — uses the
 * public anon key (safe to expose; RLS is what actually restricts access),
 * distinct from the service-role key used server-side in src/app/api/*
 * routes, which must never reach the client. createBrowserClient returns
 * one shared instance per page in the browser, so calling this repeatedly
 * is cheap and never creates a second auth client. */
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { fetch: fetchWithTimeout },
  });
}
