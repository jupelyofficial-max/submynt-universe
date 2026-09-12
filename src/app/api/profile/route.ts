import { NextResponse } from "next/server";

// Server-only route handler — same reasoning as api/perks/route.ts: the
// service-role key stays server-only, no client-exposed anon key needed.
//
// user_id is profiles' primary key with NOT NULL but (as of this route's
// creation) no foreign-key constraint — there is no login/signup system
// behind this modal, so a random UUID per submission is a synthetic,
// unique-only identifier, not a reference to any real account.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const name = body?.name;
  const email = body?.email;
  const contactNumber = body?.contactNumber;
  const age = body?.age;
  const gender = body?.gender;
  const profession = body?.profession;
  const location = body?.location;

  // All fields are now required (the form blocks submission first via
  // native `required` inputs) — this mirrors that server-side rather than
  // silently accepting a request that skipped client validation.
  const ageNumber = typeof age === "number" ? age : typeof age === "string" ? Number(age) : NaN;
  if (
    typeof name !== "string" || !name.trim() ||
    typeof email !== "string" || !email.trim() ||
    typeof contactNumber !== "string" || !contactNumber.trim() ||
    Number.isNaN(ageNumber) ||
    typeof gender !== "string" || !gender.trim() ||
    typeof profession !== "string" || !profession.trim() ||
    typeof location !== "string" || !location.trim()
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      user_id: crypto.randomUUID(),
      name,
      email,
      contact_number: contactNumber,
      age: ageNumber,
      gender,
      profession,
      location,
    }),
  });

  if (!res.ok) {
    console.error("profiles insert failed", res.status, await res.text().catch(() => ""));
    return NextResponse.json({ error: "Failed to save" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
