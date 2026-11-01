import type { AiProvider, DiscoveredBusiness, EmailDraft, LeadForAi, ReplyClassification, Research, WriteEmailInput } from "./types";

/**
 * Deterministic, offline stand-in for the Claude API, used ONLY in development/tests
 * (DEV_AI_PROVIDER=stub). It makes no network calls and only restates given evidence.
 */
export class StubProvider implements AiProvider {
  readonly name = "stub";
  constructor(private fixtures: { discover?: DiscoveredBusiness[] } = {}) {}

  async discover(_t: unknown, count: number, exclude: string[]): Promise<DiscoveredBusiness[]> {
    return (this.fixtures.discover ?? []).filter((b) => !exclude.includes(b.name)).slice(0, count);
  }

  async research(lead: LeadForAi): Promise<Research> {
    const first = lead.evidence.find((e) => e.statement.length > 20 && !/^Found via/.test(e.statement)) ?? lead.evidence[0];
    const opportunity =
      lead.gaps[0] ?? ({ salon: "online booking", restaurant: "online menu and ordering", contractor: "quote requests" } as Record<string, string>)[lead.group] ?? "a clearer way for customers to contact them";
    return {
      what_they_do: `${lead.category ?? "Local business"} in ${lead.city ?? "their area"}.`,
      offerings: [],
      takes_appointments: ["salon", "barbershop", "spa"].includes(lead.group) ? "yes" : "unknown",
      sells_products: "unknown",
      customers_order: ["restaurant", "cafe", "bakery"].includes(lead.group) ? "yes" : "unknown",
      primary_online_channel: lead.websiteStatus === "SOCIAL_ONLY" ? "instagram" : lead.website ? "own_website" : "unknown",
      best_opportunity: opportunity,
      why_maison_can_help: `${lead.name}: ${opportunity.toLowerCase()}. A mobile-first site with a clear next step would make it easier for customers to act.`,
      personalized_observation: first?.statement ?? `${lead.name} serves customers in ${lead.city ?? "the area"}.`,
      evidence_ids: first ? [first.id] : [],
      fit: lead.gaps.length ? "strong" : "moderate",
    };
  }

  async writeEmail(input: WriteEmailInput): Promise<EmailDraft> {
    const l = input.lead;
    const ev = input.research.evidence_ids;
    const where = l.city ? ` in ${l.city}` : "";
    if (input.step === 0) {
      return {
        subject: `Quick idea for ${l.name}`,
        body: `Hi ${l.name} team,\n\nI was looking at ${l.category ? `${l.category.toLowerCase()}s` : "local businesses"}${where} and came across ${l.name}. ${input.research.personalized_observation}\n\nOne idea: ${input.research.best_opportunity.toLowerCase()}. When customers can see what you offer and take the next step from their phone, there's less back-and-forth for you and fewer people who give up halfway.\n\nMaison Web Studio designs custom, mobile-first websites for small businesses at fixed prices, and we handle the setup. Would it be useful if I sent over a quick idea of what this could look like for you?`,
        landing_page: "/work",
        evidence_ids: ev,
      };
    }
    if (input.step === 1) {
      return {
        subject: `Re: ${input.previous[0]?.subject ?? `Quick idea for ${l.name}`}`,
        body: `Hi ${l.name} team,\n\nJust following up on my note from last week. If it helps, our pricing page shows exactly what each package includes, so there are no surprises.\n\nHappy to send a short idea tailored to ${l.name} if you're curious.`,
        landing_page: "/pricing",
        evidence_ids: [],
      };
    }
    return {
      subject: `Re: ${input.previous[0]?.subject ?? `Quick idea for ${l.name}`}`,
      body: `Hi ${l.name} team,\n\nI don't want to crowd your inbox, so this is my last note. If a new website is ever on your list, I'd be glad to help — just reply any time.\n\nWishing you a great season.`,
      landing_page: "/",
      evidence_ids: [],
    };
  }

  async classifyReply(input: { subject: string; text: string }): Promise<ReplyClassification> {
    const t = `${input.subject} ${input.text}`.toLowerCase();
    if (/interested|tell me more|how much|pricing|call me|sounds good|yes please/.test(t)) return { label: "INTERESTED", summary: "Asked to hear more.", wants_no_contact: false };
    if (/not interested|no thanks|no thank you/.test(t)) return { label: "NOT_INTERESTED", summary: "Not interested.", wants_no_contact: /don'?t contact|stop/.test(t) };
    if (/\?/.test(t)) return { label: "QUESTION", summary: "Asked a question.", wants_no_contact: false };
    return { label: "UNCERTAIN", summary: "Unclear reply.", wants_no_contact: false };
  }
}
