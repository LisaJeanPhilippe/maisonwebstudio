import { nowIso, parseJson, randomId, type Db } from "./db";
import {
  categoryGroup,
  dedupeKey,
  normalizeEmail,
  normalizePhone,
  normalizeUrl,
  ownDomain,
  US_STATES,
} from "./text";

export type WebsiteStatus =
  | "NO_WEBSITE"
  | "SOCIAL_ONLY"
  | "WEBSITE_BROKEN"
  | "WEBSITE_OUTDATED"
  | "WEBSITE_NEEDS_IMPROVEMENT"
  | "GOOD_WEBSITE"
  | "UNCERTAIN";

export type Priority = "HIGH_PRIORITY" | "GOOD_LEAD" | "POSSIBLE_LEAD" | "DO_NOT_CONTACT";

export type LeadRow = {
  id: string;
  dedupe_key: string;
  name: string;
  category: string | null;
  category_group: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
  website_domain: string | null;
  email: string | null;
  email_source_url: string | null;
  phone: string | null;
  phone_normalized: string | null;
  social_links: string;
  description: string | null;
  source: string;
  source_ref: string | null;
  source_url: string | null;
  website_status: WebsiteStatus;
  lead_score: number | null;
  priority: Priority | null;
  score_reasons: string;
  why_maison_can_help: string | null;
  personalized_observation: string | null;
  research: string | null;
  stage: string;
  email_status: string | null;
  reply_status: string | null;
  conversion_status: string;
  unsubscribed: number;
  follow_up_stage: number;
  date_discovered: string;
  date_contacted: string | null;
  last_contact: string | null;
  next_follow_up: string | null;
  processing_error: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

/** A business as found by a discovery source, before any checks. */
export type Candidate = {
  name: string;
  category?: string | null;
  city?: string | null;
  state?: string | null;
  website?: string | null;
  email?: string | null;
  emailSourceUrl?: string | null;
  phone?: string | null;
  socialLinks?: string[];
  description?: string | null;
  source: "ai_agent" | "osm" | "csv" | "manual";
  sourceRef?: string | null;
  sourceUrl?: string | null;
  /** Facts with their source, recorded as evidence. */
  facts?: { statement: string; sourceUrl?: string | null; kind?: string }[];
  /** Discovery searched for an official website and found none (with the search described in facts). */
  searchedForWebsite?: boolean;
  /** The source says this is a chain/franchise location. */
  chain?: boolean;
  notes?: string | null;
};

const SOURCE_LABEL: Record<Candidate["source"], string> = {
  ai_agent: "AI web research",
  osm: "OpenStreetMap",
  csv: "CSV import",
  manual: "manual entry",
};

export type InsertResult = { status: "inserted"; id: string } | { status: "duplicate"; id: string; reason: string } | { status: "invalid"; reason: string };

/** Adds a business unless it already exists (by name+location, domain, phone or email). */
export async function insertCandidate(db: Db, c: Candidate): Promise<InsertResult> {
  const name = c.name?.trim();
  if (!name || name.length < 2 || name.length > 120) return { status: "invalid", reason: "missing or invalid name" };
  const state = c.state?.trim().toUpperCase() || null;
  if (state && !US_STATES[state]) return { status: "invalid", reason: `not a US state: ${state}` };

  const key = dedupeKey(name, c.city, state);
  const website = normalizeUrl(c.website);
  const domain = ownDomain(website);
  const phone = normalizePhone(c.phone);
  const email = normalizeEmail(c.email);

  const existing = await db
    .prepare(
      `SELECT id, dedupe_key, website_domain, phone_normalized, email FROM leads
       WHERE dedupe_key = ? OR (website_domain IS NOT NULL AND website_domain = ?) OR (phone_normalized IS NOT NULL AND phone_normalized = ?) OR (email IS NOT NULL AND email = ?)
       LIMIT 1`,
    )
    .bind(key, domain, phone, email)
    .first<{ id: string; dedupe_key: string; website_domain: string | null; phone_normalized: string | null; email: string | null }>();
  if (existing) {
    const reason =
      existing.dedupe_key === key ? "same name and location" : existing.website_domain && existing.website_domain === domain ? "same website" : existing.phone_normalized === phone ? "same phone" : "same email";
    return { status: "duplicate", id: existing.id, reason };
  }

  const id = randomId("ld");
  const now = nowIso();
  const socials = [...new Set((c.socialLinks ?? []).map((u) => normalizeUrl(u)).filter((u): u is string => !!u))].slice(0, 10);
  await db
    .prepare(
      `INSERT INTO leads (id, dedupe_key, name, category, category_group, city, state, website, website_domain, email, email_source_url,
        phone, phone_normalized, social_links, description, source, source_ref, source_url, notes, date_discovered, created_at, updated_at, research)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id, key, name, c.category ?? null, categoryGroup(c.category), c.city?.trim() || null, state, website, domain,
      email, email ? (c.emailSourceUrl ?? null) : null, c.phone?.trim() || null, phone, JSON.stringify(socials),
      c.description?.slice(0, 600) ?? null, c.source, c.sourceRef ?? null, c.sourceUrl ?? null, c.notes ?? null, now, now, now,
      JSON.stringify({ discovery: { searchedForWebsite: !!c.searchedForWebsite, chain: !!c.chain } }),
    )
    .run();

  const facts = [
    { kind: "source", statement: `Found via ${SOURCE_LABEL[c.source]}.`, sourceUrl: c.sourceUrl ?? null },
    ...(c.facts ?? []).map((f) => ({ kind: f.kind ?? "source", statement: f.statement, sourceUrl: f.sourceUrl ?? null })),
  ];
  await addEvidence(db, id, facts);
  return { status: "inserted", id };
}

export async function addEvidence(db: Db, leadId: string, items: { kind: string; statement: string; sourceUrl?: string | null }[]) {
  const clean = items.filter((i) => i.statement && i.statement.length <= 500).slice(0, 40);
  if (!clean.length) return;
  const now = nowIso();
  await db.batch(
    clean.map((i) =>
      db.prepare("INSERT INTO evidence (lead_id, kind, statement, source_url, collected_at) VALUES (?, ?, ?, ?, ?)").bind(leadId, i.kind, i.statement, i.sourceUrl ?? null, now),
    ),
  );
}

export type Evidence = { id: number; kind: string; statement: string; source_url: string | null; collected_at: string };

export const getEvidence = (db: Db, leadId: string) =>
  db.prepare("SELECT id, kind, statement, source_url, collected_at FROM evidence WHERE lead_id = ? ORDER BY id").bind(leadId).all<Evidence>().then((r) => r.results);

export const getLead = (db: Db, id: string) => db.prepare("SELECT * FROM leads WHERE id = ?").bind(id).first<LeadRow>();

const UPDATABLE = new Set<keyof LeadRow>([
  "website", "website_domain", "email", "email_source_url", "phone", "phone_normalized", "social_links", "description",
  "website_status", "lead_score", "priority", "score_reasons", "why_maison_can_help", "personalized_observation", "research",
  "stage", "email_status", "reply_status", "conversion_status", "unsubscribed", "follow_up_stage", "date_contacted",
  "last_contact", "next_follow_up", "processing_error", "notes", "category", "category_group",
]);

export async function updateLead(db: Db, id: string, patch: Partial<LeadRow>) {
  const keys = Object.keys(patch).filter((k) => UPDATABLE.has(k as keyof LeadRow));
  if (!keys.length) return;
  const sql = `UPDATE leads SET ${keys.map((k) => `${k} = ?`).join(", ")}, updated_at = ? WHERE id = ?`;
  await db.prepare(sql).bind(...keys.map((k) => (patch as Record<string, unknown>)[k] ?? null), nowIso(), id).run();
}

export const leadSocials = (lead: Pick<LeadRow, "social_links">) => parseJson<string[]>(lead.social_links, []);

/** The opaque token used in UTM links: the random part of the lead id, never the name. */
export const leadToken = (leadId: string) => leadId.replace(/^ld_/, "");
