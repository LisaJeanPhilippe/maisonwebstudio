import type { Context, Hono } from "hono";
import { parseJson } from "../db";
import { previewPath } from "../builder/pipeline";
import { preflight, startDeployment, type DeploymentRow } from "../deploy/deploy";
import {
  addConnection,
  approveVersion,
  clientReviewUrl,
  markCompleted,
  markReadyForDeployment,
  rebuild,
  requestInfo,
  requestRevision,
  sendToClientReview,
  updateDeploySettings,
} from "../projects/actions";
import { client } from "../deploy/deploy";
import { listAssets, retryAssets, type MissingInfo } from "../projects/intake";
import { getProject, listVersions, addNote, type ProjectRow } from "../projects/store";
import { AI_ACTIVE, PROJECT_STATUSES, STATUS_LABEL, type ProjectStatus } from "../projects/status";
import { rollbackTo } from "../builder/pipeline";
import { audit, nowIso } from "../db";
import { Badge, Csrf, Field, fmtDate, Layout, safeHref, Stat } from "./views";
import type { AppEnv } from "../app";

type C = Context<AppEnv>;

const FLASH: Record<string, { kind: "good" | "warn" | "bad"; text: string }> = {
  approved: { kind: "good", text: "Version approved. Next: send it to the client for review, or mark it ready for deployment." },
  revision: { kind: "good", text: "Revision sent to the AI agent. A new version appears here when it's built and checked." },
  client: { kind: "good", text: "Client review link created and emailed (if email is configured)." },
  ready: { kind: "good", text: "Project is ready for deployment." },
  deploying: { kind: "good", text: "Deployment started. Progress appears below; refresh to update." },
  completed: { kind: "good", text: "Project marked completed." },
  rebuild: { kind: "good", text: "A fresh AI build was queued." },
  rollback: { kind: "good", text: "Earlier version restored as a new version for review." },
  saved: { kind: "good", text: "Saved." },
  note: { kind: "good", text: "Note added (visible to the studio only)." },
  info: { kind: "good", text: "Request for information sent to the customer." },
  assets: { kind: "good", text: "File copy retried." },
  connection: { kind: "good", text: "Cloudflare connection saved." },
};

async function page(c: C, title: string, path: string, body: unknown, status = 200, error?: string) {
  const flash = error ? { kind: "bad" as const, text: error } : (FLASH[c.req.query("m") ?? ""] ?? null);
  return c.html(
    <Layout title={title} path={path} admin={c.var.admin} flash={flash}>
      {body as never}
    </Layout>,
    status as 200,
  );
}

const form = async (c: C) => {
  const f = await c.req.parseBody({ all: true });
  return (k: string) => {
    const v = Array.isArray(f[k]) ? (f[k] as unknown[])[0] : f[k];
    return typeof v === "string" ? v : "";
  };
};

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const statusTone: Partial<Record<ProjectStatus, string>> = { READY_FOR_REVIEW: "HIGH_PRIORITY", FAILED: "bad", DEPLOYED: "HIGH_PRIORITY", COMPLETED: "GOOD_LEAD" };

export function registerProjectRoutes(admin: Hono<AppEnv>) {
  // ---------------------------------------------------------------- overview
  admin.get("/", async (c) => {
    const db = c.var.deps.db;
    const counts = Object.fromEntries((await db.prepare("SELECT status, COUNT(*) AS n FROM projects GROUP BY status").all<{ status: string; n: number }>()).results.map((r) => [r.status, r.n]));
    const n = (...s: string[]) => s.reduce((a, k) => a + (counts[k] ?? 0), 0);
    const failedDeploys = (await db.prepare("SELECT COUNT(*) AS n FROM deployments WHERE status = 'failed'").first<{ n: number }>())?.n ?? 0;
    const failedBuilds = (await db.prepare("SELECT COUNT(*) AS n FROM ai_generations WHERE status = 'failed'").first<{ n: number }>())?.n ?? 0;
    const notices = (await db.prepare("SELECT n.id, n.subject, n.created_at, n.project_id, p.business_name FROM notifications n LEFT JOIN projects p ON p.id = n.project_id WHERE n.channel = 'dashboard' AND n.status = 'unread' ORDER BY n.id DESC LIMIT 20").all<{ id: number; subject: string; created_at: string; project_id: string; business_name: string }>()).results;

    const q = c.req.query();
    const where: string[] = [];
    const args: unknown[] = [];
    const add = (sql: string, v: unknown) => {
      where.push(sql);
      args.push(v);
    };
    if (q.q) {
      const like = `%${q.q.replace(/[%_\\]/g, "\\$&").slice(0, 80)}%`;
      where.push("(business_name LIKE ? ESCAPE '\\' OR customer_name LIKE ? ESCAPE '\\' OR customer_email LIKE ? ESCAPE '\\' OR id LIKE ? ESCAPE '\\' OR order_id LIKE ? ESCAPE '\\')");
      args.push(like, like, like, like, like);
    }
    if (q.status && (PROJECT_STATUSES as readonly string[]).includes(q.status)) add("status = ?", q.status);
    if (q.package && ["starter", "business", "premium"].includes(q.package)) add("package_id = ?", q.package);
    if (q.payment && /^[a-z_]{3,20}$/.test(q.payment)) add("payment_status = ?", q.payment);
    if (q.ai && /^[a-z]{3,12}$/.test(q.ai)) add("ai_status = ?", q.ai);
    if (q.deploy && /^[a-z_]{3,15}$/.test(q.deploy)) add("deployment_status = ?", q.deploy);
    if (q.from && /^\d{4}-\d{2}-\d{2}$/.test(q.from)) add("submitted_at >= ?", q.from);
    if (q.to && /^\d{4}-\d{2}-\d{2}$/.test(q.to)) add("submitted_at < date(?, '+1 day')", q.to);
    const pageNo = Math.max(1, Number(q.page) || 1);
    const rows = (await db.prepare(`SELECT * FROM projects ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY updated_at DESC LIMIT 51 OFFSET ?`).bind(...args, (pageNo - 1) * 50).all<ProjectRow>()).results;
    const sel = (name: string, label: string, options: [string, string][]) => (
      <div>
        <label for={`f-${name}`}>{label}</label>
        <select id={`f-${name}`} name={name}>
          <option value="">Any</option>
          {options.map(([v, l]) => (
            <option value={v} selected={q[name] === v}>
              {l}
            </option>
          ))}
        </select>
      </div>
    );
    return page(
      c,
      "Website projects",
      "/admin",
      <>
        {notices.length > 0 && (
          <section class="banner warn" aria-labelledby="h-notices">
            <h2 id="h-notices" style="margin:0 0 6px;font-size:16px">
              Needs your attention
            </h2>
            <ul class="plain small">
              {notices.map((x) => (
                <li class="row">
                  <a href={`/admin/projects/${x.project_id}`}>{x.subject}</a> <span class="muted">{fmtDate(x.created_at)}</span>
                  <form method="post" action={`/admin/notifications/${x.id}/read`} style="display:inline">
                    <Csrf token={c.var.csrf} />
                    <button class="secondary" type="submit" style="min-height:30px;padding:2px 10px">
                      Dismiss
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        )}
        <h2>At a glance</h2>
        <div class="grid">
          <Stat label="Total projects" value={Object.values(counts).reduce((a, b) => a + b, 0)} />
          <Stat label="New requests" value={n("NEW_REQUEST", "AWAITING_PAYMENT")} />
          <Stat label="Paid" value={n("PAID", "QUEUED_FOR_AI", "AI_BUILDING", "READY_FOR_REVIEW", "REVISIONS_REQUESTED", "AI_REVISING", "APPROVED", "CLIENT_REVIEW", "READY_FOR_DEPLOYMENT", "DEPLOYING", "DEPLOYED", "COMPLETED")} />
          <Stat label="Being generated" value={n(...AI_ACTIVE)} />
          <Stat label="Awaiting your review" value={n("READY_FOR_REVIEW")} />
          <Stat label="Needing revisions" value={n("REVISIONS_REQUESTED")} />
          <Stat label="Approved" value={n("APPROVED", "CLIENT_REVIEW")} />
          <Stat label="Ready to deploy" value={n("READY_FOR_DEPLOYMENT")} />
          <Stat label="Deployed" value={n("DEPLOYED", "COMPLETED")} />
          <Stat label="Failed builds / deploys" value={`${failedBuilds} / ${failedDeploys}`} />
        </div>
        <h2>By status</h2>
        <ul class="grid" role="list" style="list-style:none;padding:0">
          {PROJECT_STATUSES.map((s) => (
            <li>
              <a class="card stat" style="display:block;text-decoration:none" href={`/admin?status=${s}`} aria-current={q.status === s ? "true" : undefined}>
                <div class="n">{counts[s] ?? 0}</div>
                <div class="l">{STATUS_LABEL[s]}</div>
              </a>
            </li>
          ))}
        </ul>
        <h2>Projects</h2>
        <form class="filters" method="get" role="search" aria-label="Filter projects">
          <div>
            <label for="f-q">Search</label>
            <input id="f-q" name="q" value={q.q ?? ""} placeholder="Business, customer, email or ID" />
          </div>
          {sel("status", "Status", PROJECT_STATUSES.map((s) => [s, STATUS_LABEL[s]]))}
          {sel("package", "Package", [["starter", "Starter"], ["business", "Business"], ["premium", "Premium"]])}
          {sel("payment", "Payment", ["pending_payment", "processing", "paid", "payment_failed", "cancelled", "refunded", "partially_refunded", "needs_review"].map((s) => [s, s.replace(/_/g, " ")]))}
          {sel("ai", "AI status", ["idle", "queued", "building", "succeeded", "failed"].map((s) => [s, s]))}
          {sel("deploy", "Deployment", ["not_started", "deploying", "succeeded", "failed"].map((s) => [s, s.replace(/_/g, " ")]))}
          <div>
            <label for="f-from">From</label>
            <input id="f-from" name="from" type="date" value={q.from ?? ""} />
          </div>
          <div>
            <label for="f-to">To</label>
            <input id="f-to" name="to" type="date" value={q.to ?? ""} />
          </div>
          <button type="submit">Filter</button>
          <a class="btn secondary" href="/admin">
            Clear
          </a>
        </form>
        <div class="table-wrap" tabindex={0} role="region" aria-label="Projects table (scrolls sideways on small screens)">
          <table style="min-width:1100px">
            <thead>
              <tr>
                <th scope="col">Project</th>
                <th scope="col">Customer</th>
                <th scope="col">Package</th>
                <th scope="col">Paid</th>
                <th scope="col">Payment</th>
                <th scope="col">Status</th>
                <th scope="col">AI</th>
                <th scope="col">Deploy</th>
                <th scope="col">Submitted</th>
                <th scope="col">Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 50).map((p) => (
                <tr>
                  <td>
                    <a href={`/admin/projects/${p.id}`}>{p.business_name}</a>
                    <div class="small muted">{p.id}</div>
                  </td>
                  <td>
                    {p.customer_name}
                    <div class="small muted">{p.customer_email}</div>
                  </td>
                  <td>{p.package_id}</td>
                  <td>{p.payment_status === "paid" ? money(p.amount_cents) : "—"}</td>
                  <td>
                    <Badge value={p.payment_status} kind={p.payment_status === "paid" ? "GOOD_LEAD" : "stage"} />
                  </td>
                  <td>
                    <Badge value={STATUS_LABEL[p.status]} kind={statusTone[p.status] ?? "stage"} />
                  </td>
                  <td>{p.ai_status}</td>
                  <td>{p.deployment_status.replace(/_/g, " ")}</td>
                  <td class="small">{fmtDate(p.submitted_at)}</td>
                  <td class="small">{fmtDate(p.updated_at)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colspan={10} class="muted">
                    No projects match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <nav class="pager" aria-label="Pages">
          {pageNo > 1 && (
            <a class="btn secondary" href={`?${new URLSearchParams({ ...q, page: String(pageNo - 1) })}`}>
              Previous
            </a>
          )}
          {rows.length > 50 && (
            <a class="btn secondary" href={`?${new URLSearchParams({ ...q, page: String(pageNo + 1) })}`}>
              Next
            </a>
          )}
        </nav>
      </>,
    );
  });

  admin.post("/notifications/:id/read", async (c) => {
    await c.var.deps.db.prepare("UPDATE notifications SET status = 'read' WHERE id = ? AND channel = 'dashboard'").bind(Number(c.req.param("id")) || 0).run();
    return c.redirect("/admin", 303);
  });

  // ---------------------------------------------------------------- workspace
  admin.get("/projects/:id", (c) => workspace(c));

  async function workspace(c: C, error?: string) {
    const ctx = c.var.studio;
    const db = ctx.db;
    const p = await getProject(db, c.req.param("id")!);
    if (!p) return c.notFound();
    const versions = await listVersions(db, p.id);
    const shownId = c.req.query("v") && versions.some((v) => v.id === c.req.query("v")) ? c.req.query("v")! : (p.current_version_id ?? versions[0]?.id ?? null);
    const shown = versions.find((v) => v.id === shownId) ?? null;
    const checks = shown ? (await db.prepare("SELECT * FROM quality_checks WHERE version_id = ? ORDER BY CASE status WHEN 'fail' THEN 0 WHEN 'warn' THEN 1 WHEN 'skipped' THEN 2 ELSE 3 END, category").bind(shown.id).all<{ category: string; check_id: string; status: string; message: string; details: string | null }>()).results : [];
    const assets = await listAssets(db, p.id);
    const gens = (await db.prepare("SELECT * FROM ai_generations WHERE project_id = ? ORDER BY created_at DESC LIMIT 10").bind(p.id).all<{ id: string; kind: string; status: string; stage: string; error: string | null; attempts: number; created_at: string; finished_at: string | null; model: string | null }>()).results;
    const revisions = (await db.prepare("SELECT * FROM revision_requests WHERE project_id = ? ORDER BY created_at DESC").bind(p.id).all<{ id: string; instruction: string; status: string; source: string; requested_by: string; created_at: string; error: string | null }>()).results;
    const notes = (await db.prepare("SELECT * FROM internal_notes WHERE project_id = ? ORDER BY id DESC").bind(p.id).all<{ body: string; author: string; created_at: string }>()).results;
    const history = (await db.prepare("SELECT * FROM status_history WHERE project_id = ? ORDER BY id DESC LIMIT 80").bind(p.id).all<{ event: string; from_status: string | null; to_status: string | null; actor: string; details: string; at: string }>()).results;
    const deployments = (await db.prepare("SELECT * FROM deployments WHERE project_id = ? ORDER BY started_at DESC").bind(p.id).all<DeploymentRow>()).results;
    const feedback = (await db.prepare("SELECT * FROM client_feedback WHERE project_id = ? ORDER BY id DESC").bind(p.id).all<{ decision: string; message: string | null; created_at: string }>()).results;
    const connections = (await db.prepare("SELECT id, label, owner, account_id, status, token_hint FROM cloudflare_connections ORDER BY created_at DESC").all<{ id: string; label: string; owner: string; account_id: string; status: string; token_hint: string }>()).results;
    const emails = (await db.prepare("SELECT template, status, subject, created_at, error FROM notifications WHERE project_id = ? AND channel = 'email' ORDER BY id DESC").bind(p.id).all<{ template: string; status: string; subject: string | null; created_at: string; error: string | null }>()).results;
    const order = parseJson<{ order: Record<string, unknown>; items: { name: string; total: number; quantity: number }[]; total: number }>(p.order_snapshot, { order: {}, items: [], total: 0 });
    const brief = parseJson<Record<string, unknown>>(p.brief, {});
    const missing = parseJson<MissingInfo[]>(p.missing_info, []);
    const device = (["desktop", "tablet", "mobile"].includes(c.req.query("device") ?? "") ? c.req.query("device") : "desktop") as "desktop" | "tablet" | "mobile";
    const width = { desktop: "100%", tablet: "820px", mobile: "390px" }[device];
    const previewUrl = shown && shown.build_status === "built" ? `${ctx.previewOrigin}${await previewPath(ctx, shown.id)}/` : null;
    const pre = await preflight(ctx, p);
    const csrf = c.var.csrf;
    const act = (path: string, label: string, cls = "", extra?: unknown) => (
      <form method="post" action={`/admin/projects/${p.id}/${path}`} style="display:inline">
        <Csrf token={csrf} />
        {extra as never}
        <button class={cls} type="submit">
          {label}
        </button>
      </form>
    );
    const thumb = (a: (typeof assets)[number]) =>
      a.status === "stored" && /^image\/(png|jpeg|webp|gif)$/.test(a.mime) ? <img src={`/admin/projects/${p.id}/assets/${a.id}`} alt={`${a.role}: ${a.name}`} width={96} height={96} style="width:96px;height:96px;object-fit:cover;border-radius:8px;border:1px solid var(--line)" loading="lazy" /> : null;
    const answers = Object.entries(order.order).filter(([k, v]) => !["files", "acceptTerms", "acceptPaymentAgreement", "website2", "ref"].includes(k) && v !== "" && !(Array.isArray(v) && !v.length));

    return page(
      c,
      p.business_name,
      "/admin",
      <>
        {error && <p class="banner bad" role="alert">{error}</p>}
        <p class="row">
          <Badge value={STATUS_LABEL[p.status]} kind={statusTone[p.status] ?? "stage"} /> <span class="small muted">{p.id} · order {p.order_id} · updated {fmtDate(p.updated_at)}</span>
        </p>
        {p.last_error && <p class="banner bad">{p.last_error}</p>}
        <nav aria-label="Project sections" class="small" style="margin:8px 0 16px">
          {[["next", "Next step"], ["preview", "Preview"], ["revise", "Revisions"], ["versions", "Versions"], ["checks", "Quality checks"], ["deploy", "Deployment"], ["customer", "Customer"], ["brief", "Brief"], ["files", "Files"], ["notes", "Notes"], ["history", "History"]].map(([id, l]) => (
            <a href={`#${id}`} style="margin-inline-end:12px">
              {l}
            </a>
          ))}
        </nav>

        <section id="next" class="card" aria-labelledby="h-next">
          <h2 id="h-next" style="margin-top:0">Next step</h2>
          {p.status === "AWAITING_PAYMENT" || p.status === "NEW_REQUEST" ? <p>Waiting for the customer's payment. The AI build starts automatically once Stripe confirms it.</p> : null}
          {AI_ACTIVE.includes(p.status) || p.status === "PAID" ? <p>The AI agent is working ({gens[0]?.stage ?? "queued"}). Refresh to see progress — the new version appears here when it's built and checked.</p> : null}
          {p.status === "READY_FOR_REVIEW" && shown ? (
            <div class="row">
              <p style="margin:0">
                {shown.checks_status === "failed"
                  ? `Version ${shown.number} failed quality checks (see below). Ask the AI for changes or restore an earlier version — it can't be approved as is.`
                  : `Review version ${shown.number} below, then approve it or request changes.`}
              </p>
              {shown.checks_status !== "failed" && act(
                "approve",
                `Approve version ${shown.number}`,
                "",
                <>
                  <input type="hidden" name="versionId" value={shown.id} />
                  {shown.checks_status === "warnings" && (
                    <label class="small" style="display:inline-flex;gap:6px;align-items:center">
                      <input type="checkbox" name="accept_warnings" value="1" required /> I reviewed the warnings
                    </label>
                  )}
                </>,
              )}
              {act("rebuild", "Start over (fresh AI build)", "secondary")}
            </div>
          ) : null}
          {p.status === "APPROVED" || p.status === "CLIENT_REVIEW" ? (
            <div class="row">
              {p.status === "APPROVED" && act("client-review", "Send to client for review", "secondary")}
              {act("ready", "Mark ready for deployment")}
              <span class="small muted">Client review: {p.client_review_status.replace(/_/g, " ")}</span>
            </div>
          ) : null}
          {p.status === "READY_FOR_DEPLOYMENT" ? <p>Approved and ready. Configure the Cloudflare destination below, then click Deploy.</p> : null}
          {p.status === "DEPLOYING" ? <p>Deploying… progress is listed under Deployment. Refresh to update.</p> : null}
          {p.status === "DEPLOYED" ? (
            <div class="row">
              <p style="margin:0">
                Live at{" "}
                {safeHref(p.production_url) ? (
                  <a href={p.production_url!} rel="noopener noreferrer" target="_blank">
                    {p.production_url}
                  </a>
                ) : (
                  "—"
                )}
              </p>
              {act("complete", "Mark project completed")}
            </div>
          ) : null}
          {p.status === "FAILED" ? (
            <div class="row">
              <p style="margin:0">Something failed (see the red message above). The last working version is kept.</p>
              {act("rebuild", "Retry AI build")}
              {p.current_version_id && act("rollback", "Back to review of the last version", "secondary", <input type="hidden" name="versionId" value={p.current_version_id} />)}
            </div>
          ) : null}
          {missing.length > 0 && (
            <details style="margin-top:12px" open={missing.some((m) => m.severity === "warning")}>
              <summary>Missing or incomplete information ({missing.length})</summary>
              <ul class="small">
                {missing.map((m) => (
                  <li>
                    <Badge value={m.severity} kind={m.severity === "warning" ? "bad" : "stage"} /> {m.message}
                  </li>
                ))}
              </ul>
              <form method="post" action={`/admin/projects/${p.id}/request-info`}>
                <Csrf token={csrf} />
                <Field id="info" label="Ask the customer for more information (sent by email)">
                  <textarea id="info" name="message" required minlength={5} maxlength={2000} style="min-height:90px" />
                </Field>
                <button class="secondary" type="submit">
                  Send request
                </button>
              </form>
            </details>
          )}
        </section>

        <section id="preview" aria-labelledby="h-preview">
          <h2 id="h-preview">Website preview {shown ? `— version ${shown.number}` : ""}</h2>
          {previewUrl ? (
            <>
              <p class="row small">
                {(["desktop", "tablet", "mobile"] as const).map((d) => (
                  <a class={`btn ${d === device ? "" : "secondary"}`} href={`/admin/projects/${p.id}?device=${d}${shown ? `&v=${shown.id}` : ""}#preview`} aria-current={d === device ? "true" : undefined}>
                    {d[0].toUpperCase() + d.slice(1)}
                  </a>
                ))}
                <a class="btn secondary" href={previewUrl} target="_blank" rel="noopener noreferrer">
                  Full preview (new tab)
                </a>
              </p>
              <div style="overflow-x:auto;background:var(--line);padding:12px;border-radius:12px">
                <iframe src={previewUrl} title={`Preview of version ${shown!.number}`} sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox" style={`display:block;width:${width};max-width:100%;height:760px;margin:0 auto;border:0;border-radius:8px;background:#fff`} loading="lazy" />
              </div>
              <p class="small muted">The preview runs in an isolated sandbox. Forms show a test message and never send email. Preview links are private (unguessable) — don't share them; use “Send to client for review” for customers.</p>
            </>
          ) : (
            <p class="muted">No preview yet.</p>
          )}
        </section>

        <section id="revise" aria-labelledby="h-revise">
          <h2 id="h-revise">Ask the AI for changes</h2>
          {p.current_version_id && !AI_ACTIVE.includes(p.status) && !["DEPLOYING", "AWAITING_PAYMENT", "NEW_REQUEST"].includes(p.status) ? (
            <form method="post" action={`/admin/projects/${p.id}/revise`} class="card">
              <Csrf token={csrf} />
              <Field id="instruction" label="Instruction" hint='e.g. "Make the homepage more luxurious", "Make the booking button more prominent", "Use more whitespace".'>
                <textarea id="instruction" name="instruction" required minlength={5} maxlength={2000} style="min-height:110px" aria-describedby="instruction-hint" />
              </Field>
              <button type="submit">Send to AI agent</button>
            </form>
          ) : (
            <p class="muted">Available once a version exists and the AI isn't already working.</p>
          )}
          {revisions.length > 0 && (
            <ul class="plain small" style="margin-top:12px">
              {revisions.map((r) => (
                <li>
                  <Badge value={r.status} kind={r.status === "failed" ? "bad" : "stage"} /> “{r.instruction}” <span class="muted">— {r.source === "client" ? "client" : r.requested_by}, {fmtDate(r.created_at)}</span>
                  {r.error && <div style="color:var(--bad)">{r.error}</div>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="versions" aria-labelledby="h-versions">
          <h2 id="h-versions">Version history</h2>
          <div class="table-wrap" tabindex={0} role="region" aria-label="Versions">
            <table>
              <thead>
                <tr>
                  <th scope="col">Version</th>
                  <th scope="col">Created</th>
                  <th scope="col">Build</th>
                  <th scope="col">Checks</th>
                  <th scope="col">Approval</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((v) => (
                  <tr>
                    <td>
                      <a href={`/admin/projects/${p.id}?v=${v.id}#preview`}>
                        Version {v.number}
                      </a>
                      {v.id === p.current_version_id && <span class="badge">current</span>} {v.id === p.approved_version_id && <span class="badge GOOD_LEAD">approved</span>}
                      <div class="small muted">{v.label}</div>
                    </td>
                    <td class="small">
                      {fmtDate(v.created_at)}
                      <div class="muted">{v.created_by}</div>
                    </td>
                    <td>{v.build_status}</td>
                    <td>
                      <Badge value={v.checks_status} kind={v.checks_status === "failed" ? "bad" : v.checks_status === "passed" ? "GOOD_LEAD" : "stage"} />
                    </td>
                    <td class="small">
                      {v.approval_status}
                      {v.approved_by && <div class="muted">{v.approved_by}</div>}
                    </td>
                    <td>{v.build_status === "built" && v.id !== p.current_version_id && ["READY_FOR_REVIEW", "REVISIONS_REQUESTED", "FAILED"].includes(p.status) ? act("rollback", "Restore", "secondary", <input type="hidden" name="versionId" value={v.id} />) : null}</td>
                  </tr>
                ))}
                {versions.length === 0 && (
                  <tr>
                    <td colspan={6} class="muted">
                      No versions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {gens.length > 0 && (
            <details style="margin-top:10px">
              <summary>AI build runs ({gens.length})</summary>
              <ul class="plain small">
                {gens.map((g) => (
                  <li>
                    {fmtDate(g.created_at)} · {g.kind} · <Badge value={g.status} kind={g.status === "failed" ? "bad" : "stage"} /> · stage {g.stage} · attempt {g.attempts} · {g.model ?? ""}
                    {g.error && <div style="color:var(--bad)">{g.error}</div>}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>

        <section id="checks" aria-labelledby="h-checks">
          <h2 id="h-checks">Quality checks {shown ? `— version ${shown.number}` : ""}</h2>
          {checks.length ? (
            <ul class="plain small">
              {checks.map((k) => (
                <li>
                  <Badge value={k.status} kind={k.status === "fail" ? "bad" : k.status === "pass" ? "GOOD_LEAD" : "stage"} /> <strong>{k.category}</strong> · {k.message}
                  {k.details && (
                    <details>
                      <summary>Details</summary>
                      <pre tabindex={0} class="email">{k.details}</pre>
                    </details>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p class="muted">No checks yet.</p>
          )}
          <p class="small muted">Automated checks can't catch everything: test the preview with a keyboard and on a real phone before approving.</p>
        </section>

        <section id="client" aria-labelledby="h-client">
          <h2 id="h-client">Client review</h2>
          <p>Status: {p.client_review_status.replace(/_/g, " ")}</p>
          {p.status === "CLIENT_REVIEW" && p.approved_version_id && (
            <p class="small">
              Review link (expires in 30 days): <code style="overflow-wrap:anywhere">{await clientReviewUrl(ctx, p.id, p.approved_version_id)}</code>
            </p>
          )}
          {feedback.length > 0 && (
            <ul class="plain small">
              {feedback.map((f) => (
                <li>
                  <Badge value={f.decision} /> {f.message ?? ""} <span class="muted">{fmtDate(f.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="deploy" aria-labelledby="h-deploy">
          <h2 id="h-deploy">Cloudflare deployment</h2>
          <div class="two">
            <div class="card">
              <h3 style="margin-top:0">Before deploying</h3>
              <ul class="plain small">
                {pre.map((i) => (
                  <li>
                    <Badge value={i.ok ? "ready" : i.blocking ? "required" : "optional"} kind={i.ok ? "GOOD_LEAD" : i.blocking ? "bad" : "stage"} /> <strong>{i.label}</strong> — {i.detail}
                  </li>
                ))}
              </ul>
              {["READY_FOR_DEPLOYMENT", "DEPLOYED", "COMPLETED"].includes(p.status) && (
                <form method="post" action={`/admin/projects/${p.id}/deploy`} style="margin-top:12px">
                  <Csrf token={csrf} />
                  <label class="small" style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
                    <input type="checkbox" name="confirm" value="1" required /> Deploy the approved version to {p.domain ?? "its workers.dev address"} in the selected Cloudflare account
                  </label>
                  <button type="submit" disabled={pre.some((i) => i.blocking && !i.ok)}>
                    Deploy to Cloudflare
                  </button>
                </form>
              )}
            </div>
            <form class="card" method="post" action={`/admin/projects/${p.id}/deploy-settings`}>
              <Csrf token={csrf} />
              <h3 style="margin-top:0">Destination</h3>
              <Field id="conn" label="Cloudflare account" hint="Prefer the customer's own account so they own their site. Add accounts under Cloudflare in the menu.">
                <select id="conn" name="connectionId" aria-describedby="conn-hint">
                  <option value="">Choose…</option>
                  {connections.map((cn) => (
                    <option value={cn.id} selected={cn.id === p.cloudflare_connection_id}>
                      {cn.label} ({cn.owner}, …{cn.token_hint}) — {cn.status}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="script" label="Worker name">
                <input id="script" name="scriptName" value={p.script_name ?? ""} placeholder="e.g. bella-salon" maxlength={63} pattern="[a-z0-9-]+" />
              </Field>
              <Field id="domain" label="Custom domain (optional)" hint="The domain must already be a zone in that Cloudflare account (customer adds it and updates nameservers).">
                <input id="domain" name="domain" value={p.domain ?? ""} placeholder="www.example.com" maxlength={253} aria-describedby="domain-hint" />
              </Field>
              <Field id="formTo" label="Form messages go to (FORM_TO_EMAIL)">
                <input id="formTo" name="formTo" type="email" value={p.form_to_email ?? ""} maxlength={200} />
              </Field>
              <Field id="formFrom" label="Form sender (FORM_FROM_EMAIL)" hint="An address on a domain verified in the customer's Resend account.">
                <input id="formFrom" name="formFrom" value={p.form_from_email ?? ""} placeholder="Website <forms@example.com>" maxlength={200} aria-describedby="formFrom-hint" />
              </Field>
              <Field id="resend" label={`Customer's Resend API key (RESEND_API_KEY)${p.resend_key_cipher ? " — saved; leave blank to keep" : ""}`} hint="Stored encrypted and only sent to Cloudflare as a Worker secret. Never shown again.">
                <input id="resend" name="resendKey" type="password" autocomplete="off" maxlength={200} aria-describedby="resend-hint" />
              </Field>
              <button class="secondary" type="submit">
                Save destination
              </button>
            </form>
          </div>
          <h3>Deployment history</h3>
          {deployments.length ? (
            <ul class="plain small">
              {deployments.map((d) => (
                <li>
                  <p class="row" style="margin:0">
                    <Badge value={d.status} kind={d.status === "failed" ? "bad" : d.status === "succeeded" ? "GOOD_LEAD" : "stage"} /> {fmtDate(d.started_at)} · by {d.admin} · version {versions.find((v) => v.id === d.version_id)?.number ?? "?"} · Worker {d.script_name}
                    {d.cloudflare_deployment_id && <span class="muted">· id {d.cloudflare_deployment_id}</span>}
                  </p>
                  <p style="margin:2px 0">
                    {safeHref(d.workers_dev_url) && (
                      <a href={d.workers_dev_url!} target="_blank" rel="noopener noreferrer">
                        {d.workers_dev_url}
                      </a>
                    )}{" "}
                    {d.domain && (
                      <span>
                        · {d.domain}: DNS {d.dns_status}, SSL {d.ssl_status}
                      </span>
                    )}
                  </p>
                  {d.error && <p style="color:var(--bad);margin:2px 0">{d.error}</p>}
                  <details>
                    <summary>Log</summary>
                    <ol class="small">
                      {parseJson<{ at: string; message: string }[]>(d.log, []).map((l) => (
                        <li>
                          {fmtDate(l.at)} — {l.message}
                        </li>
                      ))}
                    </ol>
                  </details>
                </li>
              ))}
            </ul>
          ) : (
            <p class="muted">No deployments yet.</p>
          )}
        </section>

        <div class="two">
          <section id="customer" aria-labelledby="h-customer">
            <h2 id="h-customer">Customer & payment</h2>
            <ul class="plain">
              <li>{p.customer_name}</li>
              <li>{p.customer_email}</li>
              <li>{p.customer_phone ?? "—"}</li>
              <li>
                Package: {p.package_id} · total {money(Math.round(order.total * 100))} ·{" "}
                <Badge value={p.payment_status} kind={p.payment_status === "paid" ? "GOOD_LEAD" : "stage"} /> {p.paid_at && <span class="small muted">paid {fmtDate(p.paid_at)}</span>}
              </li>
              {order.items.map((i) => (
                <li class="small">
                  {i.name}
                  {i.quantity > 1 ? ` × ${i.quantity}` : ""} — ${i.total}
                </li>
              ))}
            </ul>
            <p class="small muted">Payment details stay in Stripe; card numbers are never stored here.</p>
            <h3>Customer emails</h3>
            <ul class="plain small">
              {emails.map((e) => (
                <li>
                  {fmtDate(e.created_at)} · {e.subject ?? e.template} · <Badge value={e.status} kind={e.status === "failed" ? "bad" : "stage"} /> {e.error && <span class="muted">{e.error}</span>}
                </li>
              ))}
            </ul>
          </section>
          <section id="brief" aria-labelledby="h-brief">
            <h2 id="h-brief">Website brief</h2>
            <details open>
              <summary>Structured brief (sent to the AI agent)</summary>
              <pre tabindex={0} class="email" style="max-height:420px;overflow:auto">{JSON.stringify(brief, null, 2)}</pre>
            </details>
            <details>
              <summary>Questionnaire answers</summary>
              <dl class="small">
                {answers.map(([k, v]) => (
                  <>
                    <dt>
                      <strong>{k}</strong>
                    </dt>
                    <dd style="margin:0 0 8px;white-space:pre-wrap">{Array.isArray(v) ? v.join(", ") : typeof v === "object" ? JSON.stringify(v) : String(v)}</dd>
                  </>
                ))}
              </dl>
            </details>
          </section>
        </div>

        <section id="files" aria-labelledby="h-files">
          <h2 id="h-files">Branding, content and inspiration files</h2>
          {(["content", "inspiration"] as const).map((kind) => (
            <>
              <h3>{kind === "content" ? "Branding & content" : "Inspiration"}</h3>
              <ul class="grid" role="list" style="list-style:none;padding:0">
                {assets
                  .filter((a) => a.kind === kind)
                  .map((a) => (
                    <li class="card small">
                      {thumb(a)}
                      <p style="margin:6px 0 0;overflow-wrap:anywhere">{a.name}</p>
                      <p class="muted" style="margin:0">
                        {a.role} · {a.mime} · {Math.round(a.size / 1024)} KB{a.width ? ` · ${a.width}×${a.height}` : ""}
                      </p>
                      {a.status === "stored" ? (
                        <a href={`/admin/projects/${p.id}/assets/${a.id}?download=1`}>Download</a>
                      ) : (
                        <span style="color:var(--bad)">Copy failed: {a.error}</span>
                      )}
                    </li>
                  ))}
              </ul>
            </>
          ))}
          {assets.some((a) => a.status === "failed") && act("retry-assets", "Retry copying files", "secondary")}
        </section>

        <section id="notes" aria-labelledby="h-notes">
          <h2 id="h-notes">Internal notes</h2>
          <p class="small muted">Private to the studio — never shown to customers.</p>
          <form method="post" action={`/admin/projects/${p.id}/notes`} class="row" style="align-items:flex-end">
            <Csrf token={csrf} />
            <div style="flex:1;min-width:240px">
              <label for="note">New note</label>
              <textarea id="note" name="body" required maxlength={4000} style="min-height:70px" placeholder='e.g. "Waiting for logo."' />
            </div>
            <button type="submit">Add note</button>
          </form>
          <ul class="plain small" style="margin-top:10px">
            {notes.map((n) => (
              <li style="white-space:pre-wrap">
                <strong>{n.author}</strong> <span class="muted">{fmtDate(n.created_at)}</span>
                <br />
                {n.body}
              </li>
            ))}
          </ul>
        </section>

        <section id="history" aria-labelledby="h-history">
          <h2 id="h-history">Project history</h2>
          <ol class="small">
            {history.map((h) => (
              <li>
                {fmtDate(h.at)} — <strong>{h.event}</strong> {h.to_status && h.from_status !== h.to_status ? `(${h.from_status ?? "—"} → ${h.to_status})` : ""} · {h.actor}
              </li>
            ))}
          </ol>
        </section>
      </>,
      error ? 400 : 200,
    );
  }

  // ---------------------------------------------------------------- actions (all CSRF-checked by the admin middleware)
  const run = (name: string, fn: (c: C, f: (k: string) => string) => Promise<unknown>, flash: string) =>
    admin.post(`/projects/:id/${name}`, async (c) => {
      const p = await getProject(c.var.deps.db, c.req.param("id")!);
      if (!p) return c.notFound();
      const f = await form(c);
      try {
        await fn(c, f);
      } catch (err) {
        return workspace(c, err instanceof Error ? err.message : "That action failed.");
      }
      return c.redirect(`/admin/projects/${p.id}?m=${flash}`, 303);
    });

  run("approve", (c, f) => approveVersion(c.var.studio, c.req.param("id")!, f("versionId"), c.var.admin, { acceptWarnings: f("accept_warnings") === "1" }), "approved");
  run("revise", (c, f) => requestRevision(c.var.studio, c.req.param("id")!, f("instruction"), c.var.admin), "revision");
  run("client-review", (c) => sendToClientReview(c.var.studio, c.req.param("id")!, c.var.admin), "client");
  run("ready", (c) => markReadyForDeployment(c.var.studio, c.req.param("id")!, c.var.admin), "ready");
  run("complete", (c) => markCompleted(c.var.studio, c.req.param("id")!, c.var.admin), "completed");
  run("rebuild", (c) => rebuild(c.var.studio, c.req.param("id")!, c.var.admin), "rebuild");
  run("rollback", (c, f) => rollbackTo(c.var.studio, c.req.param("id")!, f("versionId"), c.var.admin), "rollback");
  run("request-info", (c, f) => requestInfo(c.var.studio, c.req.param("id")!, c.var.admin, f("message")), "info");
  run("notes", (c, f) => addNote(c.var.deps.db, c.req.param("id")!, c.var.admin, f("body")), "note");
  run("retry-assets", (c) => retryAssets(c.var.studio, c.req.param("id")!), "assets");
  run(
    "deploy-settings",
    (c, f) => updateDeploySettings(c.var.studio, c.req.param("id")!, c.var.admin, { connectionId: f("connectionId"), scriptName: f("scriptName"), domain: f("domain"), formTo: f("formTo"), formFrom: f("formFrom"), resendKey: f("resendKey") }),
    "saved",
  );
  run(
    "deploy",
    async (c, f) => {
      if (f("confirm") !== "1") throw new Error("Confirm the deployment first.");
      await startDeployment(c.var.studio, c.req.param("id")!, c.var.admin);
    },
    "deploying",
  );

  // Customer files for admins only (images inline for thumbnails; everything else as a download).
  admin.get("/projects/:id/assets/:assetId", async (c) => {
    const a = await c.var.deps.db.prepare("SELECT * FROM project_assets WHERE id = ? AND project_id = ?").bind(c.req.param("assetId"), c.req.param("id")).first<{ r2_key: string | null; mime: string; name: string }>();
    if (!a?.r2_key) return c.notFound();
    const obj = await c.var.studio.storage.get(a.r2_key);
    if (!obj) return c.notFound();
    const inline = !c.req.query("download") && /^image\/(png|jpeg|webp|gif)$/.test(a.mime);
    return new Response(obj.body, {
      headers: {
        "Content-Type": inline ? a.mime : "application/octet-stream",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${a.name.replace(/["\\]/g, "_")}"`,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "Cache-Control": "private, no-store",
      },
    });
  });

  // ---------------------------------------------------------------- Cloudflare connections
  admin.get("/connections", (c) => connectionsPage(c));
  async function connectionsPage(c: C, error?: string) {
    const rows = (await c.var.deps.db.prepare("SELECT id, label, owner, account_id, status, token_hint, workers_subdomain, verified_at, created_by, created_at FROM cloudflare_connections ORDER BY created_at DESC").all<Record<string, string>>()).results;
    return page(
      c,
      "Cloudflare connections",
      "/admin/connections",
      <>
        <p class="muted">Deployments use these API tokens through the server only. Tokens are encrypted at rest and never shown again. To keep customers in control of their sites, create a connection for each customer's own Cloudflare account.</p>
        <div class="table-wrap" tabindex={0} role="region" aria-label="Connections">
          <table>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Owner</th>
                <th scope="col">Account</th>
                <th scope="col">Token</th>
                <th scope="col">Status</th>
                <th scope="col">Verify</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr>
                  <td>{r.label}</td>
                  <td>{r.owner}</td>
                  <td class="small">
                    {r.account_id}
                    {r.workers_subdomain && <div class="muted">{r.workers_subdomain}.workers.dev</div>}
                  </td>
                  <td>…{r.token_hint}</td>
                  <td>
                    <Badge value={r.status} kind={r.status === "verified" ? "GOOD_LEAD" : "bad"} />
                  </td>
                  <td>
                    <form method="post" action={`/admin/connections/${r.id}/verify`}>
                      <Csrf token={c.var.csrf} />
                      <button class="secondary" type="submit">
                        Re-check
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colspan={6} class="muted">
                    No connections yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <h2>Add a connection</h2>
        <div class="two">
          <form method="post" action="/admin/connections" class="card">
            <Csrf token={c.var.csrf} />
            <Field id="label" label="Name">
              <input id="label" name="label" required maxlength={80} placeholder="Bella Salon (customer)" />
            </Field>
            <Field id="owner" label="Whose account is it?">
              <select id="owner" name="owner">
                <option value="customer">The customer's own account (recommended)</option>
                <option value="maison">Maison Web Studio's account</option>
              </select>
            </Field>
            <Field id="account" label="Account ID">
              <input id="account" name="accountId" required pattern="[a-fA-F0-9]{32}" maxlength={32} />
            </Field>
            <Field id="token" label="API token">
              <input id="token" name="token" type="password" required autocomplete="off" maxlength={200} />
            </Field>
            <button type="submit">Save and verify</button>
          </form>
          <div class="card small">
            <h3 style="margin-top:0">How the customer creates a token</h3>
            <ol>
              <li>Cloudflare dashboard → My Profile → API Tokens → Create Token → Custom token.</li>
              <li>
                Permissions: <strong>Account · Workers Scripts · Edit</strong>; and, for a custom domain, <strong>Zone · Workers Routes · Edit</strong>, <strong>Zone · DNS · Edit</strong> and <strong>Zone · Zone · Read</strong> on that domain.
              </li>
              <li>Account resources: only their account. Zone resources: only their domain.</li>
              <li>Send you the token securely (not by plain email), plus the Account ID from the dashboard sidebar.</li>
              <li>They can revoke the token at any time — the website keeps running in their account.</li>
            </ol>
          </div>
        </div>
      </>,
      error ? 400 : 200,
      error,
    );
  }
  admin.post("/connections", async (c) => {
    const f = await form(c);
    try {
      const r = await addConnection(c.var.studio, c.var.admin, { label: f("label"), owner: f("owner"), accountId: f("accountId"), token: f("token") });
      if (!r.ok) return connectionsPage(c, `Saved, but Cloudflare rejected the token: ${r.message}`);
    } catch (err) {
      return connectionsPage(c, err instanceof Error ? err.message : "Could not save.");
    }
    return c.redirect("/admin/connections?m=connection", 303);
  });
  admin.post("/connections/:id/verify", async (c) => {
    try {
      const { cf } = await client(c.var.studio, c.req.param("id"));
      const r = await cf.verify();
      await c.var.deps.db.prepare("UPDATE cloudflare_connections SET status = ?, workers_subdomain = ?, verified_at = ? WHERE id = ?").bind(r.ok ? "verified" : "invalid", r.subdomain, r.ok ? nowIso() : null, c.req.param("id")).run();
      await audit(c.var.deps.db, c.var.admin, "cloudflare.connection_verify", c.req.param("id"), { ok: r.ok });
      if (!r.ok) return connectionsPage(c, r.message);
    } catch (err) {
      return connectionsPage(c, err instanceof Error ? err.message : "Verification failed.");
    }
    return c.redirect("/admin/connections?m=connection", 303);
  });
}
