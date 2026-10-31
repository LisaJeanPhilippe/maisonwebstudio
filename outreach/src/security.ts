import type { Config, Env } from "./env";
import { signToken, verifyToken } from "./email/compose";

/**
 * Admin authentication: Cloudflare Access sits in front of /admin and signs a JWT
 * (Cf-Access-Jwt-Assertion). We verify that JWT ourselves (issuer, audience, expiry,
 * RS256 signature) and then require the email to be in ADMIN_EMAILS.
 */

type Jwk = JsonWebKey & { kid: string };
let jwksCache: { at: number; keys: Jwk[]; team: string } | null = null;

const b64urlToBytes = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")), (c) => c.charCodeAt(0));

async function accessKeys(team: string, fetchFn: typeof fetch): Promise<Jwk[]> {
  if (jwksCache && jwksCache.team === team && Date.now() - jwksCache.at < 3_600_000) return jwksCache.keys;
  const res = await fetchFn(`https://${team}/cdn-cgi/access/certs`, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error("Could not load Cloudflare Access keys");
  const data = (await res.json()) as { keys: Jwk[] };
  jwksCache = { at: Date.now(), keys: data.keys, team };
  return data.keys;
}

export async function verifyAccessJwt(token: string, env: Pick<Env, "ACCESS_TEAM_DOMAIN" | "ACCESS_AUD">, fetchFn: typeof fetch = fetch): Promise<string | null> {
  const team = env.ACCESS_TEAM_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!team || !env.ACCESS_AUD || !token) return null;
  const [h, p, s] = token.split(".");
  if (!h || !p || !s) return null;
  let header: { kid?: string; alg?: string };
  let payload: { aud?: string | string[]; iss?: string; exp?: number; nbf?: number; email?: string };
  try {
    header = JSON.parse(new TextDecoder().decode(b64urlToBytes(h)));
    payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));
  } catch {
    return null;
  }
  if (header.alg !== "RS256") return null;
  const now = Math.floor(Date.now() / 1000);
  const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!auds.includes(env.ACCESS_AUD) || payload.iss !== `https://${team}` || !payload.exp || payload.exp < now || (payload.nbf && payload.nbf > now + 60)) return null;
  const jwk = (await accessKeys(team, fetchFn)).find((k) => k.kid === header.kid);
  if (!jwk) return null;
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64urlToBytes(s), new TextEncoder().encode(`${h}.${p}`));
  return ok && payload.email ? payload.email.toLowerCase() : null;
}

export async function adminIdentity(req: Request, env: Env, config: Config): Promise<string | null> {
  if (config.devAdminEmail) return config.devAdminEmail; // development only (forced off in production)
  const email = await verifyAccessJwt(req.headers.get("cf-access-jwt-assertion") ?? "", env);
  if (!email) return null;
  return config.adminEmails.includes(email) ? email : null;
}

/** Stateless CSRF token bound to the admin and the day. */
export async function csrfToken(config: Config, admin: string): Promise<string> {
  return signToken(config.appSecret || "dev-only-secret-change-me", "csrf", { a: admin, d: new Date().toISOString().slice(0, 10) });
}

export async function checkCsrf(config: Config, admin: string, token: string | null): Promise<boolean> {
  if (!token) return false;
  const data = await verifyToken(config.appSecret || "dev-only-secret-change-me", "csrf", token);
  if (!data || data.a !== admin) return false;
  const age = Date.now() - new Date(`${data.d}T00:00:00Z`).getTime();
  return age >= 0 && age < 2 * 86_400_000;
}

export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return false;
  if (!origin) return true; // older browsers; the CSRF token still applies
  try {
    const host = new URL(origin).host;
    // Local dev servers may rewrite req.url, so the Host header is accepted too.
    return host === new URL(req.url).host || host === req.headers.get("host");
  } catch {
    return false;
  }
}

export const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": "default-src 'none'; style-src 'self'; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  // same-origin (not no-referrer): browsers then send a real Origin header on form posts, which the CSRF check needs.
  "Referrer-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security": "max-age=31536000",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};
