import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { LEGAL, PAGES, url } from "./shared";

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function scan(page: Page) {
  // Entrance animations fade content in (CSS scroll-driven ones depend on scroll position):
  // measure contrast on the final, fully opaque state.
  await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important}" });
  await page.waitForTimeout(700); // JS (Motion) transitions after interactions
  // @axe-core/playwright bundles its own copy of the Page type; the runtime object is the same.
  const axePage = page as unknown as ConstructorParameters<typeof AxeBuilder>[0]["page"];
  const { violations } = await new AxeBuilder({ page: axePage }).withTags(WCAG).analyze();
  return violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
}

for (const locale of ["en", "ar", "zh", "hi"]) {
  for (const width of [1440, 390]) {
    test(`axe WCAG 2.2 AA: ${locale} @${width}px`, async ({ page }) => {
      test.setTimeout(180_000);
      await page.setViewportSize({ width, height: 900 });
      const results: Record<string, string[]> = {};
      for (const path of [...PAGES, ...LEGAL, "/no-such-page"]) {
        await page.goto(url(locale, path));
        await page.waitForLoadState("networkidle");
        const v = await scan(page);
        if (v.length) results[path] = v;
      }
      expect(results).toEqual({});
    });
  }
}

test("axe: every configurator step, including the error state", async ({ page }) => {
  await page.goto("/start?package=business");
  const cont = () => page.getByRole("button", { name: /^Continue/ }).filter({ visible: true }).first().click();
  const check = async (label: string) => expect(await scan(page), label).toEqual([]);
  await check("configure");
  await cont(); // without a style → error summary
  await check("configure errors");
  await page.getByText("Editorial", { exact: true }).click();
  await cont();
  await check("add-ons");
  await cont();
  await check("details");
  await cont();
  await check("details errors");
});

test("mobile menu dialog is accessible when open", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.waitForTimeout(800); // let the open animation finish before measuring contrast
  expect(await scan(page)).toEqual([]);
});
