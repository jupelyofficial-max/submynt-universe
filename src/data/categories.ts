import type { BillingCycle, Category, Region, SortOption } from "@/types/subscription";

export const CATEGORY_META: Record<Category, { blurb: string; color: string }> = {
  "AI Tools": { blurb: "Assistants and tools that think alongside you", color: "#5B84E0" },
  "Business": { blurb: "Work, collaboration and operations", color: "#4A82B8" },
  "Cloud": { blurb: "Your files, synced across every device", color: "#46C08A" },
  "Communication": { blurb: "Calls, chat and team messaging", color: "#C07B93" },
  "Creative": { blurb: "Design, edit and build professionally", color: "#3FB0B0" },
  "Education": { blurb: "Courses, languages and lifelong learning", color: "#5B9BD9" },
  "Entertainment": { blurb: "Films, series, live TV and video on demand", color: "#E0566E" },
  "Gaming": { blurb: "Play libraries and cloud gaming", color: "#6B84A8" },
  "Music": { blurb: "Streaming sound, everywhere you go", color: "#4AACD6" },
  "News": { blurb: "Journalism and long-form writing", color: "#C24F45" },
  "Productivity": { blurb: "Docs, tasks and getting things done", color: "#6366F1" },
  "Professional Networking": { blurb: "Career profile and professional connections", color: "#0A66C2" },
  "Quick Commerce": { blurb: "Groceries and essentials, delivered in minutes", color: "#8B5FBF" },
  "Reading": { blurb: "Audiobooks, ebooks and long-form writing", color: "#A99C87" },
  "Shopping": { blurb: "Delivery, retail and loyalty perks", color: "#DD7A48" },
  "Travel": { blurb: "Rides, stays and trip planning", color: "#D9668F" },
  "Wellness": { blurb: "Movement, mindfulness and recovery", color: "#3DAE7A" },
};

export const CATEGORIES = Object.keys(CATEGORY_META) as Category[];

export const BILLING_LABELS: Record<BillingCycle, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  "half-yearly": "Half-yearly",
  annual: "Annual",
  lifetime: "Lifetime",
  free: "Free / Freemium",
};

export const BILLING_OPTIONS = Object.keys(BILLING_LABELS) as BillingCycle[];

export const PRICE_BANDS: { id: string; label: string; min: number; max: number | null }[] = [
  { id: "free", label: "Free", min: 0, max: 0 },
  { id: "under-100", label: "Under ₹100", min: 0.01, max: 100 },
  { id: "100-500", label: "₹100 – ₹500", min: 100, max: 500 },
  { id: "500-1000", label: "₹500 – ₹1,000", min: 500, max: 1000 },
  { id: "1000-2500", label: "₹1,000 – ₹2,500", min: 1000, max: 2500 },
  { id: "2500-plus", label: "₹2,500+", min: 2500, max: null },
];

export const REGION_OPTIONS: Region[] = ["India", "Global", "Available in India"];

export const SORT_LABELS: Record<SortOption, string> = {
  popular: "Popular",
  "price-low": "Price: Low to high",
  "price-high": "Price: High to low",
  savings: "Savings potential",
  new: "New",
  "most-subscribed": "Most subscribed",
  recommended: "Recommended",
};

export const SORT_OPTIONS = Object.keys(SORT_LABELS) as SortOption[];

export const USER_STATUS_LABELS = {
  "my-subscriptions": "My subscriptions",
  "not-subscribed": "Not subscribed",
  recommended: "Recommended",
  alternatives: "Alternatives",
  "potential-savings": "Potential savings",
} as const;
