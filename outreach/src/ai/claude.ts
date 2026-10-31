import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { DISCOVERY_SYSTEM, evidenceBlock, offerSummary, PLAYBOOKS, REPLY_SYSTEM, RESEARCH_SYSTEM, WRITER_SYSTEM } from "./prompts";
import {
  AiUnavailableError,
  discoveryResultSchema,
  emailDraftSchema,
  replyClassificationSchema,
  researchSchema,
  type AiProvider,
  type DiscoveredBusiness,
  type EmailDraft,
  type LeadForAi,
  type ReplyClassification,
  type Research,
  type WriteEmailInput,
} from "./types";

type Effort = "low" | "medium" | "high";

/** Claude API provider. The API key stays in the Worker (secret binding); nothing reaches the browser. */
export class ClaudeProvider implements AiProvider {
  readonly name = "claude";
  private client: Anthropic;

  constructor(
    apiKey: string,
    private model: string,
  ) {
    this.client = new Anthropic({ apiKey, maxRetries: 3, timeout: 10 * 60 * 1000 });
  }

  /** One structured-output request, resuming paused server-tool turns, with server-side refusal fallback. */
  private async structured<S extends z.ZodType>(opts: {
    system: string;
    user: string;
    schema: S;
    effort: Effort;
    maxTokens?: number;
    tools?: Anthropic.Beta.BetaToolUnion[];
  }): Promise<z.infer<S>> {
    const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: opts.user }];
    for (let turn = 0; turn < 4; turn++) {
      let response;
      try {
        response = await this.client.beta.messages.parse({
          model: this.model,
          max_tokens: opts.maxTokens ?? 16000,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          system: [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }],
          messages,
          tools: opts.tools,
          output_config: { effort: opts.effort, format: betaZodOutputFormat(opts.schema) },
        });
      } catch (err) {
        if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
          throw new AiUnavailableError("The Claude API key was rejected.");
        }
        throw err; // RateLimit/5xx/connection errors were already retried by the SDK; the job queue retries later.
      }
      if (response.stop_reason === "pause_turn") {
        messages.push({ role: "assistant", content: response.content });
        continue;
      }
      if (response.stop_reason === "refusal") throw new Error("The model declined this request.");
      if (response.stop_reason === "max_tokens") throw new Error("The model response was cut off (max_tokens).");
      if (!response.parsed_output) throw new Error("The model did not return valid structured output.");
      return response.parsed_output as z.infer<S>;
    }
    throw new Error("The model did not finish after several resumed turns.");
  }

  async discover(target: { category: string; city: string; state: string }, count: number, exclude: string[]): Promise<DiscoveredBusiness[]> {
    const result = await this.structured({
      system: DISCOVERY_SYSTEM,
      effort: "medium",
      tools: [
        {
          type: "web_search_20260209",
          name: "web_search",
          max_uses: 12,
          user_location: { type: "approximate", city: target.city, region: target.state, country: "US" },
        },
      ],
      schema: discoveryResultSchema,
      user: [
        `Find up to ${count} independent ${target.category} businesses in ${target.city}, ${target.state}.`,
        "For each, search for its official website and its public contact details, then report what you found with sources.",
        exclude.length ? `Skip these businesses, which we already have: ${exclude.slice(0, 80).join("; ")}.` : "",
      ].join("\n"),
    });
    return result.businesses.slice(0, count);
  }

  research(lead: LeadForAi): Promise<Research> {
    return this.structured({
      system: RESEARCH_SYSTEM,
      effort: "medium",
      schema: researchSchema,
      maxTokens: 8000,
      user: `${evidenceBlock(lead)}\n\nIndustry playbook (what usually matters most): ${PLAYBOOKS[lead.group] ?? PLAYBOOKS.other}`,
    });
  }

  writeEmail(input: WriteEmailInput): Promise<EmailDraft> {
    const stepNote =
      input.step === 0
        ? "Write the FIRST email."
        : input.step === 1
          ? "Write a SHORT first follow-up (reply in the same thread). Add one new, helpful angle; don't repeat the first email."
          : "Write a brief, polite FINAL follow-up that says this is the last note and leaves the door open. No pressure.";
    return this.structured({
      system: WRITER_SYSTEM,
      effort: "high",
      schema: emailDraftSchema,
      maxTokens: 8000,
      user: [
        evidenceBlock(input.lead),
        "",
        `Research notes: ${JSON.stringify(input.research)}`,
        `Industry playbook: ${PLAYBOOKS[input.lead.group] ?? PLAYBOOKS.other}`,
        `What Maison Web Studio offers: ${offerSummary()}`,
        "",
        stepNote,
        input.previous.length ? `Earlier emails in this thread:\n${input.previous.map((p, i) => `#${i + 1} Subject: ${p.subject}\n${p.body}`).join("\n\n")}` : "",
        input.avoidPhrases.length ? `Avoid reusing these sentences from other recent emails:\n- ${input.avoidPhrases.slice(0, 12).join("\n- ")}` : "",
        input.feedback?.length ? `A checker rejected the previous draft for these reasons — fix them:\n- ${input.feedback.join("\n- ")}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }

  classifyReply(input: { subject: string; text: string; ourLastEmail?: string }): Promise<ReplyClassification> {
    return this.structured({
      system: REPLY_SYSTEM,
      effort: "low",
      schema: replyClassificationSchema,
      maxTokens: 2000,
      user: `<reply_subject>${input.subject.slice(0, 300)}</reply_subject>\n<reply_text>${input.text.slice(0, 6000)}</reply_text>${
        input.ourLastEmail ? `\n<our_email>${input.ourLastEmail.slice(0, 2000)}</our_email>` : ""
      }`,
    });
  }
}
