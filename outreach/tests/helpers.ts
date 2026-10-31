import { readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Db, Stmt } from "../src/db";
import type { Config, Job, Logger } from "../src/env";
import type { Deps } from "../src/pipeline";
import type { AiProvider } from "../src/ai/types";
import { StubProvider } from "../src/ai/stub";
import type { ComposedEmail } from "../src/email/compose";
import type { InboundMessage, SendResult, Transport } from "../src/email/transport";

/** In-memory SQLite with the real migrations, exposing the same API as Cloudflare D1. */
export function testDb(): Db {
  const raw = new DatabaseSync(":memory:");
  raw.exec(readFileSync(path.join(__dirname, "../migrations/0001_init.sql"), "utf8"));
  const conv = (v: unknown) => (v === undefined ? null : typeof v === "boolean" ? (v ? 1 : 0) : v);
  const make = (sql: string, values: unknown[] = []): Stmt => ({
    bind: (...v: unknown[]) => make(sql, v.map(conv)),
    first: async <T,>() => (raw.prepare(sql).get(...(values as never[])) as T) ?? null,
    all: async <T,>() => ({ results: raw.prepare(sql).all(...(values as never[])) as T[] }),
    run: async () => ({ meta: { changes: Number(raw.prepare(sql).run(...(values as never[])).changes) } }),
  });
  return {
    prepare: (sql) => make(sql),
    batch: async (stmts) => {
      raw.exec("BEGIN");
      try {
        const out = [];
        for (const s of stmts) out.push(await s.run());
        raw.exec("COMMIT");
        return out;
      } catch (e) {
        raw.exec("ROLLBACK");
        throw e;
      }
    },
  };
}

export const testConfig = (over: Partial<Config> = {}): Config => ({
  production: false,
  businessName: "Maison Web Studio",
  websiteUrl: "https://maisonwebstudio.com",
  senderName: "Lisa",
  senderEmail: "lisa@outreach.example.org",
  postalAddress: "PO Box 100, Brooklyn, NY 11201",
  publicBaseUrl: "https://go.example.org",
  adminEmails: ["owner@example.org"],
  testRecipients: ["me+test@example.org"],
  senderTimezone: "America/New_York",
  aiModel: "claude-opus-5-5",
  appSecret: "test-secret-0123456789abcdef0123456789abcdef",
  devAdminEmail: null,
  allowLocalFetch: false,
  ...over,
});

export type FakeSite = Record<string, { status?: number; body?: string; headers?: Record<string, string> } | "fail">;

/** fetch() replacement serving fixture pages; unknown URLs fail like an unreachable host. */
export function fakeFetch(site: FakeSite) {
  const calls: string[] = [];
  const fn = async (input: string) => {
    calls.push(input);
    const hit = site[input];
    if (input.endsWith("/robots.txt") && !hit) return new Response("", { status: 404 });
    if (!hit || hit === "fail") throw new TypeError("fetch failed");
    return new Response(hit.body ?? "", { status: hit.status ?? 200, headers: { "content-type": "text/html; charset=utf-8", ...(hit.headers ?? {}) } });
  };
  return Object.assign(fn, { calls });
}

export const quietLog: Logger = { info: () => {}, warn: () => {}, error: () => {} };

export function testDeps(db: Db, opts: { site?: FakeSite; ai?: AiProvider | null; config?: Partial<Config>; now?: Date } = {}) {
  const jobs: Job[] = [];
  const deps: Deps = {
    db,
    config: testConfig(opts.config),
    ai: opts.ai === undefined ? new StubProvider() : opts.ai,
    fetch: fakeFetch(opts.site ?? {}),
    jobs: { send: async (j) => void jobs.push(j) },
    log: quietLog,
    now: opts.now ? () => opts.now! : undefined,
  };
  return { deps, jobs };
}

export class FakeTransport implements Transport {
  readonly name = "fake";
  sent: { email: ComposedEmail; rfcId: string; threadId: string | null | undefined }[] = [];
  inbound: InboundMessage[] = [];
  failNext: Error | null = null;
  async send(email: ComposedEmail, rfcId: string, threadId?: string | null): Promise<SendResult> {
    if (this.failNext) {
      const e = this.failNext;
      this.failNext = null;
      throw e;
    }
    this.sent.push({ email, rfcId, threadId });
    return { providerMessageId: `p-${this.sent.length}`, providerThreadId: threadId ?? `t-${email.to}` };
  }
  async listInbound() {
    return this.inbound;
  }
}

// ---------------------------------------------------------------- fixture websites (fake businesses)

export const OUTDATED_SALON = `<html><head><title>Glow Nail Spa</title><meta name="generator" content="FrontPage 4.0"></head>
<body><table><tr><td><font face="Arial">Welcome to Glow Nail Spa</font></td></tr></table><table><tr><td>Manicures, pedicures and gel nails in Austin.</td></tr></table>
<table><tr><td>Call us at 512-555-0100</td></tr></table><table><tr><td><a href="/contact.html">Contact us</a></td></tr></table>
<p>© 2016 Glow Nail Spa</p></body></html>`;

export const SALON_CONTACT = `<html><head><title>Contact</title></head><body><p>Email us: <a href="mailto:hello@glownailspa-test.com">hello@glownailspa-test.com</a></p></body></html>`;

export const MODERN_RESTAURANT = `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Casa Verde Kitchen</title></head>
<body><header><nav><a href="/menu">View menu</a> <a href="tel:+15125550111">Call</a></nav></header><main><h1>Casa Verde Kitchen</h1>
<p>Family-run Mexican kitchen in Austin serving breakfast tacos, enchiladas and aguas frescas every day from 7am.</p>
<p>Questions? <a href="mailto:info@casaverde-test.com">info@casaverde-test.com</a></p><a href="https://www.instagram.com/casaverde_test">Instagram</a></main>
<footer>© ${new Date().getFullYear()} Casa Verde Kitchen</footer></body></html>`;

export const GOOD_SITE = `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Peak Fitness</title></head>
<body><main><h1>Peak Fitness Studio</h1><p>Small group strength classes in Denver with certified coaches and a welcoming community for every level.</p>
<a href="https://peakfitness-test.com/book">Book a class</a> <a href="tel:3035550123">Call</a><form><input type="email"><textarea></textarea></form>
<script src="https://widgets.mindbodyonline.com/x.js"></script></main><footer>© ${new Date().getFullYear()}</footer></body></html>`;

export const PARKED = `<html><head><title>shopbella-test.com</title></head><body><h1>This domain is for sale!</h1><p>Buy this domain today.</p></body></html>`;
