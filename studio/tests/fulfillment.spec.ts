import { expect, test } from "@playwright/test";
import { blake3 } from "@noble/hashes/blake3.js";
import { testDb, testDeps } from "./helpers";
import { createCloudflareMock } from "./cloudflare-mock.mjs";
import type { StudioCtx } from "../src/projects/context";
import { WebsiteClient, type StudioStorage, type WebsiteOrder } from "../src/projects/intake";
import { syncOrder } from "../src/projects/intake";
import { getProject, listVersions, transition, TransitionError } from "../src/projects/store";
import { canTransition } from "../src/projects/status";
import { runGeneration, previewCap } from "../src/builder/pipeline";
import { StubWebsiteAgent } from "../src/builder/stub-agent";
import type { WebsiteAgent } from "../src/builder/agent";
import { approveVersion, addConnection, clientDecision, clientReviewUrl, markCompleted, markReadyForDeployment, readClientToken, requestRevision, sendToClientReview, updateDeploySettings } from "../src/projects/actions";
import { rollbackTo } from "../src/builder/pipeline";
import { runDeployment, startDeployment, verifyLater } from "../src/deploy/deploy";
import { assetHash } from "../src/deploy/cloudflare";
import { decryptSecret, encryptSecret } from "../src/crypto";
import { contrast, ensureContrast } from "../src/builder/color";
import { normalizeSpec, siteSpecSchema } from "../src/builder/spec";
import { previewCsp } from "../src/public-studio";
import type { Job } from "../src/env";

/**
 * Website-fulfillment workflow on an in-memory database with local doubles only:
 * a fake website order API, in-memory storage, the offline stub agent and a local Cloudflare API mock.
 * Nothing here contacts Stripe, Anthropic, Resend or Cloudflare.
 */

const KEY = Buffer.from(new Uint8Array(32).map((_, i) => i * 7 + 1)).toString("base64");
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
const FILE_ID = "11111111-2222-4333-8444-555555555555";
const INSPO_ID = "66666666-7777-4888-8999-aaaaaaaaaaaa";

function memoryStorage(): StudioStorage & { keys: Map<string, { body: ArrayBuffer; contentType: string }> } {
  const keys = new Map<string, { body: ArrayBuffer; contentType: string }>();
  return {
    keys,
    async put(key, body, contentType) {
      keys.set(key, { body: typeof body === "string" ? (new TextEncoder().encode(body).buffer as ArrayBuffer) : body.slice(0), contentType });
    },
    async get(key) {
      return keys.get(key) ?? null;
    },
    async getText(key) {
      const v = keys.get(key);
      return v ? new TextDecoder().decode(v.body) : null;
    },
    async list(prefix) {
      return [...keys.keys()].filter((k) => k.startsWith(prefix));
    },
  };
}

function order(status: string, over: Record<string, unknown> = {}): WebsiteOrder {
  return {
    id: "ord-0001-abcdef",
    createdAt: "2026-10-30T12:00:00.000Z",
    updatedAt: "2026-10-30T12:05:00.000Z",
    status,
    total: 899,
    items: [{ id: "growth", name: "Growth", unitPrice: 899, quantity: 1, total: 899 }],
    order: {
      packageId: "growth",
      fullName: "Dana Rivera",
      email: "dana@inbox-test.dev",
      phone: "512-555-0100",
      businessName: "Bloom & Co Florist",
      industry: "boutique",
      locale: "en",
      businessDescription: "Neighborhood florist in Austin making seasonal bouquets, wedding flowers and weekly subscriptions.",
      location: "Austin, TX",
      goals: "Get more wedding inquiries and subscription orders.",
      primaryCta: "quote",
      pages: ["home", "about", "services", "contact"],
      features: ["contactForm"],
      aboutText: "Founded in 2015 by Dana, Bloom & Co sources flowers from Texas growers.",
      servicesText: "Wedding flowers\nWeekly subscriptions\nEvent installations",
      testimonialsText: "",
      contactInfo: "hello@bloomco-test.dev",
      languages: ["en", "es"],
      files: [
        { id: FILE_ID, name: "storefront.png", size: PNG.byteLength, type: "image/png", kind: "content" },
        { id: INSPO_ID, name: "moodboard.png", size: PNG.byteLength, type: "image/png", kind: "inspiration" },
      ],
      ...over,
    },
  };
}

function harness() {
  const db = testDb();
  const { deps, jobs } = testDeps(db);
  const site: { order: WebsiteOrder | null } = { order: null };
  const cf = createCloudflareMock();
  const sent: { to: string; subject: string }[] = [];
  const websiteFetch = async (url: string, init?: RequestInit) => {
    expect((init?.headers as Record<string, string>)["x-internal-secret"]).toBe("i".repeat(40));
    const u = new URL(url);
    if (u.pathname.startsWith("/api/internal/orders/")) return site.order ? Response.json(site.order) : new Response("", { status: 404 });
    if (u.pathname.startsWith("/api/internal/files/")) return new Response(PNG, { headers: { "content-type": "image/png", "x-file-name": u.pathname.endsWith(FILE_ID) ? "storefront.png" : "moodboard.png" } });
    if (u.pathname === "/api/internal/orders") return Response.json({ orders: site.order ? [{ id: site.order.id, status: site.order.status, updatedAt: site.order.updatedAt }] : [] });
    return new Response("", { status: 404 });
  };
  const ctx: StudioCtx = {
    ...deps,
    fetch: ((input: string | Request, init?: RequestInit) => cf.handle(new Request(input, init))) as StudioCtx["fetch"],
    storage: memoryStorage(),
    site: new WebsiteClient("https://website.test", "i".repeat(40), websiteFetch as typeof fetch),
    mail: async (to, subject) => {
      sent.push({ to, subject });
      return true;
    },
    encryptionKey: KEY,
    previewOrigin: "https://preview.test",
    adminOrigin: "https://studio.test",
    cloudflareApi: "https://cf.mock/client/v4",
  };
  const take = (type: Job["type"]) => {
    const i = jobs.findIndex((j) => j.type === type);
    return i >= 0 ? jobs.splice(i, 1)[0] : null;
  };
  return { db, ctx, jobs, take, site, cf, sent };
}

/** Brings a project to READY_FOR_REVIEW through the real intake + generation path. */
async function toReview(h: ReturnType<typeof harness>, agent: WebsiteAgent = new StubWebsiteAgent()) {
  h.site.order = order("paid");
  const p = (await syncOrder(h.ctx, h.site.order.id))!;
  const job = h.take("build") as Extract<Job, { type: "build" }>;
  await runGeneration(h.ctx, agent, job.generationId);
  return (await getProject(h.db, p.id))!;
}

// ---------------------------------------------------------------- pure pieces

test("status machine: AI states cannot reach APPROVED; deploy needs READY_FOR_DEPLOYMENT", () => {
  expect(canTransition("READY_FOR_REVIEW", "APPROVED")).toBe(true);
  expect(canTransition("AI_BUILDING", "APPROVED")).toBe(false);
  expect(canTransition("AI_REVISING", "APPROVED")).toBe(false);
  expect(canTransition("QUEUED_FOR_AI", "DEPLOYING")).toBe(false);
  expect(canTransition("APPROVED", "DEPLOYING")).toBe(false);
  expect(canTransition("READY_FOR_DEPLOYMENT", "DEPLOYING")).toBe(true);
  expect(canTransition("AWAITING_PAYMENT", "QUEUED_FOR_AI")).toBe(false);
});

test("secrets are encrypted at rest with AES-GCM and tamper-evident", async () => {
  const sealed = await encryptSecret(KEY, "cf-token-secret-value");
  expect(sealed).not.toContain("cf-token");
  expect(await decryptSecret(KEY, sealed)).toBe("cf-token-secret-value");
  const parts = sealed.split(".");
  parts[2] = parts[2].slice(0, -4) + (parts[2].endsWith("AAAA") ? "BBBB" : "AAAA");
  await expect(decryptSecret(KEY, parts.join("."))).rejects.toThrow();
  await expect(encryptSecret("short", "x")).rejects.toThrow(/32 random bytes/);
});

test("asset hash matches Wrangler's (BLAKE3 of base64 + extension, 32 hex)", () => {
  expect(assetHash(new TextEncoder().encode("hi"), "/a.txt")).toBe("36d0c5876a2fdcdc9e50d9f33383cabc");
  expect(Buffer.from(blake3(new TextEncoder().encode("aGk=txt"))).toString("hex").slice(0, 32)).toBe("36d0c5876a2fdcdc9e50d9f33383cabc");
});

test("contrast correction reaches WCAG AA", () => {
  const fixed = ensureContrast("#9aa0a6", "#ffffff", 4.5);
  expect(contrast(fixed, "#ffffff")).toBeGreaterThanOrEqual(4.5);
  expect(ensureContrast("#111111", "#ffffff", 4.5)).toBe("#111111");
});

test("spec normalization drops unknown images, off-brief links and unsafe CSS", async () => {
  const agent = new StubWebsiteAgent();
  const spec = siteSpecSchema.parse(
    await agent.design({
      brief: { business: { name: "X Co", description: "We do things well for people nearby.", location: "Austin", phone: "", publicContact: "" }, goals: { purpose: "", primaryCta: "Contact us", primaryCtaId: "contact" }, pages: ["home"], design: { direction: "" }, functionality: { features: [], toolLinks: "" }, content: { about: "", services: "", testimonials: "", faq: "", pricing: "" } },
      images: [],
      documents: [],
      assetList: [],
    }),
  );
  spec.customCss = "body{background:url(https://evil.test/x.png)} @import 'x'; .a{color:red}";
  const hero = spec.pages[0].sections.find((s) => s.type === "hero") as { image?: string | null; secondaryCta?: { label: string; target: string } | null } | undefined;
  if (hero) {
    hero.image = "ast_doesnotexist";
    hero.secondaryCta = { label: "Visit", target: "https://not-in-brief.test/" };
  }
  const { spec: out, fixes } = normalizeSpec(spec, new Set(), []);
  expect(out.customCss).not.toMatch(/url\(|@import/);
  expect(fixes.length).toBeGreaterThan(0);
  const h2 = out.pages[0].sections.find((s) => s.type === "hero") as { image?: string | null; secondaryCta?: { target: string } | null } | undefined;
  if (h2) {
    expect(h2.image ?? null).toBeNull();
    expect(h2.secondaryCta?.target ?? "").not.toContain("not-in-brief");
  }
});

test("preview CSP sandboxes the generated site and only allows the studio to frame it", () => {
  const csp = previewCsp(["https://studio.test", "https://preview.test"]);
  expect(csp).toContain("sandbox allow-scripts allow-forms");
  expect(csp).not.toContain("allow-same-origin");
  expect(csp).toContain("frame-ancestors https://studio.test https://preview.test");
  expect(csp).toContain("script-src 'self'");
});

// ---------------------------------------------------------------- workflow

test("unpaid order creates a project but never starts AI generation", async () => {
  const h = harness();
  h.site.order = order("pending_payment");
  const p = (await syncOrder(h.ctx, h.site.order.id))!;
  expect(p.status).toBe("AWAITING_PAYMENT");
  expect(h.jobs.filter((j) => j.type === "build")).toHaveLength(0);
  // A forged "paid" event can't help: the order is re-read from the website, which still says unpaid.
  await syncOrder(h.ctx, h.site.order.id);
  expect((await getProject(h.db, p.id))!.status).toBe("AWAITING_PAYMENT");
  // Even a direct transition attempt is refused by the machine.
  await expect(transition(h.db, p.id, "QUEUED_FOR_AI", "GENERATION_QUEUED", "attacker")).rejects.toThrow(TransitionError);
  const n = await h.db.prepare("SELECT COUNT(*) AS n FROM ai_generations").first<{ n: number }>();
  expect(n!.n).toBe(0);
});

test("full lifecycle: paid → AI build → review → revision → approve → client review → deploy → verified → completed", async () => {
  const h = harness();
  h.site.order = order("pending_payment");
  const created = (await syncOrder(h.ctx, h.site.order.id))!;
  expect(created.status).toBe("AWAITING_PAYMENT");

  // Payment confirmed by the website (webhook-verified) → project paid, assets copied, AI queued.
  h.site.order = order("paid");
  const paid = (await syncOrder(h.ctx, h.site.order.id))!;
  expect(paid.status).toBe("QUEUED_FOR_AI");
  const assets = await h.db.prepare("SELECT kind, role, status, width FROM project_assets WHERE project_id = ? ORDER BY kind").bind(paid.id).all<{ kind: string; role: string; status: string; width: number }>();
  expect(assets.results).toEqual([
    { kind: "content", role: "photo", status: "stored", width: 1 },
    { kind: "inspiration", role: "inspiration", status: "stored", width: 1 },
  ]);
  const brief = JSON.parse(paid.brief!);
  expect(brief.business.name).toBe("Bloom & Co Florist");
  expect(h.sent.map((s) => s.subject).join("|")).toMatch(/payment/i);

  // AI build (stub agent) → a real rendered version with checks; project waits for a human.
  const build = h.take("build") as Extract<Job, { type: "build" }>;
  expect(await runGeneration(h.ctx, new StubWebsiteAgent(), build.generationId)).toHaveProperty("versionId");
  let p = (await getProject(h.db, paid.id))!;
  expect(p.status).toBe("READY_FOR_REVIEW");
  const [v1] = await listVersions(h.db, p.id);
  expect(v1.build_status).toBe("built");
  expect(["passed", "warnings"]).toContain(v1.checks_status);
  const storage = h.ctx.storage as ReturnType<typeof memoryStorage>;
  const home = await storage.getText(`versions/${v1.id}/files/index.html`);
  expect(home).toContain("Bloom &amp; Co Florist");
  expect(home).toContain(`content="${v1.id}"`);
  expect(home).toMatch(/<html lang="en" dir="ltr">/);
  expect(await storage.getText(`versions/${v1.id}/files/es/index.html`)).toMatch(/<html lang="es"/);
  expect(await storage.getText(`versions/${v1.id}/files/sitemap.xml`)).toContain("hreflang");
  // Inspiration images are references only — never published on the site.
  expect([...storage.keys.keys()].filter((k) => k.startsWith(`versions/${v1.id}/files/assets/img/`)).join()).not.toContain("moodboard");
  const checks = await h.db.prepare("SELECT category, status FROM quality_checks WHERE version_id = ?").bind(v1.id).all<{ category: string; status: string }>();
  expect(new Set(checks.results.map((c) => c.category))).toEqual(expect.objectContaining(new Set(["accessibility", "seo", "links", "security"])));
  expect(checks.results.some((c) => c.status === "fail")).toBe(false);

  // Revision through the AI → version 2, version 1 kept.
  await requestRevision(h.ctx, p.id, "Make the headline mention wedding flowers.", "owner@example.org");
  expect((await getProject(h.db, p.id))!.status).toBe("AI_REVISING");
  const rev = h.take("build") as Extract<Job, { type: "build" }>;
  await runGeneration(h.ctx, new StubWebsiteAgent(), rev.generationId);
  p = (await getProject(h.db, p.id))!;
  expect(p.status).toBe("READY_FOR_REVIEW");
  const versions = await listVersions(h.db, p.id);
  expect(versions).toHaveLength(2);
  const v2 = versions.find((v) => v.number === 2)!;
  expect(p.current_version_id).toBe(v2.id);

  // Rollback restores v1's design as v3 (no AI involved); v1 and v2 remain.
  await rollbackTo(h.ctx, p.id, v1.id, "owner@example.org");
  const v3 = (await listVersions(h.db, p.id)).find((v) => v.number === 3)!;
  expect(v3.parent_version_id).toBe(v1.id);

  // Human approval (warnings need explicit confirmation).
  if (v3.checks_status === "warnings") await expect(approveVersion(h.ctx, p.id, v3.id, "owner@example.org", { acceptWarnings: false })).rejects.toThrow(/confirm/);
  await approveVersion(h.ctx, p.id, v3.id, "owner@example.org", { acceptWarnings: true });
  p = (await getProject(h.db, p.id))!;
  expect(p.status).toBe("APPROVED");
  expect(p.approved_version_id).toBe(v3.id);

  // Client review via a signed link.
  const url = await sendToClientReview(h.ctx, p.id, "owner@example.org");
  const token = url.split("/review/")[1];
  const read = await readClientToken(h.ctx, token);
  expect(read?.versionId).toBe(v3.id);
  expect(await readClientToken(h.ctx, token.slice(0, -2) + "xx")).toBeNull();
  await clientDecision(h.ctx, p.id, v3.id, "approved", "Love it!");
  await expect(clientDecision(h.ctx, p.id, v3.id, "changes_requested", "Actually change it")).rejects.toThrow(/already recorded/);
  expect((await getProject(h.db, p.id))!.client_review_status).toBe("approved");

  // Deployment is impossible until an admin marks it ready and configures Cloudflare.
  await expect(startDeployment(h.ctx, p.id, "owner@example.org")).rejects.toThrow(/Can't deploy yet/);
  await markReadyForDeployment(h.ctx, p.id, "owner@example.org");
  const conn = await addConnection(h.ctx, "owner@example.org", { label: "Bloom & Co (customer)", owner: "customer", accountId: h.cf.accountId, token: h.cf.token });
  expect(conn.ok).toBe(true);
  const stored = await h.db.prepare("SELECT token_cipher, token_hint FROM cloudflare_connections WHERE id = ?").bind(conn.id).first<{ token_cipher: string; token_hint: string }>();
  expect(stored!.token_cipher).not.toContain(h.cf.token.slice(0, 10));
  await expect(startDeployment(h.ctx, p.id, "owner@example.org")).rejects.toThrow(/Cloudflare account/);
  await updateDeploySettings(h.ctx, p.id, "owner@example.org", { connectionId: conn.id, scriptName: "bloom-co", domain: "", formTo: "dana@inbox-test.dev", formFrom: "Bloom & Co <forms@bloomco-test.dev>", resendKey: "re_test_0123456789abcdefghij" });

  const depId = await startDeployment(h.ctx, p.id, "owner@example.org");
  expect((await getProject(h.db, p.id))!.status).toBe("DEPLOYING");
  expect(h.take("deploy")).toEqual({ type: "deploy", deploymentId: depId });
  expect(await runDeployment(h.ctx, depId)).toEqual({ ok: true });

  // What reached the (mock) Cloudflare API: assets, the form worker, secrets as secret bindings.
  const script = h.cf.state.scripts.get("bloom-co")!;
  expect(script.workersDev).toBe(true);
  const bindings = script.metadata.bindings as { name: string; type: string; text?: string }[];
  expect(bindings).toContainEqual({ name: "RESEND_API_KEY", type: "secret_text", text: "re_test_0123456789abcdefghij" });
  expect(bindings).toContainEqual({ name: "FORM_TO_EMAIL", type: "plain_text", text: "dana@inbox-test.dev" });
  expect(script.metadata.assets.config._headers).toContain("Content-Security-Policy");
  expect(Object.keys(script.manifest)).toEqual(expect.arrayContaining(["/index.html", "/es/index.html", "/404.html", "/robots.txt", "/sitemap.xml"]));

  p = (await getProject(h.db, p.id))!;
  expect(p.status).toBe("DEPLOYED");
  expect(p.production_url).toBe("https://cf.mock/__served/bloom-co");
  const dep = await h.db.prepare("SELECT * FROM deployments WHERE id = ?").bind(depId).first<{ status: string; log: string; cloudflare_deployment_id: string }>();
  expect(dep!.status).toBe("succeeded");
  expect(dep!.cloudflare_deployment_id).toMatch(/^deploy-/);
  expect(dep!.log).toContain("Verified");
  // Production build carries the production origin (no preview capability paths).
  const live = await (await h.cf.handle(new Request("https://cf.mock/__served/bloom-co/"))).text();
  expect(live).toContain(`content="${v3.id}:${depId}"`);
  expect(live).not.toContain("/p/ver_");

  await markCompleted(h.ctx, p.id, "owner@example.org");
  expect((await getProject(h.db, p.id))!.status).toBe("COMPLETED");
  const events = await h.db.prepare("SELECT event FROM status_history WHERE project_id = ? ORDER BY id").bind(p.id).all<{ event: string }>();
  expect(events.results.map((e) => e.event)).toEqual(expect.arrayContaining(["REQUEST_CREATED", "PAYMENT_CONFIRMED", "GENERATION_COMPLETED", "REVISION_REQUESTED", "ADMIN_APPROVED", "CLIENT_APPROVED", "DEPLOYMENT_STARTED", "DEPLOYMENT_SUCCEEDED", "COMPLETED"]));
});

test("AI failure keeps the last working version and marks the project failed", async () => {
  const h = harness();
  const p = await toReview(h);
  const v1 = p.current_version_id!;
  const broken: WebsiteAgent = { name: "broken", design: async () => ({}) as never, revise: async () => ({ nonsense: true }) as never, translate: async () => [] };
  await requestRevision(h.ctx, p.id, "Change the colors to green.", "owner@example.org");
  const job = h.take("build") as Extract<Job, { type: "build" }>;
  const r = await runGeneration(h.ctx, broken, job.generationId);
  expect(r).toHaveProperty("failed");
  const after = (await getProject(h.db, p.id))!;
  expect(after.status).toBe("FAILED");
  expect(after.current_version_id).toBe(v1);
  expect((await listVersions(h.db, p.id)).filter((v) => v.build_status === "built")).toHaveLength(1);
  const unread = await h.db.prepare("SELECT COUNT(*) AS n FROM notifications WHERE channel = 'dashboard' AND status = 'unread' AND template = 'admin_alert'").first<{ n: number }>();
  expect(unread!.n).toBe(1);
});

test("deployment failure never reports success and keeps the project deployable", async () => {
  const h = harness();
  let p = await toReview(h);
  await approveVersion(h.ctx, p.id, p.current_version_id!, "owner@example.org", { acceptWarnings: true });
  await markReadyForDeployment(h.ctx, p.id, "owner@example.org");
  const conn = await addConnection(h.ctx, "owner@example.org", { label: "Customer", owner: "customer", accountId: h.cf.accountId, token: h.cf.token });
  await updateDeploySettings(h.ctx, p.id, "owner@example.org", { connectionId: conn.id, scriptName: "fail-test", domain: "", formTo: "dana@inbox-test.dev", formFrom: "forms@bloomco-test.dev", resendKey: "re_test_0123456789abcdefghij" });
  const depId = await startDeployment(h.ctx, p.id, "owner@example.org");
  h.cf.state.failNext = { path: /\/workers\/scripts\/fail-test$/, status: 400, message: "Script validation failed" };
  const r = await runDeployment(h.ctx, depId);
  expect(r).toHaveProperty("failed");
  p = (await getProject(h.db, p.id))!;
  expect(p.status).toBe("READY_FOR_DEPLOYMENT");
  expect(p.production_url).toBeNull();
  expect(p.last_error).toContain("Script validation failed");
  const dep = await h.db.prepare("SELECT status FROM deployments WHERE id = ?").bind(depId).first<{ status: string }>();
  expect(dep!.status).toBe("failed");
});

test("custom domain: attached via the API but only reported live after verification", async () => {
  const h = harness();
  h.cf = createCloudflareMock({ zones: [{ id: "zone-1", name: "bloomco-test.dev", status: "active" }] });
  h.ctx.fetch = ((input: string | Request, init?: RequestInit) => {
    const req = new Request(input, init);
    // The real hostname isn't reachable in tests; it fails like DNS that hasn't propagated yet.
    if (new URL(req.url).hostname === "www.bloomco-test.dev") return Promise.reject(new TypeError("fetch failed"));
    return h.cf.handle(req);
  }) as StudioCtx["fetch"];
  let p = await toReview(h);
  await approveVersion(h.ctx, p.id, p.current_version_id!, "owner@example.org", { acceptWarnings: true });
  await markReadyForDeployment(h.ctx, p.id, "owner@example.org");
  const conn = await addConnection(h.ctx, "owner@example.org", { label: "Customer", owner: "customer", accountId: h.cf.accountId, token: h.cf.token });
  await updateDeploySettings(h.ctx, p.id, "owner@example.org", { connectionId: conn.id, scriptName: "bloom-domain", domain: "www.bloomco-test.dev", formTo: "dana@inbox-test.dev", formFrom: "forms@bloomco-test.dev", resendKey: "re_test_0123456789abcdefghij" });
  const depId = await startDeployment(h.ctx, p.id, "owner@example.org");
  await runDeployment(h.ctx, depId);
  expect(h.cf.state.domains).toEqual([expect.objectContaining({ hostname: "www.bloomco-test.dev", service: "bloom-domain", zone_id: "zone-1", environment: "production" })]);
  p = (await getProject(h.db, p.id))!;
  expect(p.status).toBe("DEPLOYED");
  expect(p.production_url).toBe("https://cf.mock/__served/bloom-domain"); // not the domain yet
  const dep = await h.db.prepare("SELECT dns_status, ssl_status FROM deployments WHERE id = ?").bind(depId).first<{ dns_status: string; ssl_status: string }>();
  expect(dep).toEqual({ dns_status: "pending", ssl_status: "pending" });
  // Live site is built for the real domain (canonical URLs) even before DNS is ready.
  const live = await (await h.cf.handle(new Request("https://cf.mock/__served/bloom-domain/"))).text();
  expect(live).toContain('href="https://www.bloomco-test.dev/"');
  // A later check that still can't reach the domain keeps it pending and re-queues itself.
  const job = h.take("verify_domain") as Extract<Job, { type: "verify_domain" }>;
  await verifyLater(h.ctx, depId, job.attempt, "domain");
  expect(h.jobs.some((j) => j.type === "verify_domain")).toBe(true);
  expect((await getProject(h.db, p.id))!.production_url).not.toContain("bloomco-test.dev");
});

test("preview capability links are bound to the version and the secret", async () => {
  const a = await previewCap("secret-a-0123456789abcdef0123456789abcdef", "ver_abc12345");
  expect(a.startsWith("ver_abc12345.")).toBe(true);
  expect(await previewCap("secret-b-0123456789abcdef0123456789abcdef", "ver_abc12345")).not.toBe(a);
  expect(await previewCap("secret-a-0123456789abcdef0123456789abcdef", "ver_abc12346")).not.toBe(a);
});

test("client review links stop working when a newer version is approved", async () => {
  const h = harness();
  const p = await toReview(h);
  await approveVersion(h.ctx, p.id, p.current_version_id!, "owner@example.org", { acceptWarnings: true });
  const url = await clientReviewUrl(h.ctx, p.id, "ver_someotherversion");
  expect(await readClientToken(h.ctx, url.split("/review/")[1])).toBeNull();
});

test("plain-http links fail the checks, except the site's own origin on a local development host", async () => {
  const { runChecks } = await import("../src/builder/checks");
  const page = (href: string) => ({ "/index.html": { body: `<!doctype html><html lang="en" dir="ltr"><body><main><h1>x</h1><a href="${href}">x</a></main></body></html>`, type: "text/html" } });
  const base = { spec: { pages: [] } as never, palette: {}, languages: ["en"], basePath: "", testimonialsSource: "", briefText: "", requestedPages: [] };
  const insecure = (files: ReturnType<typeof page>, origin?: string) => runChecks({ ...base, files, origin }).some((c) => c.status === "fail" && (c.details ?? "").includes("insecure link"));
  expect(insecure(page("http://example.com/"))).toBe(true);
  expect(insecure(page("http://localhost:8790/about/"), "http://localhost:8790")).toBe(false);
  expect(insecure(page("http://evil.test/"), "http://localhost:8790")).toBe(true);
  expect(insecure(page("http://example.com/x"), "http://example.com")).toBe(true);
  expect(insecure(page("http://127.0.0.1:8792/__served/site/about/"), "http://127.0.0.1:8792/__served/site")).toBe(false);
});
