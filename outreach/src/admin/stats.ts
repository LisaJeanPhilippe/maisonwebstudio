import type { Db } from "../db";
import { startOfLocalDay } from "../text";

const n = async (db: Db, sql: string, ...args: unknown[]) => (await db.prepare(sql).bind(...args).first<{ n: number }>())?.n ?? 0;

export async function dashboardStats(db: Db, tz: string, now = new Date()) {
  const start = startOfLocalDay(now, tz).toISOString();
  const human = "classification NOT IN ('BOUNCE','OUT_OF_OFFICE')";
  const today = {
    discovered: await n(db, "SELECT COUNT(*) AS n FROM leads WHERE date_discovered >= ?", start),
    qualified: await n(db, "SELECT COUNT(*) AS n FROM leads WHERE date_discovered >= ? AND priority IN ('HIGH_PRIORITY','GOOD_LEAD')", start),
    sent: await n(db, "SELECT COUNT(*) AS n FROM messages WHERE sent_at >= ?", start),
    delivered: await n(db, "SELECT COUNT(*) AS n FROM messages WHERE sent_at >= ? AND status = 'sent'", start),
    replies: await n(db, `SELECT COUNT(*) AS n FROM replies WHERE received_at >= ? AND ${human}`, start),
    interested: await n(db, "SELECT COUNT(*) AS n FROM replies WHERE received_at >= ? AND classification = 'INTERESTED'", start),
    meetings: await n(db, "SELECT COUNT(*) AS n FROM leads WHERE conversion_status IN ('meeting','customer') AND updated_at >= ?", start),
  };
  const stages = await db.prepare("SELECT stage, COUNT(*) AS n FROM leads GROUP BY stage").all<{ stage: string; n: number }>();
  const by = Object.fromEntries(stages.results.map((r) => [r.stage, r.n]));
  const pipeline = {
    "New": (by.new ?? 0),
    "Qualified": (by.qualified ?? 0) + (by.needs_contact ?? 0),
    "In review": (by.review ?? 0) + (by.approved ?? 0),
    "Contacted": by.contacted ?? 0,
    "Follow-up": by.follow_up ?? 0,
    "Replied": by.replied ?? 0,
    "Interested": by.interested ?? 0,
    "Customer": by.customer ?? 0,
    "Not interested": by.not_interested ?? 0,
    "Unsubscribed": (by.unsubscribed ?? 0) + (by.bounced ?? 0),
    "Not qualified": by.not_qualified ?? 0,
  };
  const sent = await n(db, "SELECT COUNT(*) AS n FROM messages WHERE sent_at IS NOT NULL");
  const bounced = await n(db, "SELECT COUNT(*) AS n FROM messages WHERE status = 'bounced'");
  const contacted = await n(db, "SELECT COUNT(DISTINCT lead_id) AS n FROM messages WHERE sent_at IS NOT NULL");
  const replied = await n(db, `SELECT COUNT(DISTINCT lead_id) AS n FROM replies WHERE ${human}`);
  const positive = await n(db, "SELECT COUNT(DISTINCT lead_id) AS n FROM replies WHERE classification IN ('INTERESTED','QUESTION')");
  const visits = await n(db, "SELECT COALESCE(SUM(count),0) AS n FROM outreach_visits");
  const visitedLeads = await n(db, "SELECT COUNT(DISTINCT lead_token) AS n FROM outreach_visits");
  const customers = await n(db, "SELECT COUNT(*) AS n FROM leads WHERE conversion_status = 'customer'");
  const meetings = await n(db, "SELECT COUNT(*) AS n FROM leads WHERE conversion_status = 'meeting'");
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 1000) / 10}%` : "—");
  const totals = {
    "Leads discovered": await n(db, "SELECT COUNT(*) AS n FROM leads"),
    "Leads qualified": await n(db, "SELECT COUNT(*) AS n FROM leads WHERE priority IN ('HIGH_PRIORITY','GOOD_LEAD')"),
    "Emails sent": sent,
    "Delivery rate": pct(sent - bounced, sent),
    "Bounce rate": pct(bounced, sent),
    "Reply rate": pct(replied, contacted),
    "Positive reply rate": pct(positive, contacted),
    "Website visits from outreach": visits,
    "Businesses that visited": visitedLeads,
    "Meetings / consultations": meetings,
    "Customers": customers,
  };
  const attention = {
    interested: await n(db, "SELECT COUNT(*) AS n FROM replies WHERE handled = 0 AND classification IN ('INTERESTED','QUESTION','UNCERTAIN')"),
    review: await n(db, "SELECT COUNT(*) AS n FROM messages WHERE status IN ('draft','needs_edit')"),
    failed: await n(db, "SELECT COUNT(*) AS n FROM messages WHERE status = 'failed'"),
    calls: await n(db, "SELECT COUNT(*) AS n FROM leads WHERE stage = 'needs_contact'"),
    errors: await n(db, "SELECT COUNT(*) AS n FROM leads WHERE processing_error IS NOT NULL"),
  };
  return { today, pipeline, totals, attention };
}
