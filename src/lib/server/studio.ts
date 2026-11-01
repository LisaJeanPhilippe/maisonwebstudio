import "server-only";

/**
 * Server-to-server events for the Maison Studio admin app (studio/).
 * Optional: nothing is sent unless STUDIO_URL and STUDIO_INTERNAL_SECRET are set.
 * Events only carry ids; the studio fetches the authoritative order back from
 * /api/internal/orders/:id, so a forged event could never mark anything paid.
 */
type StudioEvent =
  | { type: "order.created" | "order.paid" | "order.updated"; orderId: string }
  | { type: "conversion"; token: string };

export function studioConfigured() {
  return Boolean(process.env.STUDIO_URL && (process.env.STUDIO_INTERNAL_SECRET ?? "").length >= 32);
}

export async function notifyStudio(event: StudioEvent): Promise<boolean> {
  if (!studioConfigured()) return false;
  try {
    const res = await fetch(`${process.env.STUDIO_URL!.replace(/\/$/, "")}/internal/event`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-internal-secret": process.env.STUDIO_INTERNAL_SECRET! },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.warn(`[studio] Event ${event.type} returned ${res.status}`);
    return res.ok;
  } catch {
    // The studio also reconciles recent orders on a schedule, so a missed event is recovered.
    console.warn(`[studio] Could not deliver ${event.type}`);
    return false;
  }
}

/** Marks an outreach lead as a customer when an attributed order is paid. */
export async function reportOutreachConversion(ref: string | undefined) {
  if (!ref || !/^[a-z0-9]{6,32}$/.test(ref)) return;
  await notifyStudio({ type: "conversion", token: ref });
}

/** Constant-time check of the shared secret on internal endpoints. */
export function internalAuthorized(request: Request): boolean {
  const secret = process.env.STUDIO_INTERNAL_SECRET ?? "";
  const given = request.headers.get("x-internal-secret") ?? "";
  if (secret.length < 32 || given.length !== secret.length) return false;
  let diff = 0;
  for (let i = 0; i < secret.length; i++) diff |= secret.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}
