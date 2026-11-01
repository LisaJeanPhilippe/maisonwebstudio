import type { Context, Hono } from "hono";
import type { AppEnv } from "./app";
import { previewCap, previewPath } from "./builder/pipeline";
import { getVersion, TransitionError } from "./projects/store";
import { clientDecision, readClientToken } from "./projects/actions";
import { sameOrigin } from "./security";

/**
 * Public (non-admin) studio routes:
 *  - /p/<versionId>.<sig>/…  preview of one rendered version (capability URL, sandboxed, noindex)
 *  - /review/<token>         customer review of the approved version (signed, expiring link)
 */

const esc = (s: string) => s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/** Content-Security-Policy for previews: the site's own policy, plus a sandbox (opaque origin, no cookies, no top navigation). */
export function previewCsp(frameAncestors: string[]) {
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' https://fonts.bunny.net",
    "font-src https://fonts.bunny.net",
    "img-src 'self' data:",
    "connect-src 'self'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    `frame-ancestors ${[...new Set(frameAncestors.filter(Boolean))].join(" ") || "'none'"}`,
    "sandbox allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox",
  ].join("; ");
}

async function limited(limiter: RateLimit | undefined, key: string) {
  if (!limiter) return false;
  try {
    return !(await limiter.limit({ key })).success;
  } catch {
    return false;
  }
}

export function registerPublicStudioRoutes(app: Hono<AppEnv>) {
  const versionFor = async (c: Context<AppEnv>) => {
    const cap = c.req.param("cap") ?? "";
    const vid = cap.split(".")[0];
    if (!/^ver_[A-Za-z0-9_-]{6,64}$/.test(vid)) return null;
    if (!timingSafeEqual(cap, await previewCap(c.var.deps.config.appSecret, vid))) return null;
    const v = await getVersion(c.var.deps.db, vid);
    return v && v.build_status === "built" ? v : null;
  };

  const previewHeaders = (c: Context<AppEnv>, type: string) => {
    const s = c.var.studio;
    return {
      "Content-Type": type,
      "Content-Security-Policy": previewCsp([s.adminOrigin, s.previewOrigin]),
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "private, no-store",
      "Cross-Origin-Resource-Policy": "cross-origin",
    };
  };


  // Preview forms never send anything: the request is answered with a clear "preview only" message.
  app.on(["POST", "OPTIONS"], "/p/:cap/api/form", async (c) => {
    const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "Content-Type, Accept", "Cache-Control": "no-store" };
    if (c.req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (!(await versionFor(c))) return c.json({ ok: false }, 404);
    return new Response(JSON.stringify({ ok: true, preview: true, message: "Preview only — this form works on the live site; nothing was sent." }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
  });

  const servePreview = async (c: Context<AppEnv>) => {
    const v = await versionFor(c);
    if (!v) return c.text("Preview not found.", 404, { "X-Robots-Tag": "noindex" });
    const base = `/p/${c.req.param("cap")}`;
    let rest: string;
    try {
      rest = decodeURIComponent(new URL(c.req.url).pathname.slice(base.length)) || "/";
    } catch {
      return c.text("Bad path.", 400);
    }
    if (rest.includes("..") || rest.includes("\\")) return c.text("Bad path.", 400);
    const storage = c.var.studio.storage;
    const prefix = `${v.files_prefix}`;
    const key = rest.endsWith("/") ? `${rest}index.html` : rest;
    let obj = await storage.get(`${prefix}${key}`);
    if (!obj && !rest.endsWith("/") && !/\.[a-z0-9]{1,5}$/i.test(rest) && (await storage.get(`${prefix}${rest}/index.html`))) {
      return c.redirect(`${base}${rest}/`, 301);
    }
    let status = 200;
    if (!obj) {
      obj = await storage.get(`${prefix}/404.html`);
      status = 404;
      if (!obj) return c.text("Not found.", 404);
    }
    return new Response(obj.body, { status, headers: previewHeaders(c, obj.contentType) });
  };
  app.get("/p/:cap/*", servePreview);
  // Non-strict routing sends both "/p/<cap>" and "/p/<cap>/" here; only the former needs the slash added.
  app.get("/p/:cap", (c) => (new URL(c.req.url).pathname.endsWith("/") ? servePreview(c) : c.redirect(`/p/${c.req.param("cap")}/`, 301)));

  // ---------------------------------------------------------------- client review
  const reviewPage = (title: string, body: string, status = 200) =>
    new Response(
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)}</title><link rel="stylesheet" href="/admin.css"></head><body><main id="main" class="review"><h1>${esc(title)}</h1>${body}</main></body></html>`,
      { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );

  app.get("/review/:token", async (c) => {
    const ip = c.req.header("cf-connecting-ip") ?? "unknown";
    if (await limited(c.env.PUBLIC_LIMITER, `review:${ip}`)) return c.text("Too many requests. Please try again in a minute.", 429);
    const r = await readClientToken(c.var.studio, c.req.param("token"));
    if (!r) return reviewPage("Link expired", "<p>This review link is no longer valid. Reply to our last email and we'll send a fresh one.</p>", 404);
    const p = r.project;
    const preview = `${c.var.studio.previewOrigin}${await previewPath(c.var.studio, r.versionId)}/`;
    const done = c.req.query("m");
    const active = p.status === "CLIENT_REVIEW" && (!p.client_review_status || p.client_review_status === "pending");
    const action = esc(`/review/${c.req.param("token")}`);
    return reviewPage(
      `Your website preview — ${p.business_name}`,
      `${done === "approved" ? `<div class="banner good" role="status">Thank you! We've recorded your approval and will prepare your site for launch.</div>` : ""}
      ${done === "changes" ? `<div class="banner good" role="status">Thanks — we've received your requested changes and will send an updated preview.</div>` : ""}
      <p>This is a private preview of your new website. Forms in the preview don't send anything. Use the buttons below the preview to approve it or tell us what to change.</p>
      <p><a href="${esc(preview)}" target="_blank" rel="noopener">Open the preview in a new tab</a></p>
      <div class="frame-wrap"><iframe src="${esc(preview)}" title="Website preview" sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox" style="display:block;width:100%;height:720px;border:0;border-radius:8px;background:#fff" loading="lazy"></iframe></div>
      ${
        active
          ? `<section aria-labelledby="respond"><h2 id="respond">Your response</h2>
      <form method="post" action="${action}" class="card">
        <input type="hidden" name="decision" value="approved">
        <p>Happy with everything? Approving lets us launch the site.</p>
        <button type="submit" class="primary">Approve this website</button>
      </form>
      <form method="post" action="${action}" class="card">
        <input type="hidden" name="decision" value="changes_requested">
        <label for="message">What would you like changed?</label>
        <textarea id="message" name="message" rows="6" required minlength="5" maxlength="3000"></textarea>
        <button type="submit">Request changes</button>
      </form></section>`
          : `<p class="muted">Your response has been recorded. We'll be in touch.</p>`
      }`,
    );
  });

  app.post("/review/:token", async (c) => {
    const ip = c.req.header("cf-connecting-ip") ?? "unknown";
    if (await limited(c.env.PUBLIC_LIMITER, `review:${ip}`)) return c.text("Too many requests. Please try again in a minute.", 429);
    if (!sameOrigin(c.req.raw)) return c.text("Cross-site request blocked.", 403);
    const r = await readClientToken(c.var.studio, c.req.param("token"));
    if (!r) return reviewPage("Link expired", "<p>This review link is no longer valid.</p>", 404);
    const f = await c.req.parseBody();
    const decision = f.decision === "approved" ? "approved" : f.decision === "changes_requested" ? "changes_requested" : null;
    const message = typeof f.message === "string" ? f.message : "";
    if (!decision) return c.text("Bad request.", 400);
    if (decision === "changes_requested" && message.trim().length < 5) return reviewPage("Tell us what to change", `<p>Please describe the changes you'd like. <a href="/review/${esc(c.req.param("token"))}">Go back</a></p>`, 400);
    try {
      await clientDecision(c.var.studio, r.project.id, r.versionId, decision, message);
    } catch (e) {
      if (e instanceof TransitionError) return reviewPage("Already recorded", `<p>${esc(e.message)}</p>`, 409);
      throw e;
    }
    return c.redirect(`/review/${c.req.param("token")}?m=${decision === "approved" ? "approved" : "changes"}`, 303);
  });
}
