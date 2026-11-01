import { decryptSecret } from "../crypto";
import { nowIso, parseJson, randomId } from "../db";
import { buildFiles, loadBundle } from "../builder/pipeline";
import { overallStatus } from "../builder/checks";
import { HEADERS_FILE } from "../builder/render";
import { slugify } from "../builder/spec";
import type { StudioCtx } from "../projects/context";
import { notifyAdmin, notifyCustomer } from "../projects/notify";
import { getProject, getVersion, patchProject, recordEvent, transition, type ProjectRow } from "../projects/store";
import { CloudflareClient, CloudflareError, workersDevUrl } from "./cloudflare";
import { SITE_WORKER } from "./site-worker";

export type DeploymentRow = {
  id: string;
  project_id: string;
  version_id: string;
  connection_id: string;
  script_name: string;
  status: string;
  cloudflare_deployment_id: string | null;
  workers_dev_url: string | null;
  domain: string | null;
  production_url: string | null;
  dns_status: string;
  ssl_status: string;
  log: string;
  error: string | null;
  admin: string;
  attempts: number;
  started_at: string;
  finished_at: string | null;
};

type Connection = { id: string; account_id: string; token_cipher: string; status: string; workers_subdomain: string | null; owner: string; label: string };

const OFFICIAL_API = "https://api.cloudflare.com/client/v4";

export const validScriptName = (s: string) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(s);
export const defaultScriptName = (p: Pick<ProjectRow, "business_name" | "id">) => `${slugify(p.business_name).slice(0, 40) || "site"}-${p.id.slice(4, 10)}`.replace(/-+/g, "-");
export const validHostname = (h: string) => /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(h);

export async function client(ctx: StudioCtx, connectionId: string) {
  const conn = await ctx.db.prepare("SELECT * FROM cloudflare_connections WHERE id = ?").bind(connectionId).first<Connection>();
  if (!conn) throw new Error("Cloudflare connection not found.");
  const token = await decryptSecret(ctx.encryptionKey, conn.token_cipher);
  return { conn, cf: new CloudflareClient(token, conn.account_id, ctx.cloudflareApi, ctx.fetch as typeof fetch) };
}

/** Where to check a deployment. In development against a local mock API, the mock serves the site itself. */
function liveUrl(ctx: StudioCtx, script: string, subdomain: string) {
  return ctx.cloudflareApi === OFFICIAL_API ? workersDevUrl(script, subdomain) : `${ctx.cloudflareApi.replace(/\/client\/v4$/, "")}/__served/${script}`;
}

export type PreflightItem = { label: string; ok: boolean; detail: string; blocking: boolean };

/** Everything that must be true before DEPLOY is allowed, shown to the admin before they click. */
export async function preflight(ctx: StudioCtx, p: ProjectRow): Promise<PreflightItem[]> {
  const items: PreflightItem[] = [];
  const v = p.approved_version_id ? await getVersion(ctx.db, p.approved_version_id) : null;
  items.push({ label: "Project approved", ok: ["READY_FOR_DEPLOYMENT", "DEPLOYED", "COMPLETED", "FAILED"].includes(p.status) && !!v, detail: STATUS_DETAIL(p), blocking: true });
  items.push({ label: "Approved version", ok: !!v && v.approval_status === "approved", detail: v ? `Version ${v.number} — approved by ${v.approved_by ?? "?"}` : "No approved version", blocking: true });
  items.push({ label: "Build and checks", ok: !!v && v.build_status === "built" && v.checks_status !== "failed", detail: v ? `Build ${v.build_status}, checks ${v.checks_status}` : "—", blocking: true });
  const conn = p.cloudflare_connection_id ? await ctx.db.prepare("SELECT * FROM cloudflare_connections WHERE id = ?").bind(p.cloudflare_connection_id).first<Connection>() : null;
  items.push({ label: "Cloudflare account", ok: conn?.status === "verified", detail: conn ? `${conn.label} (${conn.owner === "customer" ? "customer-owned" : "Maison"} account) — ${conn.status}` : "Choose a verified connection", blocking: true });
  items.push({ label: "Worker name", ok: !!p.script_name && validScriptName(p.script_name), detail: p.script_name ?? "—", blocking: true });
  const bundle = v ? await loadBundle(ctx, v.id).catch(() => null) : null;
  const hasForms = !!bundle?.specs[bundle.languages[0]]?.pages.some((pg) => pg.sections.some((s) => s.type === "contact" && s.form !== "none"));
  items.push({
    label: "Form email (RESEND_API_KEY, FORM_TO_EMAIL, FORM_FROM_EMAIL)",
    ok: !hasForms || (!!p.resend_key_cipher && !!p.form_to_email && !!p.form_from_email),
    detail: hasForms ? (p.form_to_email ? `Messages go to ${p.form_to_email}` : "The site has forms — set where messages are delivered") : "No forms on this site",
    blocking: hasForms,
  });
  items.push({ label: "Custom domain", ok: true, detail: p.domain ? `${p.domain} (must be a zone in the selected Cloudflare account)` : "None — the site will be live on its workers.dev address", blocking: false });
  return items;
}

const STATUS_DETAIL = (p: ProjectRow) => `Project status: ${p.status.replace(/_/g, " ").toLowerCase()}`;

/** Admin clicked DEPLOY. Verifies everything server-side, then queues the deployment. */
export async function startDeployment(ctx: StudioCtx, projectId: string, admin: string): Promise<string> {
  const p = await getProject(ctx.db, projectId);
  if (!p) throw new Error("Project not found.");
  const checks = await preflight(ctx, p);
  const blockers = checks.filter((c) => c.blocking && !c.ok);
  if (blockers.length) throw new Error(`Can't deploy yet: ${blockers.map((b) => b.label).join(", ")}.`);
  const running = await ctx.db.prepare("SELECT id FROM deployments WHERE project_id = ? AND status IN ('queued','uploading','verifying')").bind(projectId).first();
  if (running) throw new Error("A deployment is already in progress.");
  const id = randomId("dep");
  await ctx.db
    .prepare("INSERT INTO deployments (id, project_id, version_id, connection_id, script_name, status, domain, admin, started_at) VALUES (?, ?, ?, ?, ?, 'queued', ?, ?, ?)")
    .bind(id, projectId, p.approved_version_id, p.cloudflare_connection_id, p.script_name, p.domain, admin, nowIso())
    .run();
  await transition(ctx.db, projectId, "DEPLOYING", "DEPLOYMENT_STARTED", admin, { details: { deploymentId: id, versionId: p.approved_version_id }, patch: { deployment_status: "deploying" } });
  await ctx.jobs.send({ type: "deploy", deploymentId: id });
  return id;
}

async function appendLog(ctx: StudioCtx, id: string, message: string) {
  const row = await ctx.db.prepare("SELECT log FROM deployments WHERE id = ?").bind(id).first<{ log: string }>();
  const log = parseJson<{ at: string; message: string }[]>(row?.log ?? "[]", []);
  log.push({ at: nowIso(), message: message.slice(0, 500) });
  await ctx.db.prepare("UPDATE deployments SET log = ? WHERE id = ?").bind(JSON.stringify(log.slice(-60)), id).run();
}

const setDep = (ctx: StudioCtx, id: string, patch: Record<string, unknown>) => {
  const keys = Object.keys(patch);
  return ctx.db.prepare(`UPDATE deployments SET ${keys.map((k) => `${k} = ?`).join(", ")} WHERE id = ?`).bind(...keys.map((k) => patch[k] ?? null), id).run();
};

/** Fetches the live URL and confirms it serves this exact build (looks for the build marker). */
export async function servesBuild(ctx: StudioCtx, url: string, marker: string): Promise<{ ok: boolean; detail: string }> {
  try {
    const res = await ctx.fetch(url, { headers: { "User-Agent": "MaisonStudioDeployCheck/1.0", "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` };
    const html = await res.text();
    return html.includes(`content="${marker}"`) ? { ok: true, detail: "Live page serves this build" } : { ok: false, detail: "Page loads but still serves an older build" };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : "unreachable" };
  }
}

/** The deploy job: production build → checks → upload → domain → verification. */
export async function runDeployment(ctx: StudioCtx, deploymentId: string) {
  const dep = await ctx.db.prepare("SELECT * FROM deployments WHERE id = ?").bind(deploymentId).first<DeploymentRow>();
  if (!dep || !["queued", "uploading"].includes(dep.status)) return { skipped: true };
  const p = (await getProject(ctx.db, dep.project_id))!;
  const log = (m: string) => appendLog(ctx, deploymentId, m);
  await setDep(ctx, deploymentId, { status: "uploading", attempts: dep.attempts + 1 });
  try {
    const v = await getVersion(ctx.db, dep.version_id);
    if (!v || v.approval_status !== "approved") throw new Error("The selected version is no longer approved.");
    const { conn, cf } = await client(ctx, dep.connection_id);
    const subdomain = conn.workers_subdomain ?? (await cf.subdomain());
    if (!subdomain) throw new Error("This Cloudflare account has no workers.dev subdomain. Open Workers & Pages in the Cloudflare dashboard once, then retry.");
    const devUrl = liveUrl(ctx, dep.script_name, subdomain);
    const origin = dep.domain ? `https://${dep.domain}` : devUrl;
    const marker = `${v.id}:${deploymentId}`;

    await log(`Preparing production build of version ${v.number} for ${origin}`);
    const bundle = await loadBundle(ctx, v.id);
    const { files, checks } = await buildFiles(ctx, p.id, bundle, { origin, basePath: "", marker });
    if (overallStatus(checks) === "failed") throw new Error(`Production build failed quality checks: ${checks.filter((c) => c.status === "fail").map((c) => c.id).join(", ")}`);
    await log(`Production build ready: ${Object.keys(files).length} files, checks ${overallStatus(checks)}.`);

    const enc = new TextEncoder();
    const upload = Object.fromEntries(Object.entries(files).map(([path, f]) => [path, { bytes: typeof f.body === "string" ? enc.encode(f.body) : f.body, type: f.type }]));
    const jwt = await cf.uploadAssets(dep.script_name, upload, (m) => void log(m));
    await log("Static files uploaded.");

    const secrets: Record<string, string> = {};
    if (p.resend_key_cipher) secrets.RESEND_API_KEY = await decryptSecret(ctx.encryptionKey, p.resend_key_cipher);
    const vars: Record<string, string> = {};
    if (p.form_to_email) vars.FORM_TO_EMAIL = p.form_to_email;
    if (p.form_from_email) vars.FORM_FROM_EMAIL = p.form_from_email;
    const script = await cf.putScript(dep.script_name, { moduleCode: SITE_WORKER, assetsJwt: jwt, headers: HEADERS_FILE, vars, secrets, compatibilityDate: "2026-10-01" });
    await setDep(ctx, deploymentId, { cloudflare_deployment_id: script.id ?? script.etag, workers_dev_url: devUrl });
    await log(`Worker "${dep.script_name}" deployed (Cloudflare id ${script.id ?? script.etag ?? "n/a"}).`);
    await cf.enableWorkersDev(dep.script_name);

    if (dep.domain) {
      const zone = await cf.findZone(dep.domain);
      if (!zone) {
        await setDep(ctx, deploymentId, { dns_status: "failed", ssl_status: "not_configured" });
        await log(`Domain ${dep.domain} isn't a zone in this Cloudflare account. Customer action: add the domain to Cloudflare (Add a site) and update the nameservers at the registrar, then retry.`);
      } else {
        await cf.attachDomain(dep.domain, dep.script_name, zone.id);
        await setDep(ctx, deploymentId, { dns_status: "pending", ssl_status: "pending" });
        await log(`Custom domain ${dep.domain} attached (zone ${zone.name}, status ${zone.status}). Waiting for DNS and SSL…`);
      }
    }

    // Verify the workers.dev deployment really serves this build before calling it a success.
    await setDep(ctx, deploymentId, { status: "verifying" });
    let check = { ok: false, detail: "" };
    for (let i = 0; i < 6 && !check.ok; i++) {
      if (i) await new Promise((r) => setTimeout(r, 5000));
      check = await servesBuild(ctx, `${devUrl}/`, marker);
    }
    if (!check.ok) {
      await log(`Not live yet at ${devUrl} (${check.detail}); checking again shortly.`);
      await ctx.jobs.send({ type: "verify_deployment", deploymentId, attempt: 1 });
      return { verifying: true };
    }
    await log(`Verified: ${devUrl} serves this build.`);
    await finishSuccess(ctx, deploymentId);
    return { ok: true };
  } catch (err) {
    const message = (err instanceof Error ? err.message : String(err)).slice(0, 500);
    const retry = err instanceof CloudflareError && err.retryable && dep.attempts + 1 < 3;
    await log(`${retry ? "Temporary error, retrying" : "Deployment failed"}: ${message}`);
    if (retry) {
      await setDep(ctx, deploymentId, { status: "queued", error: message });
      throw err;
    }
    await failDeployment(ctx, deploymentId, message);
    return { failed: message };
  }
}

async function finishSuccess(ctx: StudioCtx, deploymentId: string) {
  const dep = (await ctx.db.prepare("SELECT * FROM deployments WHERE id = ?").bind(deploymentId).first<DeploymentRow>())!;
  const marker = `${dep.version_id}:${dep.id}`;
  let production = dep.workers_dev_url;
  if (dep.domain && dep.dns_status === "pending") {
    const live = await servesBuild(ctx, `https://${dep.domain}/`, marker);
    if (live.ok) {
      await setDep(ctx, deploymentId, { dns_status: "verified", ssl_status: "verified" });
      production = `https://${dep.domain}`;
    } else {
      await ctx.jobs.send({ type: "verify_domain", deploymentId, attempt: 1 });
    }
  }
  await setDep(ctx, deploymentId, { status: "succeeded", production_url: production, finished_at: nowIso(), error: null });
  const p = await transition(ctx.db, dep.project_id, "DEPLOYED", "DEPLOYMENT_SUCCEEDED", dep.admin, {
    details: { deploymentId, url: production },
    patch: { deployment_status: "succeeded", production_url: production, last_error: null },
  });
  if (!dep.domain || production?.startsWith("https://" + dep.domain)) await notifyCustomer(ctx, p, "deployed", { url: production ?? "", dedupe: deploymentId });
}

async function failDeployment(ctx: StudioCtx, deploymentId: string, message: string) {
  const dep = (await ctx.db.prepare("SELECT * FROM deployments WHERE id = ?").bind(deploymentId).first<DeploymentRow>())!;
  await setDep(ctx, deploymentId, { status: "failed", error: message, finished_at: nowIso() });
  const p = (await getProject(ctx.db, dep.project_id))!;
  // A failed deploy never removes what's already live; the project goes back to "ready" (or stays deployed).
  const back = p.production_url ? "DEPLOYED" : "READY_FOR_DEPLOYMENT";
  if (p.status === "DEPLOYING") await transition(ctx.db, p.id, back, "DEPLOYMENT_FAILED", dep.admin, { details: { deploymentId, message }, patch: { deployment_status: "failed", last_error: `Deployment failed: ${message}` } });
  else await recordEvent(ctx.db, p.id, "DEPLOYMENT_FAILED", dep.admin, { deploymentId, message });
  await notifyAdmin(ctx, p, "admin_alert", `Deployment failed for ${p.business_name}: ${message.slice(0, 120)}`);
}

/** Follow-up checks (queue, with delays) for a deployment that wasn't live immediately. */
export async function verifyLater(ctx: StudioCtx, deploymentId: string, attempt: number, kind: "deployment" | "domain") {
  const dep = await ctx.db.prepare("SELECT * FROM deployments WHERE id = ?").bind(deploymentId).first<DeploymentRow>();
  if (!dep) return;
  const marker = `${dep.version_id}:${dep.id}`;
  if (kind === "deployment") {
    if (dep.status !== "verifying") return;
    const r = await servesBuild(ctx, `${dep.workers_dev_url}/`, marker);
    if (r.ok) {
      await appendLog(ctx, deploymentId, `Verified: ${dep.workers_dev_url} serves this build.`);
      return finishSuccess(ctx, deploymentId);
    }
    if (attempt >= 10) return failDeployment(ctx, deploymentId, `Deployment uploaded but not serving the new build after ${attempt} checks (${r.detail}).`);
    await ctx.jobs.send({ type: "verify_deployment", deploymentId, attempt: attempt + 1 }, 60);
    return;
  }
  if (dep.dns_status !== "pending") return;
  const r = await servesBuild(ctx, `https://${dep.domain}/`, marker);
  if (r.ok) {
    await setDep(ctx, deploymentId, { dns_status: "verified", ssl_status: "verified", production_url: `https://${dep.domain}` });
    await appendLog(ctx, deploymentId, `Verified: https://${dep.domain} serves this build over HTTPS.`);
    await patchProject(ctx.db, dep.project_id, { production_url: `https://${dep.domain}` });
    await recordEvent(ctx.db, dep.project_id, "DEPLOYMENT_SUCCEEDED", "system", { deploymentId, domainVerified: dep.domain });
    const p = (await getProject(ctx.db, dep.project_id))!;
    await notifyCustomer(ctx, p, "deployed", { url: `https://${dep.domain}`, dedupe: `${deploymentId}:domain` });
    return;
  }
  if (attempt >= 288) {
    await setDep(ctx, deploymentId, { dns_status: "failed", ssl_status: "failed" });
    await appendLog(ctx, deploymentId, `Domain still not serving the site after 24 hours (${r.detail}). Check the zone's nameservers and DNS records in Cloudflare.`);
    return;
  }
  await appendLog(ctx, deploymentId, `Domain check ${attempt}: ${r.detail}`);
  await ctx.jobs.send({ type: "verify_domain", deploymentId, attempt: attempt + 1 }, 300);
}
