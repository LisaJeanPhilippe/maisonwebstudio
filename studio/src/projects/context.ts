import type { Deps } from "../pipeline";
import type { StudioStorage, WebsiteClient } from "./intake";

/** Sends one transactional email. Returns false when email isn't configured or delivery failed. */
export type Mailer = (to: string, subject: string, text: string) => Promise<boolean>;

/** Everything the fulfillment system needs, injected so tests can supply local doubles. */
export type StudioCtx = Deps & {
  storage: StudioStorage;
  site: WebsiteClient;
  mail: Mailer | null;
  /** base64 AES-256 key used to encrypt deployment credentials at rest. */
  encryptionKey: string;
  /** Origin that serves previews (a separate hostname is recommended). */
  previewOrigin: string;
  /** Admin dashboard origin, for links in alerts. */
  adminOrigin: string;
  /** Cloudflare API base (overridable only in development, for local testing). */
  cloudflareApi: string;
  /** When false, paid orders are only collected for the studio; no AI build starts. */
  aiBuilds: boolean;
  /** Optional Cloudflare Browser Rendering for axe + responsive checks. */
  browser?: Fetcher | null;
};

/** Resend HTTP API mailer (transactional only; no marketing). */
export function resendMailer(apiKey: string | undefined, from: string, fetchFn: typeof fetch = fetch): Mailer | null {
  if (!apiKey || !from) return null;
  return async (to, subject, text) => {
    try {
      const res = await fetchFn("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, subject, text }),
        signal: AbortSignal.timeout(10_000),
      });
      return res.ok;
    } catch {
      return false;
    }
  };
}
