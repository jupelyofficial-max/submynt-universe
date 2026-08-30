// Regenerates src/data/subscriptions.ts and src/data/categories.ts from the
// Supabase catalogue (project ref dmczcxxiusxvtdsagnop, enriched from this
// same mock catalogue in the first place -- see submynt_v2_archived's
// migration/enrich_brands_from_universe.py). Build-time/dev-time only: run
// this manually, review the diff, commit the regenerated files -- the
// deployed app never talks to Supabase at runtime, so a re-run is required
// to pick up any future catalogue changes made in Supabase.
//
// Deliberately does NOT touch: the Category/Subscription/SubscriptionPlan
// types, BILLING_LABELS/PRICE_BANDS/REGION_OPTIONS/SORT_LABELS/USER_STATUS_LABELS
// (UI/filter config, not catalogue content), or any component -- both
// regenerated files keep their exact existing exports so nothing downstream
// needs to change.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function loadEnv(path) {
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx);
    let value = trimmed.slice(idx + 1);
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnv(join(ROOT, ".env.local"));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

async function pg(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${await res.text()}`);
  return res.json();
}

const categories = await pg("categories?select=name,color,blurb&order=name.asc");
const brands = await pg(
  "brands?select=slug,name,category:categories(name),color,default_price,tagline,initials,domain,popularity,rating,region,tags,is_new,trial_days,deal_url,billing,plans&order=popularity.desc.nullslast"
);

console.log(`Fetched ${categories.length} categories, ${brands.length} brands.`);

const missing = brands.filter((b) => b.tagline == null || b.popularity == null || b.rating == null || b.region == null || b.billing == null || b.plans == null);
if (missing.length) {
  console.error(`Refusing to generate: ${missing.length} brand(s) missing required fields:`, missing.map((b) => b.slug));
  process.exit(1);
}

function esc(s) {
  return JSON.stringify(s);
}

// ---------- categories.ts: only CATEGORY_META + CATEGORIES change ----------
const categoriesSrc = readFileSync(join(ROOT, "src/data/categories.ts"), "utf8");
const metaBlock = categories
  .map((c) => `  ${esc(c.name)}: { blurb: ${esc(c.blurb)}, color: ${esc(c.color)} },`)
  .join("\n");
const categoryMetaPattern = /export const CATEGORY_META: Record<Category, \{ blurb: string; color: string \}> = \{[\s\S]*?\n\};/;
if (!categoryMetaPattern.test(categoriesSrc)) {
  console.error("CATEGORY_META block not found -- aborting without writing.");
  process.exit(1);
}
const newCategoriesSrc = categoriesSrc.replace(
  categoryMetaPattern,
  `export const CATEGORY_META: Record<Category, { blurb: string; color: string }> = {\n${metaBlock}\n};`
);
writeFileSync(join(ROOT, "src/data/categories.ts"), newCategoriesSrc);

// ---------- subscriptions.ts: full regenerate of the catalogue section ----------
function subscriptionLiteral(b) {
  const plans = b.plans
    .map((p) => `{ name: ${esc(p.name)}, priceMonthly: ${p.priceMonthly}, billing: ${esc(p.billing)} }`)
    .join(", ");
  const billing = b.billing.map(esc).join(", ");
  const tags = (b.tags ?? [b.category.name]).map(esc).join(", ");
  const extra = [];
  if (b.is_new) extra.push(`isNew: true`);
  if (b.trial_days != null) extra.push(`trialDays: ${b.trial_days}`);
  if (b.deal_url) extra.push(`dealUrl: ${esc(b.deal_url)}`);
  return `  {
    id: ${esc(b.slug)},
    name: ${esc(b.name)},
    provider: ${esc(b.name)},
    category: ${esc(b.category.name)},
    tagline: ${esc(b.tagline)},
    color: ${esc(b.color)},
    initials: ${esc(b.initials)},
    domain: ${esc(b.domain ?? "")},
    priceMonthly: ${Number(b.default_price)},
    billing: [${billing}],
    plans: [${plans}],
    popularity: ${b.popularity},
    rating: ${b.rating},
    region: ${esc(b.region)},
    tags: [${tags}],${extra.length ? "\n    " + extra.join(",\n    ") + "," : ""}
  },`;
}

const header = `import type { Subscription } from "@/types/subscription";

/**
 * Real catalogue, synced from Supabase (project dmczcxxiusxvtdsagnop) via
 * scripts/sync-catalogue-from-supabase.mjs -- do not hand-edit entries here,
 * edit them in Supabase and re-run the sync script instead. Prices are
 * still illustrative for most entries (see each brand's own row in Supabase
 * for confidence level), but the shape and IDs are the real source of truth
 * as of the last sync.
 */

export const SUBSCRIPTIONS: Subscription[] = [
${brands.map(subscriptionLiteral).join("\n")}
];

export const SUBSCRIPTIONS_BY_ID: Record<string, Subscription> = Object.fromEntries(
  SUBSCRIPTIONS.map((s) => [s.id, s])
);

export function getAlternatives(sub: Subscription, limit = 4): Subscription[] {
  return SUBSCRIPTIONS.filter((s) => s.id !== sub.id && s.category === sub.category)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
}

/** Cheapest comparable alternative (similar or better rating) priced lower than \`sub\`. */
export function bestSavingsAlternative(sub: Subscription): Subscription | null {
  const candidates = SUBSCRIPTIONS.filter(
    (s) =>
      s.id !== sub.id &&
      s.category === sub.category &&
      s.priceMonthly < sub.priceMonthly &&
      s.rating >= sub.rating - 0.6
  ).sort((a, b) => a.priceMonthly - b.priceMonthly);
  return candidates[0] ?? null;
}

export function potentialSavingsMonthly(sub: Subscription): number {
  const alt = bestSavingsAlternative(sub);
  if (!alt) return 0;
  return Math.max(0, sub.priceMonthly - alt.priceMonthly);
}
`;

writeFileSync(join(ROOT, "src/data/subscriptions.ts"), header);
console.log("Wrote src/data/subscriptions.ts and src/data/categories.ts.");
