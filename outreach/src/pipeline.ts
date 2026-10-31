import { analyzeHtml, type SiteSignals } from "./audit/analyze";
import { classifyWebsite } from "./audit/classify";
import { fetchPage, pageSpeed, userAgent, type FetchFn, type FetchedPage } from "./audit/fetch-site";
import { AiUnavailableError, type AiProvider, type LeadForAi, type Research } from "./ai/types";
import { finishRun, nowIso, parseJson, randomId, startRun, type Db } from "./db";
import { validateDraft } from "./email/validator";
import type { Config, Job, Logger } from "./env";
import { addEvidence, getEvidence, getLead, insertCandidate, leadSocials, updateLead, type Candidate, type LeadRow } from "./leads";
import { scoreLead } from "./scoring";
import { getSettings, updateSettings, type Settings } from "./settings";
import { isSuppressed } from "./suppression";
import { domainOf, isSocialOrDirectory, isUnusableMailbox, normalizeEmail } from "./text";
import { fromAgent, fromOpenStreetMap } from "./discovery/sources";
import { PACKAGES, ADD_ONS, EXTRA_PAGE_PRICE } from "../../src/lib/catalog";

export type Deps = {
  db: Db;
  config: Config;
  ai: AiProvider | null;
  fetch: FetchFn;
  jobs: { send(job: Job): Promise<void> };
  log: Logger;
  pageSpeedKey?: string;
  now?: () => Date;
};

export const ALLOWED_NUMBERS = [
  ...PACKAGES.flatMap((p) => [String(p.price), p.price.toLocaleString("en-US"), String(p.pageLimit)]),
  ...ADD_ONS.map((a) => String(a.price)),
  String(EXTRA_PAGE_PRICE),
];

// ---------------------------------------------------------------- discovery

export async function runDiscovery(deps: Deps, opts: { manual?: boolean; targetIndex?: number } = {}) {
  const settings = await getSettings(deps.db);
  if (!opts.manual && !settings.discoveryEnabled) return { skipped: "discovery disabled" };
  if (!settings.discoveryTargets.length) return { skipped: "no discovery targets configured" };
  const index = (opts.targetIndex ?? settings.discoveryCursor) % settings.discoveryTargets.length;
  const target = settings.discoveryTargets[index];
  const runId = await startRun(deps.db, "discovery");
  const stats = { target, found: 0, inserted: 0, duplicates: 0, invalid: 0, source: "" };
  try {
    const existing = await deps.db
      .prepare("SELECT name FROM leads WHERE city = ? AND state = ? ORDER BY created_at DESC LIMIT 200")
      .bind(target.city, target.state)
      .all<{ name: string }>();
    let candidates: Candidate[] = [];
    if (deps.ai) {
      stats.source = "ai_agent";
      candidates = (await deps.ai.discover(target, settings.discoveryPerRun, existing.results.map((r) => r.name))).map(fromAgent);
    } else {
      stats.source = "osm";
      candidates = await fromOpenStreetMap(deps.fetch, target, settings.discoveryPerRun, userAgent(deps.config.websiteUrl));
    }
    stats.found = candidates.length;
    for (const c of candidates) {
      const r = await insertCandidate(deps.db, c);
      if (r.status === "inserted") {
        stats.inserted++;
        await deps.jobs.send({ type: "process_lead", leadId: r.id });
      } else if (r.status === "duplicate") stats.duplicates++;
      else stats.invalid++;
    }
    if (opts.targetIndex === undefined) await updateSettings(deps.db, "system", { discoveryCursor: (index + 1) % settings.discoveryTargets.length });
    await finishRun(deps.db, runId, stats);
    deps.log.info("discovery.done", stats);
    return stats;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await finishRun(deps.db, runId, stats, message);
    deps.log.error("discovery.failed", { message });
    throw err;
  }
}

/** Queue processing for leads added outside discovery (CSV, manual). */
export async function importCandidates(deps: Deps, candidates: Candidate[]) {
  const out = { inserted: 0, duplicates: 0, invalid: [] as string[] };
  for (const c of candidates) {
    const r = await insertCandidate(deps.db, c);
    if (r.status === "inserted") {
      out.inserted++;
      await deps.jobs.send({ type: "process_lead", leadId: r.id });
    } else if (r.status === "duplicate") out.duplicates++;
    else out.invalid.push(`${c.name || "(no name)"}: ${r.reason}`);
  }
  return out;
}

// ---------------------------------------------------------------- per-lead processing

async function fetchTwice(deps: Deps, url: string): Promise<FetchedPage[]> {
  const opts = { websiteUrl: deps.config.websiteUrl, allowLocal: deps.config.allowLocalFetch };
  const first = await fetchPage(deps.fetch, url, opts);
  if (first.ok || first.blockedByRobots || (first.status && first.status < 500 && first.status !== 408)) return [first];
  return [first, await fetchPage(deps.fetch, url, { ...opts, checkRobots: false })];
}

/** Keeps an email only if we can show where the business publishes it. */
async function verifyEmail(deps: Deps, lead: LeadRow, signals: SiteSignals | null, contactSignals: SiteSignals | null, pageUrl: string | null, contactUrl: string | null) {
  const siteDomain = lead.website_domain;
  const onSite = [...(signals?.emails ?? []), ...(contactSignals?.emails ?? [])]
    .map(normalizeEmail)
    .filter((e): e is string => !!e && !isUnusableMailbox(e) && !isSocialOrDirectory(`https://${e.split("@")[1]}`));
  if (onSite.length) {
    // Prefer an address on the business's own domain.
    const best = onSite.find((e) => siteDomain && e.endsWith(`@${siteDomain}`)) ?? onSite[0];
    const where = signals?.emails.includes(best) ? pageUrl : contactUrl;
    return { email: best, source: where, verified: true };
  }
  const listed = normalizeEmail(lead.email);
  if (!listed || isUnusableMailbox(listed)) return { email: null, source: null, verified: false };
  if (lead.source === "csv" || lead.source === "osm" || lead.source === "manual") return { email: listed, source: lead.email_source_url, verified: true };
  // AI-found email: fetch the cited page and confirm the address is really published there.
  if (lead.email_source_url) {
    const page = await fetchPage(deps.fetch, lead.email_source_url, { websiteUrl: deps.config.websiteUrl, allowLocal: deps.config.allowLocalFetch });
    if (page.ok && page.html.toLowerCase().includes(listed)) return { email: listed, source: page.finalUrl, verified: true };
  }
  return { email: null, source: null, verified: false, unverified: listed };
}

export function leadForAi(lead: LeadRow, evidence: { id: number; statement: string; source_url: string | null }[], gaps: string[]): LeadForAi {
  return {
    name: lead.name,
    category: lead.category,
    group: lead.category_group ?? "other",
    city: lead.city,
    state: lead.state,
    websiteStatus: lead.website_status,
    website: lead.website,
    gaps,
    evidence: evidence.map((e) => ({ id: e.id, statement: e.statement, source_url: e.source_url })),
  };
}

export async function processLead(deps: Deps, leadId: string, opts: { force?: boolean } = {}) {
  const lead = await getLead(deps.db, leadId);
  if (!lead) return { skipped: "not found" };
  if (!opts.force && lead.stage !== "new") return { skipped: `stage ${lead.stage}` };
  const settings = await getSettings(deps.db);
  const discovery = parseJson<{ discovery?: { searchedForWebsite?: boolean; chain?: boolean } }>(lead.research, {}).discovery ?? {};

  // 1. Website check
  let pages: FetchedPage[] = [];
  let signals: SiteSignals | null = null;
  let contactSignals: SiteSignals | null = null;
  let contactUrl: string | null = null;
  let speed = { performance: null as number | null, accessibility: null as number | null };
  if (lead.website && !isSocialOrDirectory(lead.website)) {
    pages = await fetchTwice(deps, lead.website);
    const ok = pages.find((p) => p.ok && p.html);
    if (ok) {
      signals = analyzeHtml(ok.html, ok.finalUrl);
      if (!signals.emails.length && signals.contactPageUrl) {
        const cp = await fetchPage(deps.fetch, signals.contactPageUrl, { websiteUrl: deps.config.websiteUrl, allowLocal: deps.config.allowLocalFetch });
        if (cp.ok) {
          contactSignals = analyzeHtml(cp.html, cp.finalUrl);
          contactUrl = cp.finalUrl;
        }
      }
      speed = await pageSpeed(deps.fetch, ok.finalUrl, deps.pageSpeedKey);
    }
    const last = pages.at(-1)!;
    await deps.db
      .prepare(
        "INSERT INTO website_audits (lead_id, url, final_url, http_status, reachable, https, signals, pagespeed_mobile, accessibility_score, checked_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(leadId, lead.website, (ok ?? last).finalUrl, (ok ?? last).status, ok ? 1 : 0, (ok ?? last).https ? 1 : 0, JSON.stringify({ ...signals, contactEmails: contactSignals?.emails ?? [] }), speed.performance, speed.accessibility, nowIso())
      .run();
  }

  const socials = [...new Set([...leadSocials(lead), ...(signals?.socials ?? [])])].slice(0, 10);
  const c = classifyWebsite({
    website: lead.website,
    socials,
    group: lead.category_group ?? "other",
    searchedForWebsite: !!discovery.searchedForWebsite,
    pages,
    signals,
    pageSpeed: speed,
    today: deps.now?.(),
  });

  // 2. Contact email
  const okPage = pages.find((p) => p.ok);
  const email = await verifyEmail(deps, lead, signals, contactSignals, okPage?.finalUrl ?? null, contactUrl);
  const findings: { kind: string; statement: string; sourceUrl: string | null }[] = c.findings.map((f) => ({ kind: f.kind, statement: f.statement, sourceUrl: f.sourceUrl ?? null }));
  if (email.email && email.source) findings.push({ kind: "contact", statement: `Public business email ${email.email} is published at ${email.source}.`, sourceUrl: email.source });
  if (signals?.booking.length) findings.push({ kind: "audit", statement: `Booking tools found on the site: ${signals.booking.join(", ")}.`, sourceUrl: okPage?.finalUrl ?? null });
  if (signals?.ordering.length) findings.push({ kind: "audit", statement: `Ordering options found on the site: ${signals.ordering.join(", ")}.`, sourceUrl: okPage?.finalUrl ?? null });
  if (socials.length) findings.push({ kind: "social", statement: `Public social profiles: ${socials.map((u) => domainOf(u)).join(", ")}.`, sourceUrl: socials[0] });
  await addEvidence(deps.db, leadId, findings);

  // 3. Score
  const score = scoreLead({
    status: c.status,
    gaps: c.gaps,
    group: lead.category_group ?? "other",
    hasPhone: !!lead.phone_normalized,
    hasSocials: socials.length > 0,
    hasDescription: !!lead.description,
    hasLocation: !!(lead.city && lead.state),
    chain: !!discovery.chain,
  });
  const qualifies = score.score >= settings.minScoreToContact;
  const suppressed = email.email ? await isSuppressed(deps.db, email.email) : false;
  await updateLead(deps.db, leadId, {
    website_status: c.status,
    lead_score: score.score,
    priority: score.priority,
    score_reasons: JSON.stringify(score.reasons),
    social_links: JSON.stringify(socials),
    email: email.email,
    email_source_url: email.source,
    notes: "unverified" in email && email.unverified ? [lead.notes, `Unverified email from AI research (not used): ${email.unverified}`].filter(Boolean).join("\n") : lead.notes,
    research: JSON.stringify({ discovery, gaps: c.gaps }),
    stage: !qualifies ? "not_qualified" : suppressed ? "unsubscribed" : "qualified",
    unsubscribed: suppressed ? 1 : 0,
    processing_error: null,
  });
  if (!qualifies || suppressed) return { status: c.status, score: score.score, qualified: qualifies };

  // 4. Research + first email
  if (!deps.ai) {
    await updateLead(deps.db, leadId, { processing_error: "AI is not configured (ANTHROPIC_API_KEY)." });
    return { status: c.status, score: score.score, qualified: true, drafted: false };
  }
  const fresh = (await getLead(deps.db, leadId))!;
  const evidence = await getEvidence(deps.db, leadId);
  let research: Research;
  try {
    research = await deps.ai.research(leadForAi(fresh, evidence, c.gaps));
  } catch (err) {
    await updateLead(deps.db, leadId, { processing_error: `Research failed: ${err instanceof Error ? err.message : String(err)}` });
    if (err instanceof AiUnavailableError) return { status: c.status, score: score.score, qualified: true, drafted: false };
    throw err;
  }
  await updateLead(deps.db, leadId, {
    why_maison_can_help: research.why_maison_can_help.slice(0, 600),
    personalized_observation: research.personalized_observation.slice(0, 400),
    research: JSON.stringify({ discovery, gaps: c.gaps, ...research }),
    stage: email.email ? "qualified" : "needs_contact",
  });
  if (!email.email) return { status: c.status, score: score.score, qualified: true, drafted: false, reason: "no verified public email" };

  const drafted = await createDraft(deps, leadId, 0);
  return { status: c.status, score: score.score, qualified: true, drafted: drafted.valid };
}

// ---------------------------------------------------------------- drafting

export async function createDraft(deps: Deps, leadId: string, step: 0 | 1 | 2, settingsArg?: Settings): Promise<{ messageId: string; valid: boolean; errors: string[] }> {
  if (!deps.ai) throw new AiUnavailableError("AI is not configured.");
  const settings = settingsArg ?? (await getSettings(deps.db));
  const lead = (await getLead(deps.db, leadId))!;
  if (!lead.email) throw new Error("Lead has no verified email.");
  const evidence = await getEvidence(deps.db, leadId);
  const stored = parseJson<Partial<Research> & { gaps?: string[] }>(lead.research, {});
  const research = stored as Research;
  const ai = leadForAi(lead, evidence, stored.gaps ?? []);
  const previous = (
    await deps.db.prepare("SELECT subject, body_text FROM messages WHERE lead_id = ? AND step < ? AND status = 'sent' ORDER BY step").bind(leadId, step).all<{ subject: string; body_text: string }>()
  ).results.map((m) => ({ subject: m.subject, body: m.body_text }));
  const recent = (
    await deps.db.prepare("SELECT body_text FROM messages WHERE lead_id != ? AND step = ? ORDER BY created_at DESC LIMIT 30").bind(leadId, step).all<{ body_text: string }>()
  ).results.map((r) => r.body_text);
  const avoid = recent.flatMap((b) => b.split(/(?<=[.?!])\s+/).filter((s) => s.length > 40)).slice(0, 12);

  let draft = await deps.ai.writeEmail({ lead: ai, research, step, previous, avoidPhrases: avoid });
  const check = (d: typeof draft) =>
    validateDraft({ draft: d, step, businessName: lead.name, websiteStatus: lead.website_status, evidence: ai.evidence, allowedNumbers: ALLOWED_NUMBERS, recentBodies: recent });
  let errors = check(draft);
  if (errors.length) {
    // One rewrite with the checker's feedback, then a person decides.
    draft = await deps.ai.writeEmail({ lead: ai, research, step, previous, avoidPhrases: avoid, feedback: errors });
    errors = check(draft);
  }
  const valid = errors.length === 0;
  const autoApprove = valid && settings.automatedSending && (lead.priority === "HIGH_PRIORITY" || lead.priority === "GOOD_LEAD");
  const status = !valid ? "needs_edit" : autoApprove ? "approved" : "draft";
  const now = nowIso();
  const id = randomId("msg");
  const subject = step > 0 && previous[0] && !/^re:/i.test(draft.subject) ? `Re: ${previous[0].subject}` : draft.subject;
  await deps.db
    .prepare(
      `INSERT INTO messages (id, lead_id, step, to_email, subject, body_text, landing_path, status, validation_errors, evidence_ids, approved_by, approved_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(lead_id, step) DO UPDATE SET subject = excluded.subject, body_text = excluded.body_text, landing_path = excluded.landing_path,
         status = excluded.status, validation_errors = excluded.validation_errors, evidence_ids = excluded.evidence_ids,
         approved_by = excluded.approved_by, approved_at = excluded.approved_at, updated_at = excluded.updated_at
       WHERE messages.status IN ('draft', 'needs_edit', 'cancelled')`,
    )
    .bind(id, leadId, step, lead.email, subject.slice(0, 120), draft.body.slice(0, 4000), draft.landing_page, status, JSON.stringify(errors), JSON.stringify(draft.evidence_ids), autoApprove ? "automation" : null, autoApprove ? now : null, now, now)
    .run();
  const row = await deps.db.prepare("SELECT id FROM messages WHERE lead_id = ? AND step = ?").bind(leadId, step).first<{ id: string }>();
  if (step === 0) await updateLead(deps.db, leadId, { stage: autoApprove ? "approved" : "review", email_status: status });
  return { messageId: row?.id ?? id, valid, errors };
}
