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
  const profession = body?.profession;
  const location = body?.location;

  if (
    typeof name !== "string" || !name.trim() ||
    typeof email !== "string" || !email.trim() ||
    typeof contactNumber !== "string" || !contactNumber.trim() ||
    typeof profession !== "string" || !profession.trim() ||
    typeof location !== "string" || !location.trim()
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // age is optional (form has "no strict validation") — pass through as a
  // number when present and numeric, otherwise omit rather than send junk.
  const ageNumber = typeof age === "number" ? age : typeof age === "string" && age.trim() ? Number(age) : null;

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
      age: ageNumber !== null && !Number.isNaN(ageNumber) ? ageNumber : null,
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
