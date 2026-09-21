import { NextResponse } from "next/server";
import { sendNotificationEmail } from "@/lib/email";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";

// Server-only route handler — anonymous submitters have no Supabase
// session, so this goes through the service-role key server-side rather
// than a client-side anon-key insert (which RLS would reject anyway).
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Single-line text fields in the form (SubmitListingModal has no
// <textarea>) — a newline/carriage-return here is either a malformed
// submission or an attempt at email-header injection via the notification
// email's subject line, so it's rejected rather than silently stripped.
const CONTROL_CHARS_RE = /[\r\n\0]/;

function isValidSingleLine(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength && !CONTROL_CHARS_RE.test(value);
}

function isValidUrl(value: unknown): value is string {
  if (!isValidSingleLine(value, 2048)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  // 5 submissions per 10 minutes per IP — generous for a real visitor
  // (this form isn't submitted repeatedly in normal use), tight enough to
  // blunt a naive spam script. See rateLimit.ts for the serverless caveat.
  const ip = getClientIp(request);
  if (isRateLimited(`submissions:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests, try again later" }, { status: 429 });
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
    !isValidSingleLine(name, 100) ||
    !isValidUrl(website) ||
    !isValidSingleLine(category, 50) ||
    !isValidSingleLine(tagline, 300) ||
    typeof priceMonthly !== "number" || !Number.isFinite(priceMonthly) || priceMonthly < 0 || priceMonthly > 10_000_000 ||
    !isValidSingleLine(region, 100) ||
    !isValidSingleLine(contactEmail, 254) || !EMAIL_RE.test(contactEmail)
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
