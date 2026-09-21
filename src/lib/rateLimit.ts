// Best-effort in-memory sliding-window rate limiter — NOT a substitute for
// a shared store (Redis/Upstash) in a real multi-instance deployment:
// Vercel serverless functions don't share memory across instances, so
// this only limits requests landing on the *same* warm instance. Still
// meaningfully raises the bar against a naive script hammering a single
// public endpoint, and costs nothing to run. Upgrade to a shared store if
// abuse in practice shows this isn't enough.
const hits = new Map<string, number[]>();

/** Returns true if `key` (e.g. an IP address) is still within its
 * allowance of `limit` requests per `windowMs`. */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = (hits.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= limit) {
    hits.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  hits.set(key, timestamps);

  // Opportunistic cleanup so `hits` doesn't grow unbounded across a long
  // warm instance lifetime — cheap, runs only on the ~1-in-50 request.
  if (hits.size > 500 && Math.random() < 0.02) {
    for (const [k, v] of hits) {
      if (v.every((t) => t <= windowStart)) hits.delete(k);
    }
  }

  return false;
}

/** Best-effort client IP from standard proxy headers (Vercel sets
 * x-forwarded-for). Never trust this for anything beyond rate-limiting
 * heuristics — it's attacker-controllable if no trusted proxy sets it. */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
