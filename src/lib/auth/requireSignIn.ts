import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";
import { signInWithGoogle, type ResumeIntent } from "@/lib/auth/signIn";

/** Runs `action` if the user is signed in; otherwise starts Google
 * sign-in instead (replaying `resume` once they're back, when given).
 * Used by every Track Subscriptions edit/remove control — adds are gated
 * centrally in AddSubscriptionsModal so no entry point can be missed. */
export async function requireSignIn(action: () => void, resume?: ResumeIntent): Promise<void> {
  const auth = useAuthStore.getState();
  let signedIn = Boolean(auth.user);
  if (!auth.hydrated) {
    // Session cookie still being read — don't bounce a signed-in user
    // through OAuth just because they clicked very early.
    const { data } = await createClient().auth.getSession();
    signedIn = Boolean(data.session);
  }
  if (signedIn) action();
  else void signInWithGoogle({ resume });
}
