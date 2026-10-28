import { expect, test } from "@playwright/test";

test("header language menu switches language and keeps the current page", async ({ page }) => {
  await page.goto("/pricing");
  await page.getByRole("button", { name: /^Language: English/ }).click();
  await page.locator("header").getByRole("link", { name: "Español" }).click();
  await expect(page).toHaveURL(/\/es\/pricing$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Diseño premium, precios honestos.");
});

test("the chosen language is remembered on the next visit", async ({ page, context }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Language:/ }).click();
  await page.locator("header").getByRole("link", { name: "العربية" }).click();
  await expect(page).toHaveURL(/\/ar$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  const cookie = (await context.cookies()).find((c) => c.name === "NEXT_LOCALE");
  expect(cookie?.value).toBe("ar");
  expect(cookie?.sameSite).toBe("Lax");

  await page.goto("/about"); // unprefixed (English) URL → preference applies
  await expect(page).toHaveURL(/\/ar\/about$/);

  // Switching back to English sticks too.
  await page.getByRole("button", { name: /^اللغة:/ }).click();
  await page.locator("header").getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/127\.0\.0\.1:\d+\/about$/);
  await page.goto("/work");
  await expect(page).toHaveURL(/\/work$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("language menu works with the keyboard and closes on Escape", async ({ page }) => {
  await page.goto("/");
  const button = page.getByRole("button", { name: /^Language:/ });
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("header").getByRole("link", { name: "English" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(button).toBeFocused();
});

test("search engines get hreflang alternates for every language plus x-default", async ({ page }) => {
  await page.goto("/fr/services");
  const alternates = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((ls) =>
    Object.fromEntries(ls.map((l) => [l.getAttribute("hreflang"), new URL(l.getAttribute("href")!).pathname])),
  );
  expect(alternates).toMatchObject({ en: "/services", "x-default": "/services", ar: "/ar/services", "zh-Hans": "/zh/services", "pt-BR": "/pt/services" });
});
