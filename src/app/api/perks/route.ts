import { NextResponse } from "next/server";

// Server-only route handler — runs on Vercel's Node runtime, never in the
// browser, so SUPABASE_SERVICE_ROLE_KEY (already server-only, see
// scripts/sync-catalogue-from-supabase.mjs) stays server-only here too. No
// new client-exposed key needed: this is deliberately not a client-side
// Supabase insert with an anon key, since RLS on perks_requests is
// default-deny (no policies) and an anon key would just get rejected —
// same reasoning covers submissions/route.ts.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const userType = body?.userType;
  const email = body?.email;
  const phone = body?.phone;

  if (typeof userType !== "string" || typeof email !== "string" || typeof phone !== "string" || !email.trim() || !phone.trim()) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/perks_requests`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ user_type: userType, email, phone }),
  });

  if (!res.ok) {
    console.error("perks_requests insert failed", res.status, await res.text().catch(() => ""));
    return NextResponse.json({ error: "Failed to save" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
