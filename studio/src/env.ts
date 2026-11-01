import type { Db } from "./db";

/** Worker bindings and variables (see wrangler.jsonc). Secrets are never sent to the browser. */
export type Env = {
  DB: D1Database;
  JOBS: Queue<Job>;
  ASSETS: Fetcher;
  /** Private bucket for project files, AI designs and rendered website versions. */
  SITES?: R2Bucket;
  /** Optional Cloudflare Browser Rendering binding (future axe/responsive checks). */
  BROWSER?: Fetcher;
  ADMIN_LIMITER?: RateLimit;
  PUBLIC_LIMITER?: RateLimit;

  ENVIRONMENT: string;
  BUSINESS_NAME: string;
  WEBSITE_URL: string;
  SENDER_NAME: string;
  SENDER_EMAIL: string;
  BUSINESS_POSTAL_ADDRESS: string;
  PUBLIC_BASE_URL: string;
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_AUD: string;
  ADMIN_EMAILS: string;
  TEST_RECIPIENTS: string;
  SENDER_TIMEZONE: string;
  AI_MODEL: string;
  /** Development only: treat requests as this admin without Cloudflare Access. Ignored in production. */
  DEV_ADMIN_EMAIL?: string;
  /** Development only: allow fetching localhost fixture sites in tests. Ignored in production. */
  DEV_ALLOW_LOCAL_FETCH?: string;
  /** Development only: "stub" uses a deterministic offline AI instead of the Claude API. */
  DEV_AI_PROVIDER?: string;

  ANTHROPIC_API_KEY?: string;
  GMAIL_CLIENT_ID?: string;
  GMAIL_CLIENT_SECRET?: string;
  GMAIL_REFRESH_TOKEN?: string;
  APP_SECRET?: string;
  INTERNAL_SECRET?: string;
  PAGESPEED_API_KEY?: string;
  /** Website (Next.js) origin for the private /api/internal endpoints. */
  WEBSITE_INTERNAL_URL?: string;
  /** Origin that serves website previews (ideally its own hostname). Defaults to PUBLIC_BASE_URL. */
  PREVIEW_ORIGIN?: string;
  /** base64(32 bytes) — encrypts Cloudflare tokens and customer email keys at rest. */
  ENCRYPTION_KEY?: string;
  /** Transactional customer email (Resend). */
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  /** Development only: point the deploy client at a local mock of the Cloudflare API. */
  DEV_CLOUDFLARE_API?: string;
};

export type Job =
  | { type: "process_lead"; leadId: string }
  | { type: "send_message"; messageId: string }
  | { type: "discover"; targetIndex?: number; manual?: boolean }
  // Website fulfillment
  | { type: "order_event"; orderId: string }
  | { type: "build"; generationId: string }
  | { type: "deploy"; deploymentId: string }
  | { type: "verify_deployment"; deploymentId: string; attempt: number }
  | { type: "verify_domain"; deploymentId: string; attempt: number }
  | { type: "reconcile_orders" };

/** Static configuration derived from the environment. */
export type Config = {
  production: boolean;
  businessName: string;
  websiteUrl: string;
  senderName: string;
  senderEmail: string;
  postalAddress: string;
  publicBaseUrl: string;
  adminEmails: string[];
  testRecipients: string[];
  senderTimezone: string;
  aiModel: string;
  appSecret: string;
  devAdminEmail: string | null;
  allowLocalFetch: boolean;
};

const list = (v: string | undefined) =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

export function loadConfig(env: Env): Config {
  const production = env.ENVIRONMENT !== "development";
  return {
    production,
    businessName: env.BUSINESS_NAME || "Maison Web Studio",
    websiteUrl: (env.WEBSITE_URL || "").replace(/\/$/, ""),
    senderName: env.SENDER_NAME || "Lisa",
    senderEmail: (env.SENDER_EMAIL || "").trim(),
    postalAddress: (env.BUSINESS_POSTAL_ADDRESS || "").trim(),
    publicBaseUrl: (env.PUBLIC_BASE_URL || "").replace(/\/$/, ""),
    adminEmails: list(env.ADMIN_EMAILS),
    testRecipients: list(env.TEST_RECIPIENTS),
    senderTimezone: env.SENDER_TIMEZONE || "America/New_York",
    aiModel: env.AI_MODEL || "claude-opus-5-5",
    appSecret: env.APP_SECRET || "",
    // Development-only conveniences are hard-disabled in production.
    devAdminEmail: !production && env.DEV_ADMIN_EMAIL ? env.DEV_ADMIN_EMAIL.toLowerCase() : null,
    allowLocalFetch: !production && env.DEV_ALLOW_LOCAL_FETCH === "true",
  };
}

/** Problems that block real (non-test) sending. Shown on the settings page. */
export function liveSendingBlockers(config: Config, env: Pick<Env, "GMAIL_REFRESH_TOKEN" | "APP_SECRET">): string[] {
  const out: string[] = [];
  if (!config.production) out.push("ENVIRONMENT is not production.");
  if (!config.postalAddress) out.push("BUSINESS_POSTAL_ADDRESS is not set (required in every commercial email).");
  if (!config.senderEmail) out.push("SENDER_EMAIL is not set.");
  if (!config.websiteUrl.startsWith("https://")) out.push("WEBSITE_URL must be an https:// address.");
  if (!config.publicBaseUrl.startsWith("https://")) out.push("PUBLIC_BASE_URL (for unsubscribe links) must be an https:// address.");
  if (!env.GMAIL_REFRESH_TOKEN) out.push("The outreach mailbox (Gmail API) is not connected.");
  if (!env.APP_SECRET || env.APP_SECRET.length < 32) out.push("APP_SECRET is missing or shorter than 32 characters.");
  return out;
}

export type Logger = {
  info(event: string, data?: Record<string, unknown>): void;
  warn(event: string, data?: Record<string, unknown>): void;
  error(event: string, data?: Record<string, unknown>): void;
};

/** Structured JSON logs. Never pass email bodies or full addresses; use maskEmail(). */
export const logger: Logger = {
  info: (event, data) => console.log(JSON.stringify({ level: "info", event, ...data })),
  warn: (event, data) => console.warn(JSON.stringify({ level: "warn", event, ...data })),
  error: (event, data) => console.error(JSON.stringify({ level: "error", event, ...data })),
};

export type { Db };
