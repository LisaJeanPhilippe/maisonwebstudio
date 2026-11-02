import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests in the real Workers runtime (wrangler dev, local D1 + Queues + R2).
 *
 * Outreach: fake businesses from a local fixture server, the offline AI stub and the dry-run mail transport.
 * Fulfillment: the real website (next start, run `npm run build` first) with test-mode-shaped dummy Stripe keys
 * and a locally signed webhook, the offline website agent stub, and a local Cloudflare API mock.
 * Nothing leaves this machine: no email is sent, nothing is charged, nothing is deployed to Cloudflare.
 */
const PORT = 8790;
export const WEBSITE_PORT = 3300;
export const E2E_INTERNAL_SECRET = "e2e-internal-secret-0123456789abcdef01234";
export const E2E_WEBHOOK_SECRET = "whsec_studio_e2e_local_only";
export const E2E_WEBSITE_DATA = path.join(__dirname, ".e2e-website-data");
export const MOCK_CF = { token: "mock-cf-token-e2e-0123456789abcdefghijklmn", accountId: "0123456789abcdef0123456789abcdef" };

const vars = {
  ENVIRONMENT: "development",
  DEV_ADMIN_EMAIL: "owner@example.org",
  DEV_AI_PROVIDER: "stub",
  DEV_ALLOW_LOCAL_FETCH: "true",
  APP_SECRET: "e2e-only-secret-0123456789abcdef0123456789",
  INTERNAL_SECRET: E2E_INTERNAL_SECRET,
  TEST_RECIPIENTS: "lisa.test@inbox-test.dev",
  SENDER_EMAIL: "lisa@outreach.example.org",
  PUBLIC_BASE_URL: `http://127.0.0.1:${PORT}`,
  // A different origin than the dashboard, so previews are isolated from it like in production.
  PREVIEW_ORIGIN: `http://localhost:${PORT}`,
  BUSINESS_POSTAL_ADDRESS: "PO-Box-100-Brooklyn-NY-11201",
  WEBSITE_INTERNAL_URL: `http://127.0.0.1:${WEBSITE_PORT}`,
  ENCRYPTION_KEY: "AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA=",
  DEV_CLOUDFLARE_API: "http://127.0.0.1:8792/client/v4",
  AI_BUILDS: "on",
};
const varFlags = Object.entries(vars).map(([k, v]) => `--var ${k}:${v}`).join(" ");

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 180_000,
  workers: 1,
  reporter: [["list"]],
  use: { ...devices["Desktop Chrome"], baseURL: `http://127.0.0.1:${PORT}` },
  webServer: [
    { command: "node tests/e2e/fixture-server.mjs", port: 8791, reuseExistingServer: false },
    { command: "node tests/e2e/cloudflare-mock-server.mjs", port: 8792, reuseExistingServer: false, env: { MOCK_CF_TOKEN: MOCK_CF.token, MOCK_CF_ACCOUNT: MOCK_CF.accountId } },
    {
      command: `rm -rf ${E2E_WEBSITE_DATA} && npx next start -p ${WEBSITE_PORT} -H 127.0.0.1`,
      cwd: path.join(__dirname, ".."),
      url: `http://127.0.0.1:${WEBSITE_PORT}/robots.txt`,
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        DATA_DIR: E2E_WEBSITE_DATA,
        STRIPE_SECRET_KEY: "sk_test_studio_e2e_dummy_not_a_real_key",
        STRIPE_WEBHOOK_SECRET: E2E_WEBHOOK_SECRET,
        RESEND_API_KEY: "",
        STUDIO_URL: `http://127.0.0.1:${PORT}`,
        STUDIO_INTERNAL_SECRET: E2E_INTERNAL_SECRET,
      },
    },
    {
      command: `rm -rf .wrangler-e2e && npx wrangler d1 migrations apply maison-studio --local --persist-to .wrangler-e2e -c wrangler.jsonc && npx wrangler dev -c wrangler.jsonc --local --persist-to .wrangler-e2e --port ${PORT} --ip 127.0.0.1 --test-scheduled ${varFlags}`,
      url: `http://127.0.0.1:${PORT}/healthz`,
      timeout: 180_000,
      reuseExistingServer: false,
    },
  ],
});
