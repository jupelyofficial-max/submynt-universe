import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/adminAllowlist";
import { SUBSCRIPTIONS_BY_ID } from "@/data/subscriptions";

// Service-role key, server-only — same pattern as api/submissions. Never
// queried client-side with the anon key: profiles/owned_subscriptions RLS
// is scoped to auth.uid() = user_id (each user reads only their own row),
// which is exactly wrong for an admin view that needs every row.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface AuthUserRow {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

interface ProfileRow {
  user_id: string;
  name: string | null;
  email: string | null;
  contact_number: string | null;
  age: number | null;
  gender: string | null;
  location: string | null;
}

interface OwnedSubscriptionRow {
  user_id: string;
  subscription_id: string;
  plan_name: string | null;
  price_monthly: number | null;
  billing: string | null;
  kept: boolean;
  added_at: string;
}

export interface AdminHeart {
  subscriptionId: string;
  name: string;
  category: string;
  planName: string | null;
  priceMonthly: number | null;
  billing: string | null;
  kept: boolean;
  addedAt: string;
}

export interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  contactNumber: string | null;
  age: number | null;
  gender: string | null;
  location: string | null;
  signupDate: string;
  lastSignIn: string | null;
  hearts: AdminHeart[];
}

export interface AdminUsersResponse {
  users: AdminUser[];
  totalUsers: number;
  totalHearts: number;
}

export async function GET() {
  // Re-checked here independently of the /admin page's own server-side
  // gate — this route is a directly-callable URL, so it can't rely on
  // whatever page happened to render the link to it.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminEmail(user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

  const [authRes, profilesRes, ownedRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, { headers }),
    fetch(`${SUPABASE_URL}/rest/v1/profiles?select=user_id,name,email,contact_number,age,gender,location`, { headers }),
    fetch(`${SUPABASE_URL}/rest/v1/owned_subscriptions?select=user_id,subscription_id,plan_name,price_monthly,billing,kept,added_at`, {
      headers,
    }),
  ]);

  if (!authRes.ok || !profilesRes.ok || !ownedRes.ok) {
    console.error("admin users fetch failed", authRes.status, profilesRes.status, ownedRes.status);
    return NextResponse.json({ error: "Failed to load" }, { status: 502 });
  }

  const authData = (await authRes.json()) as { users: AuthUserRow[] };
  const profiles = (await profilesRes.json()) as ProfileRow[];
  const owned = (await ownedRes.json()) as OwnedSubscriptionRow[];

  const profileByUserId = new Map(profiles.map((p) => [p.user_id, p]));
  const ownedByUserId = new Map<string, OwnedSubscriptionRow[]>();
  for (const row of owned) {
    const list = ownedByUserId.get(row.user_id) ?? [];
    list.push(row);
    ownedByUserId.set(row.user_id, list);
  }

  const users: AdminUser[] = authData.users.map((u) => {
    const profile = profileByUserId.get(u.id);
    const hearts: AdminHeart[] = (ownedByUserId.get(u.id) ?? []).map((row) => {
      const catalog = SUBSCRIPTIONS_BY_ID[row.subscription_id];
      return {
        subscriptionId: row.subscription_id,
        name: catalog?.name ?? row.subscription_id,
        category: catalog?.category ?? "Unknown",
        planName: row.plan_name,
        priceMonthly: row.price_monthly,
        billing: row.billing,
        kept: row.kept,
        addedAt: row.added_at,
      };
    });

    return {
      id: u.id,
      name: profile?.name ?? null,
      email: u.email ?? profile?.email ?? null,
      contactNumber: profile?.contact_number ?? null,
      age: profile?.age ?? null,
      gender: profile?.gender ?? null,
      location: profile?.location ?? null,
      signupDate: u.created_at,
      lastSignIn: u.last_sign_in_at,
      hearts,
    };
  });

  const response: AdminUsersResponse = {
    users,
    totalUsers: users.length,
    totalHearts: owned.length,
  };

  return NextResponse.json(response);
}
