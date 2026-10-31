import { z } from "zod";
import { audit, nowIso, type Db } from "./db";

/** A place and business type the discovery agent should search. */
export const targetSchema = z.object({
  category: z.string().trim().min(2).max(60),
  city: z.string().trim().min(2).max(60),
  state: z.string().trim().length(2).toUpperCase(),
});
export type Target = z.infer<typeof targetSchema>;

/**
 * Operator-editable settings, stored in D1 and changed from the dashboard.
 * Defaults are deliberately conservative: review mode, test mode, low volume.
 */
export const settingsSchema = z.object({
  /** MODE 2. When false (default) every email waits for a person to approve it. */
  automatedSending: z.boolean(),
  /** While true, email can only go to TEST_RECIPIENTS. Turning it off requires production setup. */
  testMode: z.boolean(),
  /** Master pause for all sending. */
  sendingPaused: z.boolean(),
  dailySendLimit: z.number().int().min(0).max(200),
  hourlySendLimit: z.number().int().min(0).max(50),
  minSpacingMinutes: z.number().int().min(2).max(240),
  maxSpacingMinutes: z.number().int().min(2).max(480),
  /** Recipient-local hours during which email may be sent (24h clock, end exclusive). */
  sendWindowStart: z.number().int().min(0).max(23),
  sendWindowEnd: z.number().int().min(1).max(24),
  /** ISO weekdays 1 (Mon) – 7 (Sun). */
  sendDays: z.array(z.number().int().min(1).max(7)).min(1),
  followUp1Days: z.number().int().min(1).max(30),
  followUp2Days: z.number().int().min(2).max(60),
  maxFollowUps: z.number().int().min(0).max(2),
  minScoreToContact: z.number().int().min(40).max(100),
  discoveryEnabled: z.boolean(),
  discoveryPerRun: z.number().int().min(1).max(50),
  discoveryTargets: z.array(targetSchema).max(100),
  /** Cursor into discoveryTargets so each run searches the next place. */
  discoveryCursor: z.number().int().min(0),
  /** Earliest time the next email may go out (enforces randomized spacing). */
  nextSendNotBefore: z.string().nullable(),
});
export type Settings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  automatedSending: false,
  testMode: true,
  sendingPaused: false,
  dailySendLimit: 10,
  hourlySendLimit: 3,
  minSpacingMinutes: 6,
  maxSpacingMinutes: 14,
  sendWindowStart: 9,
  sendWindowEnd: 16,
  sendDays: [1, 2, 3, 4, 5],
  followUp1Days: 4,
  followUp2Days: 9,
  maxFollowUps: 2,
  minScoreToContact: 60,
  discoveryEnabled: false,
  discoveryPerRun: 15,
  discoveryTargets: [],
  discoveryCursor: 0,
  nextSendNotBefore: null,
};

export async function getSettings(db: Db): Promise<Settings> {
  const rows = await db.prepare("SELECT key, value FROM settings").all<{ key: string; value: string }>();
  const stored: Record<string, unknown> = {};
  for (const r of rows.results) {
    try {
      stored[r.key] = JSON.parse(r.value);
    } catch {
      /* ignore corrupt value; default applies */
    }
  }
  // Each key is validated on its own so one bad value can't reset the others.
  const out = { ...DEFAULT_SETTINGS } as Record<string, unknown>;
  for (const [key, schema] of Object.entries(settingsSchema.shape)) {
    if (key in stored) {
      const parsed = (schema as z.ZodType).safeParse(stored[key]);
      if (parsed.success) out[key] = parsed.data;
    }
  }
  return out as Settings;
}

export async function updateSettings(db: Db, actor: string, patch: Partial<Settings>): Promise<Settings> {
  const current = await getSettings(db);
  const next = settingsSchema.parse({ ...current, ...patch });
  if (next.maxSpacingMinutes < next.minSpacingMinutes) throw new Error("Maximum spacing must be at least the minimum spacing.");
  if (next.sendWindowEnd <= next.sendWindowStart) throw new Error("Send window must end after it starts.");
  if (next.followUp2Days <= next.followUp1Days) throw new Error("Follow-up 2 must come after follow-up 1.");
  const changed = Object.keys(patch).filter(
    (k) => JSON.stringify((current as Record<string, unknown>)[k]) !== JSON.stringify((next as Record<string, unknown>)[k]),
  );
  if (changed.length === 0) return next;
  await db.batch(
    changed.map((k) =>
      db
        .prepare(
          "INSERT INTO settings (key, value, updated_by, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at",
        )
        .bind(k, JSON.stringify((next as Record<string, unknown>)[k]), actor, nowIso()),
    ),
  );
  // Routine bookkeeping keys are not worth an audit entry.
  const notable = changed.filter((k) => k !== "nextSendNotBefore" && k !== "discoveryCursor");
  if (notable.length) {
    await audit(db, actor, "settings.update", null, Object.fromEntries(notable.map((k) => [k, (next as Record<string, unknown>)[k]])));
  }
  return next;
}
