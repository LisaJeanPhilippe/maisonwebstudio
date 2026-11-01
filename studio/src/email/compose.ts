import type { Config } from "../env";
import { leadToken } from "../leads";

/** HMAC-signed, single-purpose unsubscribe token: identifies the lead and address, nothing else. */
const enc = new TextEncoder();
const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function hmac(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

export async function signToken(secret: string, purpose: string, payload: Record<string, string>): Promise<string> {
  if (!secret) throw new Error("APP_SECRET is not configured.");
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = b64url((await hmac(secret, `${purpose}.${body}`)).slice(0, 18));
  return `${body}.${sig}`;
}

export async function verifyToken(secret: string, purpose: string, token: string): Promise<Record<string, string> | null> {
  if (!secret || typeof token !== "string" || token.length > 600) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = (await hmac(secret, `${purpose}.${body}`)).slice(0, 18);
  let given: Uint8Array;
  try {
    given = fromB64url(sig);
  } catch {
    return null;
  }
  if (given.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ given[i];
  if (diff !== 0) return null;
  try {
    return JSON.parse(new TextDecoder().decode(fromB64url(body)));
  } catch {
    return null;
  }
}

export const unsubscribeUrl = async (config: Config, leadId: string, email: string) =>
  `${config.publicBaseUrl}/u/${await signToken(config.appSecret, "unsub", { l: leadId, e: email })}`;

/** Website link with UTM parameters. utm_content is an opaque token, never the business name. */
export function trackedLink(config: Config, path: string, leadId: string, step: number): string {
  const u = new URL(path, `${config.websiteUrl}/`);
  u.searchParams.set("utm_source", "email");
  u.searchParams.set("utm_medium", "outbound");
  u.searchParams.set("utm_campaign", "maison_outreach");
  u.searchParams.set("utm_content", `${leadToken(leadId)}-s${step}`);
  return u.toString();
}

export type ComposedEmail = {
  from: string;
  to: string;
  subject: string;
  text: string;
  headers: Record<string, string>;
};

/** Adds the link, signature, sender identification, postal address and opt-out (CAN-SPAM). */
export async function composeEmail(
  config: Config,
  m: { leadId: string; to: string; subject: string; body: string; landingPath: string; step: number; inReplyTo?: string | null },
): Promise<ComposedEmail> {
  if (!config.postalAddress && config.production) throw new Error("BUSINESS_POSTAL_ADDRESS is required in every commercial email.");
  const link = trackedLink(config, m.landingPath, m.leadId, m.step);
  const unsub = await unsubscribeUrl(config, m.leadId, m.to);
  const text = [
    m.body.trim(),
    "",
    `${config.businessName}:`,
    link,
    "",
    "Best,",
    config.senderName,
    config.businessName,
    "",
    "--",
    `${config.businessName} · ${config.postalAddress || "[postal address not configured — test only]"}`,
    `You're receiving this one-to-one business email because your business is publicly listed. If you'd rather not hear from us, reply "unsubscribe" or use this link and we won't email you again: ${unsub}`,
  ].join("\n");

  const headers: Record<string, string> = {
    "List-Unsubscribe": `<${unsub}>, <mailto:${config.senderEmail}?subject=unsubscribe>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
  if (m.inReplyTo) {
    headers["In-Reply-To"] = m.inReplyTo;
    headers["References"] = m.inReplyTo;
  }
  return { from: `${config.senderName} at ${config.businessName} <${config.senderEmail}>`, to: m.to, subject: m.subject, text, headers };
}

const encodeHeader = (v: string) => (/^[\x20-\x7e]*$/.test(v) ? v : `=?UTF-8?B?${btoa(String.fromCharCode(...enc.encode(v)))}?=`);
const sanitizeHeader = (v: string) => v.replace(/[\r\n]+/g, " ").trim();

/** RFC 5322 message (plain text only — no tracking pixels, no HTML). */
export function toMime(e: ComposedEmail, messageId: string): string {
  const bodyB64 = btoa(String.fromCharCode(...enc.encode(e.text))).replace(/.{1,76}/g, "$&\r\n");
  const lines = [
    `From: ${sanitizeHeader(e.from)}`,
    `To: ${sanitizeHeader(e.to)}`,
    `Subject: ${encodeHeader(sanitizeHeader(e.subject))}`,
    `Message-ID: ${messageId}`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    ...Object.entries(e.headers).map(([k, v]) => `${k}: ${sanitizeHeader(v)}`),
    "",
    bodyB64,
  ];
  return lines.join("\r\n");
}

export const rfcMessageId = (domain: string) => `<${crypto.randomUUID()}@${domain || "maison.invalid"}>`;
