# Deployment (Cloudflare Workers)

The site runs on Cloudflare Workers via the OpenNext adapter. Orders and uploads live in a private R2 bucket. Everything below is done by the site owner — no credentials belong in the repository.

## 1. One-time setup

1. **Plan:** Workers Paid ($5/month). The free plan's CPU limit is too low for server-rendered pages.
2. **R2 bucket:** R2 → Create bucket → `masion-web-studio-data`. Leave public access **off**.
3. **Repository:** push to GitHub (`masionwebstudio`), then Workers & Pages → Create → Import a repository.
   - Build command: `npx opennextjs-cloudflare build`
   - Deploy command: `npx opennextjs-cloudflare deploy`
   - Or deploy from a machine: `npx wrangler login` then `npm run deploy`.
4. **Variables and secrets** (Worker → Settings → Variables and Secrets). Add as **Secrets**, never as plain text:
   - `STRIPE_SECRET_KEY` — live key (`sk_live_…`) only in production; `sk_test_…` everywhere else
   - `STRIPE_WEBHOOK_SECRET` — from step 6
   - `RESEND_API_KEY` (recommended — without it customers get **no** confirmation email), `EMAIL_FROM`, `STUDIO_NOTIFICATION_EMAIL`
   - Build variable: `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`
   - For Maison Studio (website fulfillment + outreach, see `studio/FULFILLMENT.md`): `STUDIO_URL` and the secret `STUDIO_INTERNAL_SECRET`. Both are required for fulfillment: the website uses them to notify the studio of orders and to authorize the studio's private reads of orders and uploaded files.
5. **Domain:** add the domain to Cloudflare. Worker → Settings → Domains & Routes → add custom domain. Then in the zone:
   - SSL/TLS → mode **Full (strict)**; Edge Certificates → **Always Use HTTPS** on, minimum TLS 1.2.
   - The app also redirects HTTP→HTTPS and sends HSTS (`max-age=31536000`). Only add `includeSubDomains`/`preload` once every subdomain is HTTPS-only.
6. **Stripe webhook:** Stripe Dashboard → Developers → Webhooks → Add endpoint `https://yourdomain.com/api/webhooks/stripe` with events:
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
7. **Rate limiting & cron** are declared in `wrangler.jsonc` (`CHECKOUT_LIMITER` 10/min, `UPLOAD_LIMITER` 30/min per IP; retention job daily at 03:17 UTC). Confirm they appear under the Worker's Settings after the first deploy.
8. **Email domain:** verify the sending domain in Resend (SPF/DKIM), and set a DMARC record.

## 2. Before going live

Do a full test-mode rehearsal on a staging deployment with **test** keys:

- [ ] Place an order with Stripe test card `4242 4242 4242 4242` → webhook marks it `paid`, confirmation email arrives, success page shows "Paid in full".
- [ ] Declined card `4000 0000 0000 0002` → no order marked paid.
- [ ] Delayed method (e.g. test ACH/SEPA) → `processing`, then `paid` or `payment_failed`.
- [ ] Cancel on the Stripe page → back to review, notice shown, nothing charged.
- [ ] Refund a test payment in Stripe → order becomes `refunded`.
- [ ] Re-send a webhook event from the Stripe dashboard → acknowledged as duplicate, no second email.
- [ ] `curl -I http://yourdomain.com` → 301 to https; `curl -I https://yourdomain.com` shows CSP, HSTS, X-Frame-Options.
- [ ] `E2E_BASE_URL=https://staging.yourdomain.com npm run test:e2e`
- [ ] Lighthouse on the live URL (mobile and desktop).
- [ ] Submit `https://yourdomain.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools.

Then switch the secrets to live keys, create the live webhook endpoint, and make one small real purchase you refund yourself.

## 3. Local Cloudflare preview

```bash
cp .dev.vars.example .dev.vars   # test keys only
npm run preview                  # http://localhost:8787 (local R2 simulation)
```

## 4. Rollback

Workers keeps previous versions: Worker → Deployments → select a version → Rollback. Data in R2 is not affected by code rollbacks.
