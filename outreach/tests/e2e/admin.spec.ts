import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const CSV = [
  "name,category,city,state,website,phone,social,description,searched_for_website",
  "Velvet Nail Lounge,Nail salon,Austin,TX,http://127.0.0.1:8791/salon/,512-555-0142,,Gel manicures and nail art,",
  "Sunny Side Bakery,Bakery,Austin,TX,,512-555-0150,https://www.instagram.com/sunnyside_test,Neighborhood bakery,yes",
  "Core Studio,Fitness studio,Austin,TX,http://localhost:8791/fitness/,512-555-0177,,Pilates and strength classes,",
].join("\n");

async function axe(page: Page) {
  const axePage = page as unknown as ConstructorParameters<typeof AxeBuilder>[0]["page"];
  const { violations } = await new AxeBuilder({ page: axePage }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  return violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 2).join(" | ")}`);
}

const tick = (page: Page) => page.request.get("/__scheduled?cron=*/5+*+*+*+*");

test("full workflow with fake businesses: import → research → review → approve → send (dry run) → unsubscribe", async ({ page }) => {
  // Dashboard loads in review + test mode by default.
  await page.goto("/admin/");
  await expect(page.getByText("TEST MODE")).toBeVisible();
  await expect(page.getByText("Review mode — nothing is sent until you approve it")).toBeVisible();

  // Import fake businesses.
  await page.goto("/admin/discovery");
  await page.getByLabel("CSV file").setInputFiles({ name: "leads.csv", mimeType: "text/csv", buffer: Buffer.from(CSV) });
  await page.getByRole("button", { name: "Import and research" }).click();
  await expect(page.getByText("Added 3 businesses; skipped 0 duplicates.")).toBeVisible();

  // Re-importing the same file adds nothing (duplicate prevention).
  await page.goto("/admin/discovery");
  await page.getByLabel("CSV file").setInputFiles({ name: "leads.csv", mimeType: "text/csv", buffer: Buffer.from(CSV) });
  await page.getByRole("button", { name: "Import and research" }).click();
  await expect(page.getByText("Added 0 businesses; skipped 3 duplicates.")).toBeVisible();

  // Queue processes each lead: website check, score, research, draft.
  await expect(async () => {
    await page.goto("/admin/leads");
    await expect(page.getByRole("row", { name: /Velvet Nail Lounge.*website outdated.*review/i })).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 60_000 });
  await expect(page.getByRole("row", { name: /Sunny Side Bakery.*social only/i })).toBeVisible();
  await expect(page.getByRole("row", { name: /Core Studio.*website needs improvement.*not qualified/i })).toBeVisible();

  // Call list holds the qualified lead with no email.
  await page.goto("/admin/calls");
  await expect(page.getByRole("link", { name: "Sunny Side Bakery" })).toBeVisible();

  // Nothing is sent while the draft awaits review.
  await tick(page);
  await page.goto("/admin/activity");
  await expect(page.getByText("lisa.test@inbox-test.dev ·")).toHaveCount(0);

  // Optional screenshots for documentation (set SCREENSHOT_DIR).
  const shots = process.env.SCREENSHOT_DIR;
  if (shots) {
    await page.goto("/admin/review");
    await page.screenshot({ path: `${shots}/review-queue.png`, fullPage: true });
    await page.goto("/admin/leads");
    await page.screenshot({ path: `${shots}/leads.png`, fullPage: true });
  }

  // Review and approve.
  await page.goto("/admin/review");
  await page.getByRole("link", { name: "Velvet Nail Lounge" }).click();
  await expect(page.getByText("Public business email lisa.test@inbox-test.dev is published at")).toBeVisible();
  await page.getByText("Preview the full email as sent").click();
  const preview = await page.locator("pre.email").first().innerText();
  expect(preview).toContain("PO-Box-100-Brooklyn-NY-11201");
  expect(preview).toContain("utm_campaign=maison_outreach");
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(page.getByText("Approved. It will be sent within your sending rules.")).toBeVisible();

  // Open the sending window for the test, then trigger the scheduler.
  await page.goto("/admin/settings");
  await page.getByLabel("Send from (recipient's local hour)").fill("0");
  await page.getByLabel("Send until (hour)").fill("24");
  for (const d of ["Sat", "Sun"]) await page.getByLabel(d).check();
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();
  await tick(page);
  await expect(async () => {
    await page.goto("/admin/activity");
    await expect(page.getByText(/lisa\.test@inbox-test\.dev · /)).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 30_000 });
  await page.goto("/admin/leads?q=Velvet");
  await expect(page.getByRole("row", { name: /Velvet Nail Lounge.*contacted/i })).toBeVisible();
  if (shots) {
    await page.getByRole("link", { name: "Velvet Nail Lounge" }).click();
    await page.getByText("Preview the full email as sent").click();
    await page.screenshot({ path: `${shots}/lead-detail.png`, fullPage: true });
    await page.goto("/admin/");
    await page.screenshot({ path: `${shots}/dashboard.png`, fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: `${shots}/dashboard-phone.png`, fullPage: true });
    await page.setViewportSize({ width: 1280, height: 720 });
  }

  // The unsubscribe link works without signing in and suppresses the address immediately.
  const unsub = preview.match(/http:\/\/127\.0\.0\.1:8790\/u\/[\w.-]+/)![0];
  const res = await page.request.get(unsub);
  expect(await res.text()).toContain("You're unsubscribed");
  await page.goto("/admin/suppression");
  await expect(page.getByRole("cell", { name: "lisa.test@inbox-test.dev" })).toBeVisible();
  await page.goto("/admin/leads?q=Velvet");
  await expect(page.getByRole("row", { name: /Velvet Nail Lounge.*unsubscribed/i })).toBeVisible();
});

test("dashboard pages pass axe WCAG 2.2 AA and fit a phone screen", async ({ page }) => {
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const firstLead = await page.request.get("/admin/leads").then((r) => r.text()).then((h) => h.match(/\/admin\/leads\/ld_[a-z0-9]+/)?.[0]);
    for (const path of [...(firstLead ? [firstLead] : []), "/admin/", "/admin/review", "/admin/leads", "/admin/replies", "/admin/calls", "/admin/discovery", "/admin/suppression", "/admin/settings", "/admin/activity"]) {
      await page.goto(path);
      expect(await axe(page), `${path} @${width}`).toEqual([]);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} @${width}`).toBeLessThanOrEqual(0);
    }
  }
});

test("security: CSRF, cross-site posts, headers, internal endpoint secret, turning on automated mode needs confirmation", async ({ page, request }) => {
  const noToken = await request.post("/admin/settings/mode", { form: { change: "automated", confirm: "ENABLE" } });
  expect(noToken.status()).toBe(403);
  const crossSite = await request.post("/admin/settings/mode", { form: { change: "automated" }, headers: { origin: "https://evil.example", "sec-fetch-site": "cross-site" } });
  expect(crossSite.status()).toBe(403);

  const h = (await request.get("/admin/")).headers();
  expect(h["content-security-policy"]).toContain("default-src 'none'");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["cache-control"]).toContain("no-store");

  expect((await request.post("/internal/event", { data: { type: "visit", token: "abc123" } })).status()).toBe(403);
  expect((await request.post("/internal/event", { data: { type: "visit", token: "abc123" }, headers: { "x-internal-secret": "wrong" } })).status()).toBe(403);

  await page.goto("/admin/settings");
  await page.getByLabel("Change").selectOption("automated");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText("Type ENABLE to switch on automated sending.")).toBeVisible();
  await page.getByLabel("Change").selectOption("test");
  await page.getByLabel(/To turn on automated mode type ENABLE/).fill("LIVE");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText(/Real outreach can't start yet: ENVIRONMENT is not production/)).toBeVisible();

  expect((await request.get("/u/not-a-real-token")).status()).toBe(400);
  expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /");
});
