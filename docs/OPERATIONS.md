# Operations & backups

## Where data lives

| Data | Location | Notes |
| --- | --- | --- |
| Orders | R2 `orders/<orderId>.json` | Customer details, line items, total, status, agreement version/time |
| Uploaded files | R2 `uploads/<uploadId>/<file>` + `meta.json` | Private; stored with `Content-Disposition: attachment` |
| Processed webhook events | R2 `events/<eventId>.json` | Idempotency markers |
| Payments, cards, refunds | Stripe | The site never sees card numbers |

Off Cloudflare, the same layout is written under `DATA_DIR`.

## Order statuses

| Status | Meaning | Action |
| --- | --- | --- |
| `pending_payment` | Checkout started, not paid | None; deleted after 90 days if never paid |
| `processing` | Delayed payment method pending | Wait for Stripe |
| `paid` | Webhook confirmed full amount | Start the project |
| `payment_failed` / `cancelled` | Not paid / session expired or failed to start | None |
| `needs_review` | Amount, currency or session did not match the order | **Check Stripe manually before starting work** (`reviewReason` in the order) |
| `refunded` / `partially_refunded` | Refund issued in Stripe | Update records |

Only the Stripe webhook can mark an order paid. Refunds are issued from the Stripe dashboard (the site never refunds automatically; the agreement says payments are final, but you may still refund at your discretion or where the law requires it).

## Finding a customer's files

R2 → `masion-web-studio-data` → `orders/` → open the order JSON → `order.files[].id` → `uploads/<id>/`. Treat downloaded files as untrusted: open them in up-to-date software, and scan them before opening macros, archives or design files.

## Retention (automatic + manual)

The Worker's daily cron (`cloudflare/retention.ts`) deletes:
- unpaid orders older than 90 days and their files,
- uploads never attached to an order after 90 days,
- webhook event markers after 90 days.

**Manual:** delete paid orders' uploaded files 12 months after project completion (Privacy Policy), and keep order/payment records as your accountant advises (the policy says typically up to 7 years). Handle deletion/access requests within the legal deadline (e.g. 30 days GDPR, 45 days CCPA): find the order by email, export or delete the JSON and its uploads, and note the request.

## Backups

R2 is durable but is **not** a backup against accidental deletion, a bug, or a compromised account. Set up at least one:

1. **Recommended:** a scheduled copy of the bucket to separate storage you control, e.g. with `rclone` (S3-compatible R2 API token with **read-only** access to the bucket):
   ```bash
   rclone sync r2:masion-web-studio-data /secure/backups/maison/$(date +%F) --s3-no-check-bucket
   ```
   Run daily; keep 30 daily + 12 monthly copies; encrypt the destination (`rclone crypt`) because it contains personal data.
2. Enable R2 **object lifecycle/versioning** features if available on your plan, or bucket-level Event Notifications to a log.
3. **Test a restore quarterly:** copy a backup into a test bucket, point a preview deployment at it, open an order.

Stripe keeps its own payment records; export them for accounting monthly.

## Monitoring

- Workers → your Worker → **Logs/Observability**: look for `[webhook]` errors, `[checkout] … failed`, `[email] … responded`.
- Stripe → Webhooks → endpoint → failed deliveries (Stripe retries for 3 days).
- Recommended: an uptime check on `/` and `/robots.txt`, and an alert on Stripe webhook failures.
- Logs contain order IDs and masked emails only; never paste full customer data into tickets.

## Incident checklist

1. Payment issue: check Stripe first (source of truth), then the order JSON. Resend a webhook from Stripe if needed — processing is idempotent.
2. Suspected key leak: roll the Stripe key and webhook secret in Stripe, update Worker secrets, redeploy, review Stripe logs.
3. Suspected data exposure: preserve logs, rotate R2 API tokens, assess notification duties with your attorney.
