import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";

const ANON_ID_KEY = "submynt-anon-id";

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

/** Fire-and-forget funnel event into the insert-only `events` table
 * (supabase/events.sql). Never throws and never blocks the UI — a missing
 * table or offline client just drops the event. */
export function trackEvent(eventName: string, props: Record<string, unknown> = {}): void {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return;
    void createClient()
      .from("events")
      .insert({
        event_name: eventName,
        user_id: useAuthStore.getState().user?.id ?? null,
        anon_id: anonId(),
        props,
      })
      .then(({ error }) => {
        if (error) console.warn(`events: "${eventName}" not recorded (${error.message})`);
      });
  } catch {
    // Analytics must never break the app.
  }
}
