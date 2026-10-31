import { expect, test } from "@playwright/test";
import { LOCALES, url } from "./shared";

const WIDTHS = [320, 390, 768, 1024, 1440, 1920];
const PATHS = ["/", "/pricing", "/start?package=business", "/work/solace", "/process", "/privacy"];

for (const locale of LOCALES) {
  test(`no horizontal overflow: ${locale}`, async ({ page }) => {
    test.setTimeout(240_000);
    const problems: string[] = [];
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of PATHS) {
        await page.goto(url(locale, path));
        await page.waitForLoadState("networkidle");
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (overflow > 0) problems.push(`${path} @${width}px overflows by ${overflow}px`);
      }
    }
    expect(problems).toEqual([]);
  });
}

test("Arabic layout mirrors: logo on the right, menu on the left", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ar");
  const logo = await page.getByRole("link", { name: /Maison Web Studio/ }).first().boundingBox();
  const menu = await page.getByRole("button", { name: "افتح القائمة" }).boundingBox();
  expect(logo!.x).toBeGreaterThan(menu!.x);
});

// WCAG 1.4.10 Reflow is covered by the 320px column of the matrix above (= 1280px at 400% zoom).
// WCAG 1.4.12 Text spacing: content must survive the spacing overrides without overflowing.
test("text spacing overrides (WCAG 1.4.12) do not break the layout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/", "/pricing", "/start?package=business"]) {
    await page.goto(path);
    await page.addStyleTag({
      content: "*{line-height:1.5!important;letter-spacing:0.12em!important;word-spacing:0.16em!important}p{margin-bottom:2em!important}",
    });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
