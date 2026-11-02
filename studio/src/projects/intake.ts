import { CTA_IDS, getPackage, INDUSTRIES, ADD_ONS } from "../../../src/lib/catalog";
import { nowIso, randomId, type Db } from "../db";
import type { StudioCtx } from "./context";
import { notifyCustomer, notifyAdmin } from "./notify";
import { getProject, getProjectByOrder, patchProject, recordEvent, transition, TransitionError, type ProjectRow } from "./store";

/** The website's order record, fetched server-to-server (never from the browser). */
export type WebsiteOrder = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  total: number;
  items: { id: string; name: string; unitPrice: number; quantity: number; total: number }[];
  order: Record<string, unknown> & {
    packageId: string;
    fullName: string;
    email: string;
    phone?: string;
    businessName: string;
    industry: string;
    locale?: string;
    files?: { id: string; name: string; size: number; type: string; kind?: string }[];
  };
};

export type StudioStorage = {
  put(key: string, body: ArrayBuffer | string, contentType: string): Promise<void>;
  get(key: string): Promise<{ body: ArrayBuffer; contentType: string } | null>;
  getText(key: string): Promise<string | null>;
  list(prefix: string): Promise<string[]>;
};

/** Client for the website's private /api/internal endpoints (shared-secret, server-to-server). */
export class WebsiteClient {
  constructor(
    private baseUrl: string,
    private secret: string,
    private fetchFn: typeof fetch = fetch,
  ) {}
  private async call(path: string) {
    if (!this.baseUrl || this.secret.length < 32) throw new Error("WEBSITE_INTERNAL_URL / INTERNAL_SECRET are not configured.");
    const res = await (0, this.fetchFn)(`${this.baseUrl.replace(/\/$/, "")}${path}`, { headers: { "x-internal-secret": this.secret }, signal: AbortSignal.timeout(20_000) });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Website internal API returned ${res.status} for ${path.split("?")[0]}`);
    return res;
  }
  async order(id: string): Promise<WebsiteOrder | null> {
    if (!/^[a-z0-9-]{8,64}$/i.test(id)) return null;
    const res = await this.call(`/api/internal/orders/${encodeURIComponent(id)}`);
    return res ? ((await res.json()) as WebsiteOrder) : null;
  }
  async recentOrders(): Promise<{ id: string; status: string; updatedAt: string }[]> {
    const res = await this.call("/api/internal/orders");
    return res ? ((await res.json()) as { orders: { id: string; status: string; updatedAt: string }[] }).orders : [];
  }
  async file(id: string): Promise<{ body: ArrayBuffer; type: string; name: string } | null> {
    if (!/^[a-f0-9-]{36}$/i.test(id)) return null;
    const res = await this.call(`/api/internal/files/${id}`);
    if (!res) return null;
    return { body: await res.arrayBuffer(), type: res.headers.get("content-type") ?? "application/octet-stream", name: decodeURIComponent(res.headers.get("x-file-name") ?? "file") };
  }
}

const str = (v: unknown, max = 4000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

/**
 * Handles a website order event. The order is always re-fetched from the website, whose payment
 * status is written only by the signature-verified Stripe webhook — so a forged or replayed event
 * can at most cause a harmless re-check.
 */
export async function syncOrder(deps: StudioCtx, orderId: string): Promise<ProjectRow | null> {
  const order = await deps.site.order(orderId);
  if (!order) return null;
  let project = await getProjectByOrder(deps.db, order.id);
  if (!project) project = await createProject(deps, order);
  if (project.payment_status !== order.status) {
    await patchProject(deps.db, project.id, { payment_status: order.status });
    await recordEvent(deps.db, project.id, "PAYMENT_UPDATED", "stripe", { status: order.status });
    project = (await getProject(deps.db, project.id))!;
  }

  if (order.status === "paid" && (project.status === "NEW_REQUEST" || project.status === "AWAITING_PAYMENT")) {
    // Amount check against the catalog-priced order (the webhook already verified Stripe's amount).
    project = await transition(deps.db, project.id, "PAID", "PAYMENT_CONFIRMED", "stripe", {
      details: { amount: order.total },
      patch: { paid_at: nowIso(), amount_cents: Math.round(order.total * 100), payment_status: "paid" },
    });
    await notifyCustomer(deps, project, "payment_received");
    await prepareAndQueue(deps, project.id);
    project = (await getProject(deps.db, project.id))!;
  } else if (order.status === "needs_review" && project.status !== "FAILED") {
    await patchProject(deps.db, project.id, { last_error: "Stripe payment didn't match the order — check it in Stripe before building." });
    await notifyAdmin(deps, project, "admin_alert", "Payment needs review");
  } else if ((order.status === "refunded" || order.status === "partially_refunded") && project.status !== "FAILED") {
    await notifyAdmin(deps, project, "admin_alert", `Order ${order.status.replace("_", " ")}`);
  }
  return project;
}

async function createProject(deps: StudioCtx, order: WebsiteOrder): Promise<ProjectRow> {
  const id = randomId("prj");
  const now = nowIso();
  const o = order.order;
  await deps.db
    .prepare(
      `INSERT INTO projects (id, order_id, status, payment_status, package_id, amount_cents, customer_name, customer_email, customer_phone, business_name,
        industry, locale, order_snapshot, submitted_at, created_at, updated_at)
       VALUES (?, ?, 'AWAITING_PAYMENT', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(order_id) DO NOTHING`,
    )
    .bind(id, order.id, order.status, o.packageId, Math.round(order.total * 100), str(o.fullName, 120), str(o.email, 200), str(o.phone, 40) || null, str(o.businessName, 160), str(o.industry, 40), str(o.locale, 10) || "en", JSON.stringify({ order: o, items: order.items, total: order.total }), order.createdAt, now, now)
    .run();
  const project = (await getProjectByOrder(deps.db, order.id))!;
  if (project.id === id) {
    await recordEvent(deps.db, id, "REQUEST_CREATED", "system", { orderId: order.id }, null, "AWAITING_PAYMENT");
    await notifyCustomer(deps, project, "request_received");
  }
  return project;
}

// ---------------------------------------------------------------- assets

const SAFE_TYPES = /^(image\/(png|jpeg|webp|gif|svg\+xml|avif)|application\/pdf|text\/plain|text\/markdown|application\/(msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|rtf|zip))$/;

export function imageSize(bytes: Uint8Array, mime: string): { width: number; height: number } | null {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  try {
    if (mime === "image/png" && bytes.length > 24) return { width: dv.getUint32(16), height: dv.getUint32(20) };
    if (mime === "image/gif" && bytes.length > 10) return { width: dv.getUint16(6, true), height: dv.getUint16(8, true) };
    if (mime === "image/webp" && bytes.length > 30) {
      const chunk = String.fromCharCode(...bytes.slice(12, 16));
      if (chunk === "VP8X") return { width: 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16)), height: 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16)) };
      if (chunk === "VP8 ") return { width: dv.getUint16(26, true) & 0x3fff, height: dv.getUint16(28, true) & 0x3fff };
      if (chunk === "VP8L") {
        const b = dv.getUint32(21, true);
        return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
      }
    }
    if (mime === "image/jpeg") {
      let i = 2;
      while (i + 9 < bytes.length) {
        if (bytes[i] !== 0xff) return null;
        const marker = bytes[i + 1];
        const len = dv.getUint16(i + 2);
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { width: dv.getUint16(i + 7), height: dv.getUint16(i + 5) };
        i += 2 + len;
      }
    }
  } catch {
    /* malformed header */
  }
  return null;
}

const safeName = (name: string) =>
  name.normalize("NFKC").replace(/[^\p{L}\p{N}._-]+/gu, "-").replace(/^[.-]+/, "").slice(-80).toLowerCase() || "file";

async function copyAssets(deps: StudioCtx, project: ProjectRow) {
  const files = (JSON.parse(project.order_snapshot).order.files ?? []) as { id: string; name: string; kind?: string }[];
  let failed = 0;
  for (const f of files) {
    const exists = await deps.db.prepare("SELECT status FROM project_assets WHERE project_id = ? AND upload_id = ?").bind(project.id, f.id).first<{ status: string }>();
    if (exists?.status === "stored") continue;
    const assetId = randomId("ast", 6);
    const kind = f.kind === "inspiration" ? "inspiration" : "content";
    try {
      const file = await deps.site.file(f.id);
      if (!file) throw new Error("file not found on the website");
      const mime = file.type.split(";")[0].trim().toLowerCase();
      if (!SAFE_TYPES.test(mime)) throw new Error(`unsupported type ${mime}`);
      if (file.body.byteLength > 15 * 1024 * 1024) throw new Error("file too large");
      const bytes = new Uint8Array(file.body);
      const dims = mime.startsWith("image/") ? imageSize(bytes, mime) : null;
      const name = safeName(file.name || f.name);
      const role = kind === "inspiration" ? "inspiration" : !mime.startsWith("image/") ? "document" : /logo|brand|mark|icon/i.test(name) ? "logo" : "photo";
      const key = `projects/${project.id}/assets/${assetId}/${name}`;
      await deps.storage.put(key, file.body, mime);
      await deps.db
        .prepare(
          `INSERT INTO project_assets (id, project_id, upload_id, kind, role, name, mime, size, width, height, r2_key, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'stored', ?)
           ON CONFLICT(project_id, upload_id) DO UPDATE SET r2_key = excluded.r2_key, status = 'stored', error = NULL, mime = excluded.mime, size = excluded.size, width = excluded.width, height = excluded.height`,
        )
        .bind(assetId, project.id, f.id, kind, role, name, mime, file.body.byteLength, dims?.width ?? null, dims?.height ?? null, key, nowIso())
        .run();
    } catch (err) {
      failed++;
      const message = err instanceof Error ? err.message : String(err);
      await deps.db
        .prepare(
          `INSERT INTO project_assets (id, project_id, upload_id, kind, role, name, mime, size, status, error, created_at)
           VALUES (?, ?, ?, ?, 'document', ?, 'application/octet-stream', 0, 'failed', ?, ?)
           ON CONFLICT(project_id, upload_id) DO UPDATE SET status = 'failed', error = excluded.error`,
        )
        .bind(assetId, project.id, f.id, kind, safeName(f.name), message.slice(0, 200), nowIso())
        .run();
      deps.log.warn("asset.copy_failed", { projectId: project.id, uploadId: f.id, message });
    }
  }
  return { failed };
}

export type AssetRow = { id: string; kind: string; role: string; name: string; mime: string; size: number; width: number | null; height: number | null; r2_key: string | null; status: string; error: string | null };
export const listAssets = (db: Db, projectId: string) =>
  db.prepare("SELECT id, kind, role, name, mime, size, width, height, r2_key, status, error FROM project_assets WHERE project_id = ? ORDER BY kind, created_at").bind(projectId).all<AssetRow>().then((r) => r.results);

// ---------------------------------------------------------------- brief

export type Brief = ReturnType<typeof buildBrief>["brief"];
export type MissingInfo = { field: string; severity: "info" | "warning"; message: string };

const CTA_LABEL: Record<string, string> = {
  book: "Book an appointment", quote: "Request a quote", order: "Order online", shop: "Shop products",
  consult: "Schedule a consultation", contact: "Contact us", call: "Call us", visit: "Visit in person",
};

export function buildBrief(snapshot: { order: Record<string, unknown>; items: { id: string; name: string }[] }, assets: AssetRow[]) {
  const o = snapshot.order;
  const pkg = getPackage(str(o.packageId));
  const features = list(o.features);
  const addOns = snapshot.items.map((i) => i.id).filter((id) => id !== o.packageId);
  const has = (feature: string, addOn?: string) => features.includes(feature) || (addOn ? addOns.includes(addOn) : false);
  const brief = {
    business: {
      name: str(o.businessName, 160),
      industry: INDUSTRIES[str(o.industry) as keyof typeof INDUSTRIES] ?? str(o.industry),
      description: str(o.businessDescription, 2000),
      location: str(o.location, 160),
      phone: str(o.phone, 40),
      existingWebsite: str(o.currentWebsite, 300),
      social: str(o.social, 500),
      publicContact: str(o.contactInfo, 1000),
    },
    goals: {
      purpose: str(o.goals, 2000),
      audience: str(o.audience, 1000),
      primaryCta: CTA_IDS.includes(str(o.primaryCta) as (typeof CTA_IDS)[number]) ? CTA_LABEL[str(o.primaryCta)] : "Contact us",
      primaryCtaId: str(o.primaryCta) || "contact",
      desiredActions: str(o.desiredActions, 500),
    },
    package: { id: pkg?.id ?? str(o.packageId), name: pkg?.name ?? str(o.packageId), pageLimit: pkg?.pageLimit ?? 3 },
    pages: list(o.pages).slice(0, 32),
    design: {
      direction: str(o.style, 40),
      personality: str(o.personality, 300),
      colors: str(o.colorNotes, 300),
      colorsAvoid: str(o.colorsAvoid, 200),
      fonts: str(o.fonts, 200),
      sitesLiked: str(o.inspiration, 1000),
      dislikes: str(o.dislikes, 1000),
      notes: str(o.designNotes, 2000),
    },
    functionality: {
      features,
      addOns: addOns.map((id) => ADD_ONS.find((a) => a.id === id)?.name ?? id),
      other: str(o.featuresOther, 500),
      toolLinks: str(o.toolLinks, 1000),
    },
    content: {
      about: str(o.aboutText), services: str(o.servicesText), products: str(o.productsText), pricing: str(o.pricingText, 3000),
      testimonials: str(o.testimonialsText, 3000), faq: str(o.faqText, 3000), assetNotes: str(o.assetNotes, 1000),
    },
    languages: list(o.languages).length ? list(o.languages) : ["en"],
    launchDate: str(o.launchDate, 40),
    hasDomain: str(o.hasDomain, 10),
    assets: assets.filter((a) => a.status === "stored").map((a) => ({ id: a.id, role: a.role, name: a.name, mime: a.mime, width: a.width, height: a.height })),
  };

  const missing: MissingInfo[] = [];
  const add = (field: string, severity: MissingInfo["severity"], message: string) => missing.push({ field, severity, message });
  if (!brief.assets.some((a) => a.role === "logo")) add("logo", "warning", "No logo found (no file name mentions logo) — the site will use a text wordmark until one is provided.");
  if (!brief.assets.some((a) => a.role === "photo")) add("photos", "warning", "No photos uploaded — the design will rely on typography and color; add photos for a stronger result.");
  if (assets.some((a) => a.status === "failed")) add("files", "warning", `${assets.filter((a) => a.status === "failed").length} uploaded file(s) could not be copied — retry from the project page.`);
  if (!brief.business.description) add("description", "warning", "No business description (older order) — the AI will rely on the goals text.");
  if (!brief.business.location) add("location", "info", "No location given — local SEO and contact details will be limited.");
  if (has("booking", "booking") && !/https?:\/\//.test(brief.functionality.toolLinks)) add("booking", "warning", "Booking requested but no booking tool link — the site will use a booking request form that emails the business.");
  if ((has("ecommerce", "ecommerce") || has("ordering") || has("payments") || has("deposits")) && !/https?:\/\//.test(brief.functionality.toolLinks))
    add("commerce", "warning", "Online store/ordering/payments requested but no store or payment link — the site links to a request form until the customer provides their Shopify/Square/Stripe link.");
  if (has("accounts")) add("accounts", "warning", "Customer accounts requested — static sites can't host accounts; link to the customer's booking/store platform account pages instead.");
  if (brief.pages.some((p) => /testimonial|review/i.test(p)) && !brief.content.testimonials) add("testimonials", "warning", "A testimonials page was requested but no real reviews were provided — that section is omitted (we never invent testimonials).");
  if (!brief.content.about && !addOns.includes("copywriting")) add("copy", "info", "No About text and no copywriting add-on — the AI drafts text from the brief; confirm facts with the customer.");
  if (!brief.business.publicContact && !brief.business.phone) add("contact", "warning", "No public contact details (address/hours/phone) to show on the site.");
  if (brief.hasDomain !== "yes") add("domain", "info", "Customer may not own a domain yet — needed before connecting a custom domain.");
  if (brief.languages.length > 1) add("translations", "info", `${brief.languages.length - 1} extra language(s) — machine-assisted translations need native-speaker review.`);
  add("forms", "info", "Before deployment: set the email address that receives form submissions and the customer's email-sending key (Resend).");
  return { brief, missing };
}

async function prepareAndQueue(deps: StudioCtx, projectId: string) {
  const project = (await getProject(deps.db, projectId))!;
  const copy = await copyAssets(deps, project);
  const assets = await listAssets(deps.db, projectId);
  const { brief, missing } = buildBrief(JSON.parse(project.order_snapshot), assets);
  await patchProject(deps.db, projectId, { brief: JSON.stringify(brief), missing_info: JSON.stringify(missing), last_error: copy.failed ? `${copy.failed} file(s) could not be copied` : null });
  const p = (await getProject(deps.db, projectId))!;
  if (!deps.aiBuilds) {
    // Orders-only mode: everything the customer sent is ready in the dashboard; the studio takes it from here.
    await notifyAdmin(deps, p, "new_order", `New paid order: ${p.business_name} (${p.package_id})`);
    return;
  }
  await queueGeneration(deps, projectId, "initial", "system");
  await notifyCustomer(deps, (await getProject(deps.db, projectId))!, "project_started");
}

/** Queues an AI build. Only paid projects can be built. */
export async function queueGeneration(deps: StudioCtx, projectId: string, kind: "initial" | "revision", actor: string, opts: { revisionId?: string; baseVersionId?: string } = {}) {
  if (!deps.aiBuilds) throw new TransitionError("The AI website builder is turned off (AI_BUILDS).");
  const p = (await getProject(deps.db, projectId))!;
  if (p.payment_status !== "paid") throw new Error("AI generation only starts after payment is confirmed.");
  const id = randomId("gen");
  await deps.db
    .prepare("INSERT INTO ai_generations (id, project_id, kind, revision_id, base_version_id, status, created_at) VALUES (?, ?, ?, ?, ?, 'queued', ?)")
    .bind(id, projectId, kind, opts.revisionId ?? null, opts.baseVersionId ?? null, nowIso())
    .run();
  const to = kind === "initial" ? "QUEUED_FOR_AI" : "AI_REVISING";
  await transition(deps.db, projectId, to, kind === "initial" ? "AI_QUEUED" : "REVISION_REQUESTED", actor, { details: { generationId: id, revisionId: opts.revisionId }, patch: { ai_status: "queued" } });
  await deps.jobs.send({ type: "build", generationId: id });
  return id;
}

/** Queues a re-sync of one website order (the job re-fetches it; event payloads are never trusted). */
export async function enqueueOrderEvent(deps: Pick<StudioCtx, "jobs">, orderId: string) {
  await deps.jobs.send({ type: "order_event", orderId });
}

/** Re-checks recent website orders so a missed event never strands a paid customer. */
export async function reconcileOrders(deps: StudioCtx) {
  const orders = await deps.site.recentOrders();
  let synced = 0;
  for (const o of orders) {
    const p = await getProjectByOrder(deps.db, o.id);
    if (!p || p.payment_status !== o.status) {
      await syncOrder(deps, o.id);
      synced++;
    }
  }
  return { checked: orders.length, synced };
}

/** Retries copying files that failed and refreshes the brief. */
export async function retryAssets(deps: StudioCtx, projectId: string) {
  const project = (await getProject(deps.db, projectId))!;
  const copy = await copyAssets(deps, project);
  const assets = await listAssets(deps.db, projectId);
  const { brief, missing } = buildBrief(JSON.parse(project.order_snapshot), assets);
  await patchProject(deps.db, projectId, { brief: JSON.stringify(brief), missing_info: JSON.stringify(missing), last_error: copy.failed ? `${copy.failed} file(s) could not be copied` : null });
  return copy;
}
