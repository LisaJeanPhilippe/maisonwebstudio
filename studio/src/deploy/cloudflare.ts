import { blake3 } from "@noble/hashes/blake3.js";
import { bytesToHex } from "@noble/hashes/utils.js";

/**
 * Minimal Cloudflare API client for deploying a Worker with Static Assets — the same
 * calls Wrangler makes (verified against wrangler's own deploy code):
 *   1. POST /accounts/:a/workers/scripts/:s/assets-upload-session  {manifest}
 *   2. POST /accounts/:a/workers/assets/upload?base64=true (Bearer <session jwt>, multipart) per bucket
 *   3. PUT  /accounts/:a/workers/scripts/:s  (multipart: metadata with assets.jwt + module)
 *   4. POST /accounts/:a/workers/scripts/:s/subdomain {enabled:true}
 *   5. PUT  /accounts/:a/workers/domains {hostname, service, zone_id, environment}
 */
export class CloudflareError extends Error {
  constructor(
    message: string,
    public status: number,
    public retryable: boolean,
  ) {
    super(message);
  }
}

type Envelope<T> = { success: boolean; errors?: { code: number; message: string }[]; result: T };

/** Same hash Wrangler uses: first 32 hex chars of BLAKE3(base64(content) + extension). */
export function assetHash(bytes: Uint8Array, path: string): string {
  const ext = (path.split("/").pop() ?? "").includes(".") ? path.split(".").pop()! : "";
  return bytesToHex(blake3(new TextEncoder().encode(toBase64(bytes) + ext))).slice(0, 32);
}

export function toBase64(bytes: Uint8Array) {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export class CloudflareClient {
  constructor(
    private token: string,
    public accountId: string,
    private api = "https://api.cloudflare.com/client/v4",
    private fetchFn: typeof fetch = fetch,
  ) {}

  private async call<T>(method: string, path: string, init: { json?: unknown; body?: BodyInit; bearer?: string; query?: Record<string, string> } = {}): Promise<T> {
    const url = new URL(`${this.api}${path}`);
    for (const [k, v] of Object.entries(init.query ?? {})) url.searchParams.set(k, v);
    const headers: Record<string, string> = { Authorization: `Bearer ${init.bearer ?? this.token}` };
    let body = init.body;
    if (init.json !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(init.json);
    }
    let res: Response;
    try {
      res = await (0, this.fetchFn)(url.toString(), { method, headers, body, signal: AbortSignal.timeout(60_000) });
    } catch (e) {
      throw new CloudflareError(`Could not reach the Cloudflare API (${e instanceof Error ? e.message : "network error"})`, 0, true);
    }
    const data = (await res.json().catch(() => null)) as Envelope<T> | null;
    if (!res.ok || !data?.success) {
      const msg = data?.errors?.map((e) => `${e.code}: ${e.message}`).join("; ") || `HTTP ${res.status}`;
      throw new CloudflareError(`Cloudflare ${method} ${path.replace(this.accountId, ":account")} failed — ${msg}`, res.status, res.status === 429 || res.status >= 500);
    }
    return data.result;
  }

  /** Confirms the token works for this account (account-owned or user tokens). */
  async verify(): Promise<{ ok: boolean; subdomain: string | null; message: string }> {
    try {
      const sub = await this.subdomain();
      return { ok: true, subdomain: sub, message: sub ? `Connected. Workers subdomain: ${sub}.workers.dev` : "Connected, but this account has no workers.dev subdomain yet — open Workers & Pages once in the dashboard to create it." };
    } catch (e) {
      return { ok: false, subdomain: null, message: e instanceof Error ? e.message : "Verification failed" };
    }
  }

  async subdomain(): Promise<string | null> {
    try {
      const r = await this.call<{ subdomain: string }>("GET", `/accounts/${this.accountId}/workers/subdomain`);
      return r?.subdomain ?? null;
    } catch (e) {
      if (e instanceof CloudflareError && e.status === 404) return null;
      throw e;
    }
  }

  async uploadAssets(script: string, files: Record<string, { bytes: Uint8Array; type: string }>, log: (m: string) => void): Promise<string> {
    const manifest: Record<string, { hash: string; size: number }> = {};
    const byHash = new Map<string, { path: string; bytes: Uint8Array; type: string }>();
    for (const [path, f] of Object.entries(files)) {
      const hash = assetHash(f.bytes, path);
      manifest[path] = { hash, size: f.bytes.byteLength };
      byHash.set(hash, { path, ...f });
    }
    const session = await this.call<{ jwt: string; buckets: string[][] }>("POST", `/accounts/${this.accountId}/workers/scripts/${script}/assets-upload-session`, { json: { manifest } });
    const buckets = session.buckets ?? [];
    log(`Upload session started: ${Object.keys(manifest).length} files, ${buckets.flat().length} new or changed.`);
    if (!buckets.length) return session.jwt;
    let completion = "";
    for (const bucket of buckets) {
      const form = new FormData();
      for (const hash of bucket) {
        const f = byHash.get(hash);
        if (!f) throw new CloudflareError(`Cloudflare requested an unknown file (${hash}).`, 400, false);
        form.append(hash, new File([toBase64(f.bytes)], hash, { type: f.type || "application/null" }), hash);
      }
      const r = await this.call<{ jwt?: string }>("POST", `/accounts/${this.accountId}/workers/assets/upload`, { body: form, bearer: session.jwt, query: { base64: "true" } });
      completion = r?.jwt || completion;
    }
    if (!completion) throw new CloudflareError("Cloudflare didn't return an upload completion token.", 502, true);
    return completion;
  }

  async putScript(
    script: string,
    o: { moduleCode: string; assetsJwt: string; headers: string; vars: Record<string, string>; secrets: Record<string, string>; compatibilityDate: string },
  ): Promise<{ id: string | null; etag: string | null }> {
    const metadata = {
      main_module: "worker.js",
      compatibility_date: o.compatibilityDate,
      bindings: [
        { name: "ASSETS", type: "assets" },
        ...Object.entries(o.vars).map(([name, text]) => ({ name, type: "plain_text", text })),
        ...Object.entries(o.secrets).map(([name, text]) => ({ name, type: "secret_text", text })),
      ],
      assets: { jwt: o.assetsJwt, config: { html_handling: "auto-trailing-slash", not_found_handling: "404-page", _headers: o.headers } },
      observability: { enabled: true },
    };
    const form = new FormData();
    form.set("metadata", JSON.stringify(metadata));
    form.set("worker.js", new File([o.moduleCode], "worker.js", { type: "application/javascript+module" }));
    const r = await this.call<{ id?: string; etag?: string; deployment_id?: string }>("PUT", `/accounts/${this.accountId}/workers/scripts/${script}`, { body: form });
    return { id: r?.deployment_id ?? r?.id ?? null, etag: r?.etag ?? null };
  }

  async enableWorkersDev(script: string) {
    await this.call("POST", `/accounts/${this.accountId}/workers/scripts/${script}/subdomain`, { json: { enabled: true, previews_enabled: false } });
  }

  /** The zone for a hostname (tries the hostname and its parent domains) in this account. */
  async findZone(hostname: string): Promise<{ id: string; name: string; status: string } | null> {
    const parts = hostname.toLowerCase().split(".");
    for (let i = 0; i < parts.length - 1; i++) {
      const name = parts.slice(i).join(".");
      const zones = await this.call<{ id: string; name: string; status: string }[]>("GET", "/zones", { query: { name, "account.id": this.accountId } });
      if (zones?.length) return zones[0];
    }
    return null;
  }

  async attachDomain(hostname: string, script: string, zoneId: string) {
    return this.call<{ id: string; hostname: string }>("PUT", `/accounts/${this.accountId}/workers/domains`, { json: { environment: "production", hostname, service: script, zone_id: zoneId } });
  }
}

export const workersDevUrl = (script: string, subdomain: string) => `https://${script}.${subdomain}.workers.dev`;
