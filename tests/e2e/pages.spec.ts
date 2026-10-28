import { expect, test } from "@playwright/test";
import { LEGAL, LOCALES, PAGES, url, watchErrors } from "./shared";

const TAGS: Record<string, string> = { zh: "zh-Hans", pt: "pt-BR" };

for (const locale of LOCALES) {
  test(`${locale}: every page renders with correct language, metadata and one h1`, async ({ page }) => {
    const errors = watchErrors(page);
    for (const path of [...PAGES, ...LEGAL]) {
      const res = await page.goto(url(locale, path));
      expect(res?.status(), path).toBe(200);
      const html = page.locator("html");
      await expect(html, path).toHaveAttribute("lang", TAGS[locale] ?? locale);
      await expect(html, path).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
      await expect(page.locator("h1:not([aria-hidden=true] *)"), path).toHaveCount(1);
      expect((await page.title()).length, path).toBeGreaterThan(10);
      const description = await page.locator('meta[name="description"]').getAttribute("content");
      expect(description?.length ?? 0, path).toBeGreaterThan(locale === "zh" ? 15 : 30);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(new URL(canonical!).pathname.replace(/\/$/, ""), path).toBe(url(locale, path).replace(/\/$/, ""));
      await expect(page.locator('link[rel="alternate"][hreflang]'), path).toHaveCount(11);
      await expect(page.locator('meta[property="og:image"]').first(), path).toHaveAttribute("content", /og\.png/);
    }
    expect(errors).toEqual([]);
  });
}

test("unknown pages return a real 404 in every language", async ({ page }) => {
  for (const locale of LOCALES) {
    const res = await page.goto(url(locale, "/this-page-does-not-exist"));
    expect(res?.status()).toBe(404);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  }
});

test("/en redirects permanently to the unprefixed English URL", async ({ request }) => {
  const res = await request.get("/en/pricing", { maxRedirects: 0 });
  expect(res.status()).toBe(308);
  expect(res.headers().location).toMatch(/\/pricing$/);
});

test("security headers are present", async ({ request }) => {
  const h = (await request.get("/")).headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBeTruthy();
  expect(h["permissions-policy"]).toBeTruthy();
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["x-powered-by"]).toBeUndefined();
});

test("robots, sitemap, manifest and icons", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /api/");
  expect(robots).toMatch(/Sitemap: .*\/sitemap\.xml/);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("hreflang=\"ar\"");
  expect(sitemap).not.toContain("/checkout");
  expect(sitemap).not.toContain("/demo/");
  expect((await request.get("/manifest.webmanifest")).ok()).toBe(true);
  for (const asset of ["/favicon.ico", "/icon.svg", "/apple-touch-icon.png", "/icon-192.png", "/icon-512.png", "/og.png"]) {
    expect((await request.get(asset)).status(), asset).toBe(200);
  }
});

test("internal links resolve (no broken links)", async ({ page, request }) => {
  const seen = new Set<string>();
  for (const locale of ["en", "ar"]) {
    for (const path of [...PAGES, ...LEGAL]) {
      await page.goto(url(locale, path));
      for (const href of await page.locator("a[href^='/']").evaluateAll((as) => as.map((a) => a.getAttribute("href")!))) {
        seen.add(href.split("#")[0].split("?")[0] || "/");
      }
    }
  }
  const broken = [];
  for (const href of seen) {
    const res = await request.get(href);
    if (res.status() >= 400) broken.push(`${href} → ${res.status()}`);
  }
  expect(broken).toEqual([]);
  expect(seen.size).toBeGreaterThan(30);
});

test("checkout success page with no valid session never claims payment", async ({ page }) => {
  const res = await page.goto("/checkout/success?session_id=cs_test_fake&order=msn-000000-abcdef12");
  expect(res?.status()).toBe(200);
  await expect(page.getByText(/paid in full/i)).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
