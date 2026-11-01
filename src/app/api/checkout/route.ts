import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { PAYMENT_AGREEMENT_VERSION, computeTotals, getPackage } from "@/lib/catalog";
import { fieldErrors, orderSchema } from "@/lib/order-schema";
import { LOCALE_META, isLocale, localizePath } from "@/i18n/config";
import { clientIp, isSameOrigin, jsonError, rateLimit, readLimitedText } from "@/lib/server/request-guards";
import { getStripe, siteUrl } from "@/lib/server/stripe";
import { notifyStudio } from "@/lib/server/studio";
import { newOrderId, saveOrder, uploadExists, updateOrder } from "@/lib/server/storage";

const MAX_BODY_BYTES = 64 * 1024;

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "generic");
  if (!(request.headers.get("content-type") ?? "").includes("application/json")) return jsonError(415, "generic");
  if (!(await rateLimit("CHECKOUT_LIMITER", clientIp(request), { limit: 10, windowMs: 60_000 }))) {
    return jsonError(429, "rateLimited");
  }

  const raw = await readLimitedText(request, MAX_BODY_BYTES);
  if (raw === null) return jsonError(413, "validation");
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return jsonError(400, "validation");
  }

  // Server-side validation is authoritative. Unknown keys (including any
  // "price" or "total" sent by a tampered client) are stripped and ignored.
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    const fields = fieldErrors(parsed.error);
    if (fields.website2) return jsonError(400, "generic"); // honeypot filled: likely a bot
    return jsonError(422, "validation", { fields });
  }
  const order = parsed.data;
  const locale = isLocale(order.locale) ? order.locale : "en";

  // Only reference files that were actually uploaded through our endpoint.
  const files = [];
  for (const f of order.files) if (await uploadExists(f.id)) files.push(f);
  if (files.length === 0) return jsonError(422, "validation", { fields: { files: "filesRequired" } });
  order.files = files;

  const stripe = getStripe();
  if (!stripe) return jsonError(503, "unavailable");

  const pkg = getPackage(order.packageId)!;
  // Prices always come from the server-side catalog, never from the request.
  const { items, total } = computeTotals(order.packageId, order.addOns);
  const now = new Date().toISOString();
  const id = newOrderId();

  await saveOrder({
    id,
    createdAt: now,
    updatedAt: now,
    status: "pending_payment",
    order: { ...order, locale, website2: "" },
    items,
    total,
    paymentAgreement: { version: PAYMENT_AGREEMENT_VERSION, acceptedAt: now },
  });

  // Lets the studio dashboard show the request as "awaiting payment" (best effort).
  await notifyStudio({ type: "order.created", orderId: id });

  const origin = siteUrl(request.url);

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        customer_email: order.email,
        client_reference_id: id,
        locale: LOCALE_META[locale].stripe as Stripe.Checkout.SessionCreateParams.Locale,
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
        metadata: { orderId: id, packageId: order.packageId, paymentAgreement: PAYMENT_AGREEMENT_VERSION },
        payment_intent_data: {
          description: `${pkg.name} for ${order.businessName}`.slice(0, 200),
          metadata: { orderId: id },
        },
        custom_text: {
          submit: { message: "All payments are final and non-refundable, as agreed in the Maison Web Studio payment agreement." },
        },
        line_items: items.map((item) => ({
          quantity: item.quantity,
          price_data: {
            currency: "usd",
            unit_amount: item.unitPrice * 100,
            product_data: { name: item.name },
          },
        })),
        success_url: `${origin}${localizePath(locale, "/checkout/success")}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}${localizePath(locale, "/start")}?step=review&cancelled=1`,
      },
      { idempotencyKey: `checkout-${id}` },
    );

    await updateOrder(id, { stripeSessionId: session.id });
    return NextResponse.json({ url: session.url }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error(`[checkout] Stripe session creation failed for order ${id}:`, err instanceof Error ? err.message : "unknown");
    await updateOrder(id, { status: "cancelled" });
    return jsonError(502, "checkoutFailed");
  }
}
