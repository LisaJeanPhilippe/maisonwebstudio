import { nowIso, parseJson, randomId } from "../db";
import { signToken } from "../email/compose";
import type { StudioCtx } from "../projects/context";
import { listAssets, type AssetRow, type MissingInfo } from "../projects/intake";
import { notifyAdmin } from "../projects/notify";
import { getProject, getVersion, patchProject, recordEvent, transition, type VersionRow } from "../projects/store";
import { applyStrings, extractStrings, type AgentImage, type WebsiteAgent } from "./agent";
import { overallStatus, runChecks } from "./checks";
import { renderSite, type RenderAsset, type SiteFile } from "./render";
import { normalizeSpec, siteSpecSchema, type SiteSpec } from "./spec";
import { isSiteLocale, SITE_LOCALES, type SiteLocale } from "./ui-strings";

type Generation = {
  id: string;
  project_id: string;
  kind: "initial" | "revision";
  revision_id: string | null;
  base_version_id: string | null;
  version_id: string | null;
  status: string;
  stage: string;
  progress: string;
  attempts: number;
};

export type SiteBundle = { languages: SiteLocale[]; specs: Partial<Record<SiteLocale, SiteSpec>>; fixes: string[] };

const encoder = new TextEncoder();

/** Capability path segment for a version preview: unguessable, tied to APP_SECRET, revocable by rotating it. */
export async function previewCap(secret: string, versionId: string) {
  const sig = (await signToken(secret || "dev-only-secret-change-me", "preview", { v: versionId })).split(".")[1];
  return `${versionId}.${sig}`;
}

export const previewPath = async (ctx: Pick<StudioCtx, "config">, versionId: string) => `/p/${await previewCap(ctx.config.appSecret, versionId)}`;

export async function loadRenderAssets(ctx: StudioCtx, assets: AssetRow[]): Promise<RenderAsset[]> {
  const out: RenderAsset[] = [];
  for (const a of assets) {
    if (a.status !== "stored" || !a.r2_key || a.role === "inspiration" || a.role === "document") continue;
    const obj = await ctx.storage.get(a.r2_key);
    out.push({ id: a.id, role: a.role, name: a.name, mime: a.mime, width: a.width, height: a.height, bytes: obj ? new Uint8Array(obj.body) : null });
  }
  return out;
}

async function agentInputs(ctx: StudioCtx, projectId: string) {
  const project = (await getProject(ctx.db, projectId))!;
  const assets = await listAssets(ctx.db, projectId);
  const images: AgentImage[] = [];
  const documents: { id: string; name: string; bytes: Uint8Array }[] = [];
  for (const a of assets) {
    if (a.status !== "stored" || !a.r2_key) continue;
    if (a.mime.startsWith("image/") && a.mime !== "image/svg+xml") {
      const obj = await ctx.storage.get(a.r2_key);
      if (obj) images.push({ id: a.id, role: a.role, name: a.name, mime: a.mime, width: a.width, height: a.height, bytes: new Uint8Array(obj.body) });
    } else if (a.kind === "inspiration" && a.mime === "application/pdf") {
      const obj = await ctx.storage.get(a.r2_key);
      if (obj) documents.push({ id: a.id, name: a.name, bytes: new Uint8Array(obj.body) });
    }
  }
  // Inspiration first, then content photos, so the agent sees the design references.
  images.sort((x, y) => Number(y.role === "inspiration") - Number(x.role === "inspiration"));
  const brief = parseJson<Record<string, unknown>>(project.brief, {});
  const assetList = assets.filter((a) => a.status === "stored").map((a) => ({ id: a.id, role: a.role, name: a.name, width: a.width, height: a.height }));
  return { project, assets, images, documents, brief, assetList };
}

export function allowedLinks(brief: Record<string, unknown>): string[] {
  const text = JSON.stringify((brief as { functionality?: unknown }).functionality ?? {}) + JSON.stringify((brief as { business?: unknown }).business ?? {});
  return [...new Set((text.match(/https:\/\/[^\s"'<>\\]+/g) ?? []).map((u) => u.replace(/[),.]+$/, "")))];
}

/**
 * Runs (or resumes) one AI generation: design → translations → render → checks → version.
 * Each stage is checkpointed, so a timeout or retry continues where it stopped. A failure never
 * touches the project's last working version.
 */
export async function runGeneration(ctx: StudioCtx, agent: WebsiteAgent, generationId: string) {
  const gen = await ctx.db.prepare("SELECT * FROM ai_generations WHERE id = ?").bind(generationId).first<Generation>();
  if (!gen || gen.status === "succeeded") return { skipped: true };
  const progress = parseJson<{ bundleKey?: string; translated?: string[] }>(gen.progress, {});
  const setGen = (patch: Record<string, unknown>) => {
    const keys = Object.keys(patch);
    return ctx.db.prepare(`UPDATE ai_generations SET ${keys.map((k) => `${k} = ?`).join(", ")} WHERE id = ?`).bind(...keys.map((k) => patch[k]), generationId).run();
  };
  await setGen({ status: "running", attempts: gen.attempts + 1, started_at: nowIso(), model: agent.name === "claude" ? ctx.config.aiModel : agent.name });
  const project = (await getProject(ctx.db, gen.project_id))!;
  if (project.payment_status !== "paid") {
    await setGen({ status: "failed", error: "Project is not paid.", finished_at: nowIso() });
    return { skipped: true };
  }
  if (gen.kind === "initial" && project.status === "QUEUED_FOR_AI") {
    await transition(ctx.db, project.id, "AI_BUILDING", "GENERATION_STARTED", "ai-agent", { details: { generationId }, patch: { ai_status: "building" } });
  } else {
    await patchProject(ctx.db, project.id, { ai_status: "building" });
    await recordEvent(ctx.db, project.id, "GENERATION_STARTED", "ai-agent", { generationId, kind: gen.kind });
  }

  try {
    const input = await agentInputs(ctx, gen.project_id);
    const languages = ((input.brief.languages as string[] | undefined) ?? ["en"]).filter(isSiteLocale);
    const langs: SiteLocale[] = languages.length ? languages : ["en"];
    const ids = new Set(input.assets.filter((a) => a.status === "stored" && a.role !== "inspiration").map((a) => a.id));
    const links = allowedLinks(input.brief);

    // 1. Design (or revise)
    let bundle: SiteBundle;
    const bundleKey = `projects/${gen.project_id}/generations/${generationId}/bundle.json`;
    if (progress.bundleKey) bundle = JSON.parse((await ctx.storage.getText(progress.bundleKey)) ?? "null");
    else {
      await setGen({ stage: "design" });
      let raw: SiteSpec;
      if (gen.kind === "revision") {
        const base = await loadBundle(ctx, gen.base_version_id!);
        const rev = await ctx.db.prepare("SELECT instruction FROM revision_requests WHERE id = ?").bind(gen.revision_id).first<{ instruction: string }>();
        const history = (await ctx.db.prepare("SELECT instruction FROM revision_requests WHERE project_id = ? AND status = 'completed' ORDER BY created_at").bind(gen.project_id).all<{ instruction: string }>()).results.map((r) => r.instruction);
        await ctx.db.prepare("UPDATE revision_requests SET status = 'in_progress' WHERE id = ?").bind(gen.revision_id).run();
        raw = await agent.revise({ ...input, current: base.specs[base.languages[0]]!, instruction: rev?.instruction ?? "", history: history.slice(-8) });
      } else {
        raw = await agent.design(input);
      }
      const parsed = siteSpecSchema.parse(raw);
      const { spec, fixes } = normalizeSpec(parsed, ids, links);
      bundle = { languages: langs, specs: { [langs[0]]: spec }, fixes };
      await ctx.storage.put(bundleKey, JSON.stringify(bundle), "application/json");
      await setGen({ progress: JSON.stringify({ ...progress, bundleKey }) });
      progress.bundleKey = bundleKey;
    }

    // 2. Translations (one language at a time, checkpointed)
    const def = bundle.languages[0];
    for (const lang of bundle.languages.slice(1)) {
      if (bundle.specs[lang]) continue;
      await setGen({ stage: `translate:${lang}` });
      const source = bundle.specs[def]!;
      const items = await agent.translate({ strings: extractStrings(source), language: SITE_LOCALES[lang].name, businessName: source.siteName });
      bundle.specs[lang] = applyStrings(source, items);
      await ctx.storage.put(bundleKey, JSON.stringify(bundle), "application/json");
    }

    // 3. Render the preview build and store it as a new version
    await setGen({ stage: "render" });
    const version = await createVersion(ctx, gen.project_id, bundle, {
      label: gen.kind === "initial" ? "Initial generation" : "Revision",
      revisionId: gen.revision_id,
      parent: gen.base_version_id,
      createdBy: "ai-agent",
    });
    await setGen({ version_id: version.id, stage: "done", status: "succeeded", finished_at: nowIso() });

    // 4. Project → READY_FOR_REVIEW (an admin must review; the agent cannot approve)
    if (gen.kind === "revision") {
      await ctx.db.prepare("UPDATE revision_requests SET status = 'completed', result_version_id = ?, completed_at = ? WHERE id = ?").bind(version.id, nowIso(), gen.revision_id).run();
      await recordEvent(ctx.db, project.id, "REVISION_COMPLETED", "ai-agent", { versionId: version.id, number: version.number });
    }
    await recordEvent(ctx.db, project.id, "GENERATION_COMPLETED", "ai-agent", { versionId: version.id, checks: version.checks_status });
    const current = (await getProject(ctx.db, project.id))!;
    await transition(ctx.db, project.id, "READY_FOR_REVIEW", "READY_FOR_REVIEW", "ai-agent", {
      force: current.status === "FAILED",
      details: { versionId: version.id },
      patch: { current_version_id: version.id, ai_status: "succeeded", last_error: null },
    });
    await notifyAdmin(ctx, current, "ready_for_review", `Version ${version.number} of ${current.business_name} is ready for review (${version.checks_status}).`);
    return { versionId: version.id };
  } catch (err) {
    const message = (err instanceof Error ? err.message : String(err)).slice(0, 500);
    const transient = /timeout|overloaded|rate|ECONN|fetch failed|5\d\d|network/i.test(message);
    await setGen({ status: transient && gen.attempts + 1 < 3 ? "queued" : "failed", error: message, finished_at: nowIso() });
    ctx.log.error("generation.failed", { generationId, attempt: gen.attempts + 1, message });
    if (transient && gen.attempts + 1 < 3) throw err; // the queue retries with backoff
    if (gen.revision_id) await ctx.db.prepare("UPDATE revision_requests SET status = 'failed', error = ? WHERE id = ?").bind(message, gen.revision_id).run();
    await recordEvent(ctx.db, project.id, "GENERATION_FAILED", "ai-agent", { generationId, message });
    const p = (await getProject(ctx.db, project.id))!;
    if (p.status !== "FAILED") await transition(ctx.db, p.id, "FAILED", "GENERATION_FAILED", "ai-agent", { force: true, patch: { ai_status: "failed", last_error: `AI build failed: ${message}` } });
    await notifyAdmin(ctx, p, "admin_alert", `AI build failed for ${p.business_name}: ${message.slice(0, 120)}`);
    return { failed: message };
  }
}

export async function loadBundle(ctx: StudioCtx, versionId: string): Promise<SiteBundle> {
  const v = await getVersion(ctx.db, versionId);
  if (!v?.spec_key) throw new Error("Version has no stored design.");
  const raw = await ctx.storage.getText(v.spec_key);
  if (!raw) throw new Error("Stored design not found.");
  return JSON.parse(raw) as SiteBundle;
}

export function legalInput(brief: Record<string, unknown>, spec: SiteSpec) {
  const b = brief as { business?: { name?: string; location?: string }; functionality?: { toolLinks?: string } };
  const contact = spec.pages.flatMap((p) => p.sections).find((s) => s.type === "contact") as { email?: string | null; form?: string } | undefined;
  const hasForms = spec.pages.some((p) => p.sections.some((s) => s.type === "contact" && s.form !== "none"));
  const services = [...new Set((b.functionality?.toolLinks?.match(/https:\/\/([^/\s]+)/g) ?? []).map((u) => u.replace("https://", "").replace(/^www\./, "")))];
  return {
    businessName: spec.siteName || b.business?.name || "This business",
    contactEmail: contact?.email ?? null,
    location: b.business?.location ?? null,
    hasForms,
    usesWebFonts: true,
    linkedServices: services,
    updated: new Date().toISOString().slice(0, 10),
  };
}

/** Renders a bundle (preview or production), runs checks. Pure apart from asset loading. */
export async function buildFiles(ctx: StudioCtx, projectId: string, bundle: SiteBundle, opts: { origin: string; basePath: string; marker: string }) {
  const project = (await getProject(ctx.db, projectId))!;
  const brief = parseJson<Record<string, unknown>>(project.brief, {});
  const assets = await loadRenderAssets(ctx, await listAssets(ctx.db, projectId));
  const def = bundle.languages[0];
  const { files, fixes, palette } = renderSite({
    specs: bundle.specs,
    languages: bundle.languages,
    assets,
    origin: opts.origin,
    basePath: opts.basePath,
    marker: opts.marker,
    legal: legalInput(brief, bundle.specs[def]!),
    year: new Date().getUTCFullYear(),
  });
  const content = (brief.content ?? {}) as Record<string, string>;
  const checks = runChecks({
    files,
    spec: bundle.specs[def]!,
    palette,
    languages: bundle.languages,
    basePath: opts.basePath,
    testimonialsSource: content.testimonials ?? "",
    briefText: JSON.stringify(brief),
    requestedPages: (brief.pages as string[] | undefined) ?? [],
    origin: opts.origin,
  });
  return { files, fixes: [...bundle.fixes, ...fixes], checks };
}

async function storeFiles(ctx: StudioCtx, prefix: string, files: Record<string, SiteFile>) {
  const manifest: Record<string, { size: number; type: string }> = {};
  for (const [path, f] of Object.entries(files)) {
    const body = typeof f.body === "string" ? encoder.encode(f.body) : f.body;
    await ctx.storage.put(`${prefix}${path}`, body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer, f.type);
    manifest[path] = { size: body.byteLength, type: f.type };
  }
  return manifest;
}

/** Creates a new numbered version from a bundle: renders the preview, stores files, runs checks. */
export async function createVersion(ctx: StudioCtx, projectId: string, bundle: SiteBundle, o: { label: string; revisionId?: string | null; parent?: string | null; createdBy: string }): Promise<VersionRow> {
  const id = randomId("ver");
  const max = await ctx.db.prepare("SELECT COALESCE(MAX(number), 0) AS n FROM website_versions WHERE project_id = ?").bind(projectId).first<{ n: number }>();
  const number = (max?.n ?? 0) + 1;
  const marker = `${id}`;
  const specKey = `versions/${id}/bundle.json`;
  await ctx.db
    .prepare("INSERT INTO website_versions (id, project_id, number, label, revision_id, parent_version_id, spec_key, files_prefix, build_status, build_marker, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'building', ?, ?, ?)")
    .bind(id, projectId, number, o.label, o.revisionId ?? null, o.parent ?? null, specKey, `versions/${id}/files`, marker, o.createdBy, nowIso())
    .run();
  try {
    await ctx.storage.put(specKey, JSON.stringify(bundle), "application/json");
    const basePath = await previewPath(ctx, id);
    const { files, fixes, checks } = await buildFiles(ctx, projectId, bundle, { origin: ctx.previewOrigin, basePath, marker });
    const manifest = await storeFiles(ctx, `versions/${id}/files`, files);
    const now = nowIso();
    await ctx.db.batch([
      ...checks.map((c) => ctx.db.prepare("INSERT INTO quality_checks (version_id, category, check_id, status, message, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(id, c.category, c.id, c.status, c.message, c.details ?? null, now)),
      ...(fixes.length ? [ctx.db.prepare("INSERT INTO quality_checks (version_id, category, check_id, status, message, details, created_at) VALUES (?, 'content', 'automatic-fixes', 'warn', ?, ?, ?)").bind(id, `${fixes.length} automatic correction(s) applied to the AI design`, fixes.join("\n"), now)] : []),
      ctx.db.prepare("UPDATE website_versions SET build_status = 'built', checks_status = ?, manifest = ? WHERE id = ?").bind(overallStatus(checks), JSON.stringify(manifest), id),
    ]);
  } catch (err) {
    await ctx.db.prepare("UPDATE website_versions SET build_status = 'failed', error = ? WHERE id = ?").bind((err instanceof Error ? err.message : String(err)).slice(0, 500), id).run();
    throw err;
  }
  return (await getVersion(ctx.db, id))!;
}

/** Restores an earlier version as a new version (re-rendered from its stored design; no AI). */
export async function rollbackTo(ctx: StudioCtx, projectId: string, sourceVersionId: string, actor: string) {
  const source = await getVersion(ctx.db, sourceVersionId);
  if (!source || source.project_id !== projectId || source.build_status !== "built") throw new Error("That version can't be restored.");
  const before = (await getProject(ctx.db, projectId))!;
  if (!["READY_FOR_REVIEW", "REVISIONS_REQUESTED", "FAILED"].includes(before.status)) throw new Error("Restore a version while the project is in review (request changes first if it's already approved).");
  const bundle = await loadBundle(ctx, sourceVersionId);
  const version = await createVersion(ctx, projectId, bundle, { label: `Restored from version ${source.number}`, parent: sourceVersionId, createdBy: actor });
  await recordEvent(ctx.db, projectId, "ROLLBACK", actor, { from: sourceVersionId, versionId: version.id });
  await transition(ctx.db, projectId, "READY_FOR_REVIEW", "READY_FOR_REVIEW", actor, { patch: { current_version_id: version.id, last_error: null } });
  return version;
}

export const missingInfoOf = (raw: string) => parseJson<MissingInfo[]>(raw, []);
