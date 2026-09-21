import { NextResponse } from "next/server";
import { sendNotificationEmail } from "@/lib/email";

// Server-only route handler — anonymous submitters have no Supabase
// session, so this goes through the service-role key server-side rather
// than a client-side anon-key insert (which RLS would reject anyway).
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const name = body?.name;
  const website = body?.website;
  const category = body?.category;
  const tagline = body?.tagline;
  const priceMonthly = body?.priceMonthly;
  const region = body?.region;
  const contactEmail = body?.contactEmail;

  if (
    typeof name !== "string" || !name.trim() ||
    typeof website !== "string" || !website.trim() ||
    typeof category !== "string" || !category.trim() ||
    typeof tagline !== "string" || !tagline.trim() ||
    typeof priceMonthly !== "number" || Number.isNaN(priceMonthly) ||
    typeof region !== "string" || !region.trim() ||
    typeof contactEmail !== "string" || !contactEmail.trim()
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/submissions`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      name,
      website,
      category,
      tagline,
      price_monthly: priceMonthly,
      region,
      contact_email: contactEmail,
    }),
  });

  if (!res.ok) {
    console.error("submissions insert failed", res.status, await res.text().catch(() => ""));
    return NextResponse.json({ error: "Failed to save" }, { status: 502 });
  }

  // Notification only — the submission is already saved above regardless
  // of whether this succeeds (sendNotificationEmail swallows its own
  // errors and returns false), so a misconfigured/down mailbox never
  // blocks a real submitter. Awaited rather than fire-and-forget because
  // Vercel's serverless runtime can freeze the function once the response
  // is returned, killing any still-pending promise.
  await sendNotificationEmail(
    `New listing submission: ${name}`,
    [
      `Name: ${name}`,
      `Website: ${website}`,
      `Category: ${category}`,
      `Tagline: ${tagline}`,
      `Price/month: ${priceMonthly}`,
      `Region: ${region}`,
      `Contact email: ${contactEmail}`,
    ].join("\n")
  );

  return NextResponse.json({ ok: true });
}
