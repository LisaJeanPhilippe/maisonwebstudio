# Maison Web Studio

Marketing site and online ordering flow for Maison Web Studio: portfolio, services, fixed-price packages, a 6-step configurator with mandatory content upload, and full payment through Stripe Checkout. Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 and Motion, and deployed to Cloudflare Workers through OpenNext.

The site is available in 10 languages (English, 简体中文, Español, हिन्दी, العربية with right-to-left layout, Français, বাংলা, Português, Русский, Bahasa Indonesia). Legal and contractual documents are English-only until professionally translated (see `docs/TRANSLATION_REVIEW.md`).

## Getting started

```bash
cp .env.example .env.local   # add Stripe TEST keys
npm install
npm run dev                  # http://localhost:3000
```

For local webhooks: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server (Node) |
| `npm run typecheck`, `npm run lint` | TypeScript and ESLint |
| `npm test` | All automated tests (needs `npm run build` first) |
| `npm run test:unit` | Pricing, validation, translations completeness, data retention |
| `npm run test:integration` | Checkout, upload and Stripe webhook APIs (local, signed test events — never contacts Stripe or charges anything) |
| `npm run test:e2e` | Browser tests: every page × 10 languages, order flow, axe WCAG 2.2 AA scans, responsive overflow at 320–1920px, language switching, broken links, headers |
| `npm run check` | typecheck + lint + build + all tests |
| `npm run preview` | Build for Cloudflare and run locally in the Workers runtime |
| `npm run deploy` | Build and deploy to Cloudflare |

To run the browser tests against another server (e.g. `npm run preview` or staging): `E2E_BASE_URL=http://127.0.0.1:8787 npm run test:e2e`.

## Structure

| Path | Purpose |
| --- | --- |
| `src/app/[lang]/` | All pages, per language. English is served without a prefix (`/pricing`), other languages with one (`/ar/pricing`) |
| `src/app/api/checkout` | Validates the order, recomputes prices from the catalog, stores the order and creates the Stripe Checkout Session |
| `src/app/api/uploads` | Asset uploads: size/type allow-list, file-signature check, rate limiting |
| `src/app/api/webhooks/stripe` | Signature-verified, idempotent payment/refund handling — the only place an order becomes "paid" |
| `src/i18n/` | Locale config, formatting, dictionaries (`messages/*.ts`) |
| `src/content/legal/` | Privacy, Terms, Cookies, Payment Agreement, Accessibility Statement (English drafts) |
| `src/lib/catalog.ts` | Packages, add-ons and pricing — single source of truth |
| `src/lib/server/` | Storage (R2 or disk), Stripe, email, request guards, fulfillment |
| `cloudflare/` | Worker entry (HTTPS redirect, daily retention job) |
| `tests/` | Playwright Test: `unit/`, `integration/`, `e2e/` |
| `docs/` | Deployment, operations & backups, security, privacy data map, accessibility and translation review |

## Ordering flow

Package → Configure → Add-ons → Project details → Upload content (at least one file required) → Review & pay. The customer must accept the payment agreement (all payments final and non-refundable) and the Terms. Payment is always in full via Stripe Checkout. The success page only *reads* order status; the Stripe webhook is what marks an order paid, after checking the amount and currency. Progress is kept in `sessionStorage` for the current tab only.

## Documentation

- [Deployment](docs/DEPLOYMENT.md) — Cloudflare, secrets, Stripe, domain, post-deploy checks
- [Operations & backups](docs/OPERATIONS.md) — orders, refunds, retention, backups, incidents
- [Security notes](docs/SECURITY.md)
- [Privacy data map](docs/PRIVACY_DATA_MAP.md)
- [Accessibility testing](docs/ACCESSIBILITY_TESTING.md)
- [Translation review](docs/TRANSLATION_REVIEW.md)
