import { nowIso, type Db } from "../db";
import { canTransition, type ProjectEvent, type ProjectStatus } from "./status";

export type ProjectRow = {
  id: string;
  order_id: string;
  status: ProjectStatus;
  payment_status: string;
  ai_status: string;
  deployment_status: string;
  client_review_status: string;
  package_id: string;
  amount_cents: number;
  currency: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  business_name: string;
  industry: string | null;
  locale: string;
  order_snapshot: string;
  brief: string | null;
  missing_info: string;
  current_version_id: string | null;
  approved_version_id: string | null;
  domain: string | null;
  production_url: string | null;
  cloudflare_connection_id: string | null;
  script_name: string | null;
  form_to_email: string | null;
  form_from_email: string | null;
  resend_key_cipher: string | null;
  last_error: string | null;
  submitted_at: string;
  paid_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type VersionRow = {
  id: string;
  project_id: string;
  number: number;
  label: string;
  revision_id: string | null;
  parent_version_id: string | null;
  spec_key: string | null;
  files_prefix: string | null;
  manifest: string;
  build_status: "building" | "built" | "failed";
  checks_status: "pending" | "passed" | "warnings" | "failed";
  approval_status: "pending" | "approved" | "changes_requested" | "superseded";
  build_marker: string;
  error: string | null;
  created_by: string;
  created_at: string;
  approved_by: string | null;
  approved_at: string | null;
};

export const getProject = (db: Db, id: string) => db.prepare("SELECT * FROM projects WHERE id = ?").bind(id).first<ProjectRow>();
export const getProjectByOrder = (db: Db, orderId: string) => db.prepare("SELECT * FROM projects WHERE order_id = ?").bind(orderId).first<ProjectRow>();
export const getVersion = (db: Db, id: string) => db.prepare("SELECT * FROM website_versions WHERE id = ?").bind(id).first<VersionRow>();
export const listVersions = (db: Db, projectId: string) =>
  db.prepare("SELECT * FROM website_versions WHERE project_id = ? ORDER BY number DESC").bind(projectId).all<VersionRow>().then((r) => r.results);

export async function recordEvent(db: Db, projectId: string, event: ProjectEvent, actor: string, details: Record<string, unknown> = {}, from?: string | null, to?: string | null) {
  await db
    .prepare("INSERT INTO status_history (project_id, event, from_status, to_status, actor, details, at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(projectId, event, from ?? null, to ?? null, actor, JSON.stringify(details), nowIso())
    .run();
}

export class TransitionError extends Error {}

/**
 * Moves a project to a new status if the transition is allowed and nobody else changed it first
 * (compare-and-set on the current status). Records the event with the responsible actor.
 */
export async function transition(
  db: Db,
  projectId: string,
  to: ProjectStatus,
  event: ProjectEvent,
  actor: string,
  opts: { details?: Record<string, unknown>; patch?: Partial<ProjectRow>; force?: boolean } = {},
): Promise<ProjectRow> {
  const p = await getProject(db, projectId);
  if (!p) throw new TransitionError("Project not found.");
  if (!opts.force && p.status !== to && !canTransition(p.status, to)) throw new TransitionError(`A project can't go from ${p.status} to ${to}.`);
  const patch = { ...(opts.patch ?? {}), status: to } as Record<string, unknown>;
  const keys = Object.keys(patch).filter((k) => k !== "id");
  const res = await db
    .prepare(`UPDATE projects SET ${keys.map((k) => `${k} = ?`).join(", ")}, updated_at = ? WHERE id = ? AND status = ?`)
    .bind(...keys.map((k) => patch[k] ?? null), nowIso(), projectId, p.status)
    .run();
  if (!res.meta.changes) throw new TransitionError("The project changed while you were working on it. Refresh and try again.");
  await recordEvent(db, projectId, event, actor, opts.details ?? {}, p.status, to);
  return (await getProject(db, projectId))!;
}

/** Updates fields without changing status. */
export async function patchProject(db: Db, projectId: string, patch: Partial<ProjectRow>) {
  const keys = Object.keys(patch).filter((k) => k !== "id" && k !== "status");
  if (!keys.length) return;
  await db
    .prepare(`UPDATE projects SET ${keys.map((k) => `${k} = ?`).join(", ")}, updated_at = ? WHERE id = ?`)
    .bind(...keys.map((k) => (patch as Record<string, unknown>)[k] ?? null), nowIso(), projectId)
    .run();
}

export async function addNote(db: Db, projectId: string, author: string, body: string) {
  const text = body.trim().slice(0, 4000);
  if (!text) return;
  await db.prepare("INSERT INTO internal_notes (project_id, body, author, created_at) VALUES (?, ?, ?, ?)").bind(projectId, text, author, nowIso()).run();
  await recordEvent(db, projectId, "NOTE", author, { length: text.length });
}
