import { expect, test } from "@playwright/test";
import { insertCandidate, getLead, updateLead } from "../src/leads";
import { createDraft } from "../src/pipeline";
import { handleInbound, recordConversion, recordVisit, scheduleFollowUps, scheduleNextSend, sendQueuedMessage } from "../src/sending";
import { updateSettings } from "../src/settings";
import { isSuppressed, suppress, unsuppress } from "../src/suppression";
import { TemporaryError } from "../src/email/transport";
import type { Db } from "../src/db";
import { FakeTransport, testDb, testDeps } from "./helpers";

// Tuesday 2026-11-03, 11:00 in Austin (America/Chicago).
const TUESDAY_11AM_CT = new Date("2026-11-03T17:00:00Z");
const TEST_TO = "me+test@example.org";

let phoneSeq = 0;
async function readyLead(db: Db, email = TEST_TO, name = "Glow Nail Spa") {
  const r = await insertCandidate(db, { name, category: "Nail salon", city: "Austin", state: "TX", phone: `512-555-${String(1000 + phoneSeq++).padStart(4, "0")}`, source: "csv", email, emailSourceUrl: "https://g-test.com/contact" });
  const id = (r as { id: string }).id;
  await db.prepare("INSERT INTO evidence (lead_id, kind, statement, source_url, collected_at) VALUES (?, 'source', 'Offers manicures and pedicures in Austin.', 'https://g-test.com', ?)").bind(id, new Date().toISOString()).run();
  await updateLead(db, id, { website_status: "WEBSITE_OUTDATED", priority: "GOOD_LEAD", lead_score: 70, stage: "qualified", research: JSON.stringify({ gaps: ["No online booking found"], best_opportunity: "online booking", personalized_observation: "Offers manicures and pedicures in Austin.", evidence_ids: [2] }) });
  return id;
}

async function approve(db: Db, leadId: string, step = 0) {
  await db.prepare("UPDATE messages SET status = 'approved', approved_by = 'me', approved_at = ? WHERE lead_id = ? AND step = ?").bind(new Date().toISOString(), leadId, step).run();
}

const status = (db: Db, leadId: string, step = 0) => db.prepare("SELECT status, last_error FROM messages WHERE lead_id = ? AND step = ?").bind(leadId, step).first<{ status: string; last_error: string | null }>();

test("review mode: drafts are never sent until approved; approved emails send once", async () => {
  const db = testDb();
  const { deps, jobs } = testDeps(db);
  const t = new FakeTransport();
  const id = await readyLead(db);
  await createDraft(deps, id, 0);
  expect(await scheduleNextSend(deps, TUESDAY_11AM_CT)).toMatchObject({ queued: null, reason: "nothing approved to send" });
  await approve(db, id);
  const q = await scheduleNextSend(deps, TUESDAY_11AM_CT);
  expect(q.queued).toBeTruthy();
  expect(jobs.at(-1)).toEqual({ type: "send_message", messageId: q.queued });
  expect(await sendQueuedMessage(deps, t, q.queued!, TUESDAY_11AM_CT)).toEqual({ sent: true });
  expect(await sendQueuedMessage(deps, t, q.queued!, TUESDAY_11AM_CT)).toEqual({ skipped: "not queued" }); // duplicate delivery of the job
  expect(t.sent).toHaveLength(1);
  expect(t.sent[0].email.text).toContain("unsubscribe");
  const lead = (await getLead(db, id))!;
  expect(lead.stage).toBe("contacted");
  expect(new Date(lead.next_follow_up!).getTime() - TUESDAY_11AM_CT.getTime()).toBe(4 * 86_400_000);
});

test("test mode blocks real recipients; suppressed and duplicate addresses are cancelled", async () => {
  const db = testDb();
  const { deps } = testDeps(db);
  const real = await readyLead(db, "owner@realbusiness-test.com", "Real Business");
  await createDraft(deps, real, 0);
  await approve(db, real);
  expect(await scheduleNextSend(deps, TUESDAY_11AM_CT)).toMatchObject({ queued: null });
  expect(await status(db, real)).toMatchObject({ status: "approved", last_error: "TEST MODE: recipient is not in TEST_RECIPIENTS" });

  const sup = await readyLead(db, TEST_TO, "Suppressed Salon");
  await createDraft(deps, sup, 0);
  await approve(db, sup);
  await suppress(db, { email: TEST_TO, reason: "unsubscribe", source: "link" });
  expect(await status(db, sup)).toMatchObject({ status: "cancelled" });
});

test("limits: send window, daily/hourly caps and spacing between sends", async () => {
  const db = testDb();
  const { deps } = testDeps(db, { config: { testRecipients: ["a@example.org", "b@example.org", "c@example.org"] } });
  const ids = [await readyLead(db, "a@example.org", "Salon A"), await readyLead(db, "b@example.org", "Salon B"), await readyLead(db, "c@example.org", "Salon C")];
  for (const id of ids) {
    await createDraft(deps, id, 0);
    await approve(db, id);
  }
  const saturday = new Date("2026-11-07T17:00:00Z");
  expect(await scheduleNextSend(deps, saturday)).toMatchObject({ queued: null });
  const night = new Date("2026-11-03T04:00:00Z");
  expect(await scheduleNextSend(deps, night)).toMatchObject({ queued: null });

  await updateSettings(db, "t", { dailySendLimit: 2, hourlySendLimit: 5 });
  const t = new FakeTransport();
  const first = await scheduleNextSend(deps, TUESDAY_11AM_CT);
  await sendQueuedMessage(deps, t, first.queued!, TUESDAY_11AM_CT);
  expect(await scheduleNextSend(deps, new Date(TUESDAY_11AM_CT.getTime() + 60_000))).toMatchObject({ reason: "spacing between sends" });
  const later = new Date(TUESDAY_11AM_CT.getTime() + 20 * 60_000);
  const second = await scheduleNextSend(deps, later);
  await sendQueuedMessage(deps, t, second.queued!, later);
  expect(await scheduleNextSend(deps, new Date(later.getTime() + 30 * 60_000))).toMatchObject({ reason: "daily limit reached" });
  expect(t.sent).toHaveLength(2);
});

test("temporary failures retry, permanent failures stop", async () => {
  const db = testDb();
  const { deps } = testDeps(db);
  const t = new FakeTransport();
  const id = await readyLead(db);
  await createDraft(deps, id, 0);
  await approve(db, id);
  const q = await scheduleNextSend(deps, TUESDAY_11AM_CT);
  t.failNext = new TemporaryError("Gmail API returned 503");
  await expect(sendQueuedMessage(deps, t, q.queued!, TUESDAY_11AM_CT)).rejects.toThrow("503");
  expect(await status(db, id)).toMatchObject({ status: "queued" });
  expect(await sendQueuedMessage(deps, t, q.queued!, TUESDAY_11AM_CT)).toEqual({ sent: true });
});

async function sentLead(db: Db) {
  const { deps } = testDeps(db);
  const t = new FakeTransport();
  const id = await readyLead(db);
  await createDraft(deps, id, 0);
  await approve(db, id);
  const q = await scheduleNextSend(deps, TUESDAY_11AM_CT);
  await sendQueuedMessage(deps, t, q.queued!, TUESDAY_11AM_CT);
  return { id, deps, t };
}

test("follow-ups: drafted when due, threaded, and stop after a reply", async () => {
  const db = testDb();
  const { id, deps, t } = await sentLead(db);
  const day5 = new Date(TUESDAY_11AM_CT.getTime() + 6 * 86_400_000); // following Monday
  expect(await scheduleFollowUps(deps, day5)).toEqual({ created: 1 });
  expect(await status(db, id, 1)).toMatchObject({ status: "draft" });
  await approve(db, id, 1);
  await updateSettings(db, "t", { nextSendNotBefore: null });
  const q = await scheduleNextSend(deps, day5);
  await sendQueuedMessage(deps, t, q.queued!, day5);
  expect(t.sent[1].threadId).toBe(`t-${TEST_TO}`);
  expect(t.sent[1].email.headers["In-Reply-To"]).toBe(t.sent[0].rfcId);
  expect(t.sent[1].email.subject).toMatch(/^Re: /);

  // The prospect replies → no more automated email, ever, for this lead.
  const label = await handleInbound(deps, { id: "in-1", threadId: `t-${TEST_TO}`, from: `Owner <${TEST_TO}>`, subject: "Re: idea", date: new Date().toISOString(), text: "Sounds good, how much would that be?", headers: {} });
  expect(label).toBe("INTERESTED");
  const lead = (await getLead(db, id))!;
  expect(lead.stage).toBe("interested");
  expect(lead.next_follow_up).toBeNull();
  expect(await scheduleFollowUps(deps, new Date(day5.getTime() + 10 * 86_400_000))).toEqual({ created: 0 });
});

test("reply asking to stop → suppressed; out-of-office does not stop the sequence", async () => {
  const db = testDb();
  const { id, deps } = await sentLead(db);
  const ooo = await handleInbound(deps, { id: "in-ooo", threadId: `t-${TEST_TO}`, from: TEST_TO, subject: "Automatic reply: out of office", date: new Date().toISOString(), text: "I'm away until Monday.", headers: { "auto-submitted": "auto-replied" } });
  expect(ooo).toBe("OUT_OF_OFFICE");
  expect((await getLead(db, id))!.next_follow_up).not.toBeNull();
  const stop = await handleInbound(deps, { id: "in-2", threadId: `t-${TEST_TO}`, from: TEST_TO, subject: "Re: idea", date: new Date().toISOString(), text: "Unsubscribe me please", headers: {} });
  expect(stop).toBe("UNSUBSCRIBE");
  expect(await isSuppressed(db, TEST_TO)).toBe(true);
  expect((await getLead(db, id))!.unsubscribed).toBe(1);
  // Processing the same inbound message again changes nothing.
  expect(await db.prepare("SELECT COUNT(*) AS n FROM replies").first<{ n: number }>()).toEqual({ n: 2 });
});

test("hard bounce suppresses the address and marks the email bounced", async () => {
  const db = testDb();
  const { id, deps } = await sentLead(db);
  const r = await handleInbound(deps, {
    id: "dsn-1",
    threadId: null,
    from: "Mail Delivery Subsystem <mailer-daemon@googlemail.com>",
    subject: "Delivery Status Notification (Failure)",
    date: new Date().toISOString(),
    text: `Address not found. Final-Recipient: rfc822; ${TEST_TO}\nStatus: 5.1.1`,
    headers: {},
  });
  expect(r).toBe("BOUNCE");
  expect(await status(db, id)).toMatchObject({ status: "bounced" });
  expect(await isSuppressed(db, TEST_TO)).toBe(true);
  await expect(unsuppress(db, TEST_TO, "me", "They asked to be added back to the list")).rejects.toThrow(/bounced/);
});

test("removing a suppression needs a recorded reason", async () => {
  const db = testDb();
  await suppress(db, { email: "x@example.org", reason: "unsubscribe", source: "link" });
  await expect(unsuppress(db, "x@example.org", "me", "oops")).rejects.toThrow(/Explain/);
  expect(await unsuppress(db, "x@example.org", "me", "Owner emailed on 3/2 asking to hear about launches")).toBe(true);
  const log = await db.prepare("SELECT action FROM audit_log ORDER BY id").all<{ action: string }>();
  expect(log.results.map((r) => r.action)).toEqual(["suppression.add", "suppression.remove"]);
  expect(await isSuppressed(db, "x@example.org")).toBe(false);
  await suppress(db, { email: "@blocked-test.com", reason: "manual", source: "admin" });
  expect(await isSuppressed(db, "anyone@blocked-test.com")).toBe(true);
});

test("website visits and conversions are attributed by opaque token", async () => {
  const db = testDb();
  const { id } = await sentLead(db);
  const token = id.slice(3);
  expect(await recordVisit(db, token, "/work")).toBe(true);
  expect(await recordVisit(db, "nonexistent", "/")).toBe(false);
  expect((await getLead(db, id))!.conversion_status).toBe("visited");
  expect(await recordConversion(db, token, "customer")).toBe(true);
  const lead = (await getLead(db, id))!;
  expect(lead).toMatchObject({ conversion_status: "customer", stage: "customer", next_follow_up: null });
});
