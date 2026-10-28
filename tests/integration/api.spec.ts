import { readdir } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { validOrder } from "../fixtures";
import { DATA, readOrder, sameOrigin } from "./helpers";

const PNG = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a4b50000000049454e44ae426082", "hex");

async function upload(name: string, bytes: Buffer, headers: Record<string, string> = sameOrigin()) {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(bytes)]), name);
  return fetch(`${test.info().project.use.baseURL}/api/uploads`, { method: "POST", headers, body: form });
}

const checkout = (body: unknown, headers: Record<string, string> = sameOrigin()) =>
  fetch(`${test.info().project.use.baseURL}/api/checkout`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

test.describe("uploads API", () => {
  test("accepts a real image and stores it as a download-only file", async () => {
    const res = await upload("Logo final.png", PNG);
    expect(res.status).toBe(201);
    const saved = await res.json();
    expect(saved.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(await readdir(path.join(DATA, "uploads", saved.id))).toEqual(expect.arrayContaining(["meta.json", "Logo final.png"]));
  });

  test("rejects disguised, executable and unsupported files", async () => {
    expect((await upload("logo.png", Buffer.from("<html><script>alert(1)</script>"))).status).toBe(415);
    expect((await upload("logo.png", Buffer.from("MZ\x90\x00 executable"))).status).toBe(415);
    expect((await upload("run.exe", Buffer.from("MZ"))).status).toBe(415);
    expect((await upload("page.svg", Buffer.from("<svg onload=alert(1)>"))).status).toBe(415);
  });

  test("path traversal in file names cannot escape the upload folder", async () => {
    const res = await upload("../../../orders/evil.png", PNG);
    expect(res.status).toBe(201);
    const saved = await res.json();
    expect(saved.name).not.toContain("/");
    expect(saved.name).not.toMatch(/^\./);
  });

  test("rejects cross-site requests", async () => {
    const res = await upload("logo.png", PNG, { origin: "https://evil.example", "sec-fetch-site": "cross-site" });
    expect(res.status).toBe(403);
  });

  test("rate limits bursts", async () => {
    const headers = sameOrigin();
    const statuses = [];
    for (let i = 0; i < 32; i++) statuses.push((await upload("logo.png", PNG, headers)).status);
    expect(statuses.slice(0, 30).every((s) => s === 201)).toBe(true);
    expect(statuses.at(-1)).toBe(429);
  });
});

test.describe("checkout API", () => {
  test("rejects cross-site, wrong content type, oversized and malformed bodies", async () => {
    expect((await checkout(validOrder, { origin: "https://evil.example", "sec-fetch-site": "cross-site" })).status).toBe(403);
    const base = test.info().project.use.baseURL;
    expect((await fetch(`${base}/api/checkout`, { method: "POST", headers: { ...sameOrigin(), "content-type": "text/plain" }, body: "x" })).status).toBe(415);
    expect((await checkout({ ...validOrder, goals: "x".repeat(70_000) })).status).toBe(413);
    expect((await fetch(`${base}/api/checkout`, { method: "POST", headers: { ...sameOrigin(), "content-type": "application/json" }, body: "{" })).status).toBe(400);
  });

  test("returns field errors from server-side validation", async () => {
    const res = await checkout({ ...validOrder, email: "nope", acceptTerms: false });
    expect(res.status).toBe(422);
    expect((await res.json()).fields).toMatchObject({ email: "emailInvalid", acceptTerms: "termsRequired" });
  });

  test("rejects a filled honeypot", async () => {
    expect((await checkout({ ...validOrder, website2: "spam" })).status).toBe(400);
  });

  test("refuses files that were never uploaded", async () => {
    const res = await checkout(validOrder); // fixture file id does not exist on the server
    expect(res.status).toBe(422);
    expect((await res.json()).fields).toEqual({ files: "filesRequired" });
  });

  test("ignores tampered prices: the stored order uses catalog prices", async () => {
    test.setTimeout(240_000);
    const saved = await (await upload("logo.png", PNG)).json();
    const tampered = {
      ...validOrder,
      packageId: "premium",
      addOns: { copywriting: 1, "extra-pages": 2 },
      files: [saved],
      total: 1,
      price: 1,
      items: [{ id: "premium", unitPrice: 1, quantity: 1, total: 1 }],
    };
    const res = await checkout(tampered);
    // The dummy test key cannot create a real Checkout session, so Stripe refuses and nothing is charged.
    expect(res.status).toBe(502);
    expect((await res.json()).code).toBe("checkoutFailed");

    const orders = await readdir(path.join(DATA, "orders"));
    const stored = (await Promise.all(orders.map((f) => readOrder(f.replace(/\.json$/, ""))))).find(
      (o) => o.order.files?.[0]?.id === saved.id,
    );
    expect(stored.total).toBe(1499 + 249 + 2 * 75);
    expect(stored.items.map((i: { id: string }) => i.id).sort()).toEqual(["copywriting", "extra-pages", "premium"]);
    expect(stored.status).toBe("cancelled");
    expect(JSON.stringify(stored)).not.toContain('"price"');

    // Made-up add-ons are refused outright.
    expect((await checkout({ ...tampered, addOns: { "free-website": 1 } })).status).toBe(422);
  });

  test("rate limits bursts", async () => {
    const headers = sameOrigin();
    const statuses = [];
    for (let i = 0; i < 11; i++) statuses.push((await checkout({ ...validOrder, email: "bad" }, headers)).status);
    expect(statuses.slice(0, 10).every((s) => s === 422)).toBe(true);
    expect(statuses[10]).toBe(429);
  });
});

test.describe("API responses", () => {
  test("are not cached or indexed", async () => {
    const res = await checkout({}, sameOrigin());
    expect(res.headers.get("cache-control")).toContain("no-store");
    expect(res.headers.get("x-robots-tag")).toContain("noindex");
  });

  test("success page lookups never mark anything paid", async () => {
    const { seedOrder } = await import("./helpers");
    const id = `msn-test-${crypto.randomUUID().slice(0, 8)}`;
    await seedOrder(id, 499, "pending_payment", { stripeSessionId: "cs_test_lookup" });
    const res = await fetch(`${test.info().project.use.baseURL}/checkout/success?session_id=cs_test_lookup&order=${id}`);
    expect(res.status).toBeLessThan(500);
    expect((await readOrder(id)).status).toBe("pending_payment");
  });
});
