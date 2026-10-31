-- Maison Web Studio outreach database (Cloudflare D1 / SQLite).
-- Apply: npx wrangler d1 migrations apply maison-outreach --remote -c outreach/wrangler.jsonc

-- One row per real business. dedupe_key prevents the same business being added twice.
CREATE TABLE leads (
  id TEXT PRIMARY KEY,                       -- "ld_" + random; the random part doubles as the opaque UTM token
  dedupe_key TEXT NOT NULL UNIQUE,           -- normalized name|city|state
  name TEXT NOT NULL,
  category TEXT,                             -- as found, e.g. "Nail salon"
  category_group TEXT,                       -- salon | barbershop | restaurant | cafe | bakery | spa | boutique | contractor | cleaning | photographer | events | fitness | professional | other
  city TEXT,
  state TEXT,                                -- 2-letter US state
  website TEXT,
  website_domain TEXT,
  email TEXT,                                -- public business email, only when verified on a public page
  email_source_url TEXT,
  phone TEXT,
  phone_normalized TEXT,
  social_links TEXT NOT NULL DEFAULT '[]',   -- JSON array of URLs
  description TEXT,
  source TEXT NOT NULL,                      -- ai_agent | osm | csv | manual
  source_ref TEXT,
  source_url TEXT,
  website_status TEXT NOT NULL DEFAULT 'UNCERTAIN',  -- NO_WEBSITE | SOCIAL_ONLY | WEBSITE_BROKEN | WEBSITE_OUTDATED | WEBSITE_NEEDS_IMPROVEMENT | GOOD_WEBSITE | UNCERTAIN
  lead_score INTEGER,
  priority TEXT,                             -- HIGH_PRIORITY | GOOD_LEAD | POSSIBLE_LEAD | DO_NOT_CONTACT
  score_reasons TEXT NOT NULL DEFAULT '[]',
  why_maison_can_help TEXT,
  personalized_observation TEXT,
  research TEXT,                             -- JSON from the research step
  stage TEXT NOT NULL DEFAULT 'new',         -- new | qualified | not_qualified | needs_contact | review | approved | contacted | follow_up | replied | interested | customer | not_interested | unsubscribed | bounced | closed
  email_status TEXT,                         -- latest message status
  reply_status TEXT,                         -- latest reply classification
  conversion_status TEXT NOT NULL DEFAULT 'none',  -- none | visited | meeting | customer
  unsubscribed INTEGER NOT NULL DEFAULT 0,
  follow_up_stage INTEGER NOT NULL DEFAULT 0,
  date_discovered TEXT NOT NULL,
  date_contacted TEXT,
  last_contact TEXT,
  next_follow_up TEXT,
  processing_error TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX leads_stage ON leads(stage);
CREATE INDEX leads_priority ON leads(priority, lead_score);
CREATE INDEX leads_status ON leads(website_status);
CREATE INDEX leads_location ON leads(state, city);
CREATE INDEX leads_group ON leads(category_group);
CREATE INDEX leads_domain ON leads(website_domain);
CREATE INDEX leads_phone ON leads(phone_normalized);
CREATE INDEX leads_email ON leads(email);

-- Every fact the AI may use, with where it came from. Emails may only cite these.
CREATE TABLE evidence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,                        -- source | website | audit | social | contact | search
  statement TEXT NOT NULL,
  source_url TEXT,
  collected_at TEXT NOT NULL
);
CREATE INDEX evidence_lead ON evidence(lead_id);

CREATE TABLE website_audits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  final_url TEXT,
  http_status INTEGER,
  reachable INTEGER NOT NULL,
  https INTEGER NOT NULL DEFAULT 0,
  signals TEXT NOT NULL DEFAULT '{}',        -- JSON: viewport, tel, mailto, forms, booking, ordering, shop, socials, copyright year…
  pagespeed_mobile INTEGER,
  accessibility_score INTEGER,
  checked_at TEXT NOT NULL
);
CREATE INDEX audits_lead ON website_audits(lead_id);

-- Outreach emails. One row per lead per step (0 = first email, 1/2 = follow-ups).
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  step INTEGER NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_text TEXT NOT NULL,                   -- the personalized part; signature/footer are added when sending
  landing_path TEXT NOT NULL DEFAULT '/',
  status TEXT NOT NULL,                      -- draft | needs_edit | approved | queued | sending | sent | bounced | failed | cancelled
  validation_errors TEXT NOT NULL DEFAULT '[]',
  evidence_ids TEXT NOT NULL DEFAULT '[]',
  scheduled_for TEXT,
  approved_by TEXT,
  approved_at TEXT,
  sent_at TEXT,
  provider_message_id TEXT,
  provider_thread_id TEXT,
  rfc_message_id TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (lead_id, step)
);
CREATE INDEX messages_status ON messages(status, scheduled_for);
CREATE INDEX messages_thread ON messages(provider_thread_id);
CREATE INDEX messages_sent ON messages(sent_at);

CREATE TABLE replies (
  id TEXT PRIMARY KEY,                       -- provider message id (prevents processing twice)
  lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
  message_id TEXT,
  from_email TEXT,
  subject TEXT,
  received_at TEXT NOT NULL,
  classification TEXT NOT NULL,              -- INTERESTED | QUESTION | NOT_INTERESTED | UNSUBSCRIBE | OUT_OF_OFFICE | BOUNCE | UNCERTAIN
  summary TEXT,
  snippet TEXT,
  handled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX replies_lead ON replies(lead_id);
CREATE INDEX replies_open ON replies(handled, classification);

-- Never email these again. Entries are only removed by a person, with a recorded reason.
CREATE TABLE suppression (
  email TEXT PRIMARY KEY,                    -- lowercased address, or "@domain.com" to block a whole domain
  reason TEXT NOT NULL,                      -- unsubscribe | bounce | complaint | not_interested | manual | do_not_contact
  source TEXT NOT NULL,                      -- link | one_click | reply | bounce | admin
  lead_id TEXT,
  notes TEXT,
  created_at TEXT NOT NULL
);

-- Emails captured instead of sent (dry-run transport, used when no mailbox is configured).
CREATE TABLE test_outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id TEXT,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  raw TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Aggregate visits from outreach links (no IPs, no cookies).
CREATE TABLE outreach_visits (
  day TEXT NOT NULL,
  lead_token TEXT NOT NULL,
  path TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, lead_token, path)
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_by TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE runs (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,                        -- discovery | process_lead | send | inbox | follow_ups
  status TEXT NOT NULL,                      -- running | ok | error
  started_at TEXT NOT NULL,
  finished_at TEXT,
  stats TEXT NOT NULL DEFAULT '{}',
  error TEXT
);
CREATE INDEX runs_started ON runs(started_at);

CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  details TEXT NOT NULL DEFAULT '{}',
  at TEXT NOT NULL
);
CREATE INDEX audit_at ON audit_log(at);
