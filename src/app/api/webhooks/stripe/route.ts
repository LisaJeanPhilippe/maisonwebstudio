import { NextResponse } from "next/server";
import Stripe from "stripe";
import { handlePaidSession, handleRefund, setUnpaidStatus } from "@/lib/server/fulfillment";
import { getStripe } from "@/lib/server/stripe";
import { isEventProcessed, markEventProcessed } from "@/lib/server/storage";

const MAX_BODY = 512 * 1024;

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Webhooks are not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  const payload = await request.text();
  if (payload.length > MAX_BODY) return NextResponse.json({ error: "Payload too large." }, { status: 413 });

  let event: Stripe.Event;
  try {
    // Never trust an event until its signature is verified with our webhook secret.
    event = await stripe.webhooks.constructEventAsync(payload, signature, secret, undefined, Stripe.createSubtleCryptoProvider());
  } catch {
    console.warn("[webhook] Rejected an event with an invalid signature");
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  // Stripe can deliver the same event more than once.
  if (await isEventProcessed(event.id)) return NextResponse.json({ received: true, duplicate: true });

  try {
    switch (event.type) {
      case "checkout.session.completed":
        // Card payments arrive as "paid"; delayed methods arrive "unpaid" and settle later.
        if (event.data.object.payment_status === "paid") await handlePaidSession(event.data.object);
        else await setUnpaidStatus(event.data.object, "processing");
        break;
      case "checkout.session.async_payment_succeeded":
        await handlePaidSession(event.data.object);
        break;
      case "checkout.session.async_payment_failed":
        await setUnpaidStatus(event.data.object, "payment_failed");
        break;
      case "checkout.session.expired":
        await setUnpaidStatus(event.data.object, "cancelled");
        break;
      case "charge.refunded": {
        const charge = event.data.object;
        const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
        const orderId =
          charge.metadata?.orderId || (pi ? (await stripe.paymentIntents.retrieve(pi)).metadata?.orderId : undefined);
        if (orderId) await handleRefund(orderId, charge.refunded);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    // Returning 500 makes Stripe retry later; handlers are safe to repeat.
    console.error(`[webhook] Failed to process ${event.type} ${event.id}`, err instanceof Error ? err.message : "");
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }

  // Recorded after successful processing, so a failed attempt can be retried.
  await markEventProcessed(event.id);
  return NextResponse.json({ received: true });
}
