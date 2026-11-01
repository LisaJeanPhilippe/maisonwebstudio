-- Website fulfillment: paid orders become projects that an AI agent builds, an admin reviews and deploys.
-- Admins are not stored here: access is Cloudflare Access + the ADMIN_EMAILS allow-list (see security.ts).
-- Customer details come from the website's order (the source of truth for payment); a snapshot is kept here.

CREATE TABLE projects (
  id TEXT PRIMARY KEY,                       -- prj_…
  order_id TEXT NOT NULL UNIQUE,             -- website order id (msn-…)
  status TEXT NOT NULL,                      -- see src/projects/status.ts
  payment_status TEXT NOT NULL,              -- pending_payment | processing | paid | payment_failed | cancelled | refunded | partially_refunded | needs_review
  ai_status TEXT NOT NULL DEFAULT 'idle',    -- idle | queued | building | succeeded | failed
  deployment_status TEXT NOT NULL DEFAULT 'not_started', -- not_started | deploying | succeeded | failed
  client_review_status TEXT NOT NULL DEFAULT 'not_requested', -- not_requested | pending | approved | changes_requested
  package_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  business_name TEXT NOT NULL,
  industry TEXT,
  locale TEXT NOT NULL DEFAULT 'en',
  order_snapshot TEXT NOT NULL,              -- JSON: questionnaire answers + line items, as verified from the website
  brief TEXT,                                -- JSON website brief given to the AI agent
  missing_info TEXT NOT NULL DEFAULT '[]',   -- JSON list of gaps found in the brief
  current_version_id TEXT,
  approved_version_id TEXT,
  domain TEXT,
  production_url TEXT,
  cloudflare_connection_id TEXT,
  script_name TEXT,
  form_to_email TEXT,
  form_from_email TEXT,
  resend_key_cipher TEXT,                    -- customer's own Resend key for their site's forms (AES-GCM, never shown again)
  last_error TEXT,
  submitted_at TEXT NOT NULL,
  paid_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX projects_status ON projects(status);
CREATE INDEX projects_updated ON projects(updated_at);
CREATE INDEX projects_package ON projects(package_id);

CREATE TABLE project_assets (
  id TEXT PRIMARY KEY,                       -- ast_…
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  upload_id TEXT NOT NULL,
  kind TEXT NOT NULL,                        -- content | inspiration
  role TEXT NOT NULL,                        -- logo | photo | document | inspiration
  name TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  r2_key TEXT,                               -- copy in the studio's private bucket (null if the copy failed)
  status TEXT NOT NULL,                      -- stored | failed
  error TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (project_id, upload_id)
);

CREATE TABLE website_versions (
  id TEXT PRIMARY KEY,                       -- ver_…
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  label TEXT NOT NULL,                       -- "Initial generation", "Revision", "Rollback of v2"…
  revision_id TEXT,
  parent_version_id TEXT,
  spec_key TEXT,                             -- R2 key of the AI design spec (JSON)
  files_prefix TEXT,                         -- R2 prefix of the rendered preview files
  manifest TEXT NOT NULL DEFAULT '{}',       -- JSON {path: {size, type}}
  build_status TEXT NOT NULL,                -- building | built | failed
  checks_status TEXT NOT NULL DEFAULT 'pending', -- pending | passed | warnings | failed
  approval_status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | changes_requested | superseded
  build_marker TEXT NOT NULL,                -- written into every page; deploy verification looks for it
  error TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  approved_by TEXT,
  approved_at TEXT,
  UNIQUE (project_id, number)
);
CREATE INDEX versions_project ON website_versions(project_id, number);

CREATE TABLE ai_generations (
  id TEXT PRIMARY KEY,                       -- gen_…
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,                        -- initial | revision
  revision_id TEXT,
  base_version_id TEXT,
  version_id TEXT,
  status TEXT NOT NULL,                      -- queued | running | succeeded | failed
  stage TEXT NOT NULL DEFAULT 'queued',      -- queued | design | translate | render | checks | done
  progress TEXT NOT NULL DEFAULT '{}',       -- JSON checkpoint (spec key, translated languages…) so a retry resumes
  model TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT
);
CREATE INDEX generations_project ON ai_generations(project_id, created_at);

CREATE TABLE revision_requests (
  id TEXT PRIMARY KEY,                       -- rev_…
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  base_version_id TEXT NOT NULL,
  instruction TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'admin',      -- admin | client
  requested_by TEXT NOT NULL,
  status TEXT NOT NULL,                      -- queued | in_progress | completed | failed
  result_version_id TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE quality_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version_id TEXT NOT NULL REFERENCES website_versions(id) ON DELETE CASCADE,
  category TEXT NOT NULL,                    -- accessibility | seo | security | links | performance | content | responsive | legal | i18n
  check_id TEXT NOT NULL,
  status TEXT NOT NULL,                      -- pass | warn | fail | skipped
  message TEXT NOT NULL,
  details TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX checks_version ON quality_checks(version_id);

CREATE TABLE cloudflare_connections (
  id TEXT PRIMARY KEY,                       -- cfc_…
  label TEXT NOT NULL,
  owner TEXT NOT NULL,                       -- customer | maison
  account_id TEXT NOT NULL,
  token_cipher TEXT NOT NULL,                -- AES-GCM encrypted API token; never returned to the browser
  token_hint TEXT NOT NULL,                  -- last 4 characters, for recognition only
  status TEXT NOT NULL,                      -- unverified | verified | invalid
  workers_subdomain TEXT,
  verified_at TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE deployments (
  id TEXT PRIMARY KEY,                       -- dep_…
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_id TEXT NOT NULL,
  connection_id TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'cloudflare-workers',
  script_name TEXT NOT NULL,
  status TEXT NOT NULL,                      -- queued | uploading | verifying | succeeded | failed
  cloudflare_deployment_id TEXT,             -- Worker version/etag returned by Cloudflare
  workers_dev_url TEXT,
  domain TEXT,
  production_url TEXT,
  dns_status TEXT NOT NULL DEFAULT 'not_configured', -- not_configured | pending | verified | failed
  ssl_status TEXT NOT NULL DEFAULT 'not_configured', -- not_configured | pending | verified | failed
  log TEXT NOT NULL DEFAULT '[]',            -- JSON progress steps
  error TEXT,
  admin TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL,
  finished_at TEXT
);
CREATE INDEX deployments_project ON deployments(project_id, started_at);

CREATE TABLE status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  event TEXT NOT NULL,                       -- REQUEST_CREATED, PAYMENT_CONFIRMED, AI_QUEUED, … (src/projects/status.ts)
  from_status TEXT,
  to_status TEXT,
  actor TEXT NOT NULL,                       -- admin email, "system", "stripe", "ai-agent" or "client"
  details TEXT NOT NULL DEFAULT '{}',
  at TEXT NOT NULL
);
CREATE INDEX history_project ON status_history(project_id, id);

CREATE TABLE internal_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE client_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_id TEXT NOT NULL,
  decision TEXT NOT NULL,                    -- approved | changes_requested
  message TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,                     -- email | dashboard
  template TEXT NOT NULL,                    -- request_received | payment_received | project_started | info_needed | building | ready_for_review | approved | deployed | admin_alert
  recipient TEXT,
  subject TEXT,
  status TEXT NOT NULL,                      -- sent | skipped | failed | unread | read
  error TEXT,
  dedupe_key TEXT UNIQUE,                    -- e.g. "payment_received:prj_x" so retries never email twice
  created_at TEXT NOT NULL
);
CREATE INDEX notifications_unread ON notifications(channel, status);
