import "server-only";
import type Stripe from "stripe";
import { sendOrderConfirmation } from "./email";
import { getOrder, updateOrder, type StoredOrder } from "./storage";

/**
 * Marks an order as paid from a completed Checkout Session and sends the
 * confirmation email once. Safe to call repeatedly (webhook + success page).
 */
export async function fulfillCheckoutSession(session: Stripe.Checkout.Session): Promise<StoredOrder | null> {
  const orderId = session.metadata?.orderId ?? session.client_reference_id;
  if (!orderId) return null;
  const order = await getOrder(orderId);
  if (!order) return null;
  if (session.payment_status !== "paid") return order;

  if (order.status === "pending_payment" || !order.confirmationSentAt) {
    const paymentIntent =
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    const updated = await updateOrder(order.id, {
      status: "paid",
      stripeSessionId: session.id,
      stripePaymentIntentId: paymentIntent,
    });
    if (updated && !updated.confirmationSentAt) {
      await sendOrderConfirmation(updated);
      return updateOrder(order.id, { confirmationSentAt: new Date().toISOString() });
    }
    return updated;
  }
  return order;
}
