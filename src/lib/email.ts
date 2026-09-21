import nodemailer from "nodemailer";

// Titan Mail (GoDaddy) SMTP — venkata@submynt.com. All credentials come
// from env vars (.env.local locally, Vercel project env vars in
// production — .env.local is gitignored and never committed); nothing
// here is hardcoded. See .env.local for the exact variable names and
// Titan's documented SMTP host/port.
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
// Where notification emails land — defaults to the mailbox itself
// (SMTP_USER) since there's one shared inbox today, but stays overridable
// without touching code if that ever changes.
const NOTIFICATION_EMAIL = process.env.CONTACT_NOTIFICATION_EMAIL || SMTP_USER;

export function isEmailConfigured(): boolean {
  return !!(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);
}

let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    // Titan Mail: port 465 is implicit TLS, port 587 is STARTTLS — secure
    // must match whichever port is configured.
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return cachedTransporter;
}

/** Sends a plain-text notification email from/to the configured mailbox.
 * Callers treat a `false` return as non-fatal — email is a notification
 * nice-to-have layered on top of the Supabase write, never a reason to
 * fail the user-facing request that triggered it. */
export async function sendNotificationEmail(subject: string, text: string): Promise<boolean> {
  if (!isEmailConfigured() || !NOTIFICATION_EMAIL) {
    console.error("sendNotificationEmail: SMTP not configured, skipping send");
    return false;
  }
  try {
    await getTransporter().sendMail({
      from: `Submynt <${SMTP_USER}>`,
      to: NOTIFICATION_EMAIL,
      subject,
      text,
    });
    return true;
  } catch (err) {
    console.error("sendNotificationEmail failed", err);
    return false;
  }
}
