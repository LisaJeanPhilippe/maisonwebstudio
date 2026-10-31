import { Hono } from "hono";
import { ClaudeProvider } from "./ai/claude";
import { StubProvider } from "./ai/stub";
import type { AiProvider } from "./ai/types";
import { verifyToken } from "./email/compose";
import { DryRunTransport, GmailTransport, type Transport } from "./email/transport";
import { loadConfig, logger, type Env } from "./env";
import type { Deps } from "./pipeline";
import { adminIdentity, sameOrigin, SECURITY_HEADERS } from "./security";
import { recordConversion, recordVisit } from "./sending";
import { suppress } from "./suppression";
import { admin } from "./admin/routes";
import type { Db } from "./db";

export type AppEnv = { Bindings: Env; Variables: { deps: Deps; admin: string; csrf: string } };

export function makeAi(env: Env, production: boolean): AiProvider | null {
  if (!production && env.DEV_AI_PROVIDER === "stub") return new StubProvider();
  return env.ANTHROPIC_API_KEY ? new ClaudeProvider(env.ANTHROPIC_API_KEY, env.AI_MODEL || "claude-opus-5-5") : null;
}

export function makeDeps(env: Env): Deps {
  const config = loadConfig(env);
  return {
    db: env.DB as unknown as Db,
    config,
    ai: makeAi(env, config.production),
    fetch: (input, init) => fetch(input, init),
    jobs: { send: async (job) => { await env.JOBS.send(job); } },
    log: logger,
    pageSpeedKey: env.PAGESPEED_API_KEY,
  };
}

export function makeTransport(env: Env, db: Db): Transport {
  if (env.GMAIL_CLIENT_ID && env.GMAIL_CLIENT_SECRET && env.GMAIL_REFRESH_TOKEN) {
    return new GmailTransport({ clientId: env.GMAIL_CLIENT_ID, clientSecret: env.GMAIL_CLIENT_SECRET, refreshToken: env.GMAIL_REFRESH_TOKEN });
  }
  return new DryRunTransport(db);
}

async function limited(limiter: RateLimit | undefined, key: string) {
  if (!limiter) return false;
  try {
    return !(await limiter.limit({ key })).success;
  } catch {
    return false;
  }
}

const page = (title: string, body: string) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title><link rel="stylesheet" href="/admin.css"></head><body><main id="main" style="max-width:560px"><h1>${title}</h1>${body}</main></body></html>`;

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

export function createApp() {
  const app = new Hono<AppEnv>({ strict: false });

  app.use("*", async (c, next) => {
    c.set("deps", makeDeps(c.env));
    await next();
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) c.res.headers.set(k, v);
  });

  app.onError((err, c) => {
    logger.error("http.error", { path: new URL(c.req.url).pathname, message: err.message });
    return c.html(page("Something went wrong", "<p>The error was logged. Please try again.</p>"), 500);
  });

  app.get("/", (c) => c.html(page(c.env.BUSINESS_NAME || "Maison Web Studio", `<p>This address handles email preferences for ${escapeHtml(c.env.BUSINESS_NAME || "Maison Web Studio")}. Visit <a href="${escapeHtml(c.env.WEBSITE_URL || "#")}">our website</a>.</p>`)));
  app.get("/robots.txt", (c) => c.text("User-agent: *\nDisallow: /\n"));
  app.get("/healthz", (c) => c.json({ ok: true }));

  // ------------------------------------------------------------ unsubscribe (public)
  const unsubscribe = async (c: import("hono").Context<AppEnv>, oneClick: boolean) => {
    const ip = c.req.header("cf-connecting-ip") ?? "unknown";
    if (await limited(c.env.PUBLIC_LIMITER, `unsub:${ip}`)) return c.text("Too many requests. Please try again in a minute.", 429);
    const deps = c.var.deps;
    const data = await verifyToken(deps.config.appSecret, "unsub", c.req.param("token") ?? "");
    if (!data?.e) {
      return c.html(page("Link not recognized", `<p>This unsubscribe link is invalid or incomplete. Reply to our email with "unsubscribe" and we'll remove you right away.</p>`), 400);
    }
    await suppress(deps.db, { email: data.e, reason: "unsubscribe", source: oneClick ? "one_click" : "link", leadId: data.l ?? null });
    deps.log.info("unsubscribe", { leadId: data.l, oneClick });
    if (oneClick) return c.text("Unsubscribed.");
    return c.html(page("You're unsubscribed", `<p>You won't receive any more emails from ${escapeHtml(deps.config.businessName)} at this address. Sorry for the interruption.</p>`));
  };
  // GET unsubscribes immediately (no extra steps); POST is RFC 8058 one-click from mail apps.
  app.get("/u/:token", (c) => unsubscribe(c, false));
  app.post("/u/:token", (c) => unsubscribe(c, true));

  // ------------------------------------------------------------ website → outreach events (server-to-server)
  app.post("/internal/event", async (c) => {
    const secret = c.env.INTERNAL_SECRET ?? "";
    const given = c.req.header("x-internal-secret") ?? "";
    let diff = secret.length === given.length && secret.length >= 32 ? 0 : 1;
    for (let i = 0; i < Math.min(secret.length, given.length); i++) diff |= secret.charCodeAt(i) ^ given.charCodeAt(i);
    if (diff !== 0) return c.json({ error: "forbidden" }, 403);
    const body = (await c.req.json().catch(() => null)) as { type?: string; token?: string; path?: string } | null;
    if (!body?.token) return c.json({ error: "bad request" }, 400);
    const db = c.var.deps.db;
    const ok =
      body.type === "visit" ? await recordVisit(db, body.token, body.path ?? "/") : body.type === "conversion" ? await recordConversion(db, body.token, "customer") : false;
    return c.json({ ok });
  });

  // ------------------------------------------------------------ admin (Cloudflare Access + allow-list)
  app.use("/admin/*", async (c, next) => {
    const ip = c.req.header("cf-connecting-ip") ?? "unknown";
    if (await limited(c.env.ADMIN_LIMITER, `admin:${ip}`)) return c.text("Too many requests.", 429);
    const config = c.var.deps.config;
    if (config.production && (!c.env.ACCESS_TEAM_DOMAIN || !c.env.ACCESS_AUD || !config.adminEmails.length)) {
      return c.html(page("Dashboard not configured", "<p>Set ACCESS_TEAM_DOMAIN, ACCESS_AUD and ADMIN_EMAILS (see the setup guide) before using the dashboard.</p>"), 503);
    }
    const who = await adminIdentity(c.req.raw, c.env, config);
    if (!who) return c.html(page("Not authorized", "<p>Sign in through Cloudflare Access with an address listed in ADMIN_EMAILS.</p>"), 403);
    if (c.req.method !== "GET" && c.req.method !== "HEAD" && !sameOrigin(c.req.raw)) return c.text("Cross-site request blocked.", 403);
    c.set("admin", who);
    await next();
  });
  app.route("/admin", admin);

  return app;
}
