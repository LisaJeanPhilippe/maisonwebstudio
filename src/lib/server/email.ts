import "server-only";
import { INDUSTRIES, type IndustryId } from "@/lib/catalog";
import { SITE } from "@/lib/site";
import { orderReference, type StoredOrder } from "./storage";

const usd = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);

/** "jordan@example.com" -> "j***@example.com" — for logs only. */
export function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  return domain ? `${user.slice(0, 1)}***@${domain}` : "***";
}

/**
 * Sends email through Resend's HTTP API when RESEND_API_KEY is configured.
 * Without it, only a one-line notice is logged — never the message body,
 * which contains customer details.
 */
async function send(to: string, subject: string, text: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || `${SITE.name} <${SITE.email}>`;
  if (!key) {
    console.info(`[email] Not sent (RESEND_API_KEY not set): "${subject.replace(/—.*/, "").trim()}" to ${maskEmail(to)}`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, text }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) console.error(`[email] Resend responded ${res.status} for ${maskEmail(to)}`);
    return res.ok;
  } catch {
    console.error(`[email] Could not reach Resend for ${maskEmail(to)}`);
    return false;
  }
}

/** Order confirmation (English — see docs/TRANSLATION_REVIEW.md) and the studio's notification. */
export async function sendOrderConfirmation(stored: StoredOrder) {
  const { order } = stored;
  const ref = orderReference(stored.id);
  const lines = stored.items
    .map((i) => `  • ${i.name}${i.quantity > 1 ? ` × ${i.quantity}` : ""} — ${usd(i.total)}`)
    .join("\n");

  await send(
    order.email,
    `Your website order is confirmed — ${ref}`,
    `Hi ${order.fullName.split(" ")[0]},

Thank you for choosing ${SITE.name}. Your order ${ref} for ${order.businessName} is confirmed.

${lines}

Paid in full: ${usd(stored.total)}

As agreed at checkout, all payments are final and non-refundable.

What happens next
1. Within one business day we'll email you to schedule a 30-minute kickoff call.
2. We'll share a project board with your timeline and anything else we need.
3. Your first design draft arrives in your inbox — usually within a week.

Questions? Reply to this email or write to ${SITE.email}.

— ${SITE.name}`,
  );

  const studio = process.env.STUDIO_NOTIFICATION_EMAIL;
  if (studio) {
    await send(
      studio,
      `New order ${ref} — ${order.businessName} (${usd(stored.total)})`,
      `${order.fullName} <${order.email}> ${order.phone}
Industry: ${INDUSTRIES[order.industry as IndustryId] ?? order.industry}
Language: ${order.locale}
Package: ${order.packageId} | Style: ${order.style}
Pages: ${order.pages.join(", ")}
${lines}
Goals: ${order.goals}
Asset notes: ${order.assetNotes || "—"}
Uploaded files (R2 bucket, uploads/<id>/): ${order.files.map((f) => `${f.name} (${f.id})`).join(", ")}
Payment agreement v${stored.paymentAgreement.version}, accepted ${stored.paymentAgreement.acceptedAt}`,
    );
  }
}
