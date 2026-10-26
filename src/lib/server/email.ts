import "server-only";
import { formatPrice } from "@/lib/catalog";
import { orderReference, type StoredOrder } from "./storage";

/**
 * Sends order confirmation emails through Resend's HTTP API when
 * RESEND_API_KEY is configured. Without it, emails are logged instead so
 * local development works without credentials.
 */
async function send(to: string, subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Masion Web Studio <hello@masionwebstudio.com>";
  if (!key) {
    console.info(`[email:disabled] To: ${to} | ${subject}\n${text}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, text }),
  });
  if (!res.ok) console.error(`[email] Failed to send to ${to}: ${res.status} ${await res.text()}`);
}

export async function sendOrderConfirmation(stored: StoredOrder) {
  const { order } = stored;
  const ref = orderReference(stored.id);
  const lines = stored.items.map((i) => `  • ${i.name} — ${formatPrice(i.total)}`).join("\n");

  await send(
    order.email,
    `Your website order is confirmed — ${ref}`,
    `Hi ${order.fullName.split(" ")[0]},

Thank you for choosing Masion Web Studio. Your order ${ref} for ${order.businessName} is confirmed.

${lines}

Paid in full: ${formatPrice(stored.total)}

Please send the content we request within 5 days. If we don’t receive it in time, we’ll cancel your order and refund you in full, and you’d need to place a new order. Otherwise, as agreed at checkout, all payments are final.

What happens next
1. Within one business day we'll email you to schedule a 30-minute kickoff call.
2. We'll share a project board with your timeline and anything we still need.
3. Your first design draft arrives in your inbox — usually within a week.

Questions? Just reply to this email.

— Masion Web Studio`,
  );

  const studio = process.env.STUDIO_NOTIFICATION_EMAIL;
  if (studio) {
    await send(
      studio,
      `New order ${ref} — ${order.businessName} (${formatPrice(stored.total)})`,
      `${order.fullName} <${order.email}> ${order.phone}
Industry: ${order.industry}
Package: ${order.packageId} | Style: ${order.style}
Pages: ${order.pages.join(", ")}
${lines}
Goals: ${order.goals}
Payment agreement: v${stored.paymentAgreement.version}, accepted ${stored.paymentAgreement.acceptedAt}
Assets: ${order.files.map((f) => `${f.name} (${f.id})`).join(", ") || "none"}`,
    );
  }
}
