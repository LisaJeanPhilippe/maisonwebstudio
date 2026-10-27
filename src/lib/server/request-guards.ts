import "server-only";
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Best-effort client IP (Cloudflare sets cf-connecting-ip; other proxies x-forwarded-for). */
export function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Rejects cross-site browser requests to state-changing endpoints. These APIs
 * use no cookies, so this is defence in depth against abuse from other sites,
 * not session-CSRF protection.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") return false;
  if (!origin) return fetchSite === "same-origin";
  try {
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function jsonError(status: number, code: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ code, ...extra }, { status, headers: { "Cache-Control": "no-store" } });
}

type Limiter = { limit(options: { key: string }): Promise<{ success: boolean }> };

const memory = new Map<string, number[]>();

/**
 * Fixed-window rate limiting. On Cloudflare this uses the Workers Rate Limiting
 * binding (shared across the edge); elsewhere it falls back to an in-memory
 * window per server instance, which is best-effort only.
 */
export async function rateLimit(
  binding: "CHECKOUT_LIMITER" | "UPLOAD_LIMITER",
  key: string,
  fallback: { limit: number; windowMs: number },
): Promise<boolean> {
  try {
    const limiter = (getCloudflareContext().env as Record<string, unknown>)[binding] as Limiter | undefined;
    if (limiter) return (await limiter.limit({ key: `${binding}:${key}` })).success;
  } catch {
    /* not running on Cloudflare */
  }
  const now = Date.now();
  const bucketKey = `${binding}:${key}`;
  const hits = (memory.get(bucketKey) ?? []).filter((t) => now - t < fallback.windowMs);
  hits.push(now);
  memory.set(bucketKey, hits);
  if (memory.size > 10_000) memory.clear();
  return hits.length <= fallback.limit;
}

/** Reads a request body as text, refusing anything larger than `maxBytes`. */
export async function readLimitedText(request: Request, maxBytes: number): Promise<string | null> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > maxBytes) return null;
  const text = await request.text();
  return new TextEncoder().encode(text).length > maxBytes ? null : text;
}
