import { useAuthStore } from "@/store/useAuthStore";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";

/** True once the tracked list is trustworthy to render: localStorage has
 * rehydrated, auth state is known, and — for a signed-in user — their
 * account has actually been loaded (or loading failed and we fell back to
 * local). Signed-in users no longer get a localStorage mirror of their
 * account, so without this gate they'd see an empty list for a beat on
 * every page load. */
export function useSubscriptionsReady(): boolean {
  const hydrated = useMySubscriptionsStore((s) => s.hydrated);
  const authHydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);
  const storeUserId = useMySubscriptionsStore((s) => s.userId);
  const syncFailed = useMySubscriptionsStore((s) => s.syncFailed);
  if (!hydrated || !authHydrated) return false;
  if (!user) return true;
  return storeUserId === user.id || syncFailed;
}
