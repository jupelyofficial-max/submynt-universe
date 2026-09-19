import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/adminAllowlist";
import { AdminConsole } from "./AdminConsole";

/** Server Component, not a client useEffect gate — the redirect happens
 * before anything renders, so a non-admin never gets a blank/half-loaded
 * page even for a frame. getUser() (not getSession()) re-validates the
 * JWT against Supabase's Auth server rather than trusting the cookie's
 * contents as-is, which matters for an authorization check like this one.
 * The data API route (api/admin/users) re-checks this independently —
 * this gate alone doesn't protect the data, only the page shell. */
export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminEmail(user?.email)) {
    redirect("/explore");
  }

  return <AdminConsole />;
}
