import type { Priority, WebsiteStatus } from "./leads";

export type ScoreInput = {
  status: WebsiteStatus;
  gaps: string[];
  group: string;
  hasPhone: boolean;
  hasSocials: boolean;
  hasDescription: boolean;
  hasLocation: boolean;
  chain: boolean;
};

export type Score = { score: number; priority: Priority; reasons: string[] };

const BASE: Record<WebsiteStatus, number> = {
  NO_WEBSITE: 62,
  SOCIAL_ONLY: 64,
  WEBSITE_BROKEN: 60,
  WEBSITE_OUTDATED: 50,
  WEBSITE_NEEDS_IMPROVEMENT: 32,
  GOOD_WEBSITE: 5,
  UNCERTAIN: 20,
};

/**
 * Transparent, rule-based score (0–100). The AI never sets the score, so the same
 * business always gets the same score from the same evidence.
 */
export function scoreLead(i: ScoreInput): Score {
  const reasons: string[] = [`${i.status.replace(/_/g, " ").toLowerCase()} (+${BASE[i.status]})`];
  let s = BASE[i.status];
  const add = (n: number, why: string) => {
    s += n;
    reasons.push(`${why} (${n > 0 ? "+" : ""}${n})`);
  };

  const g = i.gaps.join(" | ").toLowerCase();
  if (g.includes("booking") || g.includes("quote")) add(12, "missing online booking/quote requests");
  if (g.includes("ordering")) add(12, "missing online ordering");
  if (g.includes("shop")) add(10, "missing online shop");
  if (g.includes("tap-to-call")) add(6, "hard to contact from the homepage");
  if (g.includes("call-to-action")) add(5, "no clear call to action");
  if (g.includes("slow on mobile")) add(5, "slow on mobile");
  if (g.includes("https")) add(4, "no HTTPS");
  if (g.includes("accessibility")) add(3, "accessibility issues");

  // Signs of an active, viable business we can help.
  if (i.hasPhone) add(5, "active phone listing");
  if (i.hasSocials) add(5, "active social presence");
  if (i.hasDescription) add(3, "clear description of services");
  if (i.group !== "other") add(4, "industry Maison has a playbook for");

  if (!i.hasLocation) add(-15, "location unknown");
  if (i.chain) add(-45, "chain/franchise location (website managed centrally)");
  if (i.status === "GOOD_WEBSITE") s = Math.min(s, 30);
  if (i.status === "UNCERTAIN") s = Math.min(s, 55); // never top priority without evidence

  const score = Math.max(0, Math.min(100, Math.round(s)));
  return { score, priority: priorityFor(score), reasons };
}

export function priorityFor(score: number): Priority {
  if (score >= 80) return "HIGH_PRIORITY";
  if (score >= 60) return "GOOD_LEAD";
  if (score >= 40) return "POSSIBLE_LEAD";
  return "DO_NOT_CONTACT";
}
