import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { LineItem } from "@/lib/catalog";
import type { Order } from "@/lib/order-schema";

/**
 * Persistence for orders and uploaded assets.
 *
 * On Cloudflare, everything is stored in the R2 bucket bound as MASION_DATA:
 *   orders/<orderId>.json
 *   uploads/<uploadId>/<filename>  and  uploads/<uploadId>/meta.json
 * Anywhere else (plain `next start`), the same layout is written to DATA_DIR on disk.
 */

export type OrderStatus = "pending_payment" | "paid" | "cancelled";

export type StoredOrder = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  order: Order;
  items: LineItem[];
  total: number;
  /** Record of the customer accepting the final-payment agreement. */
  paymentAgreement: { version: string; acceptedAt: string; ip: string | null };
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  confirmationSentAt?: string;
};

type Blob = { key: string; body: string | ArrayBuffer; contentType: string };

interface DataStore {
  get(key: string): Promise<string | null>;
  put(blob: Blob): Promise<void>;
  exists(key: string): Promise<boolean>;
}

/** Minimal shape of the R2 binding we use, so this file doesn't need Workers types. */
type R2Like = {
  get(key: string): Promise<{ text(): Promise<string> } | null>;
  head(key: string): Promise<unknown | null>;
  put(key: string, value: string | ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
};

function r2Store(bucket: R2Like): DataStore {
  return {
    async get(key) {
      const obj = await bucket.get(key);
      return obj ? obj.text() : null;
    },
    async put({ key, body, contentType }) {
      await bucket.put(key, body, { httpMetadata: { contentType } });
    },
    async exists(key) {
      return (await bucket.head(key)) !== null;
    },
  };
}

function diskStore(): DataStore {
  const root = process.env.DATA_DIR
    ? path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR)
    : path.join(/*turbopackIgnore: true*/ process.cwd(), ".data");
  const file = (key: string) => path.join(root, ...key.split("/"));
  return {
    async get(key) {
      try {
        return await readFile(file(key), "utf8");
      } catch {
        return null;
      }
    },
    async put({ key, body }) {
      const target = file(key);
      await mkdir(path.dirname(target), { recursive: true });
      const tmp = `${target}.${crypto.randomUUID()}.tmp`;
      await writeFile(tmp, typeof body === "string" ? body : Buffer.from(body));
      await rename(tmp, target);
    },
    async exists(key) {
      return (await this.get(key)) !== null;
    },
  };
}

function store(): DataStore {
  try {
    const bucket = (getCloudflareContext().env as Record<string, unknown>).MASION_DATA as R2Like | undefined;
    if (bucket) return r2Store(bucket);
  } catch {
    /* not running on Cloudflare */
  }
  return diskStore();
}

const ID_PATTERN = /^[a-z0-9-]{8,64}$/i;

export function newOrderId(): string {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  return `msn-${date}-${crypto.randomUUID().slice(0, 8)}`;
}

/** Human friendly reference, e.g. MSN-251025-1A2B3C4D */
export function orderReference(id: string): string {
  return id.toUpperCase();
}

const json = (key: string, data: unknown): Blob => ({
  key,
  body: JSON.stringify(data, null, 2),
  contentType: "application/json",
});

export async function saveOrder(order: StoredOrder): Promise<void> {
  if (!ID_PATTERN.test(order.id)) throw new Error("Invalid order id");
  await store().put(json(`orders/${order.id}.json`, order));
}

export async function getOrder(id: string): Promise<StoredOrder | null> {
  if (!ID_PATTERN.test(id)) return null;
  const raw = await store().get(`orders/${id}.json`);
  return raw ? (JSON.parse(raw) as StoredOrder) : null;
}

export async function updateOrder(
  id: string,
  patch: Partial<Omit<StoredOrder, "id" | "createdAt">>,
): Promise<StoredOrder | null> {
  const existing = await getOrder(id);
  if (!existing) return null;
  const next = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  await saveOrder(next);
  return next;
}

export async function saveUpload(
  file: File,
): Promise<{ id: string; name: string; size: number; type: string }> {
  const id = crypto.randomUUID();
  const safeName = file.name.replace(/[^\w.\- ]+/g, "_").slice(-120) || "file";
  const type = file.type || "application/octet-stream";
  const s = store();
  await s.put({ key: `uploads/${id}/${safeName}`, body: await file.arrayBuffer(), contentType: type });
  await s.put(
    json(`uploads/${id}/meta.json`, {
      id,
      name: safeName,
      originalName: file.name,
      size: file.size,
      type,
      uploadedAt: new Date().toISOString(),
    }),
  );
  return { id, name: safeName, size: file.size, type };
}

export async function uploadExists(id: string): Promise<boolean> {
  if (!ID_PATTERN.test(id)) return false;
  return store().exists(`uploads/${id}/meta.json`);
}
