import { nowIso } from "../db";
import { maskEmail } from "../text";
import type { StudioCtx } from "./context";
import type { ProjectRow } from "./store";

export type CustomerTemplate =
  | "request_received"
  | "payment_received"
  | "project_started"
  | "info_needed"
  | "building"
  | "ready_for_review"
  | "approved"
  | "deployed";

const first = (name: string) => name.split(/\s+/)[0] || "there";

function compose(t: CustomerTemplate, p: ProjectRow, businessName: string, extra: { message?: string; url?: string }) {
  const hi = `Hi ${first(p.customer_name)},`;
  const sign = `\n\n— Maison Web Studio\nQuestions? Just reply to this email.`;
  switch (t) {
    case "request_received":
      return { subject: `We received your website request for ${businessName}`, text: `${hi}\n\nThanks for your website request for ${businessName}. As soon as your payment is confirmed we'll start building.${sign}` };
    case "payment_received":
      return { subject: `Payment received — ${businessName}`, text: `${hi}\n\nYour payment is confirmed. Your website project for ${businessName} is now in our queue.${sign}` };
    case "project_started":
    case "building":
      return { subject: `We've started building ${businessName}'s website`, text: `${hi}\n\nWe've started on your website. We'll be in touch when the first version is ready to review.${sign}` };
    case "info_needed":
      return { subject: `A quick question about ${businessName}'s website`, text: `${hi}\n\nTo finish your website we need a little more information:\n\n${extra.message ?? ""}\n\nReply to this email with the details or files.${sign}` };
    case "ready_for_review":
      return { subject: `Your website is ready to review`, text: `${hi}\n\nA version of your website is ready for you to review:\n${extra.url ?? ""}\n\nOn that page you can approve it or tell us what to change.${sign}` };
    case "approved":
      return { subject: `Your website is approved`, text: `${hi}\n\nYour website has been approved. Next we'll connect your domain and publish it.${sign}` };
    case "deployed":
      return { subject: `Your website is live`, text: `${hi}\n\nYour website is now live at:\n${extra.url ?? ""}\n\nThank you for working with Maison Web Studio.${sign}` };
  }
}

/**
 * Sends a transactional email to the customer once per (template, project) — or once per
 * dedupe key — and records the outcome. Never mixes in marketing content.
 */
export async function notifyCustomer(ctx: Pick<StudioCtx, "db" | "mail" | "log">, p: ProjectRow, template: CustomerTemplate, extra: { message?: string; url?: string; dedupe?: string } = {}) {
  const key = `${template}:${p.id}${extra.dedupe ? `:${extra.dedupe}` : ""}`;
  const claim = await ctx.db
    .prepare("INSERT INTO notifications (project_id, channel, template, recipient, status, dedupe_key, created_at) VALUES (?, 'email', ?, ?, 'pending', ?, ?) ON CONFLICT(dedupe_key) DO NOTHING")
    .bind(p.id, template, p.customer_email, key, nowIso())
    .run();
  if (!claim.meta.changes) return "duplicate";
  const { subject, text } = compose(template, p, p.business_name, extra);
  let status = "skipped";
  let error: string | null = "Email is not configured (RESEND_API_KEY)";
  if (ctx.mail) {
    const ok = await ctx.mail(p.customer_email, subject, text);
    status = ok ? "sent" : "failed";
    error = ok ? null : "Email provider rejected or was unreachable";
  }
  await ctx.db.prepare("UPDATE notifications SET status = ?, subject = ?, error = ? WHERE dedupe_key = ?").bind(status, subject, error, key).run();
  ctx.log.info("notify.customer", { projectId: p.id, template, to: maskEmail(p.customer_email), status });
  return status;
}

/** Dashboard alert for the studio team (shown on the dashboard until read). */
export async function notifyAdmin(ctx: Pick<StudioCtx, "db">, p: ProjectRow, template: string, subject: string) {
  await ctx.db
    .prepare("INSERT INTO notifications (project_id, channel, template, recipient, subject, status, created_at) VALUES (?, 'dashboard', ?, 'admins', ?, 'unread', ?)")
    .bind(p.id, template, subject.slice(0, 200), nowIso())
    .run();
}
