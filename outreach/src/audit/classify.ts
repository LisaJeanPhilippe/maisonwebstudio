import type { WebsiteStatus } from "../leads";
import { isSocialOrDirectory } from "../text";
import type { SiteSignals } from "./analyze";
import type { FetchedPage } from "./fetch-site";

export type Finding = { kind: "website" | "audit" | "search"; statement: string; sourceUrl?: string | null };

export type Classification = {
  status: WebsiteStatus;
  /** Specific, verifiable opportunities ("No online booking link found on the homepage"). */
  gaps: string[];
  findings: Finding[];
};

const BOOKING_GROUPS = new Set(["salon", "barbershop", "spa", "fitness", "photographer", "events", "professional", "contractor", "cleaning"]);
const ORDERING_GROUPS = new Set(["restaurant", "cafe", "bakery"]);
const SHOP_GROUPS = new Set(["boutique"]);

export type ClassifyInput = {
  website: string | null;
  socials: string[];
  group: string;
  /** Discovery searched the web for an official site and found none. */
  searchedForWebsite: boolean;
  /** Two attempts, so a single network blip isn't reported as "broken". */
  pages: FetchedPage[];
  signals: SiteSignals | null;
  pageSpeed?: { performance: number | null; accessibility: number | null };
  today?: Date;
};

export function classifyWebsite(input: ClassifyInput): Classification {
  const today = input.today ?? new Date();
  const date = today.toISOString().slice(0, 10);
  const findings: Finding[] = [];
  const gaps: string[] = [];

  // No website of their own.
  if (!input.website || isSocialOrDirectory(input.website)) {
    const socials = [...input.socials, ...(input.website ? [input.website] : [])];
    if (input.website && isSocialOrDirectory(input.website)) {
      findings.push({ kind: "website", statement: `The website listed for the business is a social/directory page (${input.website}), not its own site.`, sourceUrl: input.website });
      return { status: "SOCIAL_ONLY", gaps: ["Uses a social or directory page instead of its own website"], findings };
    }
    if (input.searchedForWebsite && socials.length) {
      findings.push({ kind: "search", statement: `A web search on ${date} found social profiles but no official website.` });
      return { status: "SOCIAL_ONLY", gaps: ["No official website found; relies on social media"], findings };
    }
    if (input.searchedForWebsite) {
      findings.push({ kind: "search", statement: `A web search on ${date} found no official website for the business.` });
      return { status: "NO_WEBSITE", gaps: ["No official website found"], findings };
    }
    return { status: "UNCERTAIN", gaps: [], findings: [{ kind: "website", statement: "No website on record and no search was done to confirm, so website status is uncertain." }] };
  }

  const reachable = input.pages.find((p) => p.ok && p.html);
  if (!reachable) {
    const last = input.pages.at(-1);
    if (!last || last.blockedByRobots) {
      return { status: "UNCERTAIN", gaps: [], findings: [{ kind: "website", statement: "The site could not be checked (robots.txt asks automated tools not to read it).", sourceUrl: input.website }] };
    }
    // Bot challenges and "forbidden" responses don't prove the site is broken for people.
    if (last.status === 401 || last.status === 403 || last.status === 429 || last.status === 503) {
      return { status: "UNCERTAIN", gaps: [], findings: [{ kind: "website", statement: `The site returned HTTP ${last.status} to an automated check on ${date}; it may work in a browser.`, sourceUrl: input.website }] };
    }
    const allFailed = input.pages.length >= 2 && input.pages.every((p) => !p.ok);
    if (allFailed) {
      findings.push({ kind: "website", statement: `${input.website} did not load in two checks on ${date} (${last.error ?? `HTTP ${last.status}`}).`, sourceUrl: input.website });
      return { status: "WEBSITE_BROKEN", gaps: ["Website did not load"], findings };
    }
    return { status: "UNCERTAIN", gaps: [], findings: [{ kind: "website", statement: `The site failed one check on ${date}; not confirmed broken.`, sourceUrl: input.website }] };
  }

  const s = input.signals;
  if (!s) return { status: "UNCERTAIN", gaps: [], findings };
  const url = reachable.finalUrl;

  if (s.parked) {
    findings.push({ kind: "website", statement: `${input.website} shows a parked/for-sale domain page instead of the business (checked ${date}).`, sourceUrl: url });
    return { status: "WEBSITE_BROKEN", gaps: ["Domain shows a parked page"], findings };
  }
  if (s.wordCount < 15 && !s.images) {
    findings.push({ kind: "website", statement: `The homepage at ${url} loaded but showed almost no content (checked ${date}).`, sourceUrl: url });
    return { status: "WEBSITE_BROKEN", gaps: ["Homepage shows almost no content"], findings };
  }

  // Outdated: needs at least two independent signs.
  let outdated = 0;
  if (!s.viewport) {
    outdated += 2;
    findings.push({ kind: "audit", statement: "The homepage has no mobile viewport setting, so it likely displays as a shrunken desktop page on phones.", sourceUrl: url });
  }
  if (s.copyrightYear && s.copyrightYear <= today.getUTCFullYear() - 4) {
    outdated += 1;
    findings.push({ kind: "audit", statement: `The footer copyright year is ${s.copyrightYear}.`, sourceUrl: url });
  }
  if (s.legacyTech.length) {
    outdated += 2;
    findings.push({ kind: "audit", statement: `The page uses older web techniques (${s.legacyTech.join(", ")}).`, sourceUrl: url });
  }
  if (!reachable.https) {
    outdated += 1;
    findings.push({ kind: "audit", statement: "The site loads over plain HTTP without HTTPS (browsers mark it “Not secure”).", sourceUrl: url });
    gaps.push("No HTTPS");
  }

  if (BOOKING_GROUPS.has(input.group) && !s.booking.length) {
    const what = input.group === "contractor" || input.group === "cleaning" ? "online quote request" : "online booking";
    gaps.push(`No ${what} found`);
    findings.push({ kind: "audit", statement: `No ${what} link or tool was found on the homepage.`, sourceUrl: url });
  }
  if (ORDERING_GROUPS.has(input.group) && !s.ordering.length) {
    gaps.push("No online ordering found");
    findings.push({ kind: "audit", statement: "No online ordering link was found on the homepage.", sourceUrl: url });
  }
  if (SHOP_GROUPS.has(input.group) && !s.shop.length) {
    gaps.push("No online shop found");
    findings.push({ kind: "audit", statement: "No online shop or checkout was found on the homepage.", sourceUrl: url });
  }
  if (!s.telLinks && !s.contactForm && !s.emails.length) {
    gaps.push("No tap-to-call, contact form or email on the homepage");
    findings.push({ kind: "audit", statement: "The homepage has no tap-to-call link, contact form or email address.", sourceUrl: url });
  }
  if (!s.callsToAction.length) {
    gaps.push("No clear call-to-action button");
    findings.push({ kind: "audit", statement: "No clear call-to-action link (such as Book, Order, Call or Contact) was found on the homepage.", sourceUrl: url });
  }
  const perf = input.pageSpeed?.performance;
  if (typeof perf === "number" && perf < 50) {
    gaps.push("Slow on mobile");
    findings.push({ kind: "audit", statement: `Google PageSpeed Insights scored the homepage ${perf}/100 for mobile performance on ${date}.`, sourceUrl: url });
  }
  const a11y = input.pageSpeed?.accessibility;
  if (typeof a11y === "number" && a11y < 70) {
    gaps.push("Accessibility issues");
    findings.push({ kind: "audit", statement: `Google PageSpeed Insights scored the homepage ${a11y}/100 for accessibility on ${date}.`, sourceUrl: url });
  }

  if (outdated >= 2) return { status: "WEBSITE_OUTDATED", gaps: ["Website looks outdated", ...gaps], findings };
  if (gaps.length) return { status: "WEBSITE_NEEDS_IMPROVEMENT", gaps, findings };
  findings.push({ kind: "audit", statement: `The homepage at ${url} is mobile-ready, uses HTTPS and has clear contact options.`, sourceUrl: url });
  return { status: "GOOD_WEBSITE", gaps: [], findings };
}
