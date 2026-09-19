import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/adminAllowlist";

/** Lets AccountMenu (a client component) decide whether to show the Admin
 * link without ever shipping the allowlist itself to the client — this
 * only ever answers "is the CALLER's own current session an admin?", never
 * anyone else's, so there's nothing here for a non-admin to learn beyond
 * what they already know about themselves. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return NextResponse.json({ isAdmin: isAdminEmail(user?.email) });
}
