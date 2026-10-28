import { expect, test } from "@playwright/test";
import { applyRetention, type R2BucketLike, type R2ObjectLike } from "../../cloudflare/retention";

const DAY = 86_400_000;
const now = new Date("2026-10-27T00:00:00Z");
const ago = (days: number) => new Date(now.getTime() - days * DAY);

function fakeBucket(objects: Record<string, { uploaded: Date; body?: unknown }>) {
  const store = new Map(Object.entries(objects));
  const bucket: R2BucketLike = {
    async list({ prefix }) {
      const list: R2ObjectLike[] = [...store].filter(([k]) => k.startsWith(prefix)).map(([key, v]) => ({ key, uploaded: v.uploaded }));
      return { objects: list, truncated: false };
    },
    async get(key) {
      const v = store.get(key);
      return v ? { text: async () => JSON.stringify(v.body ?? {}) } : null;
    },
    async delete(keys) {
      for (const k of [keys].flat()) store.delete(k);
    },
  };
  return { bucket, keys: () => [...store.keys()].sort() };
}

const order = (status: string, days: number, fileId: string) => ({
  uploaded: ago(days),
  body: { status, createdAt: ago(days).toISOString(), order: { files: [{ id: fileId }] } },
});

test("deletes old unpaid orders, their files, orphan uploads and old event markers — keeps paid orders", async () => {
  const { bucket, keys } = fakeBucket({
    "orders/old-unpaid.json": order("cancelled", 120, "f-old"),
    "orders/new-unpaid.json": order("pending_payment", 10, "f-new"),
    "orders/old-paid.json": order("paid", 400, "f-paid"),
    "uploads/f-old/logo.png": { uploaded: ago(120) },
    "uploads/f-new/logo.png": { uploaded: ago(10) },
    "uploads/f-paid/logo.png": { uploaded: ago(400) },
    "uploads/orphan/x.png": { uploaded: ago(95) },
    "uploads/recent-orphan/x.png": { uploaded: ago(5) },
    "events/evt_old.json": { uploaded: ago(100) },
    "events/evt_new.json": { uploaded: ago(1) },
  });
  const result = await applyRetention(bucket, now);
  expect(result).toEqual({ orders: 1, uploadObjects: 2, events: 1 });
  expect(keys()).toEqual([
    "events/evt_new.json",
    "orders/new-unpaid.json",
    "orders/old-paid.json",
    "uploads/f-new/logo.png",
    "uploads/f-paid/logo.png",
    "uploads/recent-orphan/x.png",
  ]);
});
