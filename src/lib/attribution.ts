const FIRST_TOUCH_KEY = "submynt-first-touch";
const PARAMS = ["utm_source", "utm_medium", "utm_campaign", "ref"] as const;

export type FirstTouch = Partial<Record<(typeof PARAMS)[number], string>>;

/** First-touch acquisition source: the utm_* / ref params of the first
 * visit that carried any, kept in this browser and never overwritten.
 * Only these four campaign labels are read — nothing about the visitor. */
export function captureFirstTouch(): void {
  try {
    if (localStorage.getItem(FIRST_TOUCH_KEY)) return;
    const url = new URL(window.location.href);
    const touch: FirstTouch = {};
    for (const p of PARAMS) {
      const value = url.searchParams.get(p)?.trim();
      if (value) touch[p] = value.slice(0, 100);
    }
    if (Object.keys(touch).length > 0) localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(touch));
  } catch {}
}

/** The stored first-touch params (only the keys that were present). */
export function firstTouch(): FirstTouch {
  try {
    const stored = JSON.parse(localStorage.getItem(FIRST_TOUCH_KEY) ?? "null");
    const touch: FirstTouch = {};
    for (const p of PARAMS) if (typeof stored?.[p] === "string" && stored[p]) touch[p] = stored[p];
    return touch;
  } catch {
    return {};
  }
}
