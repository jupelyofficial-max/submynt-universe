import logoManifest from "@/data/logoManifest.json";

const manifest = logoManifest as Record<string, string>;

/** Local logo image path for a subscription id, pre-fetched once via
 * scripts/fetch-logos.mjs into public/logos/ (see logoManifest.json) — no
 * runtime network dependency. Returns null if that subscription has no
 * saved logo, so callers can fall back to their own initials badge. */
export function getLogoPath(id: string): string | null {
  const filename = manifest[id];
  return filename ? `/logos/${filename}` : null;
}
