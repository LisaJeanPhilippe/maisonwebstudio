import { encryptSecret } from "../crypto";
import { audit, nowIso, randomId } from "../db";
import { signToken, verifyToken } from "../email/compose";
import { CloudflareClient } from "../deploy/cloudflare";
import { defaultScriptName, validHostname, validScriptName } from "../deploy/deploy";
import { normalizeEmail } from "../text";
import type { StudioCtx } from "./context";
import { queueGeneration } from "./intake";
import { notifyCustomer } from "./notify";
import { getProject, getVersion, patchProject, recordEvent, transition, TransitionError } from "./store";

/** Only a signed-in admin reaches these (enforced by the /admin middleware); the AI never calls them. */

export async function approveVersion(ctx: StudioCtx, projectId: string, versionId: string, admin: string, opts: { acceptWarnings: boolean }) {
  const p = (await getProject(ctx.db, projectId))!;
  const v = await getVersion(ctx.db, versionId);
  if (!v || v.project_id !== projectId) throw new TransitionError("Version not found.");
  if (v.build_status !== "built") throw new TransitionError("Only a successfully built version can be approved.");
  if (v.checks_status === "failed") throw new TransitionError("This version failed quality checks — request a revision first.");
  if (v.checks_status === "warnings" && !opts.acceptWarnings) throw new TransitionError("Review the quality-check warnings and confirm before approving.");
  if (p.status !== "READY_FOR_REVIEW") throw new TransitionError("Approve a version while the project is ready for review.");
  const now = nowIso();
  await ctx.db.batch([
    ctx.db.prepare("UPDATE website_versions SET approval_status = 'superseded' WHERE project_id = ? AND approval_status = 'approved'").bind(projectId),
    ctx.db.prepare("UPDATE website_versions SET approval_status = 'approved', approved_by = ?, approved_at = ? WHERE id = ?").bind(admin, now, versionId),
  ]);
  const next = await transition(ctx.db, projectId, "APPROVED", "ADMIN_APPROVED", admin, { details: { versionId, number: v.number }, patch: { approved_version_id: versionId, current_version_id: versionId } });
  await notifyCustomer(ctx, next, "approved", { dedupe: versionId });
  return next;
}

export async function requestRevision(ctx: StudioCtx, projectId: string, instruction: string, actor: string, source: "admin" | "client" = "admin") {
  const text = instruction.trim().slice(0, 2000);
  if (text.length < 5) throw new TransitionError("Describe the change you want (at least a few words).");
  const p = (await getProject(ctx.db, projectId))!;
  const base = p.current_version_id ?? p.approved_version_id;
  if (!base) throw new TransitionError("There's no version to revise yet.");
  if (!["READY_FOR_REVIEW", "APPROVED", "CLIENT_REVIEW", "READY_FOR_DEPLOYMENT", "DEPLOYED", "COMPLETED", "REVISIONS_REQUESTED"].includes(p.status)) throw new TransitionError(`Revisions can't be requested while the project is ${p.status.toLowerCase().replace(/_/g, " ")}.`);
  const id = randomId("rev");
  await ctx.db.prepare("INSERT INTO revision_requests (id, project_id, base_version_id, instruction, source, requested_by, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'queued', ?)").bind(id, projectId, base, text, source, actor, nowIso()).run();
  await ctx.db.prepare("UPDATE website_versions SET approval_status = 'changes_requested' WHERE id = ? AND approval_status = 'pending'").bind(base).run();
  if (p.status !== "REVISIONS_REQUESTED") await transition(ctx.db, projectId, "REVISIONS_REQUESTED", "REVISION_REQUESTED", actor, { details: { revisionId: id, instruction: text.slice(0, 200) } });
  await queueGeneration(ctx, projectId, "revision", actor, { revisionId: id, baseVersionId: base });
  return id;
}

export async function sendToClientReview(ctx: StudioCtx, projectId: string, admin: string) {
  const p = (await getProject(ctx.db, projectId))!;
  if (!p.approved_version_id) throw new TransitionError("Approve a version first.");
  const next = await transition(ctx.db, projectId, "CLIENT_REVIEW", "CLIENT_REVIEW_REQUESTED", admin, { patch: { client_review_status: "pending" } });
  const url = await clientReviewUrl(ctx, projectId, p.approved_version_id);
  await notifyCustomer(ctx, next, "ready_for_review", { url, dedupe: p.approved_version_id });
  return url;
}

/** A signed, expiring link the customer uses to view the approved version and respond (no account needed). */
export async function clientReviewUrl(ctx: StudioCtx, projectId: string, versionId: string) {
  const exp = String(Date.now() + 30 * 86_400_000);
  return `${ctx.adminOrigin}/review/${await signToken(ctx.config.appSecret, "client-review", { p: projectId, v: versionId, x: exp })}`;
}

export async function readClientToken(ctx: StudioCtx, token: string) {
  const data = await verifyToken(ctx.config.appSecret, "client-review", token);
  if (!data || Number(data.x) < Date.now()) return null;
  const p = await getProject(ctx.db, data.p);
  if (!p || p.approved_version_id !== data.v) return null; // superseded links stop working
  return { project: p, versionId: data.v };
}

export async function clientDecision(ctx: StudioCtx, projectId: string, versionId: string, decision: "approved" | "changes_requested", message: string) {
  const p = (await getProject(ctx.db, projectId))!;
  if (p.status !== "CLIENT_REVIEW") throw new TransitionError("This review link is no longer active.");
  if (p.client_review_status && p.client_review_status !== "pending") throw new TransitionError("Your response was already recorded. Thank you!");
  await ctx.db.prepare("INSERT INTO client_feedback (project_id, version_id, decision, message, created_at) VALUES (?, ?, ?, ?, ?)").bind(projectId, versionId, decision, message.trim().slice(0, 3000) || null, nowIso()).run();
  await patchProject(ctx.db, projectId, { client_review_status: decision });
  await recordEvent(ctx.db, projectId, decision === "approved" ? "CLIENT_APPROVED" : "CLIENT_CHANGES_REQUESTED", "client", { versionId, message: message.slice(0, 300) });
  await ctx.db.prepare("INSERT INTO notifications (project_id, channel, template, recipient, subject, status, created_at) VALUES (?, 'dashboard', 'client_feedback', 'admins', ?, 'unread', ?)").bind(projectId, `${p.business_name}: client ${decision === "approved" ? "approved the website" : "requested changes"}`, nowIso()).run();
}

export async function markReadyForDeployment(ctx: StudioCtx, projectId: string, admin: string) {
  const p = (await getProject(ctx.db, projectId))!;
  if (!p.approved_version_id) throw new TransitionError("Approve a version first.");
  return transition(ctx.db, projectId, "READY_FOR_DEPLOYMENT", "READY_FOR_DEPLOYMENT", admin, { patch: { script_name: p.script_name ?? defaultScriptName(p) } });
}

export async function markCompleted(ctx: StudioCtx, projectId: string, admin: string) {
  return transition(ctx.db, projectId, "COMPLETED", "COMPLETED", admin, { patch: { completed_at: nowIso() } });
}

export async function rebuild(ctx: StudioCtx, projectId: string, admin: string) {
  const p = (await getProject(ctx.db, projectId))!;
  if (!["READY_FOR_REVIEW", "FAILED"].includes(p.status)) throw new TransitionError("A fresh build can be started from review or after a failure.");
  await recordEvent(ctx.db, projectId, "RETRY", admin, { kind: "initial" });
  return queueGeneration(ctx, projectId, "initial", admin);
}

export async function requestInfo(ctx: StudioCtx, projectId: string, admin: string, message: string) {
  const text = message.trim().slice(0, 2000);
  if (text.length < 5) throw new TransitionError("Write what you need from the customer.");
  const p = (await getProject(ctx.db, projectId))!;
  const status = await notifyCustomer(ctx, p, "info_needed", { message: text, dedupe: String(Date.now()) });
  await recordEvent(ctx.db, projectId, "INFO_REQUESTED", admin, { message: text.slice(0, 300), email: status });
  return status;
}

export async function updateDeploySettings(
  ctx: StudioCtx,
  projectId: string,
  admin: string,
  o: { connectionId: string; scriptName: string; domain: string; formTo: string; formFrom: string; resendKey: string },
) {
  const p = (await getProject(ctx.db, projectId))!;
  const patch: Record<string, string | null> = {};
  if (o.connectionId) {
    const conn = await ctx.db.prepare("SELECT id FROM cloudflare_connections WHERE id = ?").bind(o.connectionId).first();
    if (!conn) throw new TransitionError("Unknown Cloudflare connection.");
    patch.cloudflare_connection_id = o.connectionId;
  }
  const script = o.scriptName.trim().toLowerCase() || p.script_name || defaultScriptName(p);
  if (!validScriptName(script)) throw new TransitionError("Worker name: lowercase letters, numbers and dashes, up to 63 characters.");
  patch.script_name = script;
  const domain = o.domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (domain && !validHostname(domain)) throw new TransitionError("Enter a domain like www.example.com.");
  patch.domain = domain || null;
  if (o.formTo) {
    const e = normalizeEmail(o.formTo);
    if (!e) throw new TransitionError("Form recipient must be a valid email.");
    patch.form_to_email = e;
  }
  if (o.formFrom) {
    const m = o.formFrom.trim().match(/^(?:[^<>]{1,80}<)?([^\s<>@]+@[^\s<>@]+\.[a-z]{2,})>?$/i);
    if (!m) throw new TransitionError('Form sender must look like "Name <forms@theirdomain.com>" on a domain verified in their Resend account.');
    patch.form_from_email = o.formFrom.trim();
  }
  if (o.resendKey) {
    if (!/^re_[A-Za-z0-9_]{16,}$/.test(o.resendKey.trim())) throw new TransitionError("That doesn't look like a Resend API key (re_…).");
    patch.resend_key_cipher = await encryptSecret(ctx.encryptionKey, o.resendKey.trim());
  }
  await patchProject(ctx.db, projectId, patch);
  await audit(ctx.db, admin, "project.deploy_settings", projectId, { ...patch, resend_key_cipher: patch.resend_key_cipher ? "updated" : undefined });
}

export async function addConnection(ctx: StudioCtx, admin: string, o: { label: string; owner: string; accountId: string; token: string }) {
  const label = o.label.trim().slice(0, 80);
  const accountId = o.accountId.trim();
  const token = o.token.trim();
  if (!label) throw new TransitionError("Give the connection a name (e.g. the customer's business).");
  if (!/^[a-f0-9]{32}$/i.test(accountId)) throw new TransitionError("Account ID is the 32-character ID shown in the Cloudflare dashboard.");
  if (token.length < 30 || /\s/.test(token)) throw new TransitionError("That doesn't look like a Cloudflare API token.");
  const cf = new CloudflareClient(token, accountId, ctx.cloudflareApi, ctx.fetch as typeof fetch);
  const check = await cf.verify();
  const id = randomId("cfc");
  await ctx.db
    .prepare("INSERT INTO cloudflare_connections (id, label, owner, account_id, token_cipher, token_hint, status, workers_subdomain, verified_at, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(id, label, o.owner === "maison" ? "maison" : "customer", accountId, await encryptSecret(ctx.encryptionKey, token), token.slice(-4), check.ok ? "verified" : "invalid", check.subdomain, check.ok ? nowIso() : null, admin, nowIso())
    .run();
  await audit(ctx.db, admin, "cloudflare.connection_add", id, { label, accountId, ok: check.ok });
  return { id, ...check };
}
