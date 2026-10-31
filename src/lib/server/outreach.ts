import "server-only";

/**
 * Tells the outreach app that a business it contacted became a customer, so its
 * follow-ups stop and the conversion is counted. Sends only the opaque reference.
 * Optional: does nothing unless OUTREACH_URL and OUTREACH_INTERNAL_SECRET are set.
 */
export async function reportOutreachConversion(ref: string | undefined) {
  const endpoint = process.env.OUTREACH_URL;
  const secret = process.env.OUTREACH_INTERNAL_SECRET;
  if (!endpoint || !secret || !ref || !/^[a-z0-9]{6,32}$/.test(ref)) return;
  try {
    await fetch(`${endpoint.replace(/\/$/, "")}/internal/event`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-internal-secret": secret },
      body: JSON.stringify({ type: "conversion", token: ref }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    console.warn("[outreach] Could not report a conversion");
  }
}
