import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Server-side Supabase client (Route Handlers / Server Components) — reads
 * the session from the request's cookies via @supabase/ssr's cookie
 * adapter. `cookies()` is async in this Next.js version (15+), must be
 * awaited before use. Uses the public anon key + RLS, same as the browser
 * client — this is about reading the *user's* session server-side, not a
 * privileged bypass (that's what the service-role key in api/* is for). */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component, where cookies can't be set —
            // harmless as long as the proxy (src/proxy.ts) is also
            // refreshing the session, which it is.
          }
        },
      },
    }
  );
}
