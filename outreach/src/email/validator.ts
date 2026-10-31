import { similarity, wordCount } from "../text";
import type { WebsiteStatus } from "../leads";
import type { EmailDraft, EvidenceItem } from "../ai/types";

export type ValidationInput = {
  draft: EmailDraft;
  step: 0 | 1 | 2;
  businessName: string;
  websiteStatus: WebsiteStatus;
  evidence: EvidenceItem[];
  /** Numbers Maison may quote (prices from the catalog). */
  allowedNumbers: string[];
  /** Bodies of other recent emails, to block near-duplicates. */
  recentBodies: string[];
};

const SPAM_SUBJECT = /\b(free|urgent|guarantee[d]?|act now|last chance|limited time|winner|cash|risk[- ]free|click here|congratulations|100%|\$\$+|make money|earn)\b/i;
const URGENCY = /\b((spots?|slots?|space|availability|openings) (are|is) (limited|filling)|limited (time|spots?|availability|offer|number)|only \d+ (spots?|slots?)|act (now|fast)|hurry|expires?|deadline|last chance|before it'?s too late|today only|this week only|don'?t miss)\b/i;
const FAKE_RELATIONSHIP = /\b(as (we )?discussed|our (call|conversation|chat|meeting)|great (talking|speaking|meeting)|nice (talking|speaking|meeting)|you (requested|asked for|reached out)|per your request|as promised|we met)\b/i;
const FAKE_PROOF = /(\d+\s?%|\bpercent\b|studies show|research shows|on average|our clients (saw|got|increased|doubled)|clients? (love|say)|testimonial|\bguarantee|\b\d+x\b|proven to)/i;
const FEAR = /\b(losing (customers|money|business|sales)|falling behind|your competitors (are|have)|you'?re missing out|left behind|costing you)\b/i;
const NO_SITE_CLAIM = /\b((don'?t|do not|doesn'?t|does not)( yet)? (seem to )?(have|has) (a |an |your own |its own )?(website|site|web ?page)|no (official |real |proper )?website|without a website|lack(s|ing)? a website)\b/i;
const BROKEN_CLAIM = /\b((website|site|page) (is |was |seems |appears )?(to be )?(down|broken|offline|not loading|not working)|(couldn'?t|could not|wouldn'?t|would not) (load|open)|error page)\b/i;
const OUTDATED_CLAIM = /\b(outdated|old[- ]fashioned|dated|old) (website|site|design)\b/i;
const ABOUT_THEIR_SITE = /\byour (current |existing )?(website|site|homepage)\b/i;
const PLACEHOLDER = /\[[^\]]*\]|\{\{|\}\}|lorem ipsum|\bTODO\b|<[a-z]+>/i;

export function validateDraft(v: ValidationInput): string[] {
  const errors: string[] = [];
  const { subject, body } = v.draft;
  const text = `${subject}\n${body}`;

  // Subject
  if (subject.trim().length < 5 || subject.length > 70) errors.push("Subject must be 5–70 characters.");
  if (/!/.test(subject)) errors.push("Subject must not contain exclamation marks.");
  if (SPAM_SUBJECT.test(subject)) errors.push("Subject contains spam-trigger wording.");
  if (/\b[A-Z]{4,}\b/.test(subject.replace(/\b(LLC|USA|NYC|BBQ|DIY|HVAC)\b/g, ""))) errors.push("Subject must not use ALL CAPS words.");
  if (v.step === 0 && /^(re|fwd?):/i.test(subject.trim())) errors.push("A first email must not pretend to be a reply (Re:/Fwd:).");

  // Length
  const words = wordCount(body);
  const [min, max] = v.step === 0 ? [55, 135] : [20, 90];
  if (words < min || words > max) errors.push(`Body has ${words} words; expected ${min}–${max}.`);

  // Honesty about the website
  if (NO_SITE_CLAIM.test(body) && !["NO_WEBSITE", "SOCIAL_ONLY"].includes(v.websiteStatus)) errors.push("Claims the business has no website, which was not verified.");
  if (BROKEN_CLAIM.test(body) && v.websiteStatus !== "WEBSITE_BROKEN") errors.push("Claims the website is broken, which was not verified.");
  if (OUTDATED_CLAIM.test(body) && v.websiteStatus !== "WEBSITE_OUTDATED") errors.push("Calls the website outdated, which was not verified.");
  if (v.websiteStatus === "UNCERTAIN" && ABOUT_THEIR_SITE.test(body)) errors.push("Website status is uncertain, so the email must not comment on their website.");

  // Manipulation and fabrication
  if (URGENCY.test(text)) errors.push("Uses urgency or scarcity language.");
  if (FAKE_RELATIONSHIP.test(text)) errors.push("Implies a prior relationship or conversation.");
  if (FAKE_PROOF.test(text)) errors.push("Uses statistics, results or testimonials that cannot be verified.");
  if (FEAR.test(text)) errors.push("Uses fear-based wording.");
  if (PLACEHOLDER.test(text)) errors.push("Contains a placeholder or markup.");
  if (/https?:\/\/|www\.|[a-z0-9.-]+\.(com|net|org|io|co)\b/i.test(body)) errors.push("Body must not contain links (the website link is added automatically).");
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(body)) errors.push("Body must not contain email addresses.");
  if (/\b(unsubscribe|opt[- ]out)\b/i.test(body)) errors.push("Body must not include its own unsubscribe text (the footer adds it).");

  // Numbers must be prices we offer or numbers that appear in the evidence.
  const evidenceText = v.evidence.map((e) => e.statement).join(" ");
  const allowed = new Set([...v.allowedNumbers, ...(evidenceText.match(/\d[\d,.]*/g) ?? [])].map((n) => n.replace(/[,.]$/, "")));
  for (const n of body.match(/\d[\d,.]*/g) ?? []) {
    const clean = n.replace(/[,.]$/, "");
    if (!allowed.has(clean) && !allowed.has(clean.replace(/,/g, ""))) errors.push(`Uses the number "${clean}", which is not in the evidence or price list.`);
  }

  // Greeting: no invented owner names.
  const greet = body.match(/^\s*(hi|hello|dear|hey)\s+([^,\n]+)/i);
  if (greet) {
    const who = greet[2].trim().toLowerCase();
    const okWho = who === "there" || who.includes("team") || v.businessName.toLowerCase().includes(who) || who.includes(v.businessName.toLowerCase()) || evidenceText.toLowerCase().includes(who);
    if (!okWho) errors.push(`Greets "${greet[2].trim()}", a name not found in the evidence.`);
  } else {
    errors.push("Body must start with a greeting.");
  }

  // Evidence references must be real.
  const ids = new Set(v.evidence.map((e) => e.id));
  const bad = v.draft.evidence_ids.filter((id) => !ids.has(id));
  if (bad.length) errors.push(`Refers to unknown evidence ids: ${bad.join(", ")}.`);
  if (v.step === 0 && v.draft.evidence_ids.length === 0) errors.push("A first email must be grounded in at least one evidence item.");

  // Not a template blast.
  const closest = v.recentBodies.reduce((m, b) => Math.max(m, similarity(b, body)), 0);
  if (closest > 0.45) errors.push(`Too similar to another recent email (${Math.round(closest * 100)}% overlap).`);

  return [...new Set(errors)];
}
