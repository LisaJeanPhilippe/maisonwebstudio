import { finishRun, nowIso, startRun, type Db } from "./db";
import { composeEmail, rfcMessageId } from "./email/compose";
import { PermanentError, TemporaryError, type Transport } from "./email/transport";
import { getLead, updateLead, type LeadRow } from "./leads";
import { createDraft, type Deps } from "./pipeline";
import { getSettings, updateSettings, type Settings } from "./settings";
import { isSuppressed, suppress } from "./suppression";
import { localTime, maskEmail, normalizeEmail, US_STATES } from "./text";

/** Lead stages after which no more automated email may go out. */
export const STOP_STAGES = new Set(["replied", "interested", "customer", "not_interested", "unsubscribed", "bounced", "closed"]);

type MessageRow = {
  id: string;
  lead_id: string;
  step: number;
  to_email: string;
  subject: string;
  body_text: string;
  landing_path: string;
  status: string;
  scheduled_for: string | null;
  attempt_count: number;
  provider_thread_id: string | null;
  rfc_message_id: string | null;
};

const DAY = 86_400_000;
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);

export function recipientTimezone(lead: Pick<LeadRow, "state">, fallback: string) {
  return (lead.state && US_STATES[lead.state]?.tz) || fallback;
}

export function withinWindow(now: Date, tz: string, s: Pick<Settings, "sendWindowStart" | "sendWindowEnd" | "sendDays">) {
  const t = localTime(now, tz);
  return s.sendDays.includes(t.weekday) && t.hour >= s.sendWindowStart && t.hour < s.sendWindowEnd;
}

/** Why a message may not be sent right now (null = OK). Re-checked again right before sending. */
export async function sendBlocker(deps: Deps, m: MessageRow, lead: LeadRow | null, settings: Settings, now: Date): Promise<{ reason: string; cancel: boolean } | null> {
  if (!lead) return { reason: "lead deleted", cancel: true };
  if (lead.unsubscribed || STOP_STAGES.has(lead.stage)) return { reason: `lead stage is ${lead.stage}`, cancel: true };
  const to = normalizeEmail(m.to_email);
  if (!to) return { reason: "invalid address", cancel: true };
  if (await isSuppressed(deps.db, to)) return { reason: "address is suppressed", cancel: true };
  if (settings.testMode && !deps.config.testRecipients.includes(to)) return { reason: "TEST MODE: recipient is not in TEST_RECIPIENTS", cancel: false };
  if (m.step === 0) {
    const other = await deps.db.prepare("SELECT 1 AS x FROM messages WHERE to_email = ? AND step = 0 AND status = 'sent' AND id != ? LIMIT 1").bind(to, m.id).first();
    if (other) return { reason: "this address was already contacted for another lead", cancel: true };
  } else {
    const prev = await deps.db.prepare("SELECT status FROM messages WHERE lead_id = ? AND step = ?").bind(m.lead_id, m.step - 1).first<{ status: string }>();
    if (prev?.status !== "sent") return { reason: "previous email in the sequence was not sent", cancel: true };
  }
  if (!withinWindow(now, recipientTimezone(lead, deps.config.senderTimezone), settings)) return { reason: "outside the recipient's sending window", cancel: false };
  return null;
}

export async function sentCounts(db: Db, now: Date, tz: string) {
  const rows = await db.prepare("SELECT sent_at FROM messages WHERE sent_at IS NOT NULL AND sent_at >= ?").bind(new Date(now.getTime() - 1.5 * DAY).toISOString()).all<{ sent_at: string }>();
  const today = localTime(now, tz).day;
  let day = 0;
  let hour = 0;
  for (const r of rows.results) {
    const t = new Date(r.sent_at);
    if (localTime(t, tz).day === today) day++;
    if (now.getTime() - t.getTime() < 3_600_000) hour++;
  }
  return { day, hour };
}

/** Picks at most ONE eligible message per tick and queues it, so sends are spaced out. */
export async function scheduleNextSend(deps: Deps, now = new Date()) {
  const settings = await getSettings(deps.db);
  if (settings.sendingPaused) return { queued: null, reason: "sending paused" };
  if (settings.nextSendNotBefore && new Date(settings.nextSendNotBefore) > now) return { queued: null, reason: "spacing between sends" };
  const counts = await sentCounts(deps.db, now, deps.config.senderTimezone);
  if (counts.day >= settings.dailySendLimit) return { queued: null, reason: "daily limit reached" };
  if (counts.hour >= settings.hourlySendLimit) return { queued: null, reason: "hourly limit reached" };
  const queued = await deps.db.prepare("SELECT COUNT(*) AS n FROM messages WHERE status IN ('queued','sending')").first<{ n: number }>();
  if ((queued?.n ?? 0) > 0) return { queued: null, reason: "a send is already in progress" };

  const candidates = await deps.db
    .prepare(
      `SELECT m.* FROM messages m JOIN leads l ON l.id = m.lead_id
       WHERE m.status = 'approved' AND (m.scheduled_for IS NULL OR m.scheduled_for <= ?)
       ORDER BY m.step DESC, l.lead_score DESC, m.approved_at ASC LIMIT 25`,
    )
    .bind(now.toISOString())
    .all<MessageRow>();
  for (const m of candidates.results) {
    const lead = await getLead(deps.db, m.lead_id);
    const blocker = await sendBlocker(deps, m, lead, settings, now);
    if (blocker) {
      if (blocker.cancel) {
        await deps.db.prepare("UPDATE messages SET status = 'cancelled', last_error = ?, updated_at = ? WHERE id = ?").bind(blocker.reason, nowIso(), m.id).run();
      } else {
        await deps.db.prepare("UPDATE messages SET last_error = ?, updated_at = ? WHERE id = ?").bind(blocker.reason, nowIso(), m.id).run();
      }
      continue;
    }
    const claimed = await deps.db.prepare("UPDATE messages SET status = 'queued', last_error = NULL, updated_at = ? WHERE id = ? AND status = 'approved'").bind(nowIso(), m.id).run();
    if (!claimed.meta.changes) continue;
    const gapMin = settings.minSpacingMinutes + Math.random() * (settings.maxSpacingMinutes - settings.minSpacingMinutes);
    await updateSettings(deps.db, "system", { nextSendNotBefore: new Date(now.getTime() + gapMin * 60_000).toISOString() });
    await deps.jobs.send({ type: "send_message", messageId: m.id });
    return { queued: m.id, reason: null };
  }
  return { queued: null, reason: candidates.results.length ? "no message eligible right now" : "nothing approved to send" };
}

/** Sends one queued message. Safe to run twice: only a 'queued' message is claimed. */
export async function sendQueuedMessage(deps: Deps, transport: Transport, messageId: string, now = new Date()) {
  const claim = await deps.db
    .prepare("UPDATE messages SET status = 'sending', attempt_count = attempt_count + 1, updated_at = ? WHERE id = ? AND status = 'queued'")
    .bind(nowIso(), messageId)
    .run();
  if (!claim.meta.changes) return { skipped: "not queued" };
  const m = (await deps.db.prepare("SELECT * FROM messages WHERE id = ?").bind(messageId).first<MessageRow>())!;
  const lead = await getLead(deps.db, m.lead_id);
  const settings = await getSettings(deps.db);
  const blocker = await sendBlocker(deps, m, lead, settings, now);
  if (blocker) {
    await deps.db.prepare("UPDATE messages SET status = ?, last_error = ?, updated_at = ? WHERE id = ?").bind(blocker.cancel ? "cancelled" : "approved", blocker.reason, nowIso(), m.id).run();
    return { skipped: blocker.reason };
  }

  const first = m.step > 0 ? await deps.db.prepare("SELECT provider_thread_id, rfc_message_id FROM messages WHERE lead_id = ? AND step = ?").bind(m.lead_id, m.step - 1).first<{ provider_thread_id: string | null; rfc_message_id: string | null }>() : null;
  const rfcId = m.rfc_message_id ?? rfcMessageId(deps.config.senderEmail.split("@")[1] ?? "");
  try {
    const email = await composeEmail(deps.config, {
      leadId: m.lead_id,
      to: m.to_email,
      subject: m.subject,
      body: m.body_text,
      landingPath: m.landing_path,
      step: m.step,
      inReplyTo: first?.rfc_message_id ?? null,
    });
    const result = await transport.send(email, rfcId, first?.provider_thread_id ?? null);
    const sentAt = now.toISOString();
    await deps.db
      .prepare("UPDATE messages SET status = 'sent', sent_at = ?, provider_message_id = ?, provider_thread_id = ?, rfc_message_id = ?, last_error = NULL, updated_at = ? WHERE id = ?")
      .bind(sentAt, result.providerMessageId, result.providerThreadId, rfcId, sentAt, m.id)
      .run();
    const nextDays = m.step === 0 ? settings.followUp1Days : m.step === 1 ? settings.followUp2Days - settings.followUp1Days : null;
    const more = nextDays !== null && m.step < settings.maxFollowUps;
    await updateLead(deps.db, m.lead_id, {
      stage: m.step === 0 ? "contacted" : "follow_up",
      email_status: "sent",
      follow_up_stage: m.step,
      date_contacted: lead!.date_contacted ?? sentAt,
      last_contact: sentAt,
      next_follow_up: more ? addDays(now, nextDays!).toISOString() : null,
    });
    deps.log.info("send.ok", { messageId: m.id, step: m.step, to: maskEmail(m.to_email), transport: transport.name });
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const retry = err instanceof TemporaryError && m.attempt_count < 3;
    await deps.db.prepare("UPDATE messages SET status = ?, last_error = ?, updated_at = ? WHERE id = ?").bind(retry ? "queued" : "failed", message.slice(0, 300), nowIso(), m.id).run();
    deps.log.warn("send.failed", { messageId: m.id, retry, message });
    if (retry) throw err; // the queue redelivers with backoff
    if (!(err instanceof PermanentError) && !(err instanceof TemporaryError)) throw err;
    return { sent: false, error: message };
  }
}

/** Creates due follow-up drafts. Never runs once a lead has replied or opted out. */
export async function scheduleFollowUps(deps: Deps, now = new Date(), limit = 5) {
  const settings = await getSettings(deps.db);
  if (!deps.ai) return { created: 0, reason: "AI not configured" };
  const due = await deps.db
    .prepare("SELECT * FROM leads WHERE next_follow_up IS NOT NULL AND next_follow_up <= ? AND stage IN ('contacted','follow_up') AND unsubscribed = 0 ORDER BY next_follow_up LIMIT ?")
    .bind(now.toISOString(), limit)
    .all<LeadRow>();
  let created = 0;
  for (const lead of due.results) {
    const step = (lead.follow_up_stage + 1) as 1 | 2;
    await updateLead(deps.db, lead.id, { next_follow_up: null });
    if (step > settings.maxFollowUps) continue;
    const replied = await deps.db.prepare("SELECT 1 AS x FROM replies WHERE lead_id = ? AND classification NOT IN ('OUT_OF_OFFICE') LIMIT 1").bind(lead.id).first();
    if (replied || (lead.email && (await isSuppressed(deps.db, lead.email)))) continue;
    const exists = await deps.db.prepare("SELECT 1 AS x FROM messages WHERE lead_id = ? AND step = ?").bind(lead.id, step).first();
    if (exists) continue;
    await createDraft(deps, lead.id, step, settings);
    created++;
  }
  return { created };
}

// ---------------------------------------------------------------- inbox

const addressOf = (from: string) => normalizeEmail(from.match(/<([^>]+)>/)?.[1] ?? from) ?? "";

export function isBounce(msg: { from: string; subject: string; headers: Record<string, string> }) {
  return /mailer-daemon|postmaster/i.test(msg.from) || /^(delivery status notification|undeliverable|undelivered mail|mail delivery (failed|subsystem)|returned mail|failure notice)/i.test(msg.subject) || /delivery-status/i.test(msg.headers["content-type"] ?? "");
}

export function isAutoReply(msg: { subject: string; headers: Record<string, string> }) {
  const auto = (msg.headers["auto-submitted"] ?? "no").toLowerCase();
  return (auto !== "no" && auto !== "") || "x-autoreply" in msg.headers || "x-autorespond" in msg.headers || /\b(out of (the )?office|automatic reply|auto(matic)?[- ]?reply|away from (the )?office|on vacation)\b/i.test(msg.subject);
}

export const asksToUnsubscribe = (subject: string, text: string) => /\bunsubscribe\b/i.test(subject) || /^\s*(unsubscribe|stop|remove( me)?|take me off)\b/i.test(text.trim());

export async function processInbox(deps: Deps, transport: Transport, now = new Date()) {
  const runId = await startRun(deps.db, "inbox");
  const stats = { checked: 0, replies: 0, bounces: 0, unsubscribes: 0, interested: 0, ignored: 0 };
  try {
    const last = await deps.db.prepare("SELECT started_at FROM runs WHERE kind = 'inbox' AND status = 'ok' ORDER BY started_at DESC LIMIT 1").first<{ started_at: string }>();
    const since = last ? new Date(new Date(last.started_at).getTime() - 10 * 60_000) : new Date(now.getTime() - 3 * DAY);
    const inbound = await transport.listInbound(since);
    for (const msg of inbound) {
      stats.checked++;
      if (await deps.db.prepare("SELECT 1 AS x FROM replies WHERE id = ?").bind(msg.id).first()) continue;
      const result = await handleInbound(deps, msg);
      if (result === "ignored") stats.ignored++;
      else if (result === "BOUNCE") stats.bounces++;
      else if (result === "UNSUBSCRIBE") stats.unsubscribes++;
      else {
        stats.replies++;
        if (result === "INTERESTED") stats.interested++;
      }
    }
    await finishRun(deps.db, runId, stats);
    return stats;
  } catch (err) {
    await finishRun(deps.db, runId, stats, err instanceof Error ? err.message : String(err));
    throw err;
  }
}

async function stopSequence(db: Db, leadId: string, reason: string) {
  const now = nowIso();
  await db.batch([
    db.prepare("UPDATE messages SET status = 'cancelled', last_error = ?, updated_at = ? WHERE lead_id = ? AND status IN ('draft','needs_edit','approved','queued')").bind(reason, now, leadId),
    db.prepare("UPDATE leads SET next_follow_up = NULL, updated_at = ? WHERE id = ?").bind(now, leadId),
  ]);
}

export async function handleInbound(deps: Deps, msg: { id: string; threadId: string | null; from: string; subject: string; date: string; text: string; headers: Record<string, string> }): Promise<string> {
  const record = (leadId: string | null, messageId: string | null, label: string, summary: string, from: string) =>
    deps.db
      .prepare("INSERT INTO replies (id, lead_id, message_id, from_email, subject, received_at, classification, summary, snippet, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING")
      .bind(msg.id, leadId, messageId, from, msg.subject.slice(0, 200), msg.date, label, summary.slice(0, 300), msg.text.replace(/\s+/g, " ").slice(0, 500), nowIso())
      .run();

  if (isBounce(msg)) {
    const failed =
      msg.headers["x-failed-recipients"]?.split(",")[0] ?? msg.text.match(/final-recipient:\s*rfc822;\s*([^\s]+)/i)?.[1] ?? null;
    let target = normalizeEmail(failed);
    if (!target) {
      // Fall back to any address we have sent to that appears in the report.
      const sent = await deps.db.prepare("SELECT DISTINCT to_email FROM messages WHERE status = 'sent' AND sent_at >= ?").bind(new Date(Date.now() - 14 * DAY).toISOString()).all<{ to_email: string }>();
      target = sent.results.map((r) => r.to_email).find((e) => msg.text.toLowerCase().includes(e)) ?? null;
    }
    if (!target) return "ignored";
    const m = await deps.db.prepare("SELECT id, lead_id FROM messages WHERE to_email = ? AND status = 'sent' ORDER BY sent_at DESC LIMIT 1").bind(target).first<{ id: string; lead_id: string }>();
    // Only treat permanent failures (5.x.x) as hard bounces; temporary ones are left alone.
    const permanent = !/\b4\.\d\.\d\b|temporar|will retry|delayed/i.test(msg.text);
    if (permanent) {
      await suppress(deps.db, { email: target, reason: "bounce", source: "bounce", leadId: m?.lead_id ?? null });
      if (m) {
        await deps.db.prepare("UPDATE messages SET status = 'bounced', updated_at = ? WHERE id = ?").bind(nowIso(), m.id).run();
        await updateLead(deps.db, m.lead_id, { email_status: "bounced", reply_status: "BOUNCE" });
      }
    }
    await record(m?.lead_id ?? null, m?.id ?? null, "BOUNCE", permanent ? "Hard bounce; address suppressed." : "Temporary delivery delay.", "mailer-daemon");
    return "BOUNCE";
  }

  const from = addressOf(msg.from);
  const byThread = msg.threadId
    ? await deps.db.prepare("SELECT id, lead_id, body_text FROM messages WHERE provider_thread_id = ? ORDER BY step DESC LIMIT 1").bind(msg.threadId).first<{ id: string; lead_id: string; body_text: string }>()
    : null;
  const byFrom = byThread ? null : await deps.db.prepare("SELECT m.id, m.lead_id, m.body_text FROM messages m WHERE m.to_email = ? AND m.status = 'sent' ORDER BY m.sent_at DESC LIMIT 1").bind(from).first<{ id: string; lead_id: string; body_text: string }>();
  const ours = byThread ?? byFrom;
  if (!ours) return "ignored"; // not a reply to outreach

  if (isAutoReply(msg)) {
    await record(ours.lead_id, ours.id, "OUT_OF_OFFICE", "Automatic reply.", from);
    // Pause any follow-up for a few days rather than counting it as a response.
    const lead = await getLead(deps.db, ours.lead_id);
    if (lead?.next_follow_up) await updateLead(deps.db, lead.id, { next_follow_up: addDays(new Date(lead.next_follow_up), 3).toISOString(), reply_status: "OUT_OF_OFFICE" });
    return "OUT_OF_OFFICE";
  }

  let label = "UNCERTAIN";
  let summary = "Reply received.";
  let noContact = false;
  if (asksToUnsubscribe(msg.subject, msg.text)) {
    label = "UNSUBSCRIBE";
    summary = "Asked to be removed.";
  } else if (deps.ai) {
    try {
      const c = await deps.ai.classifyReply({ subject: msg.subject, text: msg.text, ourLastEmail: ours.body_text });
      label = c.label;
      summary = c.summary;
      noContact = c.wants_no_contact;
    } catch (err) {
      deps.log.warn("reply.classify_failed", { message: err instanceof Error ? err.message : String(err) });
    }
  }

  // Any human reply stops the automated sequence. A person answers; the system never auto-replies.
  await stopSequence(deps.db, ours.lead_id, `reply received (${label})`);
  const lead = await getLead(deps.db, ours.lead_id);
  const address = lead?.email ?? from;
  if (label === "UNSUBSCRIBE" || noContact) {
    await suppress(deps.db, { email: address, reason: label === "UNSUBSCRIBE" ? "unsubscribe" : "do_not_contact", source: "reply", leadId: ours.lead_id });
    if (from && from !== address) await suppress(deps.db, { email: from, reason: "unsubscribe", source: "reply", leadId: ours.lead_id });
  } else if (label === "NOT_INTERESTED") {
    await suppress(deps.db, { email: address, reason: "not_interested", source: "reply", leadId: ours.lead_id });
  } else {
    await updateLead(deps.db, ours.lead_id, { stage: label === "INTERESTED" ? "interested" : "replied" });
  }
  await updateLead(deps.db, ours.lead_id, { reply_status: label });
  await record(ours.lead_id, ours.id, label, summary, from);
  deps.log.info("reply.received", { leadId: ours.lead_id, label });
  return label;
}

/** Runs every few minutes from cron. */
export async function tick(deps: Deps, transport: Transport, now = new Date()) {
  const out: Record<string, unknown> = {};
  out.send = await scheduleNextSend(deps, now);
  try {
    out.inbox = transport.name === "dry-run" ? "no mailbox connected" : await processInbox(deps, transport, now);
  } catch (err) {
    out.inbox = `error: ${err instanceof Error ? err.message : String(err)}`;
  }
  try {
    out.followUps = await scheduleFollowUps(deps, now);
  } catch (err) {
    out.followUps = `error: ${err instanceof Error ? err.message : String(err)}`;
  }
  return out;
}

export async function recordVisit(db: Db, token: string, path: string, now = new Date()) {
  if (!/^[a-z0-9]{6,32}$/.test(token)) return false;
  const lead = await db.prepare("SELECT id, conversion_status FROM leads WHERE id = ?").bind(`ld_${token}`).first<{ id: string; conversion_status: string }>();
  if (!lead) return false;
  const safePath = path.replace(/[^a-z0-9/_-]/gi, "").slice(0, 60) || "/";
  await db
    .prepare("INSERT INTO outreach_visits (day, lead_token, path, count) VALUES (?, ?, ?, 1) ON CONFLICT(day, lead_token, path) DO UPDATE SET count = count + 1")
    .bind(now.toISOString().slice(0, 10), token, safePath)
    .run();
  if (lead.conversion_status === "none") await updateLead(db, lead.id, { conversion_status: "visited" });
  return true;
}

export async function recordConversion(db: Db, token: string, kind: "customer" | "meeting") {
  if (!/^[a-z0-9]{6,32}$/.test(token)) return false;
  const id = `ld_${token}`;
  const lead = await getLead(db, id);
  if (!lead) return false;
  await stopSequence(db, id, `converted (${kind})`);
  await updateLead(db, id, { conversion_status: kind, stage: kind === "customer" ? "customer" : lead.stage === "interested" ? "interested" : lead.stage });
  return true;
}
