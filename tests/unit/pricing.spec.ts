import { expect, test } from "@playwright/test";
import { ADD_ONS, EXTRA_PAGE_PRICE, PACKAGES, buildLineItems, computeTotals } from "@/lib/catalog";
import { orderSchema } from "@/lib/order-schema";
import { validOrder } from "../fixtures";

test.describe("catalog pricing", () => {
  test("package prices match the published prices", () => {
    expect(Object.fromEntries(PACKAGES.map((p) => [p.id, p.price]))).toEqual({ starter: 499, business: 899, premium: 1499 });
  });

  test("totals add package and add-ons", () => {
    const { items, total } = computeTotals("business", { copywriting: 1, "extra-pages": 2 });
    const copy = ADD_ONS.find((a) => a.id === "copywriting")!;
    expect(total).toBe(899 + copy.price + 2 * EXTRA_PAGE_PRICE);
    expect(items.map((i) => i.id).sort()).toEqual(["business", "copywriting", "extra-pages"]);
  });

  test("unknown, included and out-of-range add-ons are ignored or clamped", () => {
    const included = ADD_ONS.find((a) => a.includedIn?.includes("premium"));
    const addOns: Record<string, number> = { "not-real": 5, "extra-pages": 999 };
    if (included) addOns[included.id] = 1;
    const items = buildLineItems("premium", addOns);
    expect(items.find((i) => i.id === "not-real")).toBeUndefined();
    if (included) expect(items.find((i) => i.id === included.id)).toBeUndefined();
    const extra = items.find((i) => i.id === "extra-pages")!;
    const max = ADD_ONS.find((a) => a.id === "extra-pages")!.maxQuantity!;
    expect(extra.quantity).toBe(max);
    expect(buildLineItems("premium", { "extra-pages": -3 }).some((i) => i.id === "extra-pages")).toBe(false);
  });
});


test.describe("order schema (server-side validation)", () => {
  test("accepts a valid order", () => {
    const r = orderSchema.safeParse(validOrder);
    expect(r.success, JSON.stringify(r.error?.issues)).toBe(true);
  });

  test("strips client-supplied prices and totals", () => {
    const r = orderSchema.safeParse({ ...validOrder, total: 1, price: 1, items: [{ total: 1 }] });
    expect(r.success).toBe(true);
    expect(r.data).not.toHaveProperty("total");
    expect(r.data).not.toHaveProperty("price");
    expect(r.data).not.toHaveProperty("items");
  });

  test("requires at least one uploaded file", () => {
    const r = orderSchema.safeParse({ ...validOrder, files: [] });
    expect(r.success).toBe(false);
    expect(r.error!.issues.some((i) => i.message === "filesRequired")).toBe(true);
  });

  test("requires the payment agreement and terms", () => {
    const r = orderSchema.safeParse({ ...validOrder, acceptPaymentAgreement: false, acceptTerms: false });
    const codes = r.error!.issues.map((i) => i.message);
    expect(codes).toContain("agreementRequired");
    expect(codes).toContain("termsRequired");
  });

  test("rejects a filled honeypot, bad email and unknown package", () => {
    expect(orderSchema.safeParse({ ...validOrder, website2: "http://spam" }).success).toBe(false);
    expect(orderSchema.safeParse({ ...validOrder, email: "nope" }).success).toBe(false);
    expect(orderSchema.safeParse({ ...validOrder, packageId: "free" }).success).toBe(false);
  });

  test("rejects path-like upload ids", () => {
    const r = orderSchema.safeParse({ ...validOrder, files: [{ ...validOrder.files[0], id: "../../orders/x" }] });
    expect(r.success).toBe(false);
  });
});
