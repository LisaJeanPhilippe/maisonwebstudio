/**
 * The Worker deployed with every client site. Static files are served by Workers Static Assets;
 * this script only runs for paths that aren't files — chiefly POST /api/form.
 * Forms are delivered by email through the customer's own Resend account (RESEND_API_KEY secret),
 * so the deployed site belongs to the customer and doesn't depend on Maison's servers.
 */
export const SITE_WORKER = `const SEEN = new Map();
const HITS = new Map();
const FIELDS = { name: 120, email: 200, phone: 40, date: 20, time: 40, service: 120, message: 3000 };
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" } });

async function handleForm(request, env) {
  const url = new URL(request.url);
  const wantsJson = (request.headers.get("accept") || "").includes("application/json");
  const back = (path) => Response.redirect(new URL(path, url.origin).toString(), 303);
  const fail = (status, code, extra) => (wantsJson ? json(status, { ok: false, code, ...(extra || {}) }) : back("/form-error/"));
  if (request.method !== "POST") return json(405, { ok: false, code: "method" });
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== url.host) return fail(403, "origin");
  const length = Number(request.headers.get("content-length") || "0");
  if (length > 20000) return fail(413, "too_large");

  let data = {};
  const type = request.headers.get("content-type") || "";
  try {
    if (type.includes("application/json")) data = await request.json();
    else { const f = await request.formData(); f.forEach((v, k) => { data[k] = String(v); }); }
  } catch { return fail(400, "bad_request"); }
  if (typeof data !== "object" || data === null) return fail(400, "bad_request");

  // Spam protection: honeypot, minimum fill time, per-visitor rate limit, duplicate submissions.
  if (data.company_website) return wantsJson ? json(200, { ok: true }) : back("/thanks/");
  const t = Number(data.t || 0);
  if (t && Date.now() - t < 2500) return fail(429, "too_fast");
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const now = Date.now();
  const hits = (HITS.get(ip) || []).filter((x) => now - x < 600000);
  hits.push(now); HITS.set(ip, hits);
  if (hits.length > 5) return fail(429, "rate_limited");
  const sid = String(data.sid || "").slice(0, 64);
  if (sid && SEEN.has(sid)) return wantsJson ? json(200, { ok: true, duplicate: true }) : back("/thanks/");

  // Server-side validation (the browser checks are only a convenience).
  const fields = {};
  const clean = {};
  for (const [k, max] of Object.entries(FIELDS)) {
    const v = typeof data[k] === "string" ? data[k].trim() : "";
    if (v.length > max) fields[k] = "too_long";
    clean[k] = v;
  }
  if (!clean.name) fields.name = "required";
  if (!clean.email || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(clean.email)) fields.email = "invalid";
  if (!clean.message) fields.message = "required";
  if (Object.keys(fields).length) return wantsJson ? json(422, { ok: false, code: "validation", fields }) : back("/form-error/");

  if (!env.RESEND_API_KEY || !env.FORM_TO_EMAIL || !env.FORM_FROM_EMAIL) return fail(503, "not_configured");
  const kind = String(data.form || "contact").replace(/[^a-z]/g, "").slice(0, 20) || "contact";
  const subject = ("New " + kind + " request from " + clean.name).replace(/[\\r\\n]+/g, " ").slice(0, 150);
  const lines = Object.entries(clean).filter(([, v]) => v).map(([k, v]) => k + ": " + v);
  lines.push("", "Language: " + String(data.lang || "").slice(0, 10), "Sent from " + url.host);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: "Bearer " + env.RESEND_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({ from: env.FORM_FROM_EMAIL, to: env.FORM_TO_EMAIL, reply_to: clean.email, subject, text: lines.join("\\n") }),
  }).catch(() => null);
  if (!res || !res.ok) return fail(502, "send_failed");
  if (sid) { SEEN.set(sid, now); if (SEEN.size > 5000) SEEN.clear(); }
  return wantsJson ? json(200, { ok: true }) : back("/thanks/");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/form") return handleForm(request, env);
    return env.ASSETS.fetch(request);
  },
};
`;
