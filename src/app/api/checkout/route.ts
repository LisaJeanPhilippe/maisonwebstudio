import { NextResponse } from "next/server";
import { PAYMENT_AGREEMENT_VERSION, computeTotals, getPackage } from "@/lib/catalog";
import { fieldErrors, orderSchema } from "@/lib/order-schema";
import { getStripe, siteUrl } from "@/lib/server/stripe";
import { newOrderId, saveOrder, uploadExists, updateOrder } from "@/lib/server/storage";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Some details need attention.", fields: fieldErrors(parsed.error) },
      { status: 422 },
    );
  }
  const order = parsed.data;

  // Only reference files that were actually uploaded through our endpoint.
  const files = [];
  for (const f of order.files) if (await uploadExists(f.id)) files.push(f);
  order.files = files;

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Online payments are not configured yet. Please contact us to complete your order." },
      { status: 503 },
    );
  }

  const pkg = getPackage(order.packageId)!;
  const { items, total } = computeTotals(order.packageId, order.addOns);
  const now = new Date().toISOString();
  const id = newOrderId();

  await saveOrder({
    id,
    createdAt: now,
    updatedAt: now,
    status: "pending_payment",
    order,
    items,
    total,
    paymentAgreement: {
      version: PAYMENT_AGREEMENT_VERSION,
      acceptedAt: now,
      ip: request.headers.get("x-forwarded-for")?.split(",")[0].trim() || null,
    },
  });

  const origin = siteUrl(request.url);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: order.email,
      client_reference_id: id,
      metadata: {
        orderId: id,
        packageId: order.packageId,
        paymentAgreement: `accepted ${PAYMENT_AGREEMENT_VERSION} (all payments final)`,
      },
      custom_text: {
        submit: { message: "All payments are final and non-refundable, as agreed in the Masion Web Studio payment agreement." },
      },
      payment_intent_data: {
        description: `${pkg.name} for ${order.businessName}`,
        metadata: { orderId: id },
      },
      line_items: items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          unit_amount: item.unitPrice * 100,
          product_data: { name: item.id === pkg.id ? item.name : item.name.replace(/ \(.*\)$/, "") },
        },
      })),
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/start?step=review&cancelled=1`,
    });

    await updateOrder(id, { stripeSessionId: session.id });
    return NextResponse.json({ url: session.url, orderId: id });
  } catch (err) {
    console.error("[checkout] Stripe session creation failed", err);
    await updateOrder(id, { status: "cancelled" });
    return NextResponse.json(
      { error: "We couldn't start checkout. Please try again in a moment." },
      { status: 502 },
    );
  }
}
