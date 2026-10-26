# Masion Web Studio

Marketing site and online ordering flow for Masion Web Studio, built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Motion and Stripe Checkout.

## Getting started

```bash
cp .env.example .env.local   # add your Stripe test keys
npm install
npm run dev                  # http://localhost:3000
```

For local webhooks, run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

Scripts: `npm run dev`, `npm run build`, `npm start`, `npm run lint`, `npx tsc --noEmit`.

## Structure

| Path | Purpose |
| --- | --- |
| `src/app/(site)/` | Marketing pages: home, work, work/[slug], services, pricing, process, about, terms, start (configurator), checkout/success |
| `src/app/demo/[slug]` | Full-screen, interactive versions of the sample client sites |
| `src/app/api/checkout` | Validates the order, recomputes pricing on the server, saves the order and creates a Stripe Checkout Session |
| `src/app/api/uploads` | Accepts asset uploads (15 MB max each, allow-listed file types) |
| `src/app/api/webhooks/stripe` | Verifies signatures and marks orders paid; sends confirmation emails |
| `src/lib/catalog.ts` | Packages, add-ons, comparison matrix and pricing logic (one source of truth) |
| `src/lib/order-schema.ts` | Zod schemas shared by the client steps and the API |
| `src/lib/projects.ts` | Portfolio content |
| `src/components/demos/` | The five sample client websites (container-query responsive, so they render as desktop or mobile inside device frames) |
| `src/components/start/` | The 6-step configurator |
| `src/app/globals.css` | Design tokens: color, type, radius, shadow, motion, buttons, cards, inputs |

## Ordering flow

Package → Configure (style, pages) → Add-ons → Project details → Asset upload → Review & pay (in full or a 50% deposit) → Stripe Checkout → `/checkout/success`, which verifies the session with Stripe and shows the confirmation. Progress is saved in `localStorage`, so a refresh or a cancelled payment doesn't lose anything.

Pages beyond the package's allowance are billed automatically as "Additional pages". Add-ons already included in a package are hidden.

## Production notes

- **Storage:** orders and uploads are written to `DATA_DIR` (default `.data/`) as files. On serverless hosts (for example Vercel) the filesystem doesn't persist, so either point `DATA_DIR` at a mounted volume or replace `src/lib/server/storage.ts` with a database and object storage such as S3, R2 or Vercel Blob.
- **Email:** set `RESEND_API_KEY` to send customer confirmations, and `STUDIO_NOTIFICATION_EMAIL` to get new-order alerts. Without a key, emails are logged to the console.
- **Content:** the portfolio projects are sample or concept work and are labeled that way. Review the FAQ and terms copy before launch.
