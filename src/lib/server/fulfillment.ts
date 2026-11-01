import "server-only";
import type Stripe from "stripe";
import { sendOrderConfirmation } from "./email";
import { notifyStudio, reportOutreachConversion } from "./studio";
import { getOrder, updateOrder, type OrderStatus, type StoredOrder } from "./storage";

/** States an order can no longer leave through ordinary checkout events. */
const SETTLED: OrderStatus[] = ["paid", "refunded", "partially_refunded", "needs_review"];

function orderIdFrom(session: Stripe.Checkout.Session) {
  return session.metadata?.orderId ?? session.client_reference_id ?? null;
}

/**
 * Trusted payment handling — called only from the signature-verified webhook.
 * Marks the order paid after checking the session matches what we charged,
 * and sends the confirmation exactly once.
 */
export async function handlePaidSession(session: Stripe.Checkout.Session): Promise<StoredOrder | null> {
  const id = orderIdFrom(session);
  const order = id ? await getOrder(id) : null;
  if (!order) {
    console.warn(`[webhook] Paid session ${session.id} has no matching order`);
    return null;
  }
  if (session.payment_status !== "paid") return order;

  const expectedCents = order.total * 100;
  const mismatch =
    session.amount_total !== expectedCents ||
    session.currency !== "usd" ||
    (order.stripeSessionId && order.stripeSessionId !== session.id);
  const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

  if (mismatch) {
    console.error(`[webhook] Order ${order.id} payment does not match the order — flagged for review`);
    return updateOrder(order.id, {
      status: "needs_review",
      reviewReason: `Stripe session ${session.id} amount ${session.amount_total} ${session.currency} vs expected ${expectedCents} usd`,
      stripePaymentIntentId: paymentIntent,
    });
  }

  let updated = order;
  if (!SETTLED.includes(order.status)) {
    updated = (await updateOrder(order.id, { status: "paid", stripeSessionId: session.id, stripePaymentIntentId: paymentIntent })) ?? order;
  }
  if (updated.status === "paid" && !updated.confirmationSentAt) {
    await sendOrderConfirmation(updated);
    updated = (await updateOrder(order.id, { confirmationSentAt: new Date().toISOString() })) ?? updated;
    await reportOutreachConversion(updated.order.ref);
  }
  // The studio builds the website only after this verified payment (it re-fetches the order itself).
  if (updated.status === "paid") await notifyStudio({ type: "order.paid", orderId: updated.id });
  return updated;
}

/** Moves an unpaid order to another state without ever downgrading a settled one. */
export async function setUnpaidStatus(session: Stripe.Checkout.Session, status: "processing" | "payment_failed" | "cancelled") {
  const id = orderIdFrom(session);
  const order = id ? await getOrder(id) : null;
  if (!order || SETTLED.includes(order.status)) return order;
  const updated = await updateOrder(order.id, { status });
  await notifyStudio({ type: "order.updated", orderId: order.id });
  return updated;
}

export async function handleRefund(orderId: string, fullyRefunded: boolean) {
  const order = await getOrder(orderId);
  if (!order) return null;
  const updated = await updateOrder(order.id, { status: fullyRefunded ? "refunded" : "partially_refunded" });
  await notifyStudio({ type: "order.updated", orderId: order.id });
  return updated;
}
