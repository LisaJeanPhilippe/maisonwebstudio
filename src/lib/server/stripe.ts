import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

/** Returns a Stripe client, or null when STRIPE_SECRET_KEY is not configured. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // The fetch-based client works both on Node and on Cloudflare Workers.
  client ??= new Stripe(key, {
    appInfo: { name: "Maison Web Studio" },
    httpClient: Stripe.createFetchHttpClient(),
  });
  return client;
}

export function siteUrl(requestUrl?: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (requestUrl) return new URL(requestUrl).origin;
  return "http://localhost:3000";
}
