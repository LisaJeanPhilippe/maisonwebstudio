/** Project lifecycle. Transitions are enforced server-side; the AI can never reach APPROVED. */
export const PROJECT_STATUSES = [
  "NEW_REQUEST",
  "AWAITING_PAYMENT",
  "PAID",
  "QUEUED_FOR_AI",
  "AI_BUILDING",
  "READY_FOR_REVIEW",
  "REVISIONS_REQUESTED",
  "AI_REVISING",
  "APPROVED",
  "CLIENT_REVIEW",
  "READY_FOR_DEPLOYMENT",
  "DEPLOYING",
  "DEPLOYED",
  "COMPLETED",
  "FAILED",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  NEW_REQUEST: "New request",
  AWAITING_PAYMENT: "Awaiting payment",
  PAID: "Paid",
  QUEUED_FOR_AI: "Queued for AI",
  AI_BUILDING: "AI building",
  READY_FOR_REVIEW: "Ready for review",
  REVISIONS_REQUESTED: "Revisions requested",
  AI_REVISING: "AI revising",
  APPROVED: "Approved",
  CLIENT_REVIEW: "Client review",
  READY_FOR_DEPLOYMENT: "Ready for deployment",
  DEPLOYING: "Deploying",
  DEPLOYED: "Deployed",
  COMPLETED: "Completed",
  FAILED: "Failed / needs attention",
};

export const EVENTS = [
  "REQUEST_CREATED",
  "PAYMENT_CONFIRMED",
  "PAYMENT_UPDATED",
  "AI_QUEUED",
  "GENERATION_STARTED",
  "GENERATION_FAILED",
  "GENERATION_COMPLETED",
  "READY_FOR_REVIEW",
  "REVISION_REQUESTED",
  "REVISION_COMPLETED",
  "ROLLBACK",
  "ADMIN_APPROVED",
  "CLIENT_REVIEW_REQUESTED",
  "CLIENT_APPROVED",
  "CLIENT_CHANGES_REQUESTED",
  "READY_FOR_DEPLOYMENT",
  "DEPLOYMENT_STARTED",
  "DEPLOYMENT_FAILED",
  "DEPLOYMENT_SUCCEEDED",
  "INFO_REQUESTED",
  "COMPLETED",
  "NOTE",
  "RETRY",
] as const;
export type ProjectEvent = (typeof EVENTS)[number];

/** Allowed next states. FAILED is reachable from any working state and can be retried. */
const NEXT: Record<ProjectStatus, ProjectStatus[]> = {
  NEW_REQUEST: ["AWAITING_PAYMENT", "PAID"],
  AWAITING_PAYMENT: ["PAID", "AWAITING_PAYMENT"],
  // PAID → COMPLETED: orders-only mode, where the studio builds the site outside this system.
  PAID: ["QUEUED_FOR_AI", "COMPLETED"],
  QUEUED_FOR_AI: ["AI_BUILDING", "FAILED"],
  AI_BUILDING: ["READY_FOR_REVIEW", "FAILED"],
  READY_FOR_REVIEW: ["APPROVED", "REVISIONS_REQUESTED", "QUEUED_FOR_AI"],
  REVISIONS_REQUESTED: ["AI_REVISING", "READY_FOR_REVIEW", "FAILED"],
  AI_REVISING: ["READY_FOR_REVIEW", "FAILED"],
  APPROVED: ["CLIENT_REVIEW", "READY_FOR_DEPLOYMENT", "REVISIONS_REQUESTED"],
  CLIENT_REVIEW: ["READY_FOR_DEPLOYMENT", "REVISIONS_REQUESTED", "APPROVED"],
  READY_FOR_DEPLOYMENT: ["DEPLOYING", "REVISIONS_REQUESTED", "CLIENT_REVIEW"],
  DEPLOYING: ["DEPLOYED", "READY_FOR_DEPLOYMENT", "FAILED"],
  DEPLOYED: ["COMPLETED", "DEPLOYING", "REVISIONS_REQUESTED"],
  COMPLETED: ["DEPLOYING", "REVISIONS_REQUESTED"],
  // From FAILED a person decides: rebuild, review the last good version, or retry a deployment.
  FAILED: ["QUEUED_FOR_AI", "READY_FOR_REVIEW", "READY_FOR_DEPLOYMENT", "DEPLOYING"],
};

export const canTransition = (from: ProjectStatus, to: ProjectStatus) => NEXT[from]?.includes(to) ?? false;

/** States where the AI agent may be working (used for metrics and guards). */
export const AI_ACTIVE: ProjectStatus[] = ["QUEUED_FOR_AI", "AI_BUILDING", "AI_REVISING"];
