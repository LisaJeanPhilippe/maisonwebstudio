import { ClaudeWebsiteAgent, type WebsiteAgent } from "./builder/agent";
import { StubWebsiteAgent } from "./builder/stub-agent";
import type { Env } from "./env";
import type { Deps } from "./pipeline";
import { resendMailer, type StudioCtx } from "./projects/context";
import { WebsiteClient, type StudioStorage } from "./projects/intake";

export const CLOUDFLARE_API = "https://api.cloudflare.com/client/v4";

/** Private R2 storage for project files and rendered versions. Throws clearly when the bucket isn't bound. */
export function r2Storage(bucket: R2Bucket | undefined): StudioStorage {
  const b = () => {
    if (!bucket) throw new Error("The SITES R2 bucket is not bound (see studio/wrangler.jsonc).");
    return bucket;
  };
  return {
    async put(key, body, contentType) {
      await b().put(key, body, { httpMetadata: { contentType } });
    },
    async get(key) {
      const o = await b().get(key);
      return o ? { body: await o.arrayBuffer(), contentType: o.httpMetadata?.contentType ?? "application/octet-stream" } : null;
    },
    async getText(key) {
      const o = await b().get(key);
      return o ? o.text() : null;
    },
    async list(prefix) {
      const keys: string[] = [];
      let cursor: string | undefined;
      do {
        const r = await b().list({ prefix, cursor });
        keys.push(...r.objects.map((o) => o.key));
        cursor = r.truncated ? r.cursor : undefined;
      } while (cursor);
      return keys;
    },
  };
}

const origin = (v: string | undefined) => (v || "").replace(/\/$/, "");

export function makeStudio(env: Env, deps: Deps): StudioCtx {
  const production = deps.config.production;
  const adminOrigin = deps.config.publicBaseUrl;
  return {
    ...deps,
    storage: r2Storage(env.SITES),
    site: new WebsiteClient(origin(env.WEBSITE_INTERNAL_URL), env.INTERNAL_SECRET ?? ""),
    mail: resendMailer(env.RESEND_API_KEY, env.EMAIL_FROM ?? ""),
    encryptionKey: env.ENCRYPTION_KEY ?? "",
    previewOrigin: origin(env.PREVIEW_ORIGIN) || adminOrigin,
    adminOrigin,
    // The deploy client may only be redirected to a local mock outside production.
    cloudflareApi: !production && env.DEV_CLOUDFLARE_API ? origin(env.DEV_CLOUDFLARE_API) : CLOUDFLARE_API,
    browser: env.BROWSER ?? null,
    aiBuilds: env.AI_BUILDS === "on",
  };
}

/** Real Claude agent when an API key is set; the offline stub only in development when explicitly requested. */
export function makeAgent(env: Env, production: boolean): WebsiteAgent | null {
  if (!production && env.DEV_AI_PROVIDER === "stub") return new StubWebsiteAgent();
  return env.ANTHROPIC_API_KEY ? new ClaudeWebsiteAgent(env.ANTHROPIC_API_KEY, env.AI_MODEL || "claude-opus-5-5") : null;
}
