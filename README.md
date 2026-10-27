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

Package → Configure (style, pages) → Add-ons → Project details → Asset upload → Review & pay (always in full; the customer must accept the payment agreement, which says all payments are final) → Stripe Checkout → `/checkout/success`, which verifies the session with Stripe and shows the confirmation. Progress is saved in `localStorage`, so a refresh or a cancelled payment doesn't lose anything.

Pages beyond the package's allowance are billed automatically as "Additional pages". Add-ons already included in a package are hidden.

## Deploying to Cloudflare

The site runs on Cloudflare Workers through the OpenNext adapter (`@opennextjs/cloudflare`). Orders and customer uploads are stored in an R2 bucket bound as `MASION_DATA` (see `wrangler.jsonc`).

1. **Plan:** use Workers Paid ($5/month). The free plan's 10 ms CPU limit per request is too low for server-rendered pages.
2. **Storage:** in the Cloudflare dashboard, open R2 and create a bucket named `masion-web-studio-data`.
3. **Deploy:** either
   - connect the GitHub repo under Workers & Pages → Create → Import a repository, with build command `npx opennextjs-cloudflare build` and deploy command `npx opennextjs-cloudflare deploy`, or
   - run `npx wrangler login` and then `npm run deploy` from this folder.
4. **Secrets:** in the Worker, open Settings → Variables and Secrets and add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STUDIO_NOTIFICATION_EMAIL` and, optionally, `RESEND_API_KEY` and `EMAIL_FROM`. Optionally set `NEXT_PUBLIC_SITE_URL` as a build variable.
5. **Domain:** add your domain to Cloudflare, then in the Worker open Settings → Domains & Routes and add a custom domain.
6. **Stripe webhook:** add an endpoint at `https://yourdomain.com/api/webhooks/stripe` for `checkout.session.completed`, `checkout.session.async_payment_succeeded` and `checkout.session.expired`.

To try the Cloudflare build locally, copy `.dev.vars.example` to `.dev.vars` and run `npm run preview`.

Customer files can be downloaded from the R2 bucket in the dashboard (`uploads/<id>/`). Each order's JSON in `orders/` lists its upload IDs.

## Production notes

- **Storage:** on Cloudflare, orders and uploads go to R2. On any other Node host they're written to `DATA_DIR` (default `.data/`), which must be a persistent disk.
- **Email:** set `RESEND_API_KEY` to send customer confirmations, and `STUDIO_NOTIFICATION_EMAIL` to get new-order alerts. Without a key, emails are logged to the console.
- **Content:** the portfolio projects are sample or concept work and are labeled that way. Review the FAQ and terms copy before launch.
