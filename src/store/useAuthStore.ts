import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";

interface AuthState {
  session: Session | null;
  user: User | null;
  /** False until the initial session check (or first onAuthStateChange
   * event) has resolved — lets UI avoid flashing a "logged out" state
   * before Supabase has had a chance to read the session cookie. */
  hydrated: boolean;
  setSession: (session: Session | null) => void;
}

/** Not a `persist` store like the others in this app — Supabase's own
 * browser client already persists the session (via cookies, see
 * lib/supabase/client.ts), so this just mirrors that live state in memory.
 * Populated by the onAuthStateChange subscription set up once in
 * providers.tsx. */
export const useAuthStore = create<AuthState>()((set) => ({
  session: null,
  user: null,
  hydrated: false,
  setSession: (session) => set({ session, user: session?.user ?? null, hydrated: true }),
}));
