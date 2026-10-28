import { expect, test } from "@playwright/test";
import { newId, readOrder, seedOrder, sendWebhook, sessionEvent } from "./helpers";

test.describe("Stripe webhook", () => {
  test("rejects a missing or invalid signature and leaves the order unpaid", async () => {
    const id = newId();
    await seedOrder(id, 499);
    const event = sessionEvent("checkout.session.completed", { id: "cs_test_bad", payment_status: "paid", amount_total: 49900, metadata: { orderId: id } });
    expect((await sendWebhook(event, { badSignature: true })).status).toBe(400);
    const res = await fetch(`${test.info().project.use.baseURL}/api/webhooks/stripe`, { method: "POST", body: "{}" });
    expect(res.status).toBe(400);
    expect((await readOrder(id)).status).toBe("pending_payment");
  });

  test("marks the order paid once, and ignores a duplicate delivery", async () => {
    const id = newId();
    await seedOrder(id, 899);
    const event = sessionEvent("checkout.session.completed", { id: "cs_test_ok", payment_status: "paid", amount_total: 89900, payment_intent: "pi_test_1", metadata: { orderId: id } });
    const first = await sendWebhook(event);
    expect(first).toEqual({ status: 200, body: { received: true } });
    const paid = await readOrder(id);
    expect(paid.status).toBe("paid");
    expect(paid.stripeSessionId).toBe("cs_test_ok");
    expect(paid.confirmationSentAt).toBeTruthy();

    const again = await sendWebhook(event);
    expect(again.body).toEqual({ received: true, duplicate: true });
    expect((await readOrder(id)).confirmationSentAt).toBe(paid.confirmationSentAt);
  });

  test("flags an amount or currency mismatch for review instead of marking paid", async () => {
    const id = newId();
    await seedOrder(id, 1499);
    await sendWebhook(sessionEvent("checkout.session.completed", { id: "cs_test_low", payment_status: "paid", amount_total: 100, metadata: { orderId: id } }));
    const order = await readOrder(id);
    expect(order.status).toBe("needs_review");
    expect(order.confirmationSentAt).toBeUndefined();

    const id2 = newId();
    await seedOrder(id2, 499);
    await sendWebhook(sessionEvent("checkout.session.completed", { id: "cs_test_eur", payment_status: "paid", amount_total: 49900, currency: "eur", metadata: { orderId: id2 } }));
    expect((await readOrder(id2)).status).toBe("needs_review");
  });

  test("a session id that differs from the one we created is flagged", async () => {
    const id = newId();
    await seedOrder(id, 499, "pending_payment", { stripeSessionId: "cs_test_original" });
    await sendWebhook(sessionEvent("checkout.session.completed", { id: "cs_test_other", payment_status: "paid", amount_total: 49900, metadata: { orderId: id } }));
    expect((await readOrder(id)).status).toBe("needs_review");
  });

  test("delayed payment: processing, then paid", async () => {
    const id = newId();
    await seedOrder(id, 499);
    await sendWebhook(sessionEvent("checkout.session.completed", { id: "cs_test_async", payment_status: "unpaid", amount_total: 49900, metadata: { orderId: id } }));
    expect((await readOrder(id)).status).toBe("processing");
    await sendWebhook(sessionEvent("checkout.session.async_payment_succeeded", { id: "cs_test_async", payment_status: "paid", amount_total: 49900, metadata: { orderId: id } }));
    expect((await readOrder(id)).status).toBe("paid");
  });

  test("delayed payment failure and expired sessions are recorded", async () => {
    const failed = newId();
    await seedOrder(failed, 499, "processing");
    await sendWebhook(sessionEvent("checkout.session.async_payment_failed", { id: "cs_test_f", payment_status: "unpaid", metadata: { orderId: failed } }));
    expect((await readOrder(failed)).status).toBe("payment_failed");

    const expired = newId();
    await seedOrder(expired, 499);
    await sendWebhook(sessionEvent("checkout.session.expired", { id: "cs_test_e", payment_status: "unpaid", metadata: { orderId: expired } }));
    expect((await readOrder(expired)).status).toBe("cancelled");
  });

  test("late or out-of-order events never downgrade a paid order", async () => {
    const id = newId();
    await seedOrder(id, 499, "paid");
    await sendWebhook(sessionEvent("checkout.session.expired", { id: "cs_test_x", payment_status: "unpaid", metadata: { orderId: id } }));
    await sendWebhook(sessionEvent("checkout.session.async_payment_failed", { id: "cs_test_x", payment_status: "unpaid", metadata: { orderId: id } }));
    expect((await readOrder(id)).status).toBe("paid");
  });

  test("refunds update the order status", async () => {
    const full = newId();
    await seedOrder(full, 499, "paid");
    const charge = (orderId: string, refunded: boolean) => ({
      id: `evt_${crypto.randomUUID().replace(/-/g, "")}`,
      object: "event",
      type: "charge.refunded",
      data: { object: { object: "charge", id: "ch_test", refunded, metadata: { orderId } } },
    });
    await sendWebhook(charge(full, true));
    expect((await readOrder(full)).status).toBe("refunded");

    const partial = newId();
    await seedOrder(partial, 499, "paid");
    await sendWebhook(charge(partial, false));
    expect((await readOrder(partial)).status).toBe("partially_refunded");
  });

  test("events for unknown orders are acknowledged without side effects", async () => {
    const res = await sendWebhook(sessionEvent("checkout.session.completed", { id: "cs_test_none", payment_status: "paid", amount_total: 1, metadata: { orderId: "msn-does-not-exist" } }));
    expect(res.status).toBe(200);
  });
});
