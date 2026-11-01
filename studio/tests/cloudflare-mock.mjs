// A local stand-in for the parts of the Cloudflare API the deployer uses (TEST ONLY — never contacts Cloudflare).
// It validates the request shapes Wrangler itself sends, stores the uploaded files, and serves the "deployed"
// site at /__served/<script>/… so the deployer's live verification step has something real to check.

export function createCloudflareMock({ token = "mock-token-0123456789abcdefghijklmnopqrstu", accountId = "0123456789abcdef0123456789abcdef", subdomain = "maison-test", zones = [] } = {}) {
  const state = {
    sessions: new Map(), // upload jwt -> { script, manifest, pending:Set }
    blobs: new Map(), // hash -> { bytes, type }
    completions: new Map(), // completion jwt -> { script, manifest }
    scripts: new Map(), // script -> { manifest, metadata, module, workersDev, domains: [] }
    domains: [],
    calls: [],
    failNext: null, // { path: RegExp, status, message } to simulate errors
  };
  let seq = 0;
  const ok = (result) => Response.json({ success: true, errors: [], messages: [], result });
  const err = (status, code, message) => Response.json({ success: false, errors: [{ code, message }], result: null }, { status });

  async function handle(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    state.calls.push(`${request.method} ${path}`);

    // ----- the "deployed" site
    const served = path.match(/^\/__served\/([a-z0-9-]+)(\/.*)?$/);
    if (served) {
      const s = state.scripts.get(served[1]);
      if (!s) return new Response("no such worker", { status: 404 });
      let rest = served[2] || "/";
      if (rest.endsWith("/")) rest += "index.html";
      let entry = s.manifest[rest] || s.manifest[`${rest}/index.html`];
      let status = 200;
      if (!entry) {
        entry = s.manifest["/404.html"];
        status = 404;
      }
      if (!entry) return new Response("not found", { status: 404 });
      const blob = state.blobs.get(entry.hash);
      return new Response(blob.bytes, { status, headers: { "content-type": blob.type } });
    }

    // On Cloudflare each Worker has its own hostname, so the site links to /assets/… at the root.
    // Here sites share one host: root paths resolve against the site the page was loaded from (Referer).
    if (!path.startsWith("/client/v4/")) {
      const ref = (request.headers.get("referer") || "").match(/\/__served\/([a-z0-9-]+)\//);
      if (ref) return handle(new Request(new URL(`/__served/${ref[1]}${path}`, url), { headers: request.headers }));
      return new Response("not found", { status: 404 });
    }
    const api = path.slice("/client/v4".length);
    const auth = (request.headers.get("authorization") || "").replace(/^Bearer /, "");
    if (state.failNext && state.failNext.path.test(api)) {
      const f = state.failNext;
      state.failNext = null;
      return err(f.status, 10000 + f.status, f.message);
    }

    // Asset upload uses the session JWT instead of the API token.
    if (request.method === "POST" && api === `/accounts/${accountId}/workers/assets/upload`) {
      const session = state.sessions.get(auth);
      if (!session) return err(401, 10001, "bad upload session token");
      if (url.searchParams.get("base64") !== "true") return err(400, 10002, "expected base64=true");
      const form = await request.formData();
      for (const [hash, file] of form.entries()) {
        if (!session.pending.has(hash)) return err(400, 10003, `unexpected file ${hash}`);
        const b64 = await file.text();
        state.blobs.set(hash, { bytes: Uint8Array.from(Buffer.from(b64, "base64")), type: file.type });
        session.pending.delete(hash);
      }
      if (session.pending.size) return ok({});
      const jwt = `completion-${++seq}`;
      state.completions.set(jwt, { script: session.script, manifest: session.manifest });
      return ok({ jwt });
    }

    if (auth !== token) return err(403, 10000, "Authentication error");
    const acct = `/accounts/${accountId}`;

    if (request.method === "GET" && api === `${acct}/workers/subdomain`) return subdomain ? ok({ subdomain }) : err(404, 10007, "no subdomain");

    let m = api.match(new RegExp(`^${acct}/workers/scripts/([a-z0-9-]+)/assets-upload-session$`));
    if (m && request.method === "POST") {
      const { manifest } = await request.json();
      if (!manifest || typeof manifest !== "object") return err(400, 10004, "manifest required");
      for (const [p, e] of Object.entries(manifest)) if (!p.startsWith("/") || !/^[a-f0-9]{32}$/.test(e.hash) || typeof e.size !== "number") return err(400, 10005, `bad manifest entry ${p}`);
      const missing = [...new Set(Object.values(manifest).map((e) => e.hash))].filter((h) => !state.blobs.has(h));
      const jwt = `upload-${++seq}`;
      if (!missing.length) {
        state.completions.set(jwt, { script: m[1], manifest });
        return ok({ jwt, buckets: [] });
      }
      state.sessions.set(jwt, { script: m[1], manifest, pending: new Set(missing) });
      return ok({ jwt, buckets: [missing] });
    }

    m = api.match(new RegExp(`^${acct}/workers/scripts/([a-z0-9-]+)$`));
    if (m && request.method === "PUT") {
      const form = await request.formData();
      const rawMeta = form.get("metadata");
      const metadata = JSON.parse(typeof rawMeta === "string" ? rawMeta : await rawMeta.text());
      const mod = form.get(metadata.main_module);
      if (!mod) return err(400, 10021, "main module missing");
      const done = state.completions.get(metadata.assets && metadata.assets.jwt);
      if (!done || done.script !== m[1]) return err(400, 10022, "invalid assets completion token");
      if (!metadata.bindings.some((b) => b.type === "assets" && b.name === "ASSETS")) return err(400, 10023, "assets binding missing");
      const prev = state.scripts.get(m[1]);
      state.scripts.set(m[1], { manifest: done.manifest, metadata, module: await mod.text(), workersDev: prev ? prev.workersDev : false });
      return ok({ id: m[1], etag: `etag-${seq}`, deployment_id: `deploy-${++seq}` });
    }

    m = api.match(new RegExp(`^${acct}/workers/scripts/([a-z0-9-]+)/subdomain$`));
    if (m && request.method === "POST") {
      const s = state.scripts.get(m[1]);
      if (!s) return err(404, 10007, "script not found");
      s.workersDev = (await request.json()).enabled === true;
      return ok({ enabled: s.workersDev });
    }

    if (request.method === "GET" && api === "/zones") {
      const name = url.searchParams.get("name");
      if (url.searchParams.get("account.id") !== accountId) return ok([]);
      return ok(zones.filter((z) => z.name === name));
    }

    if (request.method === "PUT" && api === `${acct}/workers/domains`) {
      const body = await request.json();
      if (!state.scripts.has(body.service)) return err(404, 10007, "service not found");
      if (!zones.some((z) => z.id === body.zone_id)) return err(404, 1003, "zone not found");
      const d = { id: `dom-${++seq}`, hostname: body.hostname, service: body.service, zone_id: body.zone_id, environment: body.environment };
      state.domains.push(d);
      return ok(d);
    }

    return err(404, 7003, `No route for ${request.method} ${api}`);
  }

  return { state, handle, token, accountId };
}
