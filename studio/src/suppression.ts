import { audit, nowIso, type Db } from "./db";
import { normalizeEmail } from "./text";

export type SuppressionReason = "unsubscribe" | "bounce" | "complaint" | "not_interested" | "manual" | "do_not_contact";

/** True if the address or its whole domain is suppressed. */
export async function isSuppressed(db: Db, email: string): Promise<boolean> {
  const e = normalizeEmail(email);
  if (!e) return true;
  const domain = `@${e.split("@")[1]}`;
  const row = await db.prepare("SELECT 1 AS x FROM suppression WHERE email = ? OR email = ? LIMIT 1").bind(e, domain).first();
  return !!row;
}

/**
 * Records an opt-out immediately and stops everything queued for that address.
 * Idempotent: the first reason/date is kept.
 */
export async function suppress(db: Db, input: { email: string; reason: SuppressionReason; source: string; leadId?: string | null; notes?: string | null; actor?: string }) {
  const e = input.email.trim().toLowerCase();
  const now = nowIso();
  await db.batch([
    db
      .prepare("INSERT INTO suppression (email, reason, source, lead_id, notes, created_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(email) DO NOTHING")
      .bind(e, input.reason, input.source, input.leadId ?? null, input.notes ?? null, now),
    // Cancel anything not yet sent to this address.
    db.prepare("UPDATE messages SET status = 'cancelled', last_error = ?, updated_at = ? WHERE to_email = ? AND status IN ('draft','needs_edit','approved','queued')").bind(`suppressed: ${input.reason}`, now, e),
    db
      .prepare("UPDATE leads SET unsubscribed = CASE WHEN ? IN ('unsubscribe','do_not_contact','not_interested','complaint') THEN 1 ELSE unsubscribed END, stage = CASE WHEN ? = 'bounce' THEN 'bounced' WHEN ? = 'not_interested' THEN 'not_interested' ELSE 'unsubscribed' END, next_follow_up = NULL, updated_at = ? WHERE email = ?")
      .bind(input.reason, input.reason, input.reason, now, e),
  ]);
  await audit(db, input.actor ?? "system", "suppression.add", e.replace(/^(.).*@/, "$1***@"), { reason: input.reason, source: input.source });
}

/** Only a person can remove a suppression, and only with a recorded lawful reason. */
export async function unsuppress(db: Db, email: string, actor: string, reason: string) {
  if (reason.trim().length < 15) throw new Error("Explain why this address may be contacted again (at least 15 characters), e.g. the person asked to be re-added.");
  const e = email.trim().toLowerCase();
  const row = await db.prepare("SELECT reason FROM suppression WHERE email = ?").bind(e).first<{ reason: string }>();
  if (!row) return false;
  if (row.reason === "bounce") throw new Error("Hard-bounced addresses cannot be re-enabled here; they will bounce again.");
  await db.prepare("DELETE FROM suppression WHERE email = ?").bind(e).run();
  await audit(db, actor, "suppression.remove", e, { previous: row.reason, reason });
  return true;
}
