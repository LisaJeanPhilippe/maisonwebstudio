import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

/**
 * One runner for everything:
 *  - unit:        pure logic (pricing, validation, retention, translations) — no browser, no server
 *  - integration: API routes against a production build with Stripe *test-mode-shaped* dummy keys.
 *                 Webhook signatures are generated locally; nothing ever reaches Stripe, nothing is charged.
 *  - e2e:         real browser flows, axe accessibility scans and responsive checks
 *
 * Run `npm run build` first; the servers below use `next start`.
 */

/** Set E2E_BASE_URL to run the e2e project against another server, e.g. `wrangler dev` or a staging deploy. */
const EXTERNAL = process.env.E2E_BASE_URL;
export const E2E_URL = EXTERNAL || "http://127.0.0.1:3100";
export const API_URL = "http://127.0.0.1:3200";
export const TEST_DATA_DIR = path.join(__dirname, ".test-data");
export const TEST_WEBHOOK_SECRET = "whsec_playwright_local_only";

export default defineConfig({
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  projects: [
    { name: "unit", testDir: "tests/unit" },
    // Outreach system: pure logic + workflow tests on an in-memory database. No network, no real email.
    { name: "studio", testDir: "studio/tests", testIgnore: "e2e/**" },
    { name: "integration", testDir: "tests/integration", use: { baseURL: API_URL } },
    {
      name: "e2e",
      testDir: "tests/e2e",
      use: { ...devices["Desktop Chrome"], baseURL: E2E_URL },
    },
  ],
  webServer: EXTERNAL ? [] : [
    {
      // Plain production server with no payment keys (payments show the "unavailable" state).
      command: "npx next start -p 3100 -H 127.0.0.1",
      url: `${E2E_URL}/robots.txt`,
      reuseExistingServer: !process.env.CI,
      env: { DATA_DIR: path.join(TEST_DATA_DIR, "e2e"), STRIPE_SECRET_KEY: "", STRIPE_WEBHOOK_SECRET: "" },
    },
    {
      // API server with dummy test-mode keys. The secret key is not a real key, so any
      // call that would reach Stripe fails instead of creating anything.
      command: "npx next start -p 3200 -H 127.0.0.1",
      url: `${API_URL}/robots.txt`,
      reuseExistingServer: false,
      env: {
        DATA_DIR: path.join(TEST_DATA_DIR, "api"),
        STRIPE_SECRET_KEY: "sk_test_playwright_dummy_not_a_real_key",
        STRIPE_WEBHOOK_SECRET: TEST_WEBHOOK_SECRET,
        RESEND_API_KEY: "",
      },
    },
  ],
});
