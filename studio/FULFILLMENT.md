# Maison Studio: website fulfillment

This is the private dashboard at `/admin` on the studio Worker (`studio/`). It turns a paid website order into a working website, and a person stays in charge of every important step:

**paid order → structured brief → AI build → automatic checks → sandboxed preview → your review (revisions, versions, rollback) → optional client review → your approval → you deploy to Cloudflare (preferably the customer's own account) → live check → completed**

Two things are always true:
- **AI never approves anything, and nothing deploys without a person.** The status machine (`src/projects/status.ts`) has no path from an AI state to `APPROVED`. Only an admin action can approve a version. Only an admin clicking **Deploy** starts a deployment, and only for an approved version.
- **Generation starts only after payment.** The studio re-reads every order from the website, and the website marks orders paid only from a Stripe webhook with a valid signature. An event, a browser redirect or a forged request can trigger a re-check, but it can't start a build.

## How it works

| Piece | Where | What it does |
|---|---|---|
| Questionnaire + uploads | website `/start` | Collects business, goals and main action (CTA), pages, design, features, content, languages, content files and inspiration images. |
| Payment | website + Stripe Checkout | The webhook (signature, amount and currency checked) marks the order `paid`, then notifies the studio. |
| Order sync | `src/projects/intake.ts` | Fetches the order from the website's private `/api/internal/*` API, creates the project, copies files into private R2, writes the brief and a list of missing information, and queues the AI build. An hourly reconcile job catches missed events. |
| AI website agent | `src/builder/agent.ts` | Claude Opus 5.5 returns a **structured site design** (pages, sections, copy, theme) as validated JSON. It never writes code. |
| Renderer | `src/builder/render.ts` | Maison's code turns the design into real HTML/CSS, vetted JavaScript, per-language pages, SEO files, legal page templates and a form handler. Colors are corrected to meet WCAG AA contrast. |
| Checks | `src/builder/checks.ts` | Accessibility, SEO, links, security (no inline or external scripts), content honesty (testimonials must come from the customer), legal, languages, performance. A failed check blocks approval. Warnings need explicit confirmation. |
| Preview | `/p/<version>.<signature>/` | Each version is served from R2 behind an unguessable link, with `Content-Security-Policy: sandbox` and `noindex`. Forms reply "preview only" and send nothing. |
| Revisions | Project page → "Ask the AI for changes" | Each request creates a new numbered version. Earlier versions are kept. **Restore** re-renders an older design as a new version, with no AI involved. |
| Client review | `/review/<signed token>` | Optional. A 30-day link to the approved version, with "Approve" or "Request changes". The link stops working if you approve another version. |
| Deployment | `src/deploy/*` | Uses the Cloudflare API, with the same calls Wrangler makes: upload static assets, upload the Worker, turn on workers.dev, attach a custom domain. The project is marked **Deployed** only after the live URL serves this exact build (a `maison-build` marker). Domains are marked verified only once they serve that build over HTTPS. |

### Where the customer's site lives (no lock-in)

A deployed site is a small Worker with static assets and a form handler. It has **no runtime dependency on Maison**:
- Form emails go out through the customer's own Resend key, stored as a Worker secret in their account.
- Use a connection to the **customer's own Cloudflare account** (recommended; the default choice in the form). The customer owns the site and the domain, can revoke Maison's token at any time, and the site keeps running.
- Deploying to Maison's account is possible, but it's labelled clearly so you can move the site later.

### Statuses

`NEW_REQUEST → AWAITING_PAYMENT → PAID → QUEUED_FOR_AI → AI_BUILDING → READY_FOR_REVIEW ⇄ REVISIONS_REQUESTED → AI_REVISING → … → APPROVED → (CLIENT_REVIEW) → READY_FOR_DEPLOYMENT → DEPLOYING → DEPLOYED → COMPLETED`, plus `FAILED`.

Every change is written to the project's history with the actor (`stripe`, `ai-agent`, `client` or the admin's email).

### Failures

- **AI build fails:** temporary errors (timeouts, overload, rate limits) retry up to 3 times. After that the project goes to `FAILED` with the reason, the last working version stays current, and an alert appears on the dashboard. Use **Retry AI build** or **Back to review of the last version**. Builds are checkpointed by stage (design, then each language), so a retry doesn't redo finished work.
- **Deployment fails:** nothing that's already live is removed. The project returns to `READY_FOR_DEPLOYMENT`, or stays `DEPLOYED` if a previous version is live. The error and a step-by-step log are shown on the project. Temporary Cloudflare errors (429 and 5xx) retry automatically.
- **Domain not live yet:** the site is still deployed on workers.dev. The domain is re-checked every 5 minutes for 24 hours, and the customer gets the "your site is live" email only once it works.
- **File copy fails:** the project shows which files failed, with **Retry copying files**.

## External services and costs

Prices change, so check each provider's pricing page before relying on these numbers (they were current as of Nov 2026, to the best of our knowledge).

| Service | Why | Cost |
|---|---|---|
| Cloudflare Workers (studio) | Runs the dashboard, queue consumer and cron | Free plan: 100k requests/day. Workers Paid: $5/month, which also covers Queues if your account needs it. |
| Cloudflare D1 | Projects, versions, history, notes | Free tier is plenty for this volume. |
| Cloudflare R2 | Customer files and rendered versions (private) | 10 GB-month free, then about $0.015/GB-month. No egress fees. |
| Cloudflare Queues | Background jobs (sync, builds, deploys, checks) | Included in Workers Paid. Check whether your plan includes it. |
| Cloudflare Zero Trust (Access) | Login in front of `/admin` | Free up to 50 users. |
| Anthropic API (Claude Opus 5.5) | The website agent | $4 per million input tokens, $20 per million output tokens (cache reads $0.20). A typical build costs about $0.50–$2, more with many languages or images. Each revision costs about the same as a build. Set a monthly spend limit in the Claude Console. |
| Resend (studio account) | Transactional emails to customers: payment received, preview ready, site live | Free: 3,000 emails/month (100/day). |
| Customer's Cloudflare account | Hosts their site | Free plan works for a typical small-business site. A custom domain costs the registrar's fee. |
| Customer's Resend account | Sends their site's form submissions to them | Free tier is usually enough. They must verify their domain in Resend. |

## Environment variables (names only; never commit values)

**Studio Worker** (`studio/wrangler.jsonc` vars + `wrangler secret put`):

| Name | Type | Purpose |
|---|---|---|
| `ENVIRONMENT` | var | `production`. Anything else turns on development shortcuts. |
| `PUBLIC_BASE_URL` | var | The studio's https origin (dashboard, review links) |
| `PREVIEW_ORIGIN` | var | Origin that serves previews. A separate hostname is recommended. |
| `WEBSITE_INTERNAL_URL` | var | The website origin, used for `/api/internal/*` |
| `EMAIL_FROM` | var | Sender for customer emails, e.g. `Maison Web Studio <studio@yourdomain>` |
| `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, `ADMIN_EMAILS` | var | Dashboard login (Cloudflare Access) and the admin allow-list |
| `AI_MODEL` | var | Default `claude-opus-5-5` |
| `ANTHROPIC_API_KEY` | secret | Website agent |
| `APP_SECRET` | secret | Signs preview links, review links and form tokens (32+ random characters) |
| `INTERNAL_SECRET` | secret | Shared with the website for server-to-server calls (32+ characters) |
| `ENCRYPTION_KEY` | secret | Base64 of 32 random bytes. Encrypts Cloudflare tokens and customer Resend keys at rest. |
| `RESEND_API_KEY` | secret | Customer transactional email |
| Bindings: `DB` (D1), `SITES` (R2), `JOBS` (Queue), `ADMIN_LIMITER` / `PUBLIC_LIMITER` (rate limits) | | See `wrangler.jsonc` |

**Website Worker:** `STUDIO_URL` (var) and `STUDIO_INTERNAL_SECRET` (secret; the same value as the studio's `INTERNAL_SECRET`), in addition to the Stripe and storage settings in `docs/DEPLOYMENT.md`.

**Per customer, entered in the dashboard and never in code:** a Cloudflare API token and Account ID (encrypted in D1), the form recipient address, the form sender address, and the customer's Resend key (encrypted, and sent to their Worker only as a secret).

**Development only, ignored when `ENVIRONMENT=production`:** `DEV_ADMIN_EMAIL`, `DEV_AI_PROVIDER=stub`, `DEV_CLOUDFLARE_API`, `DEV_ALLOW_LOCAL_FETCH`.

## Manual setup (numbered)

Do these once, in order. Each credential lists the service, why it's needed, the cost, where to get it, the variable name, how to set it and how to test it.

1. **Two Cloudflare apps, one repo.** Connect the repo to the website app (deploy command `npx opennextjs-cloudflare deploy`) and, separately, to a Worker named `maisonstudio` (no build command; deploy command `npm run studio:ci-deploy`). Never chain both deploys in one app: Workers Builds forces every deploy in a build onto that app's own name.

   **Merge and deploy the code.** The fulfillment system is on the `outreach-system` branch. After review, merge it to `main`. The website redeploys from GitHub as before.

2. **Create the Cloudflare resources for the studio** (Cloudflare dashboard login: `npx wrangler login`):
   ```bash
   npx wrangler d1 create maison-studio            # paste database_id into studio/wrangler.jsonc
   npx wrangler r2 bucket create maison-studio-sites
   npx wrangler queues create maison-studio-jobs
   npx wrangler queues create maison-studio-dlq
   npm run studio:migrate                           # applies migrations 0001 + 0002
   ```
   Test: `npx wrangler d1 execute maison-studio --remote -c studio/wrangler.jsonc --command "SELECT COUNT(*) FROM projects"` returns 0.

3. **Fill in the vars in `studio/wrangler.jsonc`:** `PUBLIC_BASE_URL` (e.g. `https://studio.maisonwebstudio.com`), `PREVIEW_ORIGIN` (e.g. `https://preview.maisonwebstudio.com`), `WEBSITE_INTERNAL_URL` (`https://maisonwebstudio.com`), `EMAIL_FROM`, `ADMIN_EMAILS`. Deploy with `npm run studio:deploy`. Then in Workers → maisonstudio → Settings → Domains & Routes, add **both** hostnames as custom domains.

4. **`APP_SECRET`**
   - Why: signs preview, review and form links.
   - Cost: free.
   - Get it: `openssl rand -base64 48`.
   - Set: `npx wrangler secret put APP_SECRET -c studio/wrangler.jsonc`.
   - Test: open a project's preview. A changed character in the link returns "Preview not found".

5. **`ENCRYPTION_KEY`**
   - Why: encrypts customer Cloudflare tokens and Resend keys in the database.
   - Cost: free.
   - Get it: `openssl rand -base64 32` (must decode to exactly 32 bytes).
   - Set: `npx wrangler secret put ENCRYPTION_KEY -c studio/wrangler.jsonc`. Keep a copy in your password manager. If you lose it, you have to re-enter every saved token.
   - Test: add a Cloudflare connection (step 9). It saves without an "ENCRYPTION_KEY" error.

6. **`INTERNAL_SECRET` (studio) = `STUDIO_INTERNAL_SECRET` (website)**
   - Why: authenticates website ↔ studio calls.
   - Cost: free.
   - Get it: `openssl rand -base64 48`.
   - Set: `npx wrangler secret put INTERNAL_SECRET -c studio/wrangler.jsonc`. Then, in the website Worker (Cloudflare dashboard → maison → Settings → Variables and secrets), add the secret `STUDIO_INTERNAL_SECRET` with the same value and the variable `STUDIO_URL` = your studio URL. Redeploy the website.
   - Test: place a Stripe **test-mode** order. It appears on `/admin` within seconds.

7. **`ANTHROPIC_API_KEY`**
   - Why: the website-building agent.
   - Cost: see the table above. Set a monthly spend limit.
   - Get it: Claude Console → API keys → Create key.
   - Set: `npx wrangler secret put ANTHROPIC_API_KEY -c studio/wrangler.jsonc`.
   - Test: a paid test order moves from "Queued for AI" to "Ready for review", and "AI build runs" shows the model `claude-opus-5-5`. Without a key, the build fails with "No AI provider is configured". It is never faked.

8. **Cloudflare Access for `/admin`** (free)
   - Zero Trust → Access → Applications → Self-hosted. Domain: your studio hostname, path `admin`. Policy: allow your email address(es).
   - Copy the AUD tag to `ACCESS_AUD`, your team domain to `ACCESS_TEAM_DOMAIN`, and the same emails to `ADMIN_EMAILS`. Redeploy.
   - Test: `/admin` in a private window asks you to log in, and an email that isn't on the allow-list gets "Not authorized". `/p/…` and `/review/…` stay public by design: they are capability links.

9. **`RESEND_API_KEY` + `EMAIL_FROM`** (customer emails)
   - Why: payment received, preview ready, site live, and info requests. These are transactional only, never marketing.
   - Cost: free tier.
   - Get it: resend.com → add and verify your domain → API Keys.
   - Set: `npx wrangler secret put RESEND_API_KEY -c studio/wrangler.jsonc`. Set the `EMAIL_FROM` var to an address on the verified domain.
   - Test: in a project's "Notifications" list, entries show `sent`. Without a key they show `skipped`, and the workflow continues.

10. **For each customer: their Cloudflare account** (recommended)
    - The customer creates a free Cloudflare account. Under My Profile → API Tokens → Create Token → Custom, they set these permissions:
      - Account · Workers Scripts · Edit;
      - for a custom domain, also Zone · Workers Routes · Edit, Zone · DNS · Edit and Zone · Zone · Read, limited to their domain.
    - They send you the token over a secure channel, plus their Account ID.
    - In the dashboard → **Cloudflare** → *Add a connection* → **Save and verify**. Test: the status shows `verified` and their `workers.dev` subdomain. If it says there's no subdomain, they need to open Workers & Pages once in their dashboard.
    - If they want their own domain, they add it to Cloudflare ("Add a site") and switch the nameservers at their registrar before you deploy.

11. **For each customer: form email**
    - The customer creates a free Resend account, verifies their domain, and creates an API key.
    - On the project → Destination, enter the form recipient (`FORM_TO_EMAIL`), the sender (`FORM_FROM_EMAIL`, an address on their verified domain) and their key (`RESEND_API_KEY`, stored encrypted).
    - Test after deploy: submit the live contact form. The message arrives in their inbox.

12. **Deploy a site:** approve a version → (optionally) **Send to client for review** → **Mark ready for deployment** → choose the connection, Worker name and optional domain → tick the confirmation → **Deploy to Cloudflare**. Wait for **Deployed**, open the URL, then **Mark project completed** once the customer is happy.

## Before you launch each customer site (human checks)

- Read every page in every language. Translations are machine-assisted, so have a native speaker review them.
- Legal pages are **templates**. The business owner, and ideally a lawyer, must review them. They don't guarantee legal compliance.
- The automatic accessibility checks and axe scans catch many problems, not all of them. Do a short keyboard and screen-reader pass. Don't claim the site is "ADA compliant".
- Check that facts, prices and testimonials match what the customer provided. The checks flag testimonials that aren't in the customer's own text, but a person makes the final call.

## Testing

```bash
npm run studio:typecheck
npm run studio:test                       # unit + workflow tests (in-memory DB, local doubles)
npm run build && npm run studio:e2e       # real website + studio Worker + browser, all local
```

The end-to-end test runs the whole chain locally:
- `next start` with dummy test-mode Stripe keys, and a Stripe webhook signed locally with a test secret;
- `wrangler dev` with local D1, Queues and R2, and the offline stub agent;
- a local mock of the Cloudflare API that checks request shapes and serves the "deployed" site.

It also runs axe on the dashboard, the client review page, the preview (at 375, 768 and 1280 px) and the deployed site. **Nothing is charged, emailed or deployed to Cloudflare.**

What the automated tests cannot prove, and needs a one-time manual check with real accounts:
- a real Claude build;
- a real deploy to a Cloudflare account, including the custom-domain path (DNS and SSL);
- real Resend delivery.

Do these with a test order (Stripe test mode) and a throwaway Cloudflare account before your first customer.
