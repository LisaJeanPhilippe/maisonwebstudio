import type { DiscoveredBusiness } from "../ai/types";
import type { Candidate } from "../leads";
import type { FetchFn } from "../audit/fetch-site";
import { isSocialOrDirectory, normalizeEmail, normalizeUrl } from "../text";

/** Converts the AI agent's sourced findings into a candidate. Unsupported fields are dropped. */
export function fromAgent(b: DiscoveredBusiness): Candidate {
  const sources = new Set(b.facts.map((f) => f.source_url).filter(Boolean));
  const website = normalizeUrl(b.official_website);
  const socials = b.social_profiles.map((u) => normalizeUrl(u)).filter((u): u is string => !!u && isSocialOrDirectory(u));
  // The email is only kept if it names the page it came from; it is re-verified later by fetching that page.
  const email = normalizeEmail(b.public_business_email);
  const emailSource = email ? normalizeUrl(b.email_source_url) : null;
  return {
    name: b.name,
    category: b.category,
    city: b.city,
    state: b.state,
    website: website && !isSocialOrDirectory(website) ? website : null,
    socialLinks: website && isSocialOrDirectory(website) ? [website, ...socials] : socials,
    email: email && emailSource ? email : null,
    emailSourceUrl: emailSource,
    phone: b.phone,
    description: b.description,
    source: "ai_agent",
    sourceUrl: [...sources][0] ?? null,
    searchedForWebsite: b.searched_for_official_website && sources.size > 0,
    chain: b.is_chain_or_franchise,
    facts: [
      ...b.facts.slice(0, 12).map((f) => ({ statement: f.statement, sourceUrl: f.source_url, kind: "source" })),
      ...(b.searched_for_official_website ? [{ statement: `Website search: ${b.website_search_summary}`, sourceUrl: null, kind: "search" }] : []),
    ],
  };
}

/** OpenStreetMap tags for each category (Overpass API). Data © OpenStreetMap contributors, ODbL. */
const OSM_TAGS: Record<string, string[]> = {
  "nail salon": ['["shop"="beauty"]["beauty"~"nails"]'],
  "hair salon": ['["shop"="hairdresser"]'],
  "beauty salon": ['["shop"="beauty"]'],
  barbershop: ['["shop"="hairdresser"]["hairdresser"~"barber"]', '["shop"="barber"]'],
  spa: ['["leisure"="spa"]', '["shop"="massage"]', '["amenity"="spa"]'],
  restaurant: ['["amenity"="restaurant"]'],
  cafe: ['["amenity"="cafe"]'],
  bakery: ['["shop"="bakery"]'],
  boutique: ['["shop"="boutique"]', '["shop"="clothes"]'],
  "cleaning company": ['["craft"="cleaning"]', '["office"="cleaning"]'],
  contractor: ['["craft"~"builder|carpenter|electrician|plumber|roofer|painter|hvac"]'],
  photographer: ['["craft"="photographer"]', '["shop"="photo"]'],
  "event planner": ['["office"="event_management"]'],
  "fitness studio": ['["leisure"="fitness_centre"]', '["sport"="yoga"]'],
};

export const OSM_CATEGORIES = Object.keys(OSM_TAGS);

export async function fromOpenStreetMap(fetchFn: FetchFn, t: { category: string; city: string; state: string }, limit: number, ua: string): Promise<Candidate[]> {
  const tags = OSM_TAGS[t.category.toLowerCase()];
  if (!tags) return [];
  const esc = (s: string) => s.replace(/["\\]/g, "");
  const area = `area["name"="${esc(t.city)}"]["boundary"="administrative"]->.city;`;
  const query = `[out:json][timeout:25];${area}(${tags.map((tag) => `nwr${tag}["name"](area.city);`).join("")});out center tags ${Math.min(limit * 3, 150)};`;
  const res = await fetchFn("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": ua },
    body: `data=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`OpenStreetMap returned HTTP ${res.status}`);
  const data = (await res.json()) as { elements?: { type: string; id: number; tags?: Record<string, string> }[] };
  const out: Candidate[] = [];
  for (const el of data.elements ?? []) {
    const tg = el.tags ?? {};
    if (!tg.name || tg.brand || tg["brand:wikidata"]) continue; // brands are usually chains
    const state = (tg["addr:state"] ?? t.state).toUpperCase();
    if (state !== t.state.toUpperCase()) continue;
    const src = `https://www.openstreetmap.org/${el.type}/${el.id}`;
    const website = tg.website ?? tg["contact:website"] ?? null;
    out.push({
      name: tg.name,
      category: t.category,
      city: tg["addr:city"] ?? t.city,
      state,
      website,
      email: tg.email ?? tg["contact:email"] ?? null,
      emailSourceUrl: tg.email || tg["contact:email"] ? src : null,
      phone: tg.phone ?? tg["contact:phone"] ?? null,
      socialLinks: [tg["contact:instagram"], tg["contact:facebook"]].filter((x): x is string => !!x),
      source: "osm",
      sourceRef: `${el.type}/${el.id}`,
      sourceUrl: src,
      facts: [
        { statement: `Listed on OpenStreetMap as "${tg.name}" (${t.category}) in ${tg["addr:city"] ?? t.city}, ${state}.`, sourceUrl: src },
        ...(tg.opening_hours ? [{ statement: `Opening hours listed: ${tg.opening_hours.slice(0, 120)}.`, sourceUrl: src }] : []),
      ],
    });
    if (out.length >= limit) break;
  }
  return out;
}

/** Parses a CSV the studio prepared itself. Header names are case-insensitive. */
export function fromCsv(csv: string): { candidates: Candidate[]; errors: string[] } {
  const rows = parseCsv(csv.replace(/^\uFEFF/, ""));
  if (rows.length < 2) return { candidates: [], errors: ["The CSV needs a header row and at least one business."] };
  const header = rows[0].map((h) => h.trim().toLowerCase().replace(/[^a-z_]/g, "_"));
  const col = (r: string[], ...names: string[]) => {
    for (const n of names) {
      const i = header.indexOf(n);
      if (i >= 0 && r[i]?.trim()) return r[i].trim();
    }
    return null;
  };
  const candidates: Candidate[] = [];
  const errors: string[] = [];
  rows.slice(1, 1001).forEach((r, idx) => {
    const name = col(r, "name", "business_name", "business");
    if (!name) {
      if (r.some((c) => c.trim())) errors.push(`Row ${idx + 2}: missing name.`);
      return;
    }
    const email = col(r, "email", "business_email", "public_email");
    const emailSource = col(r, "email_source", "email_source_url", "source_url");
    candidates.push({
      name,
      category: col(r, "category", "industry", "type"),
      city: col(r, "city"),
      state: col(r, "state"),
      website: col(r, "website", "url"),
      email,
      emailSourceUrl: email ? emailSource : null,
      phone: col(r, "phone", "phone_number"),
      socialLinks: (col(r, "social", "social_links", "instagram", "facebook") ?? "").split(/[\s;|]+/).filter(Boolean),
      description: col(r, "description", "notes_public"),
      source: "csv",
      sourceUrl: col(r, "source_url", "source"),
      notes: col(r, "notes"),
      searchedForWebsite: /^(true|yes|1)$/i.test(col(r, "searched_for_website", "no_website_verified") ?? ""),
      facts: col(r, "description") ? [{ statement: `Description (from import): ${col(r, "description")}`, sourceUrl: col(r, "source_url") }] : [],
    });
  });
  return { candidates, errors };
}

export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}
