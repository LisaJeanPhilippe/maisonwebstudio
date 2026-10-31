/** Small, dependency-free helpers for normalizing business data. */

const STOP_WORDS = new Set(["the", "llc", "inc", "co", "company", "corp", "ltd", "and"]);

export function normalizeName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w && !STOP_WORDS.has(w))
    .join(" ")
    .trim();
}

export const dedupeKey = (name: string, city?: string | null, state?: string | null) =>
  [normalizeName(name), normalizeName(city ?? ""), (state ?? "").trim().toUpperCase()].join("|");

/** US numbers only: returns 10 digits, or null. */
export function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null;
  let d = phone.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  return d.length === 10 ? d : null;
}

/** Domains that are profiles or directories, never a business's own website. */
export const SOCIAL_OR_DIRECTORY = [
  "facebook.com", "fb.com", "instagram.com", "tiktok.com", "twitter.com", "x.com", "linkedin.com", "youtube.com",
  "pinterest.com", "threads.net", "linktr.ee", "linkin.bio", "beacons.ai", "lnk.bio", "taplink.cc",
  "yelp.com", "google.com", "goo.gl", "g.page", "maps.app.goo.gl", "tripadvisor.com", "nextdoor.com",
  "booksy.com", "vagaro.com", "styleseat.com", "fresha.com", "thumbtack.com", "angi.com", "homeadvisor.com",
  "houzz.com", "bbb.org", "yellowpages.com", "mapquest.com", "doordash.com", "ubereats.com", "grubhub.com",
  "opentable.com", "resy.com", "squareup.com", "square.site", "wixsite.com", "business.site",
];

export function domainOf(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
    return u.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

export const isSocialOrDirectory = (url?: string | null) => {
  const d = domainOf(url);
  return !!d && SOCIAL_OR_DIRECTORY.some((s) => d === s || d.endsWith(`.${s}`));
};

/** Business-own domain for dedupe, ignoring social profiles and free page builders. */
export const ownDomain = (url?: string | null) => (isSocialOrDirectory(url) ? null : domainOf(url));

export function normalizeUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
}

const EMAIL_RE = /^[a-z0-9._%+'-]+@[a-z0-9.-]+\.[a-z]{2,24}$/i;
export const isEmail = (s?: string | null) => !!s && s.length <= 254 && EMAIL_RE.test(s.trim());
export const normalizeEmail = (s?: string | null) => (isEmail(s) ? s!.trim().toLowerCase() : null);

/** "jordan@example.com" → "j***@example.com" for logs. */
export function maskEmail(email?: string | null) {
  if (!email) return null;
  const [u, d] = email.split("@");
  return d ? `${u.slice(0, 1)}***@${d}` : "***";
}

/** Addresses that are role or no-reply mailboxes we must never write to. */
export const isUnusableMailbox = (email: string) =>
  /^(no-?reply|do-?not-?reply|mailer-daemon|postmaster|abuse|privacy|legal|dmca|unsubscribe)@/i.test(email);

export const wordCount = (s: string) => (s.trim().match(/\S+/g) ?? []).length;

/** Word 3-gram Jaccard similarity, used to stop near-identical emails going out. */
export function similarity(a: string, b: string): number {
  const grams = (s: string) => {
    const w = s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
    const out = new Set<string>();
    for (let i = 0; i + 2 < w.length; i++) out.add(`${w[i]} ${w[i + 1]} ${w[i + 2]}`);
    return out;
  };
  const A = grams(a);
  const B = grams(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const g of A) if (B.has(g)) inter++;
  return inter / (A.size + B.size - inter);
}

export const US_STATES: Record<string, { name: string; tz: string }> = {
  AL: { name: "Alabama", tz: "America/Chicago" }, AK: { name: "Alaska", tz: "America/Anchorage" },
  AZ: { name: "Arizona", tz: "America/Phoenix" }, AR: { name: "Arkansas", tz: "America/Chicago" },
  CA: { name: "California", tz: "America/Los_Angeles" }, CO: { name: "Colorado", tz: "America/Denver" },
  CT: { name: "Connecticut", tz: "America/New_York" }, DE: { name: "Delaware", tz: "America/New_York" },
  DC: { name: "District of Columbia", tz: "America/New_York" }, FL: { name: "Florida", tz: "America/New_York" },
  GA: { name: "Georgia", tz: "America/New_York" }, HI: { name: "Hawaii", tz: "Pacific/Honolulu" },
  ID: { name: "Idaho", tz: "America/Boise" }, IL: { name: "Illinois", tz: "America/Chicago" },
  IN: { name: "Indiana", tz: "America/Indiana/Indianapolis" }, IA: { name: "Iowa", tz: "America/Chicago" },
  KS: { name: "Kansas", tz: "America/Chicago" }, KY: { name: "Kentucky", tz: "America/New_York" },
  LA: { name: "Louisiana", tz: "America/Chicago" }, ME: { name: "Maine", tz: "America/New_York" },
  MD: { name: "Maryland", tz: "America/New_York" }, MA: { name: "Massachusetts", tz: "America/New_York" },
  MI: { name: "Michigan", tz: "America/Detroit" }, MN: { name: "Minnesota", tz: "America/Chicago" },
  MS: { name: "Mississippi", tz: "America/Chicago" }, MO: { name: "Missouri", tz: "America/Chicago" },
  MT: { name: "Montana", tz: "America/Denver" }, NE: { name: "Nebraska", tz: "America/Chicago" },
  NV: { name: "Nevada", tz: "America/Los_Angeles" }, NH: { name: "New Hampshire", tz: "America/New_York" },
  NJ: { name: "New Jersey", tz: "America/New_York" }, NM: { name: "New Mexico", tz: "America/Denver" },
  NY: { name: "New York", tz: "America/New_York" }, NC: { name: "North Carolina", tz: "America/New_York" },
  ND: { name: "North Dakota", tz: "America/Chicago" }, OH: { name: "Ohio", tz: "America/New_York" },
  OK: { name: "Oklahoma", tz: "America/Chicago" }, OR: { name: "Oregon", tz: "America/Los_Angeles" },
  PA: { name: "Pennsylvania", tz: "America/New_York" }, RI: { name: "Rhode Island", tz: "America/New_York" },
  SC: { name: "South Carolina", tz: "America/New_York" }, SD: { name: "South Dakota", tz: "America/Chicago" },
  TN: { name: "Tennessee", tz: "America/Chicago" }, TX: { name: "Texas", tz: "America/Chicago" },
  UT: { name: "Utah", tz: "America/Denver" }, VT: { name: "Vermont", tz: "America/New_York" },
  VA: { name: "Virginia", tz: "America/New_York" }, WA: { name: "Washington", tz: "America/Los_Angeles" },
  WV: { name: "West Virginia", tz: "America/New_York" }, WI: { name: "Wisconsin", tz: "America/Chicago" },
  WY: { name: "Wyoming", tz: "America/Denver" },
};

/** Local hour (0–23) and ISO weekday (1–7) at `date` in a time zone. */
export function localTime(date: Date, timeZone: string): { hour: number; weekday: number; day: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hourCycle: "h23",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekday = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(get("weekday")) + 1;
  return { hour: Number(get("hour")), weekday, day: `${get("year")}-${get("month")}-${get("day")}` };
}

/** Maps a free-text business category to one of our playbook groups. */
export function categoryGroup(category?: string | null): string {
  const c = (category ?? "").toLowerCase();
  const rules: [RegExp, string][] = [
    [/barber/, "barbershop"],
    [/nail|hair|salon|beauty|lash|brow|wax|braid|makeup|esthetic/, "salon"],
    [/spa|massage|facial|med ?spa/, "spa"],
    [/bakery|bake|pastry|cake|donut/, "bakery"],
    [/caf[eé]|coffee|tea house|juice/, "cafe"],
    [/restaurant|pizza|grill|kitchen|diner|bistro|taqueria|sushi|bbq|food truck|eatery|bar\b/, "restaurant"],
    [/boutique|clothing|apparel|shop|store|gift|jewel|florist|retail/, "boutique"],
    [/clean|maid|janitor|pressure wash/, "cleaning"],
    [/contract|plumb|electric|roof|landscap|hvac|remodel|construct|handyman|paint|flooring|carpent|concrete|fenc/, "contractor"],
    [/photo|videograph/, "photographer"],
    [/event|wedding|planner|party|catering|dj\b/, "events"],
    [/fitness|gym|yoga|pilates|crossfit|martial|dance|trainer|boxing/, "fitness"],
    [/law|attorney|account|cpa|tax|insurance|consult|real estate|realtor|therap|dental|chiro|clinic|tutor/, "professional"],
  ];
  return rules.find(([re]) => re.test(c))?.[1] ?? "other";
}

/** The UTC instant of local midnight for `now` in a time zone. */
export function startOfLocalDay(now: Date, timeZone: string): Date {
  const p = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const g = (t: string) => Number(p.find((x) => x.type === t)?.value);
  const asUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second"));
  const offset = asUtc - Math.floor(now.getTime() / 1000) * 1000;
  return new Date(Date.UTC(g("year"), g("month") - 1, g("day")) - offset);
}
