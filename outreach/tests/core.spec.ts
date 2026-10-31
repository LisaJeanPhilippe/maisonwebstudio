import { expect, test } from "@playwright/test";
import { analyzeHtml } from "../src/audit/analyze";
import { classifyWebsite } from "../src/audit/classify";
import { isSafePublicUrl, robotsTxtAllows, type FetchedPage } from "../src/audit/fetch-site";
import { composeEmail, signToken, trackedLink, verifyToken } from "../src/email/compose";
import { validateDraft } from "../src/email/validator";
import { insertCandidate } from "../src/leads";
import { ALLOWED_NUMBERS } from "../src/pipeline";
import { priorityFor, scoreLead } from "../src/scoring";
import { DEFAULT_SETTINGS, getSettings, updateSettings } from "../src/settings";
import { dedupeKey, isSocialOrDirectory, normalizePhone } from "../src/text";
import { GOOD_SITE, MODERN_RESTAURANT, OUTDATED_SALON, PARKED, testConfig, testDb } from "./helpers";

const page = (html: string, over: Partial<FetchedPage> = {}): FetchedPage => ({ ok: true, url: "https://x-test.com/", finalUrl: "https://x-test.com/", status: 200, https: true, html, bytes: html.length, error: null, redirects: 0, ...over });
const failed = (over: Partial<FetchedPage> = {}): FetchedPage => ({ ...page(""), ok: false, status: null, error: "connection failed", ...over });

test.describe("normalization and duplicates", () => {
  test("same business with different spellings has one key", () => {
    expect(dedupeKey("The Glow Nail Spa, LLC", "Austin", "tx")).toBe(dedupeKey("Glow Nail Spa", "austin", "TX"));
    expect(dedupeKey("Bella & Co.", "Miami", "FL")).toBe(dedupeKey("Bella and Co", "Miami", "FL"));
    expect(normalizePhone("+1 (512) 555-0100")).toBe("5125550100");
    expect(isSocialOrDirectory("https://www.instagram.com/glow")).toBe(true);
    expect(isSocialOrDirectory("https://glownails.com")).toBe(false);
  });

  test("duplicates are detected by name+location, website, phone and email", async () => {
    const db = testDb();
    const base = { source: "csv" as const, city: "Austin", state: "TX" };
    expect((await insertCandidate(db, { ...base, name: "Glow Nail Spa", website: "https://www.glownails-test.com", phone: "512-555-0100" })).status).toBe("inserted");
    expect(await insertCandidate(db, { ...base, name: "The Glow Nail Spa LLC" })).toMatchObject({ status: "duplicate", reason: "same name and location" });
    expect(await insertCandidate(db, { ...base, name: "Glow Nails Downtown", website: "glownails-test.com/about" })).toMatchObject({ status: "duplicate", reason: "same website" });
    expect(await insertCandidate(db, { ...base, name: "Glow Studio", phone: "(512) 555 0100" })).toMatchObject({ status: "duplicate", reason: "same phone" });
    expect(await insertCandidate(db, { ...base, name: "Instagram-only", website: "https://instagram.com/a" })).toMatchObject({ status: "inserted" });
    expect(await insertCandidate(db, { ...base, name: "Other IG", website: "https://instagram.com/b" })).toMatchObject({ status: "inserted" }); // social URLs are not a shared "domain"
    expect(await insertCandidate(db, { ...base, name: "X", state: "ZZ" })).toMatchObject({ status: "invalid" });
  });
});

test.describe("fetching safety", () => {
  test("blocks internal, raw-IP and non-web URLs", () => {
    for (const bad of ["http://127.0.0.1/", "http://10.0.0.5/", "http://[::1]/", "file:///etc/passwd", "http://localhost:8080", "https://intranet.local/", "https://user:pw@site.com", "https://site.com:8443/"]) {
      expect(isSafePublicUrl(bad), bad).toBe(false);
    }
    expect(isSafePublicUrl("https://glownails.com/contact")).toBe(true);
  });

  test("honours robots.txt", () => {
    expect(robotsTxtAllows("User-agent: *\nDisallow: /", "/", "maisonwebstudiobot")).toBe(false);
    expect(robotsTxtAllows("User-agent: *\nDisallow: /admin", "/", "maisonwebstudiobot")).toBe(true);
    expect(robotsTxtAllows("User-agent: MaisonWebStudioBot\nDisallow: /\n\nUser-agent: *\nAllow: /", "/", "maisonwebstudiobot")).toBe(false);
  });
});

test.describe("website classification never overclaims", () => {
  const base = { socials: [], group: "salon", searchedForWebsite: false, pages: [], signals: null };

  test("no website is only claimed after a search", () => {
    expect(classifyWebsite({ ...base, website: null }).status).toBe("UNCERTAIN");
    expect(classifyWebsite({ ...base, website: null, searchedForWebsite: true }).status).toBe("NO_WEBSITE");
    expect(classifyWebsite({ ...base, website: null, searchedForWebsite: true, socials: ["https://instagram.com/x"] }).status).toBe("SOCIAL_ONLY");
    expect(classifyWebsite({ ...base, website: "https://www.facebook.com/glow" }).status).toBe("SOCIAL_ONLY");
  });

  test("broken needs two failed checks; bot blocks are uncertain", () => {
    expect(classifyWebsite({ ...base, website: "https://x-test.com", pages: [failed()] }).status).toBe("UNCERTAIN");
    expect(classifyWebsite({ ...base, website: "https://x-test.com", pages: [failed(), failed()] }).status).toBe("WEBSITE_BROKEN");
    expect(classifyWebsite({ ...base, website: "https://x-test.com", pages: [failed({ status: 403, error: "HTTP 403" })] }).status).toBe("UNCERTAIN");
    expect(classifyWebsite({ ...base, website: "https://x-test.com", pages: [failed({ blockedByRobots: true })] }).status).toBe("UNCERTAIN");
    const p = page(PARKED);
    expect(classifyWebsite({ ...base, website: "https://x-test.com", pages: [p], signals: analyzeHtml(PARKED, p.finalUrl) }).status).toBe("WEBSITE_BROKEN");
  });

  test("outdated salon, restaurant without ordering, and a good site", () => {
    const today = new Date();
    const salon = page(OUTDATED_SALON, { https: false, finalUrl: "http://glownails-test.com/" });
    const s = classifyWebsite({ ...base, website: "http://glownails-test.com", pages: [salon], signals: analyzeHtml(OUTDATED_SALON, salon.finalUrl), today });
    expect(s.status).toBe("WEBSITE_OUTDATED");
    expect(s.gaps.join(" ")).toContain("No online booking");
    expect(s.findings.map((f) => f.statement).join(" ")).toContain("copyright year is 2016");

    const r = page(MODERN_RESTAURANT);
    const rc = classifyWebsite({ ...base, group: "restaurant", website: "https://casaverde-test.com", pages: [r], signals: analyzeHtml(MODERN_RESTAURANT, r.finalUrl), today });
    expect(rc.status).toBe("WEBSITE_NEEDS_IMPROVEMENT");
    expect(rc.gaps).toContain("No online ordering found");

    const g = page(GOOD_SITE);
    const gc = classifyWebsite({ ...base, group: "fitness", website: "https://peakfitness-test.com", pages: [g], signals: analyzeHtml(GOOD_SITE, g.finalUrl), today });
    expect(gc.status).toBe("GOOD_WEBSITE");
  });

  test("HTML analysis finds contact details, booking vendors and socials", () => {
    const s = analyzeHtml(MODERN_RESTAURANT, "https://casaverde-test.com/");
    expect(s.viewport).toBe(true);
    expect(s.telLinks).toBe(1);
    expect(s.emails).toEqual(["info@casaverde-test.com"]);
    expect(s.socials[0]).toContain("instagram.com/casaverde_test");
    expect(analyzeHtml(GOOD_SITE, "https://p-test.com/").booking).toContain("Mindbody");
    expect(analyzeHtml(OUTDATED_SALON, "http://g-test.com/").contactPageUrl).toBe("http://g-test.com/contact.html");
  });
});

test.describe("scoring", () => {
  const base = { gaps: [], group: "salon", hasPhone: true, hasSocials: true, hasDescription: true, hasLocation: true, chain: false };
  test("bands and priorities", () => {
    expect(priorityFor(85)).toBe("HIGH_PRIORITY");
    expect(priorityFor(65)).toBe("GOOD_LEAD");
    expect(priorityFor(45)).toBe("POSSIBLE_LEAD");
    expect(priorityFor(10)).toBe("DO_NOT_CONTACT");
    expect(scoreLead({ ...base, status: "SOCIAL_ONLY", gaps: ["No official website found; relies on social media"] }).priority).toBe("HIGH_PRIORITY");
    expect(scoreLead({ ...base, status: "WEBSITE_OUTDATED", gaps: ["No online booking found"] }).score).toBeGreaterThanOrEqual(60);
    expect(scoreLead({ ...base, status: "GOOD_WEBSITE" }).priority).toBe("DO_NOT_CONTACT");
    expect(scoreLead({ ...base, status: "UNCERTAIN", gaps: ["No online booking found"] }).score).toBeLessThanOrEqual(55);
    expect(scoreLead({ ...base, status: "NO_WEBSITE", chain: true }).priority).toBe("DO_NOT_CONTACT");
  });
});

test.describe("email checker", () => {
  const evidence = [
    { id: 1, statement: "Offers manicures, pedicures and gel nails in Austin.", source_url: "https://x" },
    { id: 2, statement: "No online booking link or tool was found on the homepage.", source_url: "https://x" },
  ];
  const good = {
    subject: "Online booking idea for Glow Nail Spa",
    body: "Hi Glow Nail Spa team,\n\nI came across Glow Nail Spa while looking at nail salons in Austin, and your mix of manicures, pedicures and gel nails caught my eye.\n\nOne idea: letting clients book online from their phone. When someone can pick a service and a time in a few taps, you spend less time on the phone and fewer people drift off before booking.\n\nMaison Web Studio designs custom, mobile-first websites with booking built in, at fixed prices starting at $499. Would it help if I sent a quick idea of how this could look for you?",
    landing_page: "/work" as const,
    evidence_ids: [1, 2],
  };
  const v = (over: Partial<typeof good>, more: Partial<Parameters<typeof validateDraft>[0]> = {}) =>
    validateDraft({ draft: { ...good, ...over }, step: 0, businessName: "Glow Nail Spa", websiteStatus: "WEBSITE_OUTDATED", evidence, allowedNumbers: ALLOWED_NUMBERS, recentBodies: [], ...more });

  test("accepts a specific, honest email", () => {
    expect(v({})).toEqual([]);
  });

  test("rejects unverified or manipulative claims", () => {
    expect(v({ body: good.body.replace("One idea:", "Since you don't have a website, one idea:") }).join()).toContain("no website");
    expect(v({}, { websiteStatus: "UNCERTAIN", draft: { ...good, body: good.body.replace("One idea:", "Your website could use an update. One idea:") } }).join()).toContain("uncertain");
    expect(v({ body: good.body.replace("Would it help", "Spots are limited this week, so would it help") }).join()).toContain("urgency");
    expect(v({ body: good.body.replace("One idea:", "Our clients saw 40% more bookings. One idea:") }).join()).toContain("statistics");
    expect(v({ body: good.body.replace("I came across", "Great talking with you last week. I came across") }).join()).toContain("prior relationship");
    expect(v({ body: good.body.replace("Hi Glow Nail Spa team", "Hi Maria") }).join()).toContain("not found in the evidence");
    expect(v({ body: good.body.replace("$499", "$349") }).join()).toContain('"349"');
    expect(v({ subject: "FREE WEBSITE!!!" }).length).toBeGreaterThan(1);
    expect(v({ subject: "Re: Quick idea" }).join()).toContain("pretend to be a reply");
    expect(v({ body: `${good.body} See https://maisonwebstudio.com` }).join()).toContain("links");
    expect(v({ body: "Hi Glow Nail Spa team, quick idea for you." }).join()).toContain("words");
    expect(v({ evidence_ids: [99] }).join()).toContain("unknown evidence");
  });

  test("blocks near-identical emails across businesses", () => {
    expect(v({}, { recentBodies: [good.body.replace("Glow Nail Spa", "Shine Nails")] }).join()).toContain("Too similar");
  });
});

test.describe("composed email (CAN-SPAM basics, links, unsubscribe)", () => {
  test("adds identification, postal address, one-click unsubscribe and an opaque UTM link", async () => {
    const config = testConfig();
    const e = await composeEmail(config, { leadId: "ld_abc123xyz", to: "hello@glownailspa-test.com", subject: "Idea", body: "Hi team,\n\nBody.", landingPath: "/work", step: 0 });
    expect(e.text).toContain("PO Box 100, Brooklyn, NY 11201");
    expect(e.text).toContain("Best,\nLisa\nMaison Web Studio");
    expect(e.text).toContain("https://maisonwebstudio.com/work?utm_source=email&utm_medium=outbound&utm_campaign=maison_outreach&utm_content=abc123xyz-s0");
    expect(e.text).toMatch(/https:\/\/go\.example\.org\/u\/[\w-]+\.[\w-]+/);
    expect(e.headers["List-Unsubscribe"]).toMatch(/^<https:\/\/go\.example\.org\/u\/.+>, <mailto:lisa@outreach\.example\.org\?subject=unsubscribe>$/);
    expect(e.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    expect(trackedLink(config, "/pricing", "ld_abc123xyz", 1)).not.toContain("Glow");
  });

  test("production refuses to send without a postal address", async () => {
    await expect(composeEmail(testConfig({ production: true, postalAddress: "" }), { leadId: "ld_x", to: "a@b.com", subject: "s", body: "b", landingPath: "/", step: 0 })).rejects.toThrow(/POSTAL/);
  });

  test("signed tokens reject tampering", async () => {
    const t = await signToken("secret-a", "unsub", { l: "ld_1", e: "a@b.com" });
    expect(await verifyToken("secret-a", "unsub", t)).toEqual({ l: "ld_1", e: "a@b.com" });
    expect(await verifyToken("secret-b", "unsub", t)).toBeNull();
    expect(await verifyToken("secret-a", "csrf", t)).toBeNull();
    const [body] = t.split(".");
    const forged = `${btoa(JSON.stringify({ l: "ld_1", e: "victim@b.com" })).replace(/=+$/, "")}.${t.split(".")[1]}`;
    expect(await verifyToken("secret-a", "unsub", forged)).toBeNull();
    expect(body.length).toBeGreaterThan(5);
  });
});

test.describe("settings", () => {
  test("defaults are review mode, test mode and low volume", async () => {
    const db = testDb();
    expect(await getSettings(db)).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS.automatedSending).toBe(false);
    expect(DEFAULT_SETTINGS.testMode).toBe(true);
    expect(DEFAULT_SETTINGS.dailySendLimit).toBeLessThanOrEqual(10);
  });

  test("rejects invalid combinations and records changes", async () => {
    const db = testDb();
    await expect(updateSettings(db, "me", { sendWindowStart: 17, sendWindowEnd: 9 })).rejects.toThrow();
    await expect(updateSettings(db, "me", { dailySendLimit: 5000 })).rejects.toThrow();
    await updateSettings(db, "me", { dailySendLimit: 20 });
    expect((await getSettings(db)).dailySendLimit).toBe(20);
    const log = await db.prepare("SELECT action, details FROM audit_log").all<{ action: string; details: string }>();
    expect(log.results[0]).toMatchObject({ action: "settings.update" });
  });
});
