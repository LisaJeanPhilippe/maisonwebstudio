import { expect, test } from "@playwright/test";
import { StubProvider } from "../src/ai/stub";
import { insertCandidate, getLead } from "../src/leads";
import { processLead, runDiscovery } from "../src/pipeline";
import { updateSettings } from "../src/settings";
import { fromCsv } from "../src/discovery/sources";
import { MODERN_RESTAURANT, OUTDATED_SALON, SALON_CONTACT, testDb, testDeps } from "./helpers";

const SITE = {
  "http://glownails-test.com/": { body: OUTDATED_SALON },
  "http://glownails-test.com/contact.html": { body: SALON_CONTACT },
  "https://casaverde-test.com/": { body: MODERN_RESTAURANT },
};

test("outdated salon: audited, scored, researched, email found on the contact page, draft waits for review", async () => {
  const db = testDb();
  const { deps } = testDeps(db, { site: SITE });
  const ins = await insertCandidate(db, { name: "Glow Nail Spa", category: "Nail salon", city: "Austin", state: "TX", website: "http://glownails-test.com/", phone: "512-555-0100", source: "csv", description: "Manicures and pedicures" });
  if (ins.status !== "inserted") throw new Error("insert failed");
  const r = await processLead(deps, ins.id);
  expect(r).toMatchObject({ status: "WEBSITE_OUTDATED", qualified: true, drafted: true });
  const lead = (await getLead(db, ins.id))!;
  expect(lead.email).toBe("hello@glownailspa-test.com");
  expect(lead.email_source_url).toBe("http://glownails-test.com/contact.html");
  expect(lead.stage).toBe("review");
  expect(lead.why_maison_can_help).toBeTruthy();
  const m = await db.prepare("SELECT status, subject, body_text, validation_errors FROM messages WHERE lead_id = ?").bind(ins.id).first<{ status: string; subject: string; body_text: string; validation_errors: string }>();
  expect(m?.status, m?.validation_errors).toBe("draft"); // REVIEW mode: never auto-approved
  expect(m?.body_text).toContain("Glow Nail Spa");
  const evidence = await db.prepare("SELECT statement FROM evidence WHERE lead_id = ?").bind(ins.id).all<{ statement: string }>();
  expect(evidence.results.map((e) => e.statement).join(" | ")).toContain("Public business email hello@glownailspa-test.com is published at");
});

test("automated mode approves only valid drafts for good leads", async () => {
  const db = testDb();
  const { deps } = testDeps(db, { site: SITE });
  await updateSettings(db, "test", { automatedSending: true });
  const ins = await insertCandidate(db, { name: "Glow Nail Spa", category: "Nail salon", city: "Austin", state: "TX", website: "http://glownails-test.com/", phone: "512-555-0100", source: "csv" });
  await processLead(deps, (ins as { id: string }).id);
  const m = await db.prepare("SELECT status, approved_by FROM messages").first<{ status: string; approved_by: string }>();
  expect(m).toEqual({ status: "approved", approved_by: "automation" });
});

test("no verified email → call list; AI-claimed email that isn't on the cited page is dropped", async () => {
  const db = testDb();
  const { deps } = testDeps(db, {
    site: { "https://www.yelp.com/biz/fresh-cuts-test": { body: "<html><body>Fresh Cuts barbershop reviews</body></html>" } },
  });
  const ins = await insertCandidate(db, {
    name: "Fresh Cuts",
    category: "Barbershop",
    city: "Houston",
    state: "TX",
    socialLinks: ["https://instagram.com/freshcuts_test"],
    email: "owner@freshcuts-test.com",
    emailSourceUrl: "https://www.yelp.com/biz/fresh-cuts-test",
    phone: "713-555-0123",
    source: "ai_agent",
    searchedForWebsite: true,
    facts: [{ statement: "Barbershop in Houston offering fades and beard trims.", sourceUrl: "https://instagram.com/freshcuts_test" }],
  });
  const id = (ins as { id: string }).id;
  const r = await processLead(deps, id);
  expect(r).toMatchObject({ status: "SOCIAL_ONLY", qualified: true, drafted: false });
  const lead = (await getLead(db, id))!;
  expect(lead.email).toBeNull();
  expect(lead.stage).toBe("needs_contact");
  expect(lead.notes).toContain("Unverified email from AI research (not used)");
});

test("good website is not contacted", async () => {
  const db = testDb();
  const { deps } = testDeps(db, {
    site: { "https://peak-test.com/": { body: `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width"></head><body><main><h1>Peak</h1><p>Strength classes in Denver for every level with friendly certified coaches.</p><a href="https://x.mindbodyonline.com/book">Book a class</a><a href="tel:3035550000">Call</a></main><footer>© ${new Date().getFullYear()}</footer></body></html>` } },
  });
  const ins = await insertCandidate(db, { name: "Peak Fitness", category: "Fitness studio", city: "Denver", state: "CO", website: "https://peak-test.com/", source: "csv" });
  expect(await processLead(deps, (ins as { id: string }).id)).toMatchObject({ status: "GOOD_WEBSITE", qualified: false });
  expect((await db.prepare("SELECT COUNT(*) AS n FROM messages").first<{ n: number }>())?.n).toBe(0);
});

test("discovery with the AI agent adds new businesses, skips duplicates and queues processing", async () => {
  const db = testDb();
  const ai = new StubProvider({
    discover: [
      {
        name: "Sunrise Bakery",
        category: "Bakery",
        city: "Austin",
        state: "TX",
        official_website: null,
        social_profiles: ["https://www.instagram.com/sunrisebakery_test"],
        public_business_email: null,
        email_source_url: null,
        phone: "512-555-0199",
        description: "Neighborhood bakery known for kolaches.",
        searched_for_official_website: true,
        website_search_summary: "Results show only Instagram and Yelp pages.",
        is_chain_or_franchise: false,
        facts: [{ statement: "Neighborhood bakery in Austin known for kolaches.", source_url: "https://www.instagram.com/sunrisebakery_test" }],
      },
    ],
  });
  const { deps, jobs } = testDeps(db, { ai });
  await updateSettings(db, "test", { discoveryTargets: [{ category: "bakery", city: "Austin", state: "TX" }] });
  expect(await runDiscovery(deps, { manual: true })).toMatchObject({ inserted: 1, duplicates: 0, source: "ai_agent" });
  expect(jobs).toHaveLength(1);
  expect(await runDiscovery(deps, { manual: true })).toMatchObject({ inserted: 0 });
  expect(await runDiscovery(deps)).toMatchObject({ skipped: "discovery disabled" });
});

test("CSV import parsing handles quotes and reports bad rows", () => {
  const { candidates, errors } = fromCsv('name,category,city,state,website,email\n"Bella, Boutique",Boutique,Miami,FL,bella-test.com,hi@bella-test.com\n,Cafe,Miami,FL,,\n');
  expect(candidates).toHaveLength(1);
  expect(candidates[0]).toMatchObject({ name: "Bella, Boutique", website: "bella-test.com", email: "hi@bella-test.com" });
  expect(errors[0]).toContain("Row 3");
});
