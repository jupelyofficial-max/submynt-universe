import { createBrowserClient } from "@supabase/ssr";

/** Browser-side Supabase client for the magic-link auth flow — uses the
 * public anon key (safe to expose; RLS is what actually restricts access),
 * distinct from the service-role key used server-side in src/app/api/*
 * routes, which must never reach the client. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
