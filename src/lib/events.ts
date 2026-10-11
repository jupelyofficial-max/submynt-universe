import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";
import { firstTouch } from "@/lib/attribution";

const ANON_ID_KEY = "submynt-anon-id";
// Funnel events that also carry the first-touch utm_* / ref (lib/attribution).
const ATTRIBUTED_EVENTS = new Set(["signin_completed", "add_flow_opened", "subscription_added", "bundle_interest"]);

/** Stable per-browser id so signed-out events (the gate being shown) can be
 * tied to the sign-in that follows. Not an identity: random, local only. */
function anonId(): string | null {
  try {
    let id = localStorage.getItem(ANON_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** Forgets this browser's anon id so the next visitor's signed-out events
 * aren't linked to the previous user's (called on sign-out). */
export function resetAnonId(): void {
  try {
    localStorage.removeItem(ANON_ID_KEY);
  } catch {}
}

/** Fire-and-forget funnel event into the insert-only `events` table
 * (supabase/events.sql). Never throws and never blocks the UI — a missing
 * table or offline client just drops the event. The returned promise
 * (never rejects) is only for the rare caller that must let the insert
 * finish first, e.g. sign-out before it reloads the page. */
export function trackEvent(eventName: string, props: Record<string, unknown> = {}): Promise<void> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return Promise.resolve();
    return Promise.resolve(
      createClient()
        .from("events")
        .insert({
          event_name: eventName,
          user_id: useAuthStore.getState().user?.id ?? null,
          anon_id: anonId(),
          props: ATTRIBUTED_EVENTS.has(eventName) ? { ...props, ...firstTouch() } : props,
        })
    ).then(
      ({ error }) => {
        if (error) console.warn(`events: "${eventName}" not recorded (${error.message})`);
      },
      () => {}
    );
  } catch {
    // Analytics must never break the app.
    return Promise.resolve();
  }
}
