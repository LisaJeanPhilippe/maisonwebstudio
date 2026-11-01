/**
 * Cloudflare Worker entry point. Wraps the OpenNext-generated worker to:
 *  1. redirect any plain-HTTP request to HTTPS, and
 *  2. run the daily data-retention job (see cloudflare/retention.ts), and
 *  3. count visits that arrive from outreach emails (UTM-tagged links) in the outreach app.
 */
// The generated worker only exists after `opennextjs-cloudflare build`.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import openNextWorker from "../.open-next/worker.js";
import { applyRetention, type R2BucketLike } from "./retention";

type Env = { MASION_DATA?: R2BucketLike } & Record<string, unknown>;
type Ctx = { waitUntil(promise: Promise<unknown>): void };
type Handler = { fetch(request: Request, env: Env, ctx: Ctx): Promise<Response> };

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** Sends only the opaque lead token and the path — no IP address, user agent or cookies. */
function reportVisit(url: URL, env: Env, ctx: Ctx) {
  const endpoint = typeof env.STUDIO_URL === "string" ? env.STUDIO_URL : "";
  const secret = typeof env.STUDIO_INTERNAL_SECRET === "string" ? env.STUDIO_INTERNAL_SECRET : "";
  const token = (url.searchParams.get("utm_content") ?? "").split("-s")[0];
  if (!endpoint || !secret || !/^[a-z0-9]{6,32}$/.test(token)) return;
  ctx.waitUntil(
    fetch(`${endpoint.replace(/\/$/, "")}/internal/event`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-internal-secret": secret },
      body: JSON.stringify({ type: "visit", token, path: url.pathname }),
    }).catch(() => undefined),
  );
}

const worker = {
  async fetch(request: Request, env: Env, ctx: Ctx): Promise<Response> {
    const url = new URL(request.url);
    if (url.protocol === "http:" && !LOCAL_HOSTS.has(url.hostname)) {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }
    if (request.method === "GET" && url.searchParams.get("utm_campaign") === "maison_outreach") reportVisit(url, env, ctx);
    return (openNextWorker as Handler).fetch(request, env, ctx);
  },

  async scheduled(_controller: unknown, env: Env, ctx: Ctx) {
    if (!env.MASION_DATA) return;
    ctx.waitUntil(
      applyRetention(env.MASION_DATA).then((r) =>
        console.info(`[retention] removed ${r.orders} unpaid orders, ${r.uploadObjects} upload objects, ${r.events} event records`),
      ),
    );
  },
};

export default worker;
