# Security notes

This describes the controls in place and their limits. It is not a certification; an independent penetration test is recommended before launch and after major changes.

## Controls

| Area | Control | Verified by |
| --- | --- | --- |
| Transport | HTTP→HTTPS 301 in the Worker; HSTS 1 year (production) | `tests/e2e/pages.spec.ts` (headers); redirect needs a post-deploy `curl` check |
| Headers | CSP, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, Referrer-Policy, Permissions-Policy, COOP; no `X-Powered-By` | e2e headers test, wrangler preview |
| Payments | Prices only from `src/lib/catalog.ts`; client totals stripped; unknown add-ons rejected; Checkout idempotency key | `tests/unit/pricing.spec.ts`, `tests/integration/api.spec.ts` |
| Webhook | Signature verified with `STRIPE_WEBHOOK_SECRET`; idempotent per event id; amount/currency/session checked (`needs_review` on mismatch); paid orders never downgraded; 500 on failure so Stripe retries | `tests/integration/webhook.spec.ts` |
| Success page | Read-only; shows "paid" only when the webhook has recorded it and the session id matches | integration + e2e tests |
| Uploads | 15 MB / 15 files, extension allow-list, file-signature check, executables/HTML/script-bearing SVG refused, sanitized names (no path traversal), server-chosen content type, stored privately as downloads, never served from the site | integration tests |
| Abuse | Same-origin check on POST APIs; per-IP rate limits (Cloudflare Rate Limiting binding; in-memory fallback elsewhere); body size limits; honeypot field | integration tests |
| Input | zod validation on the server for every field (lengths, formats, enums) | unit + integration tests |
| Secrets | Server-only modules (`server-only`); only `NEXT_PUBLIC_SITE_URL` reaches the browser; `.env*`, `.dev.vars` git-ignored; no source maps in production | code review, build |
| Logging | Order ids and masked emails only; never message bodies, addresses or card data | code review |
| Dependencies | `npm audit` clean at the time of the audit (wrangler upgraded, `glob` pinned via `overrides`) | `npm audit` |

## Known trade-offs / residual risks

- **CSP allows `'unsafe-inline'` scripts and styles.** Next.js inlines hydration scripts; a nonce-based CSP would make every page dynamic (slower, more expensive on Workers). The site renders no user-generated HTML, which limits XSS exposure, but a nonce/hash CSP is the stronger option if requirements change.
- **No authentication / admin area.** Orders are managed in R2 and Stripe dashboards; protect those accounts with strong passwords and 2FA/passkeys, and keep the number of people with access small.
- **Uploaded files are not malware-scanned.** They're checked for type consistency only. Open them with care (see OPERATIONS.md) or add a scanning service.
- **Rate limiting off Cloudflare** trusts `X-Forwarded-For`; only deploy behind a proxy that sets it.
- **Order lookup on the success page** requires both the order id and the matching Stripe session id; it shows a masked email and order summary only.
- **CSRF:** the APIs use no cookies or sessions; Origin/`Sec-Fetch-Site` checks block cross-site form posts.
- **Bot protection:** honeypot + rate limits only. If spam appears, add Cloudflare Turnstile (requires a privacy-policy update).

## Reporting a vulnerability

Email the address in `src/lib/site.ts` with "Security" in the subject. Consider publishing `/.well-known/security.txt` once a dedicated address exists.
