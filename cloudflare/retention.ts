/**
 * Data retention for the R2 bucket — run daily by the Cloudflare cron trigger.
 * Implements the periods stated in the Privacy Policy:
 *  - unpaid orders (pending, cancelled, failed) and their uploads: deleted after 90 days
 *  - uploads never attached to any order: deleted after 90 days
 *  - processed Stripe event markers: deleted after 90 days
 * Paid orders and their files are kept; deleting those (12 months after a project
 * is complete, or on request) is a manual step — see docs/OPERATIONS.md.
 * Self-contained (no app imports) so the worker can bundle it directly.
 */

export type R2ObjectLike = { key: string; uploaded: Date };
export type R2BucketLike = {
  list(options: { prefix: string; cursor?: string; limit?: number }): Promise<{
    objects: R2ObjectLike[];
    truncated: boolean;
    cursor?: string;
  }>;
  get(key: string): Promise<{ text(): Promise<string> } | null>;
  delete(keys: string | string[]): Promise<void>;
};

const DAY = 24 * 60 * 60 * 1000;
export const RETENTION_DAYS = 90;
const UNPAID = new Set(["pending_payment", "cancelled", "payment_failed"]);

async function listAll(bucket: R2BucketLike, prefix: string) {
  const out: R2ObjectLike[] = [];
  let cursor: string | undefined;
  do {
    const page = await bucket.list({ prefix, cursor, limit: 1000 });
    out.push(...page.objects);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return out;
}

async function deleteKeys(bucket: R2BucketLike, keys: string[]) {
  for (let i = 0; i < keys.length; i += 1000) await bucket.delete(keys.slice(i, i + 1000));
}

export async function applyRetention(bucket: R2BucketLike, now = new Date()) {
  const cutoff = now.getTime() - RETENTION_DAYS * DAY;
  const keepUploads = new Set<string>();
  const deleteOrders: string[] = [];
  const dropUploads = new Set<string>();

  for (const obj of await listAll(bucket, "orders/")) {
    const body = await bucket.get(obj.key);
    if (!body) continue;
    let order: { status?: string; createdAt?: string; order?: { files?: { id: string }[] } };
    try {
      order = JSON.parse(await body.text());
    } catch {
      continue;
    }
    const ids = (order.order?.files ?? []).map((f) => f.id);
    const created = Date.parse(order.createdAt ?? "") || obj.uploaded.getTime();
    if (order.status && UNPAID.has(order.status) && created < cutoff) {
      deleteOrders.push(obj.key);
      ids.forEach((id) => dropUploads.add(id));
    } else {
      ids.forEach((id) => keepUploads.add(id));
    }
  }

  const uploadKeys: string[] = [];
  for (const obj of await listAll(bucket, "uploads/")) {
    const id = obj.key.split("/")[1];
    if (keepUploads.has(id)) continue;
    if (dropUploads.has(id) || obj.uploaded.getTime() < cutoff) uploadKeys.push(obj.key);
  }

  const eventKeys = (await listAll(bucket, "events/")).filter((o) => o.uploaded.getTime() < cutoff).map((o) => o.key);

  await deleteKeys(bucket, [...deleteOrders, ...uploadKeys, ...eventKeys]);
  return { orders: deleteOrders.length, uploadObjects: uploadKeys.length, events: eventKeys.length };
}
