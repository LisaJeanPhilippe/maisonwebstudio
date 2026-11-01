import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { watchErrors } from "./shared";

const LOGO = path.join(__dirname, "logo.png");
const cont = (page: Page) => page.getByRole("button", { name: /^Continue/ }).filter({ visible: true }).first().click();

for (const width of [1440, 390]) {
  test(`full order flow with validation @${width}px (payments not configured)`, async ({ page }) => {
    const errors = watchErrors(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/pricing");
    await page.getByRole("link", { name: "Choose Business" }).first().click();
    await expect(page.getByRole("heading", { name: "Shape your website." })).toBeVisible();

    // Missing style → error summary and focus on the first invalid field.
    await cont(page);
    await expect(page.locator("#error-summary")).toBeVisible();
    await page.getByText("Editorial", { exact: true }).click();
    await cont(page);

    await expect(page.getByRole("heading", { name: "Add what you need." })).toBeVisible();
    await expect(page.locator("#step-title")).toBeFocused({ timeout: 3000 });
    await page.getByText("Professional copywriting", { exact: true }).click();
    await cont(page);

    await page.getByLabel("Full name").fill("Jordan Avery");
    await page.getByLabel("Email").fill("not-an-email");
    await cont(page);
    await expect(page.locator("#email-error")).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");
    await page.getByLabel("Email").fill("jordan@example.com");
    await page.getByLabel("Business name").fill("Avery Botanicals");
    await page.getByLabel("Industry").selectOption("beauty");
    await page.getByLabel(/What should your new website achieve/).fill("Sell our candles online and look more established.");
    await cont(page);

    // Website questionnaire: business, goals, design, features, content, languages.
    await expect(page.getByRole("heading", { name: "Tell us about your website." })).toBeVisible();
    await cont(page);
    await expect(page.locator("#error-summary")).toBeVisible();
    await page.getByLabel(/Describe your business/).fill("Small-batch soy candles and botanical home fragrance, hand-poured in Portland.");
    await page.getByLabel("City and state").fill("Portland, OR");
    await page.getByLabel("The main thing visitors should do").selectOption("shop");
    await page.getByRole("checkbox", { name: "Español" }).check({ force: true });
    await expect(page.getByRole("checkbox", { name: "Español" })).toBeChecked();
    await cont(page);

    // Uploading content is mandatory.
    await expect(page.getByRole("heading", { name: "Share your brand assets." })).toBeVisible();
    await cont(page);
    await expect(page.locator("#files-error")).toBeVisible();
    await page.getByLabel("Upload files").setInputFiles(LOGO);
    await expect(page.getByRole("list", { name: "Uploaded files" })).toContainText("Uploaded");
    await cont(page);

    await expect(page.getByRole("heading", { name: "Review your order." })).toBeVisible();
    await expect(page.getByText("$1,148").first()).toBeVisible(); // 899 + 249, computed from the catalog
    const pay = page.getByRole("button", { name: /Pay/ }).filter({ visible: true }).last();
    await pay.click();
    await expect(page.locator("#acceptPaymentAgreement-error")).toBeVisible();
    await expect(page.locator("#acceptTerms-error")).toBeVisible();
    await page.locator("#acceptPaymentAgreement").check({ force: true });
    await page.locator("#acceptTerms").check({ force: true });
    await pay.click();
    await expect(page.getByRole("alert").filter({ hasText: /payments are not available/i })).toBeVisible();
    expect(errors.filter((e) => !/status of 503/.test(e))).toEqual([]);
  });
}

test("a cancelled checkout returns to review with a notice and nothing charged", async ({ page }) => {
  await page.goto("/start?step=review&cancelled=1");
  await expect(page.getByText(/nothing was charged/i)).toBeVisible();
});

test("draft is kept per tab only and can be cleared", async ({ page, context }) => {
  await page.goto("/start?package=starter");
  await page.getByText("Minimal", { exact: true }).click();
  const stored = await page.evaluate(() => ({ session: sessionStorage.length, local: localStorage.length }));
  expect(stored.session).toBeGreaterThan(0);
  expect(stored.local).toBe(0);
  const other = await context.newPage();
  await other.goto("/start");
  expect(await other.evaluate(() => sessionStorage.length)).toBe(0);
});

test("keyboard: skip link moves focus to main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to main content" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main#main")).toBeFocused();
});

test("Arabic configurator works right-to-left with Arabic validation", async ({ page }) => {
  await page.goto("/ar/start?package=premium");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.getByRole("button", { name: /^متابعة/ }).filter({ visible: true }).first().click();
  await expect(page.locator("#error-summary")).toContainText("يُرجى");
});
