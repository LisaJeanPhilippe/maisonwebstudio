import type { Db } from "../db";
import { nowIso } from "../db";
import type { FetchFn } from "../audit/fetch-site";
import { toMime, type ComposedEmail } from "./compose";

export type SendResult = { providerMessageId: string; providerThreadId: string | null };

export type InboundMessage = {
  id: string;
  threadId: string | null;
  from: string;
  subject: string;
  date: string;
  text: string;
  headers: Record<string, string>;
};

/** A mail transport. Errors that may succeed later must be TemporaryError so the queue retries them. */
export interface Transport {
  readonly name: string;
  send(email: ComposedEmail, rfcMessageId: string, threadId?: string | null): Promise<SendResult>;
  /** Inbound messages received after `since` (replies, bounces, auto-replies). */
  listInbound(since: Date): Promise<InboundMessage[]>;
}

export class TemporaryError extends Error {
  constructor(
    message: string,
    public retryAfterSeconds = 300,
  ) {
    super(message);
  }
}
export class PermanentError extends Error {}

/** Captures email in the database instead of sending. Used when no mailbox is connected. */
export class DryRunTransport implements Transport {
  readonly name = "dry-run";
  constructor(private db: Db) {}
  async send(email: ComposedEmail, rfcMessageId: string): Promise<SendResult> {
    await this.db
      .prepare("INSERT INTO test_outbox (message_id, to_email, subject, raw, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(rfcMessageId, email.to, email.subject, toMime(email, rfcMessageId), nowIso())
      .run();
    return { providerMessageId: `dry-${rfcMessageId}`, providerThreadId: `dry-thread-${email.to}` };
  }
  async listInbound(): Promise<InboundMessage[]> {
    return [];
  }
}

const b64urlEncode = (s: string) => {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const b64urlDecode = (s: string) => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

type GmailPart = { mimeType?: string; body?: { data?: string }; parts?: GmailPart[]; headers?: { name: string; value: string }[] };

/**
 * Gmail API transport for a dedicated Google Workspace outreach mailbox.
 * Uses an OAuth refresh token with the gmail.send + gmail.readonly scopes.
 */
export class GmailTransport implements Transport {
  readonly name = "gmail";
  private token: { value: string; expires: number } | null = null;

  constructor(
    private creds: { clientId: string; clientSecret: string; refreshToken: string },
    private fetchFn: FetchFn = fetch,
  ) {}

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expires > Date.now() + 60_000) return this.token.value;
    const res = await this.fetchFn("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.creds.clientId,
        client_secret: this.creds.clientSecret,
        refresh_token: this.creds.refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (res.status === 400 || res.status === 401) throw new PermanentError("Gmail authorization failed; reconnect the outreach mailbox.");
    if (!res.ok) throw new TemporaryError(`Google token endpoint returned ${res.status}`);
    const data = (await res.json()) as { access_token: string; expires_in: number };
    this.token = { value: data.access_token, expires: Date.now() + data.expires_in * 1000 };
    return data.access_token;
  }

  private async api(path: string, init: RequestInit = {}) {
    const res = await this.fetchFn(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${await this.accessToken()}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
      signal: AbortSignal.timeout(30_000),
    });
    if (res.status === 429 || res.status >= 500) throw new TemporaryError(`Gmail API returned ${res.status}`, Number(res.headers.get("retry-after")) || 600);
    if (!res.ok) throw new PermanentError(`Gmail API returned ${res.status}`);
    return res.json();
  }

  async send(email: ComposedEmail, rfcMessageId: string, threadId?: string | null): Promise<SendResult> {
    const body: Record<string, string> = { raw: b64urlEncode(toMime(email, rfcMessageId)) };
    if (threadId) body.threadId = threadId;
    const data = (await this.api("messages/send", { method: "POST", body: JSON.stringify(body) })) as { id: string; threadId: string };
    return { providerMessageId: data.id, providerThreadId: data.threadId };
  }

  async listInbound(since: Date): Promise<InboundMessage[]> {
    const after = Math.floor(since.getTime() / 1000);
    const list = (await this.api(`messages?maxResults=50&q=${encodeURIComponent(`in:inbox after:${after}`)}`)) as { messages?: { id: string }[] };
    const out: InboundMessage[] = [];
    for (const { id } of list.messages ?? []) {
      const m = (await this.api(`messages/${id}?format=full`)) as { id: string; threadId: string; payload: GmailPart; snippet?: string; internalDate?: string };
      const headers = Object.fromEntries((m.payload.headers ?? []).map((h) => [h.name.toLowerCase(), h.value]));
      out.push({
        id: m.id,
        threadId: m.threadId,
        from: headers["from"] ?? "",
        subject: headers["subject"] ?? "",
        date: m.internalDate ? new Date(Number(m.internalDate)).toISOString() : nowIso(),
        text: extractText(m.payload) || m.snippet || "",
        headers,
      });
    }
    return out;
  }
}

function extractText(part: GmailPart): string {
  if (part.mimeType === "text/plain" && part.body?.data) return b64urlDecode(part.body.data);
  for (const p of part.parts ?? []) {
    const t = extractText(p);
    if (t) return t;
  }
  if (part.mimeType === "text/html" && part.body?.data) return b64urlDecode(part.body.data).replace(/<[^>]+>/g, " ");
  // Delivery reports carry the failure details in a message/delivery-status part.
  if (part.mimeType === "message/delivery-status" && part.body?.data) return b64urlDecode(part.body.data);
  return "";
}
