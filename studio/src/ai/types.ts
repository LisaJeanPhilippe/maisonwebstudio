import { z } from "zod";

// Schemas for structured outputs. Kept to plain types (length rules are enforced in our own validators).

export const discoveredBusinessSchema = z.object({
  name: z.string(),
  category: z.string(),
  city: z.string(),
  state: z.string().describe("Two-letter US state code"),
  official_website: z.string().nullable().describe("The business's own website URL, or null if none was found"),
  social_profiles: z.array(z.string()).describe("Public social media profile URLs of the business"),
  public_business_email: z.string().nullable().describe("Only an email the business itself publishes for customers; otherwise null"),
  email_source_url: z.string().nullable().describe("URL of the page where that email is published"),
  phone: z.string().nullable(),
  description: z.string().describe("One factual sentence about what the business offers, from the sources"),
  searched_for_official_website: z.boolean().describe("True only if you searched specifically for an official website"),
  website_search_summary: z.string().describe("What the website search found, e.g. 'Results show only Instagram and Yelp pages'"),
  is_chain_or_franchise: z.boolean(),
  facts: z
    .array(z.object({ statement: z.string(), source_url: z.string() }))
    .describe("Facts about the business, each with the URL it came from"),
});
export type DiscoveredBusiness = z.infer<typeof discoveredBusinessSchema>;

export const discoveryResultSchema = z.object({ businesses: z.array(discoveredBusinessSchema) });

export const researchSchema = z.object({
  what_they_do: z.string(),
  offerings: z.array(z.string()),
  takes_appointments: z.enum(["yes", "no", "unknown"]),
  sells_products: z.enum(["yes", "no", "unknown"]),
  customers_order: z.enum(["yes", "no", "unknown"]),
  primary_online_channel: z.enum(["own_website", "instagram", "facebook", "tiktok", "directory", "none_found", "unknown"]),
  best_opportunity: z.string().describe("The ONE most valuable website improvement for this business"),
  why_maison_can_help: z.string().describe("2 sentences for internal use"),
  personalized_observation: z.string().describe("One specific, verifiable observation about the business, suitable for an email"),
  evidence_ids: z.array(z.number().int()).describe("Evidence ids the observation and opportunity rely on"),
  fit: z.enum(["strong", "moderate", "weak"]),
});
export type Research = z.infer<typeof researchSchema>;

export const emailDraftSchema = z.object({
  subject: z.string(),
  body: z.string().describe("Greeting and email body only. No signature, link line, address or unsubscribe text."),
  landing_page: z.enum(["/work", "/pricing", "/services", "/process", "/start", "/"]),
  evidence_ids: z.array(z.number().int()).describe("Evidence ids for every factual statement about the business"),
});
export type EmailDraft = z.infer<typeof emailDraftSchema>;

export const replyClassificationSchema = z.object({
  label: z.enum(["INTERESTED", "QUESTION", "NOT_INTERESTED", "UNSUBSCRIBE", "OUT_OF_OFFICE", "BOUNCE", "UNCERTAIN"]),
  summary: z.string().describe("One short sentence for the studio owner"),
  wants_no_contact: z.boolean().describe("True if they ask not to be contacted again in any way"),
});
export type ReplyClassification = z.infer<typeof replyClassificationSchema>;

export type EvidenceItem = { id: number; statement: string; source_url: string | null };

export type LeadForAi = {
  name: string;
  category: string | null;
  group: string;
  city: string | null;
  state: string | null;
  websiteStatus: string;
  website: string | null;
  gaps: string[];
  evidence: EvidenceItem[];
};

export type WriteEmailInput = {
  lead: LeadForAi;
  research: Research;
  step: 0 | 1 | 2;
  previous: { subject: string; body: string }[];
  /** Recently generated bodies for other leads, so the model avoids repeating itself. */
  avoidPhrases: string[];
  feedback?: string[];
};

export interface AiProvider {
  readonly name: string;
  discover(target: { category: string; city: string; state: string }, count: number, exclude: string[]): Promise<DiscoveredBusiness[]>;
  research(lead: LeadForAi): Promise<Research>;
  writeEmail(input: WriteEmailInput): Promise<EmailDraft>;
  classifyReply(input: { subject: string; text: string; ourLastEmail?: string }): Promise<ReplyClassification>;
}

export class AiUnavailableError extends Error {}
