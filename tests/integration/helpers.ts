import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import Stripe from "stripe";
import { validOrder } from "../fixtures";
import { API_URL, TEST_DATA_DIR, TEST_WEBHOOK_SECRET } from "../../playwright.config";

export const DATA = path.join(TEST_DATA_DIR, "api");
const stripe = new Stripe("sk_test_unused_for_local_signing");

/** Headers a same-origin browser request would send. A unique IP keeps tests out of each other's rate-limit windows. */
export const sameOrigin = (ip = crypto.randomUUID()) => ({ origin: API_URL, "sec-fetch-site": "same-origin", "x-forwarded-for": ip });

export async function seedOrder(id: string, total: number, status = "pending_payment", extra: Record<string, unknown> = {}) {
  const now = new Date().toISOString();
  const order = { id, createdAt: now, updatedAt: now, status, order: { ...validOrder, files: [] }, items: [], total, paymentAgreement: { version: "test", acceptedAt: now }, ...extra };
  await mkdir(path.join(DATA, "orders"), { recursive: true });
  await writeFile(path.join(DATA, "orders", `${id}.json`), JSON.stringify(order));
}

export async function readOrder(id: string) {
  return JSON.parse(await readFile(path.join(DATA, "orders", `${id}.json`), "utf8"));
}

export function sessionEvent(type: string, session: Record<string, unknown>, id = `evt_${crypto.randomUUID().replace(/-/g, "")}`) {
  return { id, object: "event", type, data: { object: { object: "checkout.session", currency: "usd", ...session } } };
}

/** Sends an event signed with the test webhook secret — generated locally, never sent by or to Stripe. */
export async function sendWebhook(event: unknown, { badSignature = false } = {}) {
  const payload = JSON.stringify(event);
  const signature = badSignature
    ? "t=1700000000,v1=0000000000000000000000000000000000000000000000000000000000000000"
    : stripe.webhooks.generateTestHeaderString({ payload, secret: TEST_WEBHOOK_SECRET });
  const res = await fetch(`${API_URL}/api/webhooks/stripe`, {
    method: "POST",
    headers: { "content-type": "application/json", "stripe-signature": signature },
    body: payload,
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

export const newId = () => `msn-test-${crypto.randomUUID().slice(0, 8)}`;
