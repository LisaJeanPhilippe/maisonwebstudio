import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end test of the outreach dashboard in the real Workers runtime (wrangler dev, local D1 + Queues).
 * Uses fake businesses served from a local fixture server, the offline AI stub and the dry-run mail
 * transport. Nothing leaves this machine and no real email can be sent.
 */
const PORT = 8790;
const vars = {
  ENVIRONMENT: "development",
  DEV_ADMIN_EMAIL: "owner@example.org",
  DEV_AI_PROVIDER: "stub",
  DEV_ALLOW_LOCAL_FETCH: "true",
  APP_SECRET: "e2e-only-secret-0123456789abcdef0123456789",
  INTERNAL_SECRET: "e2e-internal-secret-0123456789abcdef01234",
  TEST_RECIPIENTS: "lisa.test@inbox-test.dev",
  SENDER_EMAIL: "lisa@outreach.example.org",
  PUBLIC_BASE_URL: `http://127.0.0.1:${PORT}`,
  BUSINESS_POSTAL_ADDRESS: "PO-Box-100-Brooklyn-NY-11201",
};
const varFlags = Object.entries(vars).map(([k, v]) => `--var ${k}:${v}`).join(" ");

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  workers: 1,
  reporter: [["list"]],
  use: { ...devices["Desktop Chrome"], baseURL: `http://127.0.0.1:${PORT}` },
  webServer: [
    { command: "node tests/e2e/fixture-server.mjs", port: 8791, reuseExistingServer: false },
    {
      command: `rm -rf .wrangler-e2e && npx wrangler d1 migrations apply maison-outreach --local --persist-to .wrangler-e2e -c wrangler.jsonc && npx wrangler dev -c wrangler.jsonc --local --persist-to .wrangler-e2e --port ${PORT} --ip 127.0.0.1 --test-scheduled ${varFlags}`,
      url: `http://127.0.0.1:${PORT}/healthz`,
      timeout: 180_000,
      reuseExistingServer: false,
    },
  ],
});
