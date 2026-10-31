# Privacy data map

Use this to keep the Privacy Policy and Cookie Policy accurate. Update both whenever this table changes. Reviewed against the code on 2026-10-28.

| Data | Source | Purpose | Stored where | Shared with | Retention |
| --- | --- | --- | --- | --- | --- |
| Name, email, phone (optional), business name, industry, website, goals, audience, inspiration, launch date, brand notes, page list | Order form | Deliver the project, contact the customer | R2 `orders/` | Cloudflare (host), email provider (confirmation) | Paid: per accounting needs (policy says typically ≤ 7 years). Unpaid: auto-deleted after 90 days |
| Uploaded files (may contain personal data, photos of people) | Order form | Build the website | R2 `uploads/` | Cloudflare | 12 months after completion (manual) · unpaid/orphaned: 90 days (automatic) |
| Payment-agreement acceptance (version + timestamp) | Review step | Evidence of agreement | Order record | — | With the order |
| Payment details | Stripe Checkout | Payment, fraud prevention | Stripe | Stripe | Stripe's policy |
| Order language | Configurator | Communicate in the right language | Order record | — | With the order |
| IP address | Requests | Rate limiting, security | Not stored by the app (transient in Cloudflare rate limiter and Cloudflare logs) | Cloudflare | Cloudflare log retention |
| Outreach leads: business name, category, city/state, public website, public business email (with the page it was published on), public phone, public social profiles, website check results, AI research notes, emails sent and replies | Public web pages, OpenStreetMap, AI web research, CSV import (outreach app) | Find and contact businesses that may need a website | Cloudflare D1 (outreach app) | Anthropic (Claude API), Google (Gmail mailbox, optional PageSpeed), Cloudflare | Opt-outs: kept permanently in the suppression list (address + reason only). Other leads: define and document a deletion period with your attorney (e.g. 12 months without engagement) |
| `maison:ref` session storage | Outreach email links (utm_content) | Attribute visits/orders to outreach | Browser sessionStorage; reference code stored with the order | Outreach app (code only) | Until the tab closes; with the order record |
| `NEXT_LOCALE` cookie | Language selector | Remember chosen language | Browser | — | 1 year |
| `masion:configurator:v2` | Order form | Keep progress in the tab | Browser `sessionStorage` | — | Until the tab closes or "Clear my saved details" |

Not collected: analytics, advertising/social trackers, fingerprinting, customer accounts. No data is sold or shared for advertising.

**Before adding analytics, chat widgets, embedded maps/videos, fonts from third-party CDNs or Turnstile:** update this table, the Privacy Policy, the Cookie Policy and the CSP, and add a consent mechanism where required (EU/UK/Brazil and others).

Legal review required: lawful bases, international transfer mechanism, controller identity/address, data-request process, CCPA/CPRA and other state law applicability, children's data statement.
