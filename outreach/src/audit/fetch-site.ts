/**
 * Polite, safe fetching of a business's own public website:
 * - identifies itself with a descriptive User-Agent and honours robots.txt
 * - one page (plus at most one contact page) per business, short timeouts, size cap
 * - refuses non-http(s) URLs, raw IPs and internal hostnames (SSRF protection)
 */

export type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;

export type FetchedPage = {
  ok: boolean;
  url: string;
  finalUrl: string;
  status: number | null;
  https: boolean;
  html: string;
  bytes: number;
  error: string | null;
  redirects: number;
  blockedByRobots?: boolean;
};

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 10_000;

export const userAgent = (websiteUrl: string) => `MaisonWebStudioBot/1.0 (+${websiteUrl || "https://maisonwebstudio.com"})`;

export function isSafePublicUrl(raw: string, allowLocal = false): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  if (u.username || u.password) return false;
  const host = u.hostname.toLowerCase();
  if (allowLocal && (host === "127.0.0.1" || host === "localhost")) return true;
  if (u.port && !["80", "443"].includes(u.port)) return false;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(":") || host.startsWith("[")) return false; // raw IPv4/IPv6
  if (!host.includes(".")) return false;
  if (/\.(local|localhost|internal|lan|home|corp|test|invalid|example)$/.test(host)) return false;
  return true;
}

async function readCapped(res: Response): Promise<{ text: string; bytes: number }> {
  const type = res.headers.get("content-type") ?? "";
  if (type && !/text\/html|application\/xhtml|text\/plain/i.test(type)) {
    await res.body?.cancel();
    return { text: "", bytes: 0 };
  }
  const reader = res.body?.getReader();
  if (!reader) return { text: "", bytes: 0 };
  const chunks: Uint8Array[] = [];
  let kept = 0;
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    const room = MAX_BYTES - kept;
    chunks.push(value.byteLength > room ? value.subarray(0, room) : value);
    kept += Math.min(value.byteLength, room);
    if (kept >= MAX_BYTES) {
      await reader.cancel();
      break;
    }
  }
  const all = new Uint8Array(kept);
  let off = 0;
  for (const c of chunks) {
    all.set(c, off);
    off += c.byteLength;
  }
  return { text: new TextDecoder("utf-8").decode(all), bytes };
}

async function timedFetch(fetchFn: FetchFn, url: string, ua: string): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetchFn(url, {
      redirect: "manual",
      signal: ctrl.signal,
      headers: { "User-Agent": ua, Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5" },
    });
  } finally {
    clearTimeout(t);
  }
}

/** Minimal robots.txt check for "/" paths: our UA group, else "*". Errors mean "allowed". */
export async function robotsAllows(fetchFn: FetchFn, pageUrl: string, ua: string): Promise<boolean> {
  try {
    const u = new URL(pageUrl);
    const res = await timedFetch(fetchFn, `${u.origin}/robots.txt`, ua);
    if (!res.ok) return true;
    const { text } = await readCapped(new Response(res.body, { headers: { "content-type": "text/plain" } }));
    return robotsTxtAllows(text, u.pathname || "/", "maisonwebstudiobot");
  } catch {
    return true;
  }
}

export function robotsTxtAllows(robots: string, path: string, agent: string): boolean {
  const groups: { agents: string[]; rules: { allow: boolean; path: string }[] }[] = [];
  let current: (typeof groups)[number] | null = null;
  let lastWasAgent = false;
  for (const raw of robots.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const field = m[1].toLowerCase();
    const value = m[2].trim();
    if (field === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if ((field === "allow" || field === "disallow") && current) {
      if (value) current.rules.push({ allow: field === "allow", path: value });
      lastWasAgent = false;
    }
  }
  const group = groups.find((g) => g.agents.some((a) => a !== "*" && agent.includes(a))) ?? groups.find((g) => g.agents.includes("*"));
  if (!group) return true;
  let best: { allow: boolean; len: number } | null = null;
  for (const r of group.rules) {
    const prefix = r.path.replace(/\*.*$/, "").replace(/\$$/, "");
    if (path.startsWith(prefix) && (!best || prefix.length > best.len)) best = { allow: r.allow, len: prefix.length };
  }
  return best ? best.allow : true;
}

export async function fetchPage(fetchFn: FetchFn, url: string, opts: { websiteUrl: string; allowLocal?: boolean; checkRobots?: boolean }): Promise<FetchedPage> {
  const ua = userAgent(opts.websiteUrl);
  const base: FetchedPage = { ok: false, url, finalUrl: url, status: null, https: url.startsWith("https://"), html: "", bytes: 0, error: null, redirects: 0 };
  if (!isSafePublicUrl(url, opts.allowLocal)) return { ...base, error: "unsafe or invalid URL" };
  if (opts.checkRobots !== false && !(await robotsAllows(fetchFn, url, ua))) return { ...base, blockedByRobots: true, error: "robots.txt disallows" };

  let current = url;
  for (let i = 0; i <= 5; i++) {
    let res: Response;
    try {
      res = await timedFetch(fetchFn, current, ua);
    } catch (e) {
      return { ...base, finalUrl: current, redirects: i, error: e instanceof Error && e.name === "AbortError" ? "timeout" : "connection failed" };
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      await res.body?.cancel();
      const next = new URL(res.headers.get("location")!, current).toString();
      if (!isSafePublicUrl(next, opts.allowLocal)) return { ...base, finalUrl: next, status: res.status, redirects: i + 1, error: "redirect to unsafe URL" };
      current = next;
      continue;
    }
    const { text, bytes } = await readCapped(res);
    return { ok: res.ok, url, finalUrl: current, status: res.status, https: current.startsWith("https://"), html: text, bytes, error: res.ok ? null : `HTTP ${res.status}`, redirects: i };
  }
  return { ...base, finalUrl: current, error: "too many redirects", redirects: 6 };
}

/** Google PageSpeed Insights (mobile). Optional; returns nulls without a key or on error. */
export async function pageSpeed(fetchFn: FetchFn, url: string, apiKey?: string): Promise<{ performance: number | null; accessibility: number | null }> {
  if (!apiKey) return { performance: null, accessibility: null };
  try {
    const api = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    api.searchParams.set("url", url);
    api.searchParams.set("strategy", "mobile");
    api.searchParams.append("category", "performance");
    api.searchParams.append("category", "accessibility");
    api.searchParams.set("key", apiKey);
    const res = await fetchFn(api.toString(), { signal: AbortSignal.timeout(60_000) });
    if (!res.ok) return { performance: null, accessibility: null };
    const data = (await res.json()) as { lighthouseResult?: { categories?: Record<string, { score?: number | null }> } };
    const cat = data.lighthouseResult?.categories ?? {};
    const pct = (v?: number | null) => (typeof v === "number" ? Math.round(v * 100) : null);
    return { performance: pct(cat.performance?.score), accessibility: pct(cat.accessibility?.score) };
  } catch {
    return { performance: null, accessibility: null };
  }
}
