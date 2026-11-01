import { Hono, type Context } from "hono";
import { audit, nowIso, parseJson } from "../db";
import { liveSendingBlockers, type Env } from "../env";
import { getEvidence, getLead, updateLead, type LeadRow } from "../leads";
import { ALLOWED_NUMBERS, importCandidates } from "../pipeline";
import { fromCsv } from "../discovery/sources";
import { validateDraft } from "../email/validator";
import { composeEmail } from "../email/compose";
import { getSettings, targetSchema, updateSettings, type Settings } from "../settings";
import { suppress, unsuppress } from "../suppression";
import { normalizeEmail, US_STATES } from "../text";
import { checkCsrf, csrfToken } from "../security";
import { dashboardStats } from "./stats";
import { Badge, Csrf, Field, fmtDate, Layout, ModeBanner, safeHref, Stat } from "./views";
import type { AppEnv } from "../app";
import { registerProjectRoutes } from "./projects";

const FLASH: Record<string, { kind: "good" | "warn" | "bad"; text: string }> = {
  saved: { kind: "good", text: "Saved." },
  approved: { kind: "good", text: "Approved. It will be sent within your sending rules." },
  rejected: { kind: "warn", text: "Draft rejected; it will not be sent." },
  queued: { kind: "good", text: "Queued for processing. Refresh in a minute." },
  suppressed: { kind: "good", text: "Address added to the suppression list. Nothing more will be sent to it." },
  unsuppressed: { kind: "warn", text: "Address removed from the suppression list (recorded in the activity log)." },
  imported: { kind: "good", text: "Import finished." },
  discovery: { kind: "good", text: "Discovery started. New leads appear as they are processed." },
  mode: { kind: "good", text: "Mode updated." },
  handled: { kind: "good", text: "Marked as handled." },
};

const STAGES = ["new", "qualified", "needs_contact", "not_qualified", "review", "approved", "contacted", "follow_up", "replied", "interested", "customer", "not_interested", "unsubscribed", "bounced", "closed"];
const STATUSES = ["NO_WEBSITE", "SOCIAL_ONLY", "WEBSITE_BROKEN", "WEBSITE_OUTDATED", "WEBSITE_NEEDS_IMPROVEMENT", "GOOD_WEBSITE", "UNCERTAIN"];
const REPLIES = ["INTERESTED", "QUESTION", "NOT_INTERESTED", "UNSUBSCRIBE", "OUT_OF_OFFICE", "BOUNCE", "UNCERTAIN"];
const GROUPS = ["salon", "barbershop", "spa", "restaurant", "cafe", "bakery", "boutique", "contractor", "cleaning", "photographer", "events", "fitness", "professional", "other"];

type C = Context<AppEnv>;

async function page(c: C, title: string, path: string, body: unknown, status = 200) {
  const s = await getSettings(c.var.deps.db);
  const flash = FLASH[c.req.query("m") ?? ""] ?? null;
  return c.html(
    <Layout title={title} path={path} admin={c.var.admin} flash={flash} modeBanner={<ModeBanner automated={s.automatedSending} testMode={s.testMode} paused={s.sendingPaused} />}>
      {body as never}
    </Layout>,
    status as 200,
  );
}

// Bodies are always parsed with { all: true } because Hono caches the first parse.
const form = async (c: C) => {
  const f = await c.req.parseBody({ all: true });
  return (k: string) => {
    const v = Array.isArray(f[k]) ? (f[k] as unknown[])[0] : f[k];
    return typeof v === "string" ? v : "";
  };
};

export const admin = new Hono<AppEnv>({ strict: false });

// CSRF + same-origin enforcement for every state-changing request.
admin.use("*", async (c, next) => {
  c.set("csrf", await csrfToken(c.var.deps.config, c.var.admin));
  if (c.req.method === "POST") {
    const f = await c.req.parseBody({ all: true });
    const raw = Array.isArray(f._csrf) ? f._csrf[0] : f._csrf;
    const token = typeof raw === "string" ? raw : null;
    if (!(await checkCsrf(c.var.deps.config, c.var.admin, token))) return c.text("Invalid or expired form token. Go back, refresh and try again.", 403);
  }
  await next();
});

// ---------------------------------------------------------------- dashboard
admin.get("/outreach", async (c) => {
  const s = await dashboardStats(c.var.deps.db, c.var.deps.config.senderTimezone);
  return page(
    c,
    "Outreach",
    "/admin/outreach",
    <>
      {(s.attention.interested > 0 || s.attention.review > 0 || s.attention.failed > 0) && (
        <div class="banner warn">
          <strong>Needs you:</strong>{" "}
          {s.attention.interested > 0 && <a href="/admin/replies">{s.attention.interested} replies to answer</a>}
          {s.attention.interested > 0 && s.attention.review > 0 && " · "}
          {s.attention.review > 0 && <a href="/admin/review">{s.attention.review} emails to review</a>}
          {s.attention.failed > 0 && <> · <a href="/admin/leads?email=failed">{s.attention.failed} failed sends</a></>}
        </div>
      )}
      <h2>Today</h2>
      <div class="grid">
        <Stat label="Leads discovered" value={s.today.discovered} />
        <Stat label="Leads qualified" value={s.today.qualified} />
        <Stat label="Emails sent" value={s.today.sent} />
        <Stat label="Emails delivered" value={s.today.delivered} />
        <Stat label="Replies" value={s.today.replies} />
        <Stat label="Interested prospects" value={s.today.interested} />
        <Stat label="Meetings / leads generated" value={s.today.meetings} />
      </div>
      <h2>Pipeline</h2>
      <div class="grid">
        {Object.entries(s.pipeline).map(([k, v]) => (
          <a class="card stat" style="text-decoration:none" href={`/admin/leads?stage=${encodeURIComponent(pipelineStage(k))}`}>
            <div class="n">{v}</div>
            <div class="l">{k}</div>
          </a>
        ))}
      </div>
      <h2>Performance (all time)</h2>
      <div class="grid">
        {Object.entries(s.totals).map(([k, v]) => (
          <Stat label={k} value={v} />
        ))}
      </div>
      <p class="small muted">Delivered = sent and not bounced (the mailbox does not report final inbox placement). Visits come from the website's UTM links, counted without cookies.</p>
    </>,
  );
});

const pipelineStage = (label: string) =>
  ({ New: "new", Qualified: "qualified", "In review": "review", Contacted: "contacted", "Follow-up": "follow_up", Replied: "replied", Interested: "interested", Customer: "customer", "Not interested": "not_interested", Unsubscribed: "unsubscribed", "Not qualified": "not_qualified" })[label] ?? "";

// ---------------------------------------------------------------- leads
admin.get("/leads", async (c) => {
  const q = c.req.query();
  const where: string[] = [];
  const args: unknown[] = [];
  const add = (sql: string, v: unknown) => {
    where.push(sql);
    args.push(v);
  };
  if (q.q) add("(name LIKE ? ESCAPE '\\')", `%${q.q.replace(/[%_\\]/g, "\\$&").slice(0, 80)}%`);
  if (q.industry && GROUPS.includes(q.industry)) add("category_group = ?", q.industry);
  if (q.state && US_STATES[q.state]) add("state = ?", q.state);
  if (q.city) add("city LIKE ?", `${q.city.slice(0, 60)}%`);
  if (q.min_score && /^\d+$/.test(q.min_score)) add("lead_score >= ?", Number(q.min_score));
  if (q.status && STATUSES.includes(q.status)) add("website_status = ?", q.status);
  if (q.stage && STAGES.includes(q.stage)) add("stage = ?", q.stage);
  if (q.reply && REPLIES.includes(q.reply)) add("reply_status = ?", q.reply);
  if (q.email === "failed") where.push("id IN (SELECT lead_id FROM messages WHERE status = 'failed')");
  const pageNo = Math.max(1, Number(q.page) || 1);
  const rows = await c.var.deps.db
    .prepare(`SELECT * FROM leads ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY COALESCE(lead_score, -1) DESC, created_at DESC LIMIT 51 OFFSET ?`)
    .bind(...args, (pageNo - 1) * 50)
    .all<LeadRow>();
  const more = rows.results.length > 50;
  const qs = (p: number) => `?${new URLSearchParams({ ...q, page: String(p) })}`;
  const sel = (name: string, label: string, options: string[]) => (
    <div>
      <label for={`f-${name}`}>{label}</label>
      <select id={`f-${name}`} name={name}>
        <option value="">Any</option>
        {options.map((o) => (
          <option value={o} selected={q[name] === o}>
            {o.replace(/_/g, " ").toLowerCase()}
          </option>
        ))}
      </select>
    </div>
  );
  return page(
    c,
    "Leads",
    "/admin/leads",
    <>
      <form class="filters" method="get" role="search" aria-label="Filter leads">
        <div>
          <label for="f-q">Search</label>
          <input id="f-q" name="q" value={q.q ?? ""} placeholder="Business name" />
        </div>
        {sel("industry", "Industry", GROUPS)}
        <div>
          <label for="f-state">State</label>
          <select id="f-state" name="state">
            <option value="">Any</option>
            {Object.keys(US_STATES).map((s) => (
              <option value={s} selected={q.state === s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label for="f-city">City</label>
          <input id="f-city" name="city" value={q.city ?? ""} size={12} />
        </div>
        <div>
          <label for="f-min">Min score</label>
          <input id="f-min" name="min_score" type="number" min="0" max="100" value={q.min_score ?? ""} style="width:6em" />
        </div>
        {sel("status", "Website status", STATUSES)}
        {sel("stage", "Outreach status", STAGES)}
        {sel("reply", "Reply status", REPLIES)}
        <button type="submit">Filter</button>
        <a class="btn secondary" href="/admin/leads">
          Clear
        </a>
      </form>
      <div class="table-wrap" tabindex={0} role="region" aria-label="Table (scrolls sideways on small screens)">
        <table>
          <caption class="sr-only">Leads</caption>
          <thead>
            <tr>
              <th scope="col">Business</th>
              <th scope="col">Location</th>
              <th scope="col">Website status</th>
              <th scope="col">Score</th>
              <th scope="col">Outreach</th>
              <th scope="col">Reply</th>
              <th scope="col">Contact</th>
            </tr>
          </thead>
          <tbody>
            {rows.results.slice(0, 50).map((l) => (
              <tr>
                <td>
                  <a href={`/admin/leads/${l.id}`}>{l.name}</a>
                  <div class="small muted">{l.category ?? l.category_group}</div>
                </td>
                <td>{[l.city, l.state].filter(Boolean).join(", ")}</td>
                <td>
                  <Badge value={l.website_status} />
                </td>
                <td>
                  {l.lead_score ?? "—"} <Badge value={l.priority} />
                </td>
                <td>
                  <Badge value={l.stage} kind="stage" />
                </td>
                <td>
                  <Badge value={l.reply_status} />
                </td>
                <td class="small">{l.email ? "email" : l.phone ? "phone only" : "—"}</td>
              </tr>
            ))}
            {rows.results.length === 0 && (
              <tr>
                <td colspan={7} class="muted">
                  No leads match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <nav class="pager" aria-label="Pages">
        {pageNo > 1 && (
          <a class="btn secondary" href={qs(pageNo - 1)}>
            Previous
          </a>
        )}
        {more && (
          <a class="btn secondary" href={qs(pageNo + 1)}>
            Next
          </a>
        )}
      </nav>
    </>,
  );
});

type MessageRow = { id: string; step: number; to_email: string; subject: string; body_text: string; landing_path: string; status: string; validation_errors: string; sent_at: string | null; last_error: string | null; approved_by: string | null };

admin.get("/leads/:id", async (c) => {
  const { db, config } = c.var.deps;
  const lead = await getLead(db, c.req.param("id"));
  if (!lead) return c.notFound();
  const evidence = await getEvidence(db, lead.id);
  const messages = (await db.prepare("SELECT * FROM messages WHERE lead_id = ? ORDER BY step").bind(lead.id).all<MessageRow>()).results;
  const replies = (await db.prepare("SELECT * FROM replies WHERE lead_id = ? ORDER BY received_at DESC").bind(lead.id).all<{ id: string; classification: string; summary: string; snippet: string; received_at: string; handled: number }>()).results;
  const auditRow = await db.prepare("SELECT * FROM website_audits WHERE lead_id = ? ORDER BY id DESC LIMIT 1").bind(lead.id).first<{ final_url: string; http_status: number; pagespeed_mobile: number | null; accessibility_score: number | null; checked_at: string }>();
  const research = parseJson<Record<string, unknown>>(lead.research, {});
  const reasons = parseJson<string[]>(lead.score_reasons, []);
  const csrf = c.var.csrf;
  const preview = async (m: MessageRow) => (await composeEmail({ ...config, appSecret: config.appSecret || "preview" }, { leadId: lead.id, to: m.to_email, subject: m.subject, body: m.body_text, landingPath: m.landing_path, step: m.step })).text;
  const previews = await Promise.all(messages.map(preview));
  const act = (action: string, label: string, cls = "secondary") => (
    <form method="post" action={`/admin/leads/${lead.id}/action`} style="display:inline">
      <Csrf token={csrf} />
      <input type="hidden" name="action" value={action} />
      <button class={cls} type="submit">
        {label}
      </button>
    </form>
  );
  return page(
    c,
    lead.name,
    "/admin/leads",
    <>
      <p class="row">
        <Badge value={lead.website_status} /> <Badge value={lead.priority} /> <span>Score {lead.lead_score ?? "—"}</span> <Badge value={lead.stage} kind="stage" />
        {lead.unsubscribed ? <Badge value="unsubscribed" kind="bad" /> : null}
      </p>
      {lead.processing_error && <p class="banner bad">{lead.processing_error}</p>}
      <div class="two">
        <section aria-labelledby="h-msgs">
          <h2 id="h-msgs">Emails</h2>
          {messages.length === 0 && <p class="muted">No email drafted yet{lead.email ? "" : " — no verified public email (see the call list)"}.</p>}
          {messages.map((m, i) => {
            const errs = parseJson<string[]>(m.validation_errors, []);
            const editable = ["draft", "needs_edit", "approved"].includes(m.status);
            return (
              <div class="card" style="margin-bottom:12px">
                <p class="row">
                  <strong>{m.step === 0 ? "First email" : `Follow-up ${m.step}`}</strong> <Badge value={m.status} kind="stage" />
                  <span class="small muted">to {m.to_email}</span>
                  {m.sent_at && <span class="small muted">sent {fmtDate(m.sent_at)}</span>}
                </p>
                {m.last_error && <p class="small muted">Note: {m.last_error}</p>}
                {errs.length > 0 && (
                  <div class="banner warn">
                    <strong>Checker found problems:</strong>
                    <ul>
                      {errs.map((e) => (
                        <li>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {editable ? (
                  <form method="post" action={`/admin/messages/${m.id}`}>
                    <Csrf token={csrf} />
                    <Field id={`subj-${m.id}`} label="Subject">
                      <input id={`subj-${m.id}`} name="subject" value={m.subject} maxlength={120} style="width:100%" />
                    </Field>
                    <Field id={`body-${m.id}`} label="Body (signature, link, address and unsubscribe are added automatically)">
                      <textarea id={`body-${m.id}`} name="body" maxlength={4000}>
                        {m.body_text}
                      </textarea>
                    </Field>
                    <Field id={`land-${m.id}`} label="Link to">
                      <select id={`land-${m.id}`} name="landing_path">
                        {["/work", "/pricing", "/services", "/process", "/start", "/"].map((p) => (
                          <option value={p} selected={m.landing_path === p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </Field>
                    {errs.length > 0 && (
                      <p>
                        <input type="checkbox" id={`ov-${m.id}`} name="override" value="1" /> <label for={`ov-${m.id}`} style="display:inline">I checked every statement and it is accurate — approve despite the warnings</label>
                      </p>
                    )}
                    <div class="row">
                      <button type="submit" name="action" value="approve">
                        Approve
                      </button>
                      <button class="secondary" type="submit" name="action" value="save">
                        Save
                      </button>
                      <button class="secondary" type="submit" name="action" value="regenerate">
                        Regenerate
                      </button>
                      <button class="danger" type="submit" name="action" value="reject">
                        Reject
                      </button>
                    </div>
                  </form>
                ) : null}
                <details style="margin-top:10px">
                  <summary>Preview the full email as sent</summary>
                  <pre class="email">{`Subject: ${m.subject}\n\n${previews[i]}`}</pre>
                </details>
              </div>
            );
          })}
          <h2>Replies</h2>
          {replies.length === 0 ? (
            <p class="muted">None.</p>
          ) : (
            <ul class="plain">
              {replies.map((r) => (
                <li>
                  <Badge value={r.classification} /> {r.summary} <span class="small muted">{fmtDate(r.received_at)}</span>
                  <div class="small">{r.snippet}</div>
                </li>
              ))}
            </ul>
          )}
          <h2>Actions</h2>
          <div class="row">
            {act("mark_meeting", "Meeting booked")}
            {act("mark_customer", "Became a customer")}
            {act("mark_not_interested", "Not interested")}
            {act("close", "Close (stop all emails)")}
            {act("reprocess", "Re-check website & re-score")}
            {lead.email && !lead.unsubscribed ? act("suppress", "Do not contact", "danger") : null}
          </div>
          <form method="post" action={`/admin/leads/${lead.id}/action`} style="margin-top:12px">
            <Csrf token={csrf} />
            <input type="hidden" name="action" value="note" />
            <Field id="notes" label="Notes">
              <textarea id="notes" name="notes" style="min-height:80px" maxlength={4000}>
                {lead.notes ?? ""}
              </textarea>
            </Field>
            <button class="secondary" type="submit">
              Save notes
            </button>
          </form>
        </section>
        <section aria-labelledby="h-facts">
          <h2 id="h-facts">Business</h2>
          <ul class="plain">
            <li>Category: {lead.category ?? "—"} ({lead.category_group})</li>
            <li>Location: {[lead.city, lead.state].filter(Boolean).join(", ") || "—"}</li>
            <li>
              Website:{" "}
              {safeHref(lead.website) ? (
                <a href={safeHref(lead.website)} rel="noopener noreferrer nofollow" target="_blank">
                  {lead.website}
                </a>
              ) : lead.website ? (
                lead.website
              ) : (
                "none on record"
              )}
            </li>
            <li>Email: {lead.email ?? "—"} {lead.email_source_url && <span class="small muted">(published at {lead.email_source_url})</span>}</li>
            <li>Phone: {lead.phone ?? "—"}</li>
            <li>Social: {parseJson<string[]>(lead.social_links, []).join(", ") || "—"}</li>
            <li>Source: {lead.source} · discovered {fmtDate(lead.date_discovered)}</li>
            {auditRow && (
              <li>
                Last check: HTTP {auditRow.http_status ?? "—"} · mobile speed {auditRow.pagespeed_mobile ?? "n/a"} · accessibility {auditRow.accessibility_score ?? "n/a"} · {fmtDate(auditRow.checked_at)}
              </li>
            )}
          </ul>
          <h3>Why Maison can help</h3>
          <p>{lead.why_maison_can_help ?? <span class="muted">Not researched yet.</span>}</p>
          <h3>Personalized observation</h3>
          <p>{lead.personalized_observation ?? "—"}</p>
          {typeof research.best_opportunity === "string" && (
            <>
              <h3>Best opportunity</h3>
              <p>{research.best_opportunity}</p>
            </>
          )}
          <h3>Score breakdown</h3>
          <ul>
            {reasons.map((r) => (
              <li class="small">{r}</li>
            ))}
          </ul>
          <h3>Evidence</h3>
          <ol class="small">
            {evidence.map((e) => (
              <li value={e.id}>
                {e.statement}{" "}
                {safeHref(e.source_url) && (
                  <a href={safeHref(e.source_url)} rel="noopener noreferrer nofollow" target="_blank">
                    source
                  </a>
                )}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>,
  );
});

admin.post("/leads/:id/action", async (c) => {
  const { db } = c.var.deps;
  const lead = await getLead(db, c.req.param("id"));
  if (!lead) return c.notFound();
  const f = await form(c);
  const action = f("action");
  const stop = () =>
    db.prepare("UPDATE messages SET status = 'cancelled', last_error = ?, updated_at = ? WHERE lead_id = ? AND status IN ('draft','needs_edit','approved','queued')").bind(`stopped by ${c.var.admin}`, nowIso(), lead.id).run();
  switch (action) {
    case "mark_meeting":
      await stop();
      await updateLead(db, lead.id, { conversion_status: "meeting", stage: "interested", next_follow_up: null });
      break;
    case "mark_customer":
      await stop();
      await updateLead(db, lead.id, { conversion_status: "customer", stage: "customer", next_follow_up: null });
      break;
    case "mark_not_interested":
      if (lead.email) await suppress(db, { email: lead.email, reason: "not_interested", source: "admin", leadId: lead.id, actor: c.var.admin });
      else await updateLead(db, lead.id, { stage: "not_interested" });
      break;
    case "close":
      await stop();
      await updateLead(db, lead.id, { stage: "closed", next_follow_up: null });
      break;
    case "suppress":
      if (lead.email) await suppress(db, { email: lead.email, reason: "do_not_contact", source: "admin", leadId: lead.id, actor: c.var.admin });
      break;
    case "reprocess":
      await updateLead(db, lead.id, { stage: "new", processing_error: null });
      await c.var.deps.jobs.send({ type: "process_lead", leadId: lead.id });
      await audit(db, c.var.admin, "lead.reprocess", lead.id);
      return c.redirect(`/admin/leads/${lead.id}?m=queued`, 303);
    case "note":
      await updateLead(db, lead.id, { notes: f("notes").slice(0, 4000) });
      break;
    default:
      return c.text("Unknown action", 400);
  }
  await audit(db, c.var.admin, `lead.${action}`, lead.id);
  return c.redirect(`/admin/leads/${lead.id}?m=${action === "suppress" || action === "mark_not_interested" ? "suppressed" : "saved"}`, 303);
});

admin.post("/messages/:id", async (c) => {
  const { db } = c.var.deps;
  const m = await db.prepare("SELECT * FROM messages WHERE id = ?").bind(c.req.param("id")).first<MessageRow & { lead_id: string; evidence_ids: string }>();
  if (!m) return c.notFound();
  const lead = (await getLead(db, m.lead_id))!;
  const f = await form(c);
  const action = f("action");
  const back = (code: string) => c.redirect(`/admin/leads/${lead.id}?m=${code}`, 303);
  if (!["draft", "needs_edit", "approved"].includes(m.status)) return c.text("This email can no longer be changed.", 409);

  if (action === "reject") {
    await db.prepare("UPDATE messages SET status = 'cancelled', last_error = ?, updated_at = ? WHERE id = ?").bind(`rejected by ${c.var.admin}`, nowIso(), m.id).run();
    if (m.step === 0) await updateLead(db, lead.id, { stage: "qualified", email_status: "cancelled" });
    await audit(db, c.var.admin, "message.reject", m.id);
    return back("rejected");
  }
  if (action === "regenerate") {
    const { createDraft } = await import("../pipeline");
    await db.prepare("UPDATE messages SET status = 'cancelled', updated_at = ? WHERE id = ?").bind(nowIso(), m.id).run();
    await createDraft(c.var.deps, lead.id, m.step as 0 | 1 | 2);
    await audit(db, c.var.admin, "message.regenerate", m.id);
    return back("saved");
  }

  const subject = f("subject").trim().slice(0, 120);
  const body = f("body").replace(/\r\n/g, "\n").trim().slice(0, 4000);
  const landing = ["/work", "/pricing", "/services", "/process", "/start", "/"].includes(f("landing_path")) ? f("landing_path") : m.landing_path;
  const evidence = await getEvidence(db, lead.id);
  const recent = (await db.prepare("SELECT body_text FROM messages WHERE lead_id != ? AND step = ? ORDER BY created_at DESC LIMIT 30").bind(lead.id, m.step).all<{ body_text: string }>()).results.map((r) => r.body_text);
  const errors = validateDraft({
    draft: { subject, body, landing_page: landing as "/work", evidence_ids: parseJson<number[]>(m.evidence_ids, []) },
    step: m.step as 0 | 1 | 2,
    businessName: lead.name,
    websiteStatus: lead.website_status,
    evidence: evidence.map((e) => ({ id: e.id, statement: e.statement, source_url: e.source_url })),
    allowedNumbers: ALLOWED_NUMBERS,
    recentBodies: recent,
  });
  const approve = action === "approve";
  if (approve && (!lead.email || lead.unsubscribed)) return c.text("This lead has no usable email or has opted out.", 409);
  const override = approve && errors.length > 0 && f("override") === "1";
  const status = approve && (errors.length === 0 || override) ? "approved" : errors.length ? "needs_edit" : "draft";
  await db
    .prepare("UPDATE messages SET subject = ?, body_text = ?, landing_path = ?, status = ?, validation_errors = ?, approved_by = ?, approved_at = ?, updated_at = ? WHERE id = ?")
    .bind(subject, body, landing, status, JSON.stringify(errors), status === "approved" ? c.var.admin : null, status === "approved" ? nowIso() : null, nowIso(), m.id)
    .run();
  if (m.step === 0) await updateLead(db, lead.id, { stage: status === "approved" ? "approved" : "review", email_status: status });
  await audit(db, c.var.admin, approve ? "message.approve" : "message.save", m.id, { status, override, warnings: errors.length });
  return back(status === "approved" ? "approved" : "saved");
});

// ---------------------------------------------------------------- review queue
admin.get("/review", async (c) => {
  const rows = await c.var.deps.db
    .prepare(
      `SELECT m.id, m.step, m.subject, m.status, m.validation_errors, m.body_text, l.id AS lead_id, l.name, l.city, l.state, l.lead_score, l.priority, l.website_status
       FROM messages m JOIN leads l ON l.id = m.lead_id WHERE m.status IN ('draft','needs_edit') ORDER BY l.lead_score DESC LIMIT 100`,
    )
    .all<{ id: string; step: number; subject: string; status: string; validation_errors: string; body_text: string; lead_id: string; name: string; city: string; state: string; lead_score: number; priority: string; website_status: string }>();
  return page(
    c,
    "Review queue",
    "/admin/review",
    <>
      <p class="muted">Every email here was written from verified evidence and passed (or failed) the honesty checker. Open one to read it, edit it, and approve it. Nothing is sent without approval in review mode.</p>
      {rows.results.length === 0 && <p class="card">Nothing to review right now.</p>}
      {rows.results.map((r) => (
        <article class="card" style="margin-bottom:10px">
          <p class="row">
            <a href={`/admin/leads/${r.lead_id}`}>
              <strong>{r.name}</strong>
            </a>
            <span class="small muted">{[r.city, r.state].filter(Boolean).join(", ")}</span>
            <Badge value={r.priority} /> <Badge value={r.website_status} /> <Badge value={r.status} kind="stage" />
            {r.step > 0 && <span class="badge">follow-up {r.step}</span>}
          </p>
          <p>
            <strong>{r.subject}</strong>
          </p>
          <pre class="email">{r.body_text}</pre>
          {parseJson<string[]>(r.validation_errors, []).length > 0 && <p class="small" style="color:var(--bad)">Checker: {parseJson<string[]>(r.validation_errors, []).join(" ")}</p>}
        </article>
      ))}
    </>,
  );
});

// ---------------------------------------------------------------- calls (no email)
admin.get("/calls", async (c) => {
  const rows = await c.var.deps.db.prepare("SELECT * FROM leads WHERE stage = 'needs_contact' ORDER BY lead_score DESC LIMIT 200").all<LeadRow>();
  return page(
    c,
    "Call / message list",
    "/admin/calls",
    <>
      <p class="muted">Qualified businesses with no verified public email. Reach out by phone or by messaging their business profile yourself — the system never scrapes or guesses addresses.</p>
      <div class="table-wrap" tabindex={0} role="region" aria-label="Table (scrolls sideways on small screens)">
        <table>
          <thead>
            <tr>
              <th scope="col">Business</th>
              <th scope="col">Phone</th>
              <th scope="col">Social</th>
              <th scope="col">Talking point</th>
            </tr>
          </thead>
          <tbody>
            {rows.results.map((l) => (
              <tr>
                <td>
                  <a href={`/admin/leads/${l.id}`}>{l.name}</a>
                  <div class="small muted">
                    {[l.city, l.state].filter(Boolean).join(", ")} · {l.lead_score}
                  </div>
                </td>
                <td>{l.phone ?? "—"}</td>
                <td class="small">{parseJson<string[]>(l.social_links, []).slice(0, 2).join(" ") || "—"}</td>
                <td class="small">{l.why_maison_can_help ?? "—"}</td>
              </tr>
            ))}
            {rows.results.length === 0 && (
              <tr>
                <td colspan={4} class="muted">
                  Empty.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>,
  );
});

// ---------------------------------------------------------------- replies
admin.get("/replies", async (c) => {
  const show = c.req.query("all") ? "" : "WHERE r.handled = 0 AND r.classification NOT IN ('BOUNCE','OUT_OF_OFFICE')";
  const rows = await c.var.deps.db
    .prepare(`SELECT r.*, l.name FROM replies r LEFT JOIN leads l ON l.id = r.lead_id ${show} ORDER BY CASE r.classification WHEN 'INTERESTED' THEN 0 WHEN 'QUESTION' THEN 1 ELSE 2 END, r.received_at DESC LIMIT 200`)
    .all<{ id: string; lead_id: string; name: string; classification: string; summary: string; snippet: string; received_at: string; handled: number; from_email: string }>();
  return page(
    c,
    "Replies",
    "/admin/replies",
    <>
      <p class="muted">
        Interested prospects are listed first. Reply to them yourself from the outreach mailbox — the system never sends AI replies. <a href="/admin/replies?all=1">Show all, including handled, bounces and auto-replies</a>.
      </p>
      {rows.results.length === 0 && <p class="card">No replies waiting.</p>}
      {rows.results.map((r) => (
        <article class="card" style="margin-bottom:10px">
          <p class="row">
            <Badge value={r.classification} /> <a href={`/admin/leads/${r.lead_id}`}>{r.name ?? r.from_email}</a> <span class="small muted">{fmtDate(r.received_at)}</span>
          </p>
          <p>{r.summary}</p>
          <p class="small muted">{r.snippet}</p>
          {!r.handled && (
            <form method="post" action={`/admin/replies/${r.id}/handled`}>
              <Csrf token={c.var.csrf} />
              <button class="secondary" type="submit">
                Mark handled
              </button>
            </form>
          )}
        </article>
      ))}
    </>,
  );
});

admin.post("/replies/:id/handled", async (c) => {
  await c.var.deps.db.prepare("UPDATE replies SET handled = 1 WHERE id = ?").bind(c.req.param("id")).run();
  await audit(c.var.deps.db, c.var.admin, "reply.handled", c.req.param("id"));
  return c.redirect("/admin/replies?m=handled", 303);
});

// ---------------------------------------------------------------- discovery
admin.get("/discovery", async (c) => {
  const s = await getSettings(c.var.deps.db);
  const runs = await c.var.deps.db.prepare("SELECT * FROM runs WHERE kind = 'discovery' ORDER BY started_at DESC LIMIT 10").all<{ id: string; status: string; started_at: string; stats: string; error: string | null }>();
  return page(
    c,
    "Lead discovery",
    "/admin/discovery",
    <>
      <p class="muted">
        Each weekday morning the agent searches the next target below (if scheduled discovery is on), researches what it finds, and adds qualified emails to the review queue. AI web research is used when the Claude API is configured; otherwise OpenStreetMap data. Data © OpenStreetMap contributors (ODbL) where used.
      </p>
      <form method="post" action="/admin/discovery/targets" class="card">
        <Csrf token={c.var.csrf} />
        <Field id="targets" label="Targets — one per line: category, city, state" hint="Example: nail salon, Brooklyn, NY">
          <textarea id="targets" name="targets" aria-describedby="targets-hint">
            {s.discoveryTargets.map((t) => `${t.category}, ${t.city}, ${t.state}`).join("\n")}
          </textarea>
        </Field>
        <div class="row">
          <label style="display:inline">
            <input type="checkbox" name="enabled" value="1" checked={s.discoveryEnabled} /> Run discovery automatically on weekday mornings
          </label>
        </div>
        <Field id="per" label="Businesses per run">
          <input id="per" name="per_run" type="number" min="1" max="50" value={String(s.discoveryPerRun)} />
        </Field>
        <button type="submit">Save targets</button>
      </form>
      <form method="post" action="/admin/discovery/run" class="row" style="margin:12px 0">
        <Csrf token={c.var.csrf} />
        <label for="ti" class="sr-only">
          Target to search now
        </label>
        <select id="ti" name="target">
          {s.discoveryTargets.map((t, i) => (
            <option value={String(i)}>{`${t.category}, ${t.city}, ${t.state}`}</option>
          ))}
        </select>
        <button type="submit" disabled={!s.discoveryTargets.length}>
          Run discovery now
        </button>
      </form>
      <h2>Import a CSV</h2>
      <form method="post" action="/admin/discovery/import" enctype="multipart/form-data" class="card">
        <Csrf token={c.var.csrf} />
        <p class="small muted">
          Columns: name, category, city, state, website, email, email_source_url, phone, social, description, notes. Only include public business contact details you are allowed to use. Maximum 1,000 rows.
        </p>
        <Field id="csv" label="CSV file">
          <input id="csv" name="file" type="file" accept=".csv,text/csv" required />
        </Field>
        <button type="submit">Import and research</button>
      </form>
      <h2>Recent runs</h2>
      <ul class="plain small">
        {runs.results.map((r) => (
          <li>
            {fmtDate(r.started_at)} · <Badge value={r.status} /> · {r.error ?? r.stats}
          </li>
        ))}
      </ul>
    </>,
  );
});

admin.post("/discovery/targets", async (c) => {
  const f = await form(c);
  const lines = f("targets").split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 100);
  const targets = [];
  const bad: string[] = [];
  for (const line of lines) {
    const [category, city, state] = line.split(",").map((p) => p.trim());
    const t = targetSchema.safeParse({ category, city, state });
    if (t.success && US_STATES[t.data.state]) targets.push(t.data);
    else bad.push(line);
  }
  if (bad.length) return page(c, "Lead discovery", "/admin/discovery", <p class="banner bad">These lines are not "category, city, ST": {bad.join(" | ")}. Go back and fix them.</p>, 400);
  await updateSettings(c.var.deps.db, c.var.admin, { discoveryTargets: targets, discoveryEnabled: f("enabled") === "1", discoveryPerRun: Math.min(50, Math.max(1, Number(f("per_run")) || 15)), discoveryCursor: 0 });
  return c.redirect("/admin/discovery?m=saved", 303);
});

admin.post("/discovery/run", async (c) => {
  const f = await form(c);
  await c.var.deps.jobs.send({ type: "discover", targetIndex: Number(f("target")) || 0, manual: true });
  await audit(c.var.deps.db, c.var.admin, "discovery.run", f("target"));
  return c.redirect("/admin/discovery?m=discovery", 303);
});

admin.post("/discovery/import", async (c) => {
  const body = await c.req.parseBody({ all: true });
  const file = Array.isArray(body.file) ? body.file[0] : body.file;
  if (!(file instanceof File) || file.size === 0 || file.size > 2_000_000) return page(c, "Lead discovery", "/admin/discovery", <p class="banner bad">Choose a CSV file under 2 MB.</p>, 400);
  const { candidates, errors } = fromCsv(await file.text());
  const result = await importCandidates(c.var.deps, candidates);
  await audit(c.var.deps.db, c.var.admin, "csv.import", null, { rows: candidates.length, inserted: result.inserted, duplicates: result.duplicates });
  return page(
    c,
    "Import results",
    "/admin/discovery",
    <div class="card">
      <p>
        Added {result.inserted} businesses; skipped {result.duplicates} duplicates.
      </p>
      {[...errors, ...result.invalid].length > 0 && (
        <ul class="small">
          {[...errors, ...result.invalid].slice(0, 50).map((e) => (
            <li>{e}</li>
          ))}
        </ul>
      )}
      <a class="btn" href="/admin/leads?stage=new">
        See new leads
      </a>
    </div>,
  );
});

// ---------------------------------------------------------------- suppression
admin.get("/suppression", async (c) => {
  const q = (c.req.query("q") ?? "").trim().toLowerCase();
  const rows = await c.var.deps.db
    .prepare(`SELECT * FROM suppression ${q ? "WHERE email LIKE ?" : ""} ORDER BY created_at DESC LIMIT 200`)
    .bind(...(q ? [`%${q.replace(/[%_]/g, "")}%`] : []))
    .all<{ email: string; reason: string; source: string; created_at: string; notes: string | null }>();
  return page(
    c,
    "Suppression list",
    "/admin/suppression",
    <>
      <p class="muted">Addresses here are never emailed again. Unsubscribes, hard bounces and "don't contact me" replies are added automatically and immediately.</p>
      <form method="post" action="/admin/suppression" class="card row">
        <Csrf token={c.var.csrf} />
        <div>
          <label for="s-email">Email or @domain.com</label>
          <input id="s-email" name="email" required maxlength={254} />
        </div>
        <div>
          <label for="s-notes">Note</label>
          <input id="s-notes" name="notes" maxlength={200} />
        </div>
        <button type="submit">Add</button>
      </form>
      <form method="get" class="filters" style="margin-top:12px">
        <div>
          <label for="s-q">Search</label>
          <input id="s-q" name="q" value={q} />
        </div>
        <button type="submit" class="secondary">
          Search
        </button>
      </form>
      <div class="table-wrap" tabindex={0} role="region" aria-label="Table (scrolls sideways on small screens)">
        <table>
          <thead>
            <tr>
              <th scope="col">Address</th>
              <th scope="col">Reason</th>
              <th scope="col">Source</th>
              <th scope="col">Date</th>
              <th scope="col">Remove</th>
            </tr>
          </thead>
          <tbody>
            {rows.results.map((r) => (
              <tr>
                <td>{r.email}</td>
                <td>{r.reason}</td>
                <td>{r.source}</td>
                <td>{fmtDate(r.created_at)}</td>
                <td>
                  {r.reason === "bounce" ? (
                    <span class="small muted">bounced — permanent</span>
                  ) : (
                    <details>
                      <summary class="small">Remove…</summary>
                      <form method="post" action="/admin/suppression/remove">
                        <Csrf token={c.var.csrf} />
                        <input type="hidden" name="email" value={r.email} />
                        <label for={`why-${r.email}`}>Lawful reason (e.g. "Owner emailed asking to be re-added on 3/2")</label>
                        <input id={`why-${r.email}`} name="reason" required minlength={15} maxlength={300} style="width:100%" />
                        <button class="danger" type="submit">
                          Remove from list
                        </button>
                      </form>
                    </details>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>,
  );
});

admin.post("/suppression", async (c) => {
  const f = await form(c);
  const raw = f("email").trim().toLowerCase();
  const ok = normalizeEmail(raw) || /^@[a-z0-9.-]+\.[a-z]{2,}$/.test(raw);
  if (!ok) return page(c, "Suppression list", "/admin/suppression", <p class="banner bad">Enter a valid email address or @domain.com.</p>, 400);
  await suppress(c.var.deps.db, { email: raw, reason: "manual", source: "admin", notes: f("notes").slice(0, 200), actor: c.var.admin });
  return c.redirect("/admin/suppression?m=suppressed", 303);
});

admin.post("/suppression/remove", async (c) => {
  const f = await form(c);
  try {
    await unsuppress(c.var.deps.db, f("email"), c.var.admin, f("reason"));
  } catch (err) {
    return page(c, "Suppression list", "/admin/suppression", <p class="banner bad">{err instanceof Error ? err.message : "Could not remove."}</p>, 400);
  }
  return c.redirect("/admin/suppression?m=unsuppressed", 303);
});

// ---------------------------------------------------------------- settings
const num = (v: string) => (v.trim() === "" ? NaN : Number(v));

admin.get("/settings", async (c) => settingsPage(c));

async function settingsPage(c: C, error?: string) {
  const s = await getSettings(c.var.deps.db);
  const blockers = liveSendingBlockers(c.var.deps.config, c.env as Env);
  const csrf = c.var.csrf;
  const n = (id: keyof Settings, label: string, hint?: string, min = 0, max = 500) => (
    <Field id={id} label={label} hint={hint}>
      <input id={id} name={id} type="number" min={String(min)} max={String(max)} value={String(s[id] as number)} required aria-describedby={hint ? `${id}-hint` : undefined} />
    </Field>
  );
  return page(
    c,
    "Settings",
    "/admin/settings",
    <>
      {error && <p class="banner bad">{error}</p>}
      <section class="card" aria-labelledby="h-mode">
        <h2 id="h-mode" style="margin-top:0">Sending mode</h2>
        <p>
          <strong>Mode:</strong> {s.automatedSending ? "AUTOMATED — qualified emails that pass every check are approved and sent within your limits." : "REVIEW — every email waits for your approval."}
          <br />
          <strong>Test mode:</strong> {s.testMode ? `ON — email can only go to: ${c.var.deps.config.testRecipients.join(", ") || "(no TEST_RECIPIENTS set)"}` : "OFF — real outreach to businesses."}
          <br />
          <strong>Sending:</strong> {s.sendingPaused ? "PAUSED" : "active"}
        </p>
        {blockers.length > 0 && (
          <div class="banner warn">
            <strong>Before real outreach can start:</strong>
            <ul>
              {blockers.map((b) => (
                <li>{b}</li>
              ))}
            </ul>
          </div>
        )}
        <form method="post" action="/admin/settings/mode">
          <Csrf token={csrf} />
          <Field id="mode-action" label="Change">
            <select id="mode-action" name="change">
              <option value="">Choose…</option>
              <option value="pause">{s.sendingPaused ? "Resume sending" : "Pause all sending"}</option>
              <option value="automated">{s.automatedSending ? "Switch to REVIEW mode" : "Switch to AUTOMATED mode"}</option>
              <option value="test">{s.testMode ? "Turn TEST MODE off (start real outreach)" : "Turn TEST MODE back on"}</option>
            </select>
          </Field>
          <Field id="confirm" label='To turn on automated mode type ENABLE; to leave test mode type LIVE' hint="Not needed for pausing or for switching back to safer settings.">
            <input id="confirm" name="confirm" autocomplete="off" aria-describedby="confirm-hint" />
          </Field>
          <button type="submit">Apply</button>
        </form>
      </section>
      <form method="post" action="/admin/settings" class="card" style="margin-top:16px">
        <Csrf token={csrf} />
        <h2 style="margin-top:0">Volume and timing</h2>
        <div class="grid">
          {n("dailySendLimit", "Daily send limit", "Start with 10/day; raise slowly (e.g. +5 per week) while bounces stay under 2%.", 0, 200)}
          {n("hourlySendLimit", "Hourly send limit", undefined, 0, 50)}
          {n("minSpacingMinutes", "Min minutes between sends", undefined, 2, 240)}
          {n("maxSpacingMinutes", "Max minutes between sends", undefined, 2, 480)}
          {n("sendWindowStart", "Send from (recipient's local hour)", undefined, 0, 23)}
          {n("sendWindowEnd", "Send until (hour)", undefined, 1, 24)}
          {n("followUp1Days", "Follow-up 1 after (days)", undefined, 1, 30)}
          {n("followUp2Days", "Follow-up 2 after (days from first email)", undefined, 2, 60)}
          {n("maxFollowUps", "Number of follow-ups (0–2)", undefined, 0, 2)}
          {n("minScoreToContact", "Minimum lead score to contact", "60 = GOOD LEAD and above.", 40, 100)}
        </div>
        <fieldset>
          <legend>Send on</legend>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
            <label style="display:inline-block;margin-right:12px">
              <input type="checkbox" name="sendDays" value={String(i + 1)} checked={s.sendDays.includes(i + 1)} /> {d}
            </label>
          ))}
        </fieldset>
        <p>
          <button type="submit">Save settings</button>
        </p>
      </form>
    </>,
    error ? 400 : 200,
  );
}

admin.post("/settings", async (c) => {
  const body = await c.req.parseBody({ all: true });
  const one = (k: string) => {
    const v = Array.isArray(body[k]) ? (body[k] as unknown[])[0] : body[k];
    return typeof v === "string" ? v : "";
  };
  const days = ([] as unknown[]).concat(body.sendDays ?? []).map((d) => Number(d)).filter((d) => d >= 1 && d <= 7);
  try {
    await updateSettings(c.var.deps.db, c.var.admin, {
      dailySendLimit: num(one("dailySendLimit")),
      hourlySendLimit: num(one("hourlySendLimit")),
      minSpacingMinutes: num(one("minSpacingMinutes")),
      maxSpacingMinutes: num(one("maxSpacingMinutes")),
      sendWindowStart: num(one("sendWindowStart")),
      sendWindowEnd: num(one("sendWindowEnd")),
      followUp1Days: num(one("followUp1Days")),
      followUp2Days: num(one("followUp2Days")),
      maxFollowUps: num(one("maxFollowUps")),
      minScoreToContact: num(one("minScoreToContact")),
      sendDays: days,
    });
  } catch (err) {
    const msg = err instanceof Error && !err.message.startsWith("[") ? err.message : "Some values are out of range. Check each number and try again.";
    return settingsPage(c, msg);
  }
  return c.redirect("/admin/settings?m=saved", 303);
});

admin.post("/settings/mode", async (c) => {
  const f = await form(c);
  const s = await getSettings(c.var.deps.db);
  const change = f("change");
  const confirm = f("confirm").trim();
  if (change === "pause") await updateSettings(c.var.deps.db, c.var.admin, { sendingPaused: !s.sendingPaused });
  else if (change === "automated") {
    if (!s.automatedSending && confirm !== "ENABLE") return settingsPage(c, "Type ENABLE to switch on automated sending.");
    await updateSettings(c.var.deps.db, c.var.admin, { automatedSending: !s.automatedSending });
  } else if (change === "test") {
    if (s.testMode) {
      const blockers = liveSendingBlockers(c.var.deps.config, c.env as Env);
      if (blockers.length) return settingsPage(c, `Real outreach can't start yet: ${blockers.join(" ")}`);
      if (confirm !== "LIVE") return settingsPage(c, "Type LIVE to turn off test mode.");
    }
    await updateSettings(c.var.deps.db, c.var.admin, { testMode: !s.testMode });
  } else return settingsPage(c, "Choose a change.");
  return c.redirect("/admin/settings?m=mode", 303);
});

// ---------------------------------------------------------------- activity
admin.get("/activity", async (c) => {
  const { db } = c.var.deps;
  const runs = await db.prepare("SELECT * FROM runs ORDER BY started_at DESC LIMIT 40").all<{ kind: string; status: string; started_at: string; stats: string; error: string | null }>();
  const log = await db.prepare("SELECT * FROM audit_log ORDER BY id DESC LIMIT 60").all<{ actor: string; action: string; target: string | null; details: string; at: string }>();
  const outbox = await db.prepare("SELECT to_email, subject, created_at FROM test_outbox ORDER BY id DESC LIMIT 10").all<{ to_email: string; subject: string; created_at: string }>();
  return page(
    c,
    "Activity",
    "/admin/activity",
    <>
      <h2>Background runs</h2>
      <ul class="plain small">
        {runs.results.map((r) => (
          <li>
            {fmtDate(r.started_at)} · {r.kind} · <Badge value={r.status} /> · {r.error ?? r.stats}
          </li>
        ))}
      </ul>
      <h2>Dry-run outbox (not sent)</h2>
      <p class="small muted">When no mailbox is connected, "sent" email is captured here instead.</p>
      <ul class="plain small">
        {outbox.results.map((o) => (
          <li>
            {fmtDate(o.created_at)} · {o.to_email} · {o.subject}
          </li>
        ))}
      </ul>
      <h2>Audit log</h2>
      <ul class="plain small">
        {log.results.map((a) => (
          <li>
            {fmtDate(a.at)} · {a.actor} · {a.action} {a.target ?? ""} <span class="muted">{a.details}</span>
          </li>
        ))}
      </ul>
    </>,
  );
});

// Website fulfillment: projects overview at /admin, workspaces, deployment, Cloudflare connections.
registerProjectRoutes(admin);
