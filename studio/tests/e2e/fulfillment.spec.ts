import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import Stripe from "stripe";
import { E2E_WEBHOOK_SECRET, E2E_WEBSITE_DATA, MOCK_CF, WEBSITE_PORT } from "../../playwright.e2e.config";

/**
 * Website fulfillment, end to end, across the real services running locally:
 * website (next start) → signed Stripe test webhook → studio worker (wrangler dev: D1, Queues, R2)
 * → AI build (offline stub agent) → sandboxed preview → revision → approval → client review
 * → deployment through a local Cloudflare API mock → live verification → completed.
 */

const WEBSITE = `http://127.0.0.1:${WEBSITE_PORT}`;
const stripe = new Stripe("sk_test_unused_for_local_signing");

async function axe(page: Page) {
  const axePage = page as unknown as ConstructorParameters<typeof AxeBuilder>[0]["page"];
  const { violations } = await new AxeBuilder({ page: axePage }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  return violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 2).join(" | ")}`);
}

/** A real PNG "photo" made by rendering a small scene in the browser. */
async function photo(page: Page, color: string, label: string) {
  await page.setContent(`<body style="margin:0"><div style="width:640px;height:420px;background:linear-gradient(135deg,${color},#fff);display:grid;place-items:center;font:600 40px sans-serif">${label}</div></body>`);
  return page.locator("div").screenshot();
}

async function upload(page: Page, name: string, bytes: Buffer) {
  const res = await page.request.post(`${WEBSITE}/api/uploads`, {
    headers: { origin: WEBSITE, "sec-fetch-site": "same-origin", "x-forwarded-for": `10.9.${Math.floor(Math.random() * 200)}.1` },
    multipart: { file: { name, mimeType: "image/png", buffer: bytes } },
  });
  expect(res.status(), await res.text()).toBe(201);
  return (await res.json()) as { id: string; name: string; size: number; type: string };
}

async function waitForStatus(page: Page, projectUrl: string, label: RegExp, timeout = 90_000) {
  await expect(async () => {
    await page.goto(projectUrl);
    await expect(page.locator("main .row").first()).toContainText(label, { timeout: 1000 });
  }).toPass({ timeout, intervals: [1000, 2000, 3000] });
}

test("paid order → AI build → preview → revision → approval → client review → Cloudflare deploy → completed", async ({ page, browser }) => {
  // ------------------------------------------------ customer side (website)
  const storefront = await upload(page, "storefront.png", await photo(page, "#c2410c", "Bloom & Co"));
  const moodboard = await upload(page, "moodboard.png", await photo(page, "#4d7c0f", "Mood"));
  const orderId = `msn-e2e-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  const order = {
    id: orderId,
    createdAt: now,
    updatedAt: now,
    status: "pending_payment",
    total: 899,
    items: [{ id: "growth", name: "Growth", unitPrice: 899, quantity: 1, total: 899 }],
    paymentAgreement: { version: "test", acceptedAt: now },
    order: {
      packageId: "growth",
      style: "warm",
      pages: ["Home", "About", "Services", "Contact"],
      addOns: {},
      fullName: "Dana Rivera",
      email: "dana@inbox-test.dev",
      phone: "512-555-0100",
      businessName: "Bloom & Co Florist",
      currentWebsite: "",
      industry: "retail",
      goals: "Get more wedding inquiries and weekly flower subscriptions.",
      hasDomain: "no",
      acceptPaymentAgreement: true,
      acceptTerms: true,
      businessDescription: "Neighborhood florist in Austin making seasonal bouquets, wedding flowers and weekly subscriptions.",
      location: "Austin, TX",
      primaryCta: "quote",
      features: ["contactForm"],
      aboutText: "Founded in 2015, Bloom & Co sources flowers from Texas growers.",
      servicesText: "Wedding flowers\nWeekly subscriptions\nEvent installations",
      contactInfo: "hello@bloomco-test.dev",
      languages: ["en", "es"],
      files: [
        { ...storefront, kind: "content" },
        { ...moodboard, kind: "inspiration" },
      ],
    },
  };
  // The order as the checkout route stores it (checkout itself needs live Stripe, which tests never call).
  await mkdir(path.join(E2E_WEBSITE_DATA, "orders"), { recursive: true });
  await writeFile(path.join(E2E_WEBSITE_DATA, "orders", `${orderId}.json`), JSON.stringify(order));

  // Reconciliation finds the unpaid order: a project exists, but no AI work starts.
  await page.request.get("/__scheduled?cron=17+*+*+*+*");
  await expect(async () => {
    await page.goto("/admin");
    await expect(page.getByRole("row", { name: /Bloom & Co Florist.*Awaiting payment/i })).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 30_000 });
  const projectUrl = (await page.getByRole("link", { name: "Bloom & Co Florist" }).getAttribute("href"))!;
  await page.goto(projectUrl);
  await expect(page.getByText("Waiting for the customer's payment.")).toBeVisible();

  // A forged event can't mark anything paid (bad secret is rejected; a valid event only triggers a re-check).
  expect((await page.request.post("/internal/event", { headers: { "x-internal-secret": "nope" }, data: { type: "order.paid", orderId } })).status()).toBe(403);
  const fakeWebhook = await page.request.post(`${WEBSITE}/api/webhooks/stripe`, { headers: { "content-type": "application/json", "stripe-signature": "t=1,v1=00" }, data: "{}" });
  expect(fakeWebhook.status()).toBe(400);

  // Stripe (test mode) confirms payment: the event is signed locally with the test webhook secret.
  const event = {
    id: `evt_${crypto.randomUUID().replace(/-/g, "")}`,
    object: "event",
    type: "checkout.session.completed",
    data: { object: { object: "checkout.session", id: "cs_test_e2e", currency: "usd", payment_status: "paid", amount_total: 89900, payment_intent: "pi_test_e2e", metadata: { orderId } } },
  };
  const payload = JSON.stringify(event);
  const hook = await page.request.post(`${WEBSITE}/api/webhooks/stripe`, { headers: { "content-type": "application/json", "stripe-signature": stripe.webhooks.generateTestHeaderString({ payload, secret: E2E_WEBHOOK_SECRET }) }, data: payload });
  expect(hook.status()).toBe(200);

  // ------------------------------------------------ studio: AI build → review
  await waitForStatus(page, projectUrl, /Ready for review/i);
  await expect(page.getByRole("heading", { name: "Next step" })).toBeVisible();
  const files = page.locator("#files");
  await expect(files).toContainText("storefront.png");
  await expect(files).toContainText("moodboard.png");
  expect(await axe(page)).toEqual([]);

  // Preview: separate origin, sandboxed, real rendered site.
  const frame = page.locator("#preview iframe");
  const previewUrl = (await frame.getAttribute("src"))!;
  expect(previewUrl).toMatch(/^http:\/\/localhost:8790\/p\/ver_[^/]+\.[^/]+\/$/);
  const consoleErrors: string[] = [];
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
  await page.reload();
  await frame.scrollIntoViewIfNeeded();
  await expect(page.frameLocator("#preview iframe").getByRole("heading", { level: 1 })).toBeVisible().catch((e) => {
    throw new Error(`${e.message}\nconsole: ${consoleErrors.join("\n")}`);
  });

  const previewCtx = await browser.newContext();
  const preview = await previewCtx.newPage();
  const res = await preview.goto(previewUrl);
  expect(res!.status()).toBe(200);
  expect(res!.headers()["content-security-policy"]).toContain("sandbox allow-scripts");
  expect(res!.headers()["x-robots-tag"]).toContain("noindex");
  await expect(preview.locator("html")).toHaveAttribute("lang", "en");
  await expect(preview.getByText("Bloom & Co Florist").first()).toBeVisible();
  for (const width of [375, 768, 1280]) {
    await preview.setViewportSize({ width, height: 900 });
    await preview.goto(previewUrl);
    expect(await preview.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `no sideways scroll at ${width}px`).toBe(true);
    expect(await axe(preview), `axe at ${width}px`).toEqual([]);
  }
  // Spanish version exists and is marked up as Spanish.
  await preview.goto(`${previewUrl}es/`);
  await expect(preview.locator("html")).toHaveAttribute("lang", "es");
  // The preview form answers "preview only" and sends nothing.
  await preview.goto(previewUrl);
  const formEl = preview.locator("form.mws-form").first();
  if (await formEl.count()) {
    await formEl.scrollIntoViewIfNeeded();
    for (const input of await formEl.locator("input[required]:not([type=hidden]), textarea[required]").all()) {
      const type = await input.getAttribute("type");
      await input.fill(type === "email" ? "visitor@inbox-test.dev" : type === "tel" ? "5125550199" : "Hello, I'd like a quote for wedding flowers in June.");
    }
    await preview.waitForTimeout(3100); // the form's minimum fill time (anti-bot)
    await formEl.locator("button[type=submit]").click();
    await expect(formEl.locator("[role=status], [aria-live]").first()).toContainText(/Preview only/);
  }
  // A tampered capability link is refused.
  expect((await preview.goto(previewUrl.replace(/\.([^./]+)\/$/, ".AAAA$1/")))!.status()).toBe(404);
  await previewCtx.close();

  // ------------------------------------------------ revision via the AI agent
  await page.goto(projectUrl);
  await page.getByLabel("Instruction").fill("Make the main headline mention wedding flowers in Austin.");
  await page.getByRole("button", { name: "Send to AI agent" }).click();
  await expect(page.getByText("Revision sent to the AI agent.")).toBeVisible();
  await waitForStatus(page, projectUrl, /Ready for review/i);
  await expect(page.locator("#versions")).toContainText("Version 2");
  await expect(page.locator("#versions")).toContainText("Version 1");

  // ------------------------------------------------ human approval
  const accept = page.getByLabel("I reviewed the warnings");
  if (await accept.count()) await accept.check();
  await page.getByRole("button", { name: /Approve version 2/ }).click();
  await expect(page.getByText("Version approved.")).toBeVisible();

  // ------------------------------------------------ client review (signed link, no account)
  await page.getByRole("button", { name: "Send to client for review" }).click();
  await expect(page.getByText("Client review link created")).toBeVisible();
  const reviewLink = (await page.locator("code", { hasText: "/review/" }).textContent())!.trim();
  const client = await browser.newContext();
  const cp = await client.newPage();
  await cp.goto(reviewLink);
  await expect(cp.getByRole("heading", { level: 1 })).toContainText("Bloom & Co Florist");
  expect(await axe(cp)).toEqual([]);
  await cp.getByRole("button", { name: "Approve this website" }).click();
  await expect(cp.getByText("We've recorded your approval")).toBeVisible();
  await expect(cp.getByRole("button", { name: "Approve this website" })).toHaveCount(0);
  await client.close();

  await page.goto(projectUrl);
  await expect(page.getByText("Client review: approved")).toBeVisible();
  await page.getByRole("button", { name: "Mark ready for deployment" }).click();
  await expect(page.getByText("Project is ready for deployment.")).toBeVisible();

  // ------------------------------------------------ Cloudflare connection (customer-owned account)
  await page.goto("/admin/connections");
  await page.getByLabel("Name").fill("Bloom & Co (customer account)");
  await page.getByLabel("Account ID").fill(MOCK_CF.accountId);
  await page.getByLabel("API token").fill(MOCK_CF.token);
  await page.getByRole("button", { name: "Save and verify" }).click();
  await expect(page.getByText("Cloudflare connection saved.")).toBeVisible();
  await expect(page.getByText(/verified/).first()).toBeVisible();
  expect(await page.content()).not.toContain(MOCK_CF.token);

  await page.goto(`${projectUrl}#deploy`);
  await expect(page.getByRole("button", { name: "Deploy to Cloudflare" })).toBeDisabled();
  const option = page.locator("#conn option", { hasText: "Bloom & Co (customer account)" });
  await page.getByLabel("Cloudflare account", { exact: true }).selectOption((await option.getAttribute("value"))!);
  await page.getByLabel("Worker name").fill("bloom-co-e2e");
  await page.getByLabel("Form messages go to (FORM_TO_EMAIL)").fill("dana@inbox-test.dev");
  await page.getByLabel("Form sender (FORM_FROM_EMAIL)").fill("Bloom & Co <forms@bloomco-test.dev>");
  await page.getByLabel(/Customer's Resend API key/).fill("re_test_e2e_0123456789abcdefghij");
  await page.getByRole("button", { name: "Save destination" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();
  expect(await page.content()).not.toContain("re_test_e2e_0123456789abcdefghij");

  await page.getByLabel(/Deploy the approved version/).check();
  await page.getByRole("button", { name: "Deploy to Cloudflare" }).click();
  await expect(page.getByText("Deployment started.")).toBeVisible();
  await waitForStatus(page, projectUrl, /Deployed/i);
  await expect(page.locator("#deploy")).toContainText("succeeded");
  await expect(page.locator("#deploy")).toContainText("Verified");

  // The deployed site (served by the Cloudflare mock from the uploaded assets) is this exact build.
  const liveCtx = await browser.newContext();
  const live = await liveCtx.newPage();
  const liveRes = await live.goto("http://127.0.0.1:8792/__served/bloom-co-e2e/");
  expect(liveRes!.status()).toBe(200);
  const html = await live.content();
  expect(html).toMatch(/name="maison-build" content="ver_[^:]+:dep_/);
  expect(html).not.toContain("/p/ver_");
  expect(await axe(live)).toEqual([]);
  await liveCtx.close();

  await page.getByRole("button", { name: "Mark project completed" }).click();
  await expect(page.getByText("Project marked completed.")).toBeVisible();
  await expect(page.locator("main .row").first()).toContainText(/Completed/i);
  await expect(page.locator("#history")).toContainText("DEPLOYMENT_SUCCEEDED");

  const shots = process.env.SCREENSHOT_DIR;
  if (shots) {
    await page.goto("/admin");
    await page.screenshot({ path: `${shots}/projects.png`, fullPage: true });
    await page.goto(projectUrl);
    await page.screenshot({ path: `${shots}/project.png`, fullPage: false });
  }
});
