import { CATEGORY_META } from "./categories";
import type {
  BillingCycle,
  Category,
  Region,
  Subscription,
  SubscriptionPlan,
} from "@/types/subscription";

/**
 * Mock catalogue for the SUBMYNT V2 prototype. Prices are illustrative
 * (INR, monthly-equivalent) — not live pricing. Swap for a real feed
 * without touching any component: everything downstream reads the
 * `Subscription` shape, never an individual brand.
 */

type RawSub = {
  name: string;
  category: Category;
  priceMonthly: number;
  popularity: number; // 0-100
  rating: number; // 0-5
  region: Region;
  tagline?: string;
  isNew?: boolean;
};

/** Country each service originates from — used to place its node on the world map. */
const ORIGIN_BY_NAME: Record<string, string> = {
  "ChatGPT Plus": "United States",
  "Claude Pro": "United States",
  "Gemini Advanced": "United States",
  "Notion AI": "United States",
  "Perplexity Pro": "United States",
  "GitHub Copilot": "United States",
  "Grammarly Premium": "United States",
  "Todoist Pro": "United States",
  "Otter.ai Pro": "United States",
  "Microsoft Copilot Pro": "United States",
  Superhuman: "United States",

  Netflix: "United States",
  "Amazon Prime Video": "United States",
  JioHotstar: "India",
  Zee5: "India",
  SonyLIV: "India",
  ALTBalaji: "India",
  "Voot Select": "India",
  "Lionsgate Play": "United States",

  "Spotify Premium": "Sweden",
  "Apple Music": "United States",
  "YouTube Music Premium": "United States",
  "JioSaavn Pro": "India",
  "Gaana Plus": "India",
  "Wynk Music": "India",
  "Amazon Music Unlimited": "United States",
  Tidal: "Norway",

  "YouTube Premium": "United States",
  "Apple TV+": "United States",
  "MX Player Pro": "India",
  "Discovery+": "United States",
  "Sun NXT": "India",
  Hulu: "United States",
  Crunchyroll: "United States",

  "Google One": "United States",
  "iCloud+": "United States",
  "Dropbox Plus": "United States",
  "Microsoft OneDrive": "United States",
  pCloud: "Switzerland",
  "Amazon Photos": "United States",
  Box: "United States",

  "Adobe Creative Cloud": "United States",
  "Canva Pro": "Australia",
  "Figma Professional": "United States",
  "CapCut Pro": "China",
  "Envato Elements": "Australia",
  Procreate: "Australia",
  "DaVinci Resolve Studio": "Australia",
  Sketch: "Netherlands",
  Framer: "Netherlands",
  "Affinity Suite": "United Kingdom",

  "Coursera Plus": "United States",
  "Duolingo Super": "United States",
  "Udemy Personal Plan": "United States",
  Skillshare: "United States",
  "LinkedIn Learning": "United States",
  "BYJU'S": "India",
  "Unacademy Plus": "India",
  MasterClass: "United States",

  Headspace: "United States",
  Calm: "United States",
  "Cult.fit": "India",
  "MyFitnessPal Premium": "United States",
  Strava: "United States",
  "Peloton App": "United States",
  "Fitbit Premium": "United States",
  "Nike Training Club": "United States",

  "The New York Times": "United States",
  "The Economist": "United Kingdom",
  "Wall Street Journal": "United States",
  "Times Prime": "India",
  "Medium Membership": "United States",
  "Substack Pro": "United States",
  "The Ken": "India",

  "PlayStation Plus": "Japan",
  "Xbox Game Pass": "United States",
  "EA Play": "United States",
  "Apple Arcade": "United States",
  "Google Play Pass": "United States",
  "NVIDIA GeForce NOW": "United States",

  CRED: "India",
  "ET Prime": "India",
  "Morningstar Investor": "United States",
  "INDmoney Premium": "India",
  "smallcase Premium": "India",
  "Value Research Premium": "India",

  "Amazon Prime": "United States",
  "Flipkart VIP": "India",
  "Myntra Insider": "India",
  "Swiggy One": "India",
  "Zomato Gold": "India",
  "BigBasket BB Star": "India",
  "Tata Neu": "India",

  "Microsoft 365": "United States",
  "Google Workspace": "United States",
  "Zoom Pro": "United States",
  "Slack Pro": "United States",
  "Asana Premium": "United States",
  "Monday.com": "Israel",
  "Trello Premium": "Australia",
  "HubSpot Starter": "United States",

  "Discord Nitro": "United States",
  "Telegram Premium": "United Arab Emirates",
  "Google Voice": "United States",
  RingCentral: "United States",
  "Microsoft Teams Premium": "United States",

  "Uber One": "United States",
  "Ola Select": "India",
  "MakeMyTrip Black": "India",
  "Cleartrip Plus": "India",
  "EaseMyTrip Prime": "India",
  "Yatra SmartClub": "India",

  NordVPN: "Lithuania",
  ExpressVPN: "United Kingdom",
  "1Password": "Canada",
  "LastPass Premium": "United States",
  "Norton 360": "United States",
  "McAfee Total Protection": "United States",

  Audible: "United States",
  "Kindle Unlimited": "United States",
  Storytel: "Sweden",
  Blinkist: "Germany",
  Scribd: "United States",
  "Patreon Membership": "United States",
};

/** Real company domain per subscription, used to fetch an actual logo image (see src/lib/logos.ts). */
const DOMAIN_BY_NAME: Record<string, string> = {
  "ChatGPT Plus": "openai.com",
  "Claude Pro": "claude.ai",
  "Gemini Advanced": "gemini.google.com",
  "Notion AI": "notion.so",
  "Perplexity Pro": "perplexity.ai",
  "GitHub Copilot": "github.com",
  "Grammarly Premium": "grammarly.com",
  "Todoist Pro": "todoist.com",
  "Otter.ai Pro": "otter.ai",
  "Microsoft Copilot Pro": "copilot.microsoft.com",
  Superhuman: "superhuman.com",

  Netflix: "netflix.com",
  "Amazon Prime Video": "primevideo.com",
  JioHotstar: "jiohotstar.com",
  Zee5: "zee5.com",
  SonyLIV: "sonyliv.com",
  ALTBalaji: "altbalaji.com",
  "Voot Select": "voot.com",
  "Lionsgate Play": "lionsgateplay.com",

  "Spotify Premium": "spotify.com",
  "Apple Music": "music.apple.com",
  "YouTube Music Premium": "music.youtube.com",
  "JioSaavn Pro": "jiosaavn.com",
  "Gaana Plus": "gaana.com",
  "Wynk Music": "wynk.in",
  "Amazon Music Unlimited": "music.amazon.com",
  Tidal: "tidal.com",

  "YouTube Premium": "youtube.com",
  "Apple TV+": "tv.apple.com",
  "MX Player Pro": "mxplayer.in",
  "Discovery+": "discoveryplus.com",
  "Sun NXT": "sunnxt.com",
  Hulu: "hulu.com",
  Crunchyroll: "crunchyroll.com",

  "Google One": "one.google.com",
  "iCloud+": "icloud.com",
  "Dropbox Plus": "dropbox.com",
  "Microsoft OneDrive": "onedrive.live.com",
  pCloud: "pcloud.com",
  "Amazon Photos": "amazon.com",
  Box: "box.com",

  "Adobe Creative Cloud": "adobe.com",
  "Canva Pro": "canva.com",
  "Figma Professional": "figma.com",
  "CapCut Pro": "capcut.com",
  "Envato Elements": "elements.envato.com",
  Procreate: "procreate.com",
  "DaVinci Resolve Studio": "blackmagicdesign.com",
  Sketch: "sketch.com",
  Framer: "framer.com",
  "Affinity Suite": "affinity.serif.com",

  "Coursera Plus": "coursera.org",
  "Duolingo Super": "duolingo.com",
  "Udemy Personal Plan": "udemy.com",
  Skillshare: "skillshare.com",
  "LinkedIn Learning": "linkedin.com",
  "BYJU'S": "byjus.com",
  "Unacademy Plus": "unacademy.com",
  MasterClass: "masterclass.com",

  Headspace: "headspace.com",
  Calm: "calm.com",
  "Cult.fit": "cult.fit",
  "MyFitnessPal Premium": "myfitnesspal.com",
  Strava: "strava.com",
  "Peloton App": "onepeloton.com",
  "Fitbit Premium": "fitbit.com",
  "Nike Training Club": "nike.com",

  "The New York Times": "nytimes.com",
  "The Economist": "economist.com",
  "Wall Street Journal": "wsj.com",
  "Times Prime": "timesprime.com",
  "Medium Membership": "medium.com",
  "Substack Pro": "substack.com",
  "The Ken": "the-ken.com",

  "PlayStation Plus": "playstation.com",
  "Xbox Game Pass": "xbox.com",
  "EA Play": "ea.com",
  "Apple Arcade": "apple.com",
  "Google Play Pass": "play.google.com",
  "NVIDIA GeForce NOW": "nvidia.com",

  CRED: "cred.club",
  "ET Prime": "economictimes.indiatimes.com",
  "Morningstar Investor": "morningstar.com",
  "INDmoney Premium": "indmoney.com",
  "smallcase Premium": "smallcase.com",
  "Value Research Premium": "valueresearchonline.com",

  "Amazon Prime": "amazon.com",
  "Flipkart VIP": "flipkart.com",
  "Myntra Insider": "myntra.com",
  "Swiggy One": "swiggy.com",
  "Zomato Gold": "zomato.com",
  "BigBasket BB Star": "bigbasket.com",
  "Tata Neu": "tataneu.com",

  "Microsoft 365": "microsoft.com",
  "Google Workspace": "workspace.google.com",
  "Zoom Pro": "zoom.us",
  "Slack Pro": "slack.com",
  "Asana Premium": "asana.com",
  "Monday.com": "monday.com",
  "Trello Premium": "trello.com",
  "HubSpot Starter": "hubspot.com",

  "Discord Nitro": "discord.com",
  "Telegram Premium": "telegram.org",
  "Google Voice": "voice.google.com",
  RingCentral: "ringcentral.com",
  "Microsoft Teams Premium": "teams.microsoft.com",

  "Uber One": "uber.com",
  "Ola Select": "olacabs.com",
  "MakeMyTrip Black": "makemytrip.com",
  "Cleartrip Plus": "cleartrip.com",
  "EaseMyTrip Prime": "easemytrip.com",
  "Yatra SmartClub": "yatra.com",

  NordVPN: "nordvpn.com",
  ExpressVPN: "expressvpn.com",
  "1Password": "1password.com",
  "LastPass Premium": "lastpass.com",
  "Norton 360": "norton.com",
  "McAfee Total Protection": "mcafee.com",

  Audible: "audible.com",
  "Kindle Unlimited": "amazon.com",
  Storytel: "storytel.com",
  Blinkist: "blinkist.com",
  Scribd: "scribd.com",
  "Patreon Membership": "patreon.com",
};

const BRAND_COLORS: Record<string, string> = {
  Netflix: "#E50914",
  "Amazon Prime Video": "#1FA8DC",
  "Amazon Prime": "#00A8E1",
  JioHotstar: "#0F1B4C",
  "Disney+": "#113CCF",
  Spotify: "#1DB954",
  "Apple Music": "#FA2D48",
  "YouTube Music": "#FF0000",
  "YouTube Premium": "#FF0000",
  "ChatGPT Plus": "#10A37F",
  "Claude Pro": "#D97757",
  "Gemini Advanced": "#4285F4",
  Notion: "#000000",
  "Notion AI": "#000000",
  "Adobe Creative Cloud": "#FF0000",
  "Canva Pro": "#00C4CC",
  Figma: "#A259FF",
  "Microsoft 365": "#EA3E23",
  "Google One": "#4285F4",
  "Google Workspace": "#4285F4",
  Dropbox: "#0061FF",
  "GitHub Copilot": "#8957E5",
  Grammarly: "#15C39A",
  Duolingo: "#58CC02",
  "Coursera Plus": "#0056D2",
  Slack: "#4A154B",
  Zoom: "#2D8CFF",
  "PlayStation Plus": "#003791",
  "Xbox Game Pass": "#107C10",
  CRED: "#000000",
  NordVPN: "#4687FF",
  Audible: "#FF9900",
  "Kindle Unlimited": "#232F3E",
};

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) =>
    Math.round(255 * x)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function deriveColor(name: string, category: Category): string {
  if (BRAND_COLORS[name]) return BRAND_COLORS[name];
  const base = CATEGORY_META[category].color;
  // parse base hex to hsl-ish hue jitter for individuality within a category family
  const hash = hashString(name);
  const hueJitter = (hash % 40) - 20;
  const r = parseInt(base.slice(1, 3), 16) / 255;
  const g = parseInt(base.slice(3, 5), 16) / 255;
  const b = parseInt(base.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return hslToHex((h + hueJitter + 360) % 360, Math.min(90, s * 100 + 10), Math.max(35, Math.min(72, l * 100)));
}

function initialsOf(name: string): string {
  const words = name.replace(/[+]/g, " Plus ").split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function defaultBilling(priceMonthly: number): BillingCycle[] {
  if (priceMonthly === 0) return ["free"];
  return ["monthly", "annual"];
}

function defaultPlans(name: string, priceMonthly: number, billing: BillingCycle[]): SubscriptionPlan[] {
  if (billing.includes("free")) {
    return [{ name: "Free", priceMonthly: 0, billing: "free" }];
  }
  const plans: SubscriptionPlan[] = [{ name: "Standard", priceMonthly, billing: "monthly" }];
  if (billing.includes("annual")) {
    plans.push({
      name: "Annual",
      priceMonthly: Math.round(priceMonthly * 0.8),
      billing: "annual",
    });
  }
  if (billing.includes("quarterly")) {
    plans.push({
      name: "Quarterly",
      priceMonthly: Math.round(priceMonthly * 0.92),
      billing: "quarterly",
    });
  }
  return plans;
}

function mkSub(raw: RawSub): Subscription {
  const billing = defaultBilling(raw.priceMonthly);
  return {
    id: slugify(raw.name),
    name: raw.name,
    provider: raw.name,
    category: raw.category,
    tagline: raw.tagline ?? CATEGORY_META[raw.category].blurb,
    color: deriveColor(raw.name, raw.category),
    initials: initialsOf(raw.name),
    domain: DOMAIN_BY_NAME[raw.name] ?? "",
    priceMonthly: raw.priceMonthly,
    billing,
    plans: defaultPlans(raw.name, raw.priceMonthly, billing),
    popularity: raw.popularity,
    rating: raw.rating,
    region: raw.region,
    originCountry: ORIGIN_BY_NAME[raw.name] ?? "United States",
    tags: [raw.category],
    isNew: raw.isNew,
  };
}

const RAW: RawSub[] = [
  // AI & Productivity
  { name: "ChatGPT Plus", category: "AI & Productivity", priceMonthly: 1999, popularity: 96, rating: 4.7, region: "Available in India", tagline: "GPT-5 access, voice mode and advanced reasoning" },
  { name: "Claude Pro", category: "AI & Productivity", priceMonthly: 1670, popularity: 88, rating: 4.8, region: "Available in India", tagline: "Anthropic's assistant for deep, careful work", isNew: true },
  { name: "Gemini Advanced", category: "AI & Productivity", priceMonthly: 1950, popularity: 82, rating: 4.4, region: "Available in India", tagline: "Google's AI across Docs, Gmail and Search" },
  { name: "Notion AI", category: "AI & Productivity", priceMonthly: 830, popularity: 74, rating: 4.5, region: "Available in India", tagline: "AI writing and Q&A inside your workspace" },
  { name: "Perplexity Pro", category: "AI & Productivity", priceMonthly: 1670, popularity: 70, rating: 4.5, region: "Available in India" },
  { name: "GitHub Copilot", category: "AI & Productivity", priceMonthly: 830, popularity: 79, rating: 4.6, region: "Available in India", tagline: "AI pair programmer inside your editor" },
  { name: "Grammarly Premium", category: "AI & Productivity", priceMonthly: 1000, popularity: 68, rating: 4.3, region: "Available in India" },
  { name: "Todoist Pro", category: "AI & Productivity", priceMonthly: 340, popularity: 45, rating: 4.4, region: "Available in India" },
  { name: "Otter.ai Pro", category: "AI & Productivity", priceMonthly: 1400, popularity: 38, rating: 4.1, region: "Global" },
  { name: "Microsoft Copilot Pro", category: "AI & Productivity", priceMonthly: 1700, popularity: 55, rating: 4.2, region: "Available in India" },
  { name: "Superhuman", category: "AI & Productivity", priceMonthly: 2600, popularity: 22, rating: 4.5, region: "Global" },

  // Entertainment
  { name: "Netflix", category: "Entertainment", priceMonthly: 649, popularity: 98, rating: 4.6, region: "Available in India", tagline: "Movies, series and specials on demand" },
  { name: "Amazon Prime Video", category: "Entertainment", priceMonthly: 299, popularity: 90, rating: 4.3, region: "Available in India" },
  { name: "JioHotstar", category: "Entertainment", priceMonthly: 299, popularity: 92, rating: 4.2, region: "India", tagline: "Cricket, movies and Disney originals" },
  { name: "Zee5", category: "Entertainment", priceMonthly: 149, popularity: 58, rating: 3.9, region: "India" },
  { name: "SonyLIV", category: "Entertainment", priceMonthly: 299, popularity: 55, rating: 3.9, region: "India" },
  { name: "ALTBalaji", category: "Entertainment", priceMonthly: 100, popularity: 30, rating: 3.6, region: "India" },
  { name: "Voot Select", category: "Entertainment", priceMonthly: 99, popularity: 28, rating: 3.5, region: "India" },
  { name: "Lionsgate Play", category: "Entertainment", priceMonthly: 99, popularity: 24, rating: 3.7, region: "India" },

  // Music
  { name: "Spotify Premium", category: "Music", priceMonthly: 149, popularity: 95, rating: 4.7, region: "Available in India", tagline: "Ad-free music, offline and high quality" },
  { name: "Apple Music", category: "Music", priceMonthly: 99, popularity: 62, rating: 4.5, region: "Available in India" },
  { name: "YouTube Music Premium", category: "Music", priceMonthly: 139, popularity: 70, rating: 4.2, region: "Available in India" },
  { name: "JioSaavn Pro", category: "Music", priceMonthly: 99, popularity: 66, rating: 4.0, region: "India" },
  { name: "Gaana Plus", category: "Music", priceMonthly: 99, popularity: 35, rating: 3.7, region: "India" },
  { name: "Wynk Music", category: "Music", priceMonthly: 49, popularity: 40, rating: 3.8, region: "India" },
  { name: "Amazon Music Unlimited", category: "Music", priceMonthly: 129, popularity: 48, rating: 4.1, region: "Available in India" },
  { name: "Tidal", category: "Music", priceMonthly: 700, popularity: 18, rating: 4.3, region: "Global" },

  // Video & Streaming
  { name: "YouTube Premium", category: "Video & Streaming", priceMonthly: 149, popularity: 80, rating: 4.4, region: "Available in India", tagline: "Ad-free video, background play and YT Music" },
  { name: "Apple TV+", category: "Video & Streaming", priceMonthly: 99, popularity: 40, rating: 4.4, region: "Available in India" },
  { name: "MX Player Pro", category: "Video & Streaming", priceMonthly: 49, popularity: 20, rating: 3.6, region: "India" },
  { name: "Discovery+", category: "Video & Streaming", priceMonthly: 299, popularity: 22, rating: 3.8, region: "Available in India" },
  { name: "Sun NXT", category: "Video & Streaming", priceMonthly: 99, popularity: 25, rating: 3.6, region: "India" },
  { name: "Hulu", category: "Video & Streaming", priceMonthly: 650, popularity: 15, rating: 4.1, region: "Global" },
  { name: "Crunchyroll", category: "Video & Streaming", priceMonthly: 280, popularity: 33, rating: 4.5, region: "Available in India" },

  // Cloud Storage
  { name: "Google One", category: "Cloud Storage", priceMonthly: 130, popularity: 78, rating: 4.4, region: "Available in India", tagline: "Extra storage across Gmail, Photos and Drive" },
  { name: "iCloud+", category: "Cloud Storage", priceMonthly: 75, popularity: 72, rating: 4.3, region: "Available in India" },
  { name: "Dropbox Plus", category: "Cloud Storage", priceMonthly: 850, popularity: 42, rating: 4.2, region: "Available in India" },
  { name: "Microsoft OneDrive", category: "Cloud Storage", priceMonthly: 140, popularity: 55, rating: 4.1, region: "Available in India" },
  { name: "pCloud", category: "Cloud Storage", priceMonthly: 400, popularity: 15, rating: 4.3, region: "Global" },
  { name: "Amazon Photos", category: "Cloud Storage", priceMonthly: 230, popularity: 20, rating: 3.9, region: "Available in India" },
  { name: "Box", category: "Cloud Storage", priceMonthly: 950, popularity: 18, rating: 4.0, region: "Global" },

  // Software & Creative
  { name: "Adobe Creative Cloud", category: "Software & Creative", priceMonthly: 4230, popularity: 85, rating: 4.5, region: "Available in India", tagline: "Photoshop, Premiere, Illustrator and more" },
  { name: "Canva Pro", category: "Software & Creative", priceMonthly: 500, popularity: 88, rating: 4.6, region: "Available in India" },
  { name: "Figma Professional", category: "Software & Creative", priceMonthly: 1000, popularity: 76, rating: 4.7, region: "Available in India" },
  { name: "CapCut Pro", category: "Software & Creative", priceMonthly: 600, popularity: 65, rating: 4.3, region: "Available in India" },
  { name: "Envato Elements", category: "Software & Creative", priceMonthly: 1650, popularity: 30, rating: 4.4, region: "Global" },
  { name: "Procreate", category: "Software & Creative", priceMonthly: 0, popularity: 35, rating: 4.8, region: "Global", tagline: "One-time purchase, unlimited use" },
  { name: "DaVinci Resolve Studio", category: "Software & Creative", priceMonthly: 0, popularity: 28, rating: 4.6, region: "Global" },
  { name: "Sketch", category: "Software & Creative", priceMonthly: 750, popularity: 12, rating: 4.1, region: "Global" },
  { name: "Framer", category: "Software & Creative", priceMonthly: 1250, popularity: 33, rating: 4.5, region: "Available in India", isNew: true },
  { name: "Affinity Suite", category: "Software & Creative", priceMonthly: 0, popularity: 20, rating: 4.5, region: "Global" },

  // Education
  { name: "Coursera Plus", category: "Education", priceMonthly: 3500, popularity: 60, rating: 4.5, region: "Available in India", tagline: "Unlimited access to courses and certificates" },
  { name: "Duolingo Super", category: "Education", priceMonthly: 420, popularity: 84, rating: 4.6, region: "Available in India" },
  { name: "Udemy Personal Plan", category: "Education", priceMonthly: 850, popularity: 55, rating: 4.3, region: "Available in India" },
  { name: "Skillshare", category: "Education", priceMonthly: 1100, popularity: 30, rating: 4.2, region: "Global" },
  { name: "LinkedIn Learning", category: "Education", priceMonthly: 1600, popularity: 38, rating: 4.3, region: "Available in India" },
  { name: "BYJU'S", category: "Education", priceMonthly: 1200, popularity: 42, rating: 3.4, region: "India" },
  { name: "Unacademy Plus", category: "Education", priceMonthly: 900, popularity: 40, rating: 3.7, region: "India" },
  { name: "MasterClass", category: "Education", priceMonthly: 1000, popularity: 25, rating: 4.4, region: "Global" },

  // Fitness & Wellness
  { name: "Headspace", category: "Fitness & Wellness", priceMonthly: 700, popularity: 45, rating: 4.5, region: "Available in India", tagline: "Guided meditation and sleep" },
  { name: "Calm", category: "Fitness & Wellness", priceMonthly: 750, popularity: 48, rating: 4.6, region: "Available in India" },
  { name: "Cult.fit", category: "Fitness & Wellness", priceMonthly: 1500, popularity: 62, rating: 4.2, region: "India" },
  { name: "MyFitnessPal Premium", category: "Fitness & Wellness", priceMonthly: 800, popularity: 40, rating: 4.1, region: "Available in India" },
  { name: "Strava", category: "Fitness & Wellness", priceMonthly: 500, popularity: 44, rating: 4.4, region: "Available in India" },
  { name: "Peloton App", category: "Fitness & Wellness", priceMonthly: 1000, popularity: 20, rating: 4.3, region: "Global" },
  { name: "Fitbit Premium", category: "Fitness & Wellness", priceMonthly: 650, popularity: 22, rating: 4.0, region: "Available in India" },
  { name: "Nike Training Club", category: "Fitness & Wellness", priceMonthly: 0, popularity: 33, rating: 4.5, region: "Global" },

  // News & Publications
  { name: "The New York Times", category: "News & Publications", priceMonthly: 1400, popularity: 30, rating: 4.5, region: "Global", tagline: "Independent journalism, cooking and games" },
  { name: "The Economist", category: "News & Publications", priceMonthly: 1600, popularity: 24, rating: 4.6, region: "Global" },
  { name: "Wall Street Journal", category: "News & Publications", priceMonthly: 1500, popularity: 18, rating: 4.4, region: "Global" },
  { name: "Times Prime", category: "News & Publications", priceMonthly: 165, popularity: 35, rating: 3.9, region: "India" },
  { name: "Medium Membership", category: "News & Publications", priceMonthly: 420, popularity: 32, rating: 4.1, region: "Global" },
  { name: "Substack Pro", category: "News & Publications", priceMonthly: 0, popularity: 20, rating: 4.2, region: "Global" },
  { name: "The Ken", category: "News & Publications", priceMonthly: 500, popularity: 15, rating: 4.3, region: "India" },

  // Gaming
  { name: "PlayStation Plus", category: "Gaming", priceMonthly: 500, popularity: 55, rating: 4.4, region: "Available in India", tagline: "Online play, monthly games and cloud saves" },
  { name: "Xbox Game Pass", category: "Gaming", priceMonthly: 750, popularity: 58, rating: 4.6, region: "Available in India" },
  { name: "EA Play", category: "Gaming", priceMonthly: 420, popularity: 25, rating: 4.0, region: "Available in India" },
  { name: "Apple Arcade", category: "Gaming", priceMonthly: 99, popularity: 20, rating: 4.2, region: "Available in India" },
  { name: "Google Play Pass", category: "Gaming", priceMonthly: 130, popularity: 15, rating: 3.9, region: "Available in India" },
  { name: "NVIDIA GeForce NOW", category: "Gaming", priceMonthly: 850, popularity: 28, rating: 4.3, region: "Available in India" },

  // Finance
  { name: "CRED", category: "Finance", priceMonthly: 0, popularity: 58, rating: 4.4, region: "India", tagline: "Credit card management and rewards" },
  { name: "ET Prime", category: "Finance", priceMonthly: 300, popularity: 22, rating: 4.0, region: "India" },
  { name: "Morningstar Investor", category: "Finance", priceMonthly: 1900, popularity: 10, rating: 4.3, region: "Global" },
  { name: "INDmoney Premium", category: "Finance", priceMonthly: 300, popularity: 18, rating: 4.0, region: "India" },
  { name: "smallcase Premium", category: "Finance", priceMonthly: 250, popularity: 16, rating: 3.9, region: "India" },
  { name: "Value Research Premium", category: "Finance", priceMonthly: 300, popularity: 12, rating: 4.1, region: "India" },

  // Shopping & Memberships
  { name: "Amazon Prime", category: "Shopping & Memberships", priceMonthly: 300, popularity: 94, rating: 4.5, region: "Available in India", tagline: "Fast delivery, video and music bundled in" },
  { name: "Flipkart VIP", category: "Shopping & Memberships", priceMonthly: 80, popularity: 50, rating: 4.0, region: "India" },
  { name: "Myntra Insider", category: "Shopping & Memberships", priceMonthly: 0, popularity: 45, rating: 4.1, region: "India" },
  { name: "Swiggy One", category: "Shopping & Memberships", priceMonthly: 150, popularity: 68, rating: 4.2, region: "India" },
  { name: "Zomato Gold", category: "Shopping & Memberships", priceMonthly: 150, popularity: 65, rating: 4.1, region: "India" },
  { name: "BigBasket BB Star", category: "Shopping & Memberships", priceMonthly: 60, popularity: 30, rating: 3.9, region: "India" },
  { name: "Tata Neu", category: "Shopping & Memberships", priceMonthly: 0, popularity: 35, rating: 3.8, region: "India" },

  // Professional & Business
  { name: "Microsoft 365", category: "Professional & Business", priceMonthly: 580, popularity: 80, rating: 4.5, region: "Available in India", tagline: "Word, Excel, Teams and cloud storage" },
  { name: "Google Workspace", category: "Professional & Business", priceMonthly: 630, popularity: 70, rating: 4.5, region: "Available in India" },
  { name: "Zoom Pro", category: "Professional & Business", priceMonthly: 1400, popularity: 60, rating: 4.3, region: "Available in India" },
  { name: "Slack Pro", category: "Professional & Business", priceMonthly: 600, popularity: 50, rating: 4.4, region: "Available in India" },
  { name: "Asana Premium", category: "Professional & Business", priceMonthly: 1000, popularity: 32, rating: 4.3, region: "Available in India" },
  { name: "Monday.com", category: "Professional & Business", priceMonthly: 900, popularity: 35, rating: 4.4, region: "Available in India" },
  { name: "Trello Premium", category: "Professional & Business", priceMonthly: 500, popularity: 30, rating: 4.2, region: "Available in India" },
  { name: "HubSpot Starter", category: "Professional & Business", priceMonthly: 1700, popularity: 20, rating: 4.1, region: "Available in India" },

  // Communication
  { name: "Discord Nitro", category: "Communication", priceMonthly: 420, popularity: 46, rating: 4.4, region: "Available in India", tagline: "Boosted servers, better video and emoji" },
  { name: "Telegram Premium", category: "Communication", priceMonthly: 400, popularity: 40, rating: 4.3, region: "Available in India" },
  { name: "Google Voice", category: "Communication", priceMonthly: 850, popularity: 10, rating: 4.0, region: "Global" },
  { name: "RingCentral", category: "Communication", priceMonthly: 1650, popularity: 12, rating: 4.0, region: "Available in India" },
  { name: "Microsoft Teams Premium", category: "Communication", priceMonthly: 660, popularity: 18, rating: 4.1, region: "Available in India" },

  // Travel
  { name: "Uber One", category: "Travel", priceMonthly: 199, popularity: 38, rating: 4.1, region: "India", tagline: "Member pricing on rides and delivery" },
  { name: "Ola Select", category: "Travel", priceMonthly: 179, popularity: 30, rating: 3.7, region: "India" },
  { name: "MakeMyTrip Black", category: "Travel", priceMonthly: 0, popularity: 25, rating: 3.9, region: "India" },
  { name: "Cleartrip Plus", category: "Travel", priceMonthly: 150, popularity: 15, rating: 3.7, region: "India" },
  { name: "EaseMyTrip Prime", category: "Travel", priceMonthly: 99, popularity: 12, rating: 3.6, region: "India" },
  { name: "Yatra SmartClub", category: "Travel", priceMonthly: 0, popularity: 10, rating: 3.5, region: "India" },

  // Utilities
  { name: "NordVPN", category: "Utilities", priceMonthly: 350, popularity: 55, rating: 4.4, region: "Available in India", tagline: "Private, encrypted browsing anywhere" },
  { name: "ExpressVPN", category: "Utilities", priceMonthly: 700, popularity: 48, rating: 4.4, region: "Available in India" },
  { name: "1Password", category: "Utilities", priceMonthly: 250, popularity: 42, rating: 4.6, region: "Available in India" },
  { name: "LastPass Premium", category: "Utilities", priceMonthly: 250, popularity: 20, rating: 4.0, region: "Available in India" },
  { name: "Norton 360", category: "Utilities", priceMonthly: 450, popularity: 25, rating: 4.1, region: "Available in India" },
  { name: "McAfee Total Protection", category: "Utilities", priceMonthly: 400, popularity: 22, rating: 3.9, region: "Available in India" },

  // Other
  { name: "Audible", category: "Other", priceMonthly: 199, popularity: 50, rating: 4.5, region: "Available in India", tagline: "Audiobooks and Originals, one credit a month" },
  { name: "Kindle Unlimited", category: "Other", priceMonthly: 169, popularity: 40, rating: 4.3, region: "Available in India" },
  { name: "Storytel", category: "Other", priceMonthly: 299, popularity: 18, rating: 4.1, region: "Available in India" },
  { name: "Blinkist", category: "Other", priceMonthly: 700, popularity: 15, rating: 4.0, region: "Global" },
  { name: "Scribd", category: "Other", priceMonthly: 800, popularity: 12, rating: 4.0, region: "Global" },
  { name: "Patreon Membership", category: "Other", priceMonthly: 500, popularity: 20, rating: 4.2, region: "Global" },
];

export const SUBSCRIPTIONS: Subscription[] = RAW.map(mkSub);

export const SUBSCRIPTIONS_BY_ID: Record<string, Subscription> = Object.fromEntries(
  SUBSCRIPTIONS.map((s) => [s.id, s])
);

export function getAlternatives(sub: Subscription, limit = 4): Subscription[] {
  return SUBSCRIPTIONS.filter((s) => s.id !== sub.id && s.category === sub.category)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
}

/** Cheapest comparable alternative (similar or better rating) priced lower than `sub`. */
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
