// Run once with `node scripts/fetch-logos.mjs` to download real logo images
// for the mock catalogue into public/logos/, plus a manifest mapping each
// subscription's id to its saved filename. NOT a runtime dependency — the
// app reads the local files/manifest, never hits the network for logos.
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// Keep in sync with DOMAIN_BY_NAME in src/data/subscriptions.ts.
const DOMAIN_BY_NAME = {
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

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const outDir = join(process.cwd(), "public", "logos");
mkdirSync(outDir, { recursive: true });

const EXT_BY_CONTENT_TYPE = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/gif": "gif",
};

async function fetchLogo(domain) {
  // Google's public favicon endpoint: reliable, no API key, no rate limit —
  // unlike unavatar.io, whose anonymous tier caps out at a handful of
  // requests/day (confirmed via a live 429 with a 24h retry-after).
  const url = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=256`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const contentType = (res.headers.get("content-type") || "").split(";")[0].trim();
  const ext = EXT_BY_CONTENT_TYPE[contentType];
  if (!ext) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength < 100) return null; // tiny/empty placeholder, treat as a miss
  return { buf, ext };
}

const manifest = {};
const entries = Object.entries(DOMAIN_BY_NAME);
let ok = 0;

for (const [name, domain] of entries) {
  const slug = slugify(name);
  try {
    const logo = await fetchLogo(domain);
    if (logo) {
      const filename = `${slug}.${logo.ext}`;
      writeFileSync(join(outDir, filename), logo.buf);
      manifest[slug] = filename;
      ok += 1;
      console.log(`✓ ${name} -> ${filename}`);
    } else {
      console.log(`✗ ${name} (no logo found for ${domain})`);
    }
  } catch (err) {
    console.log(`✗ ${name} (${err.message})`);
  }
  await sleep(150);
}

writeFileSync(
  join(process.cwd(), "src", "data", "logoManifest.json"),
  JSON.stringify(manifest, null, 2) + "\n"
);

console.log(`\nDone: ${ok}/${entries.length} logos saved to public/logos/, manifest written to src/data/logoManifest.json`);
