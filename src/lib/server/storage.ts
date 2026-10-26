import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { LineItem } from "@/lib/catalog";
import type { Order } from "@/lib/order-schema";

/**
 * Minimal file-based persistence for orders and uploaded assets.
 * DATA_DIR should point to durable storage in production (a mounted volume),
 * or swap these functions for a database / object store.
 */
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR)
  : path.join(/*turbopackIgnore: true*/ process.cwd(), ".data");
const ORDERS_DIR = path.join(DATA_DIR, "orders");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

export type OrderStatus = "pending_payment" | "paid" | "deposit_paid" | "cancelled";

export type StoredOrder = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  order: Order;
  items: LineItem[];
  subtotal: number;
  dueToday: number;
  balance: number;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  confirmationSentAt?: string;
};

const ID_PATTERN = /^[a-z0-9-]{8,64}$/i;

export function newOrderId(): string {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  return `msn-${date}-${randomUUID().slice(0, 8)}`;
}

/** Human friendly reference, e.g. MSN-251025-1A2B3C4D */
export function orderReference(id: string): string {
  return id.toUpperCase();
}

async function writeJsonAtomic(file: string, data: unknown) {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await rename(tmp, file);
}

export async function saveOrder(order: StoredOrder): Promise<void> {
  if (!ID_PATTERN.test(order.id)) throw new Error("Invalid order id");
  await writeJsonAtomic(path.join(ORDERS_DIR, `${order.id}.json`), order);
}

export async function getOrder(id: string): Promise<StoredOrder | null> {
  if (!ID_PATTERN.test(id)) return null;
  try {
    return JSON.parse(await readFile(path.join(ORDERS_DIR, `${id}.json`), "utf8")) as StoredOrder;
  } catch {
    return null;
  }
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
  const id = randomUUID();
  const safeName = file.name.replace(/[^\w.\- ]+/g, "_").slice(-120) || "file";
  const dir = path.join(UPLOADS_DIR, id);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, safeName), Buffer.from(await file.arrayBuffer()));
  await writeJsonAtomic(path.join(dir, "meta.json"), {
    id,
    name: safeName,
    originalName: file.name,
    size: file.size,
    type: file.type,
    uploadedAt: new Date().toISOString(),
  });
  return { id, name: safeName, size: file.size, type: file.type };
}

export async function uploadExists(id: string): Promise<boolean> {
  if (!ID_PATTERN.test(id)) return false;
  try {
    await readFile(path.join(UPLOADS_DIR, id, "meta.json"));
    return true;
  } catch {
    return false;
  }
}
