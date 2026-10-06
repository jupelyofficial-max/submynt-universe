export const TIMED_OUT = Symbol("timed out");

/** Resolves with `work`'s result, or TIMED_OUT if it hasn't settled within
 * `ms`. `work` keeps running; the caller just stops waiting for it. Takes
 * any thenable (Supabase query builders aren't real Promises). */
export async function withTimeout<T>(work: PromiseLike<T>, ms: number): Promise<T | typeof TIMED_OUT> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<typeof TIMED_OUT>((resolve) => {
    timer = setTimeout(() => resolve(TIMED_OUT), ms);
  });
  try {
    return await Promise.race([Promise.resolve(work), timeout]);
  } finally {
    clearTimeout(timer);
  }
}
