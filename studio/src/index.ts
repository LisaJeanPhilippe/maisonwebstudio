import { createApp, makeDeps, makeTransport } from "./app";
import type { Env, Job } from "./env";
import { processLead, runDiscovery } from "./pipeline";
import { sendQueuedMessage, tick } from "./sending";
import { TemporaryError } from "./email/transport";
import { makeAgent, makeStudio } from "./studio";
import { runGeneration } from "./builder/pipeline";
import { runDeployment, verifyLater } from "./deploy/deploy";
import { reconcileOrders, syncOrder } from "./projects/intake";
import { getProject, recordEvent, transition } from "./projects/store";
import type { StudioCtx } from "./projects/context";

/** Marks a queued generation failed when no AI agent is configured (never fakes a build). */
async function noAgent(ctx: StudioCtx, generationId: string) {
  const msg = "No AI provider is configured (set the ANTHROPIC_API_KEY secret).";
  const gen = await ctx.db.prepare("SELECT project_id FROM ai_generations WHERE id = ?").bind(generationId).first<{ project_id: string }>();
  await ctx.db.prepare("UPDATE ai_generations SET status = 'failed', error = ? WHERE id = ?").bind(msg, generationId).run();
  if (!gen) return;
  const p = await getProject(ctx.db, gen.project_id);
  await recordEvent(ctx.db, gen.project_id, "GENERATION_FAILED", "system", { generationId, message: msg });
  if (p && p.status !== "FAILED") await transition(ctx.db, p.id, "FAILED", "GENERATION_FAILED", "system", { force: true, patch: { ai_status: "failed", last_error: msg } });
}

const app = createApp();

const worker: ExportedHandler<Env, Job> = {
  fetch: (req, env, ctx) => app.fetch(req, env, ctx),

  // One cron trigger ("*/5 * * * *") drives everything, so the studio fits the Workers Free plan's
  // per-account cron limit. The hourly and weekday jobs are picked from the scheduled time (UTC).
  async scheduled(controller, env, ctx) {
    const deps = makeDeps(env);
    const t = new Date(controller.scheduledTime);
    const minute = t.getUTCMinutes();
    const every5 = controller.cron === "*/5 * * * *";
    // Hourly safety net at :15: re-check recent website orders in case an event was missed.
    if (controller.cron === "17 * * * *" || (every5 && minute >= 15 && minute < 20)) ctx.waitUntil(env.JOBS.send({ type: "reconcile_orders" }));
    // Weekdays ≈ 13:05 UTC (≈ 9 am US Eastern): discover and research new leads.
    const weekday = t.getUTCDay() >= 1 && t.getUTCDay() <= 5;
    if (controller.cron === "7 13 * * 1-5" || (every5 && weekday && t.getUTCHours() === 13 && minute >= 5 && minute < 10)) ctx.waitUntil(env.JOBS.send({ type: "discover" }));
    if (!every5) return;
    ctx.waitUntil(
      tick(deps, makeTransport(env, deps.db)).then(
        (r) => deps.log.info("tick", r),
        (err) => deps.log.error("tick.failed", { message: err instanceof Error ? err.message : String(err) }),
      ),
    );
  },

  // One job at a time (max_concurrency 1). Failures are retried by the queue, then go to the dead-letter queue.
  async queue(batch, env) {
    const deps = makeDeps(env);
    const studio = makeStudio(env, deps);
    for (const msg of batch.messages) {
      const job = msg.body;
      try {
        if (job.type === "process_lead") await processLead(deps, job.leadId);
        else if (job.type === "discover") await runDiscovery(deps, { manual: job.manual, targetIndex: job.targetIndex });
        else if (job.type === "send_message") await sendQueuedMessage(deps, makeTransport(env, deps.db), job.messageId);
        else if (job.type === "order_event") await syncOrder(studio, job.orderId);
        else if (job.type === "reconcile_orders") await reconcileOrders(studio);
        else if (job.type === "build") {
          const agent = makeAgent(env, deps.config.production);
          if (agent) await runGeneration(studio, agent, job.generationId);
          else await noAgent(studio, job.generationId);
        } else if (job.type === "deploy") await runDeployment(studio, job.deploymentId);
        else if (job.type === "verify_deployment") await verifyLater(studio, job.deploymentId, job.attempt, "deployment");
        else if (job.type === "verify_domain") await verifyLater(studio, job.deploymentId, job.attempt, "domain");
        msg.ack();
      } catch (err) {
        const delay = err instanceof TemporaryError ? err.retryAfterSeconds : 120 * msg.attempts;
        deps.log.warn("job.retry", { type: job.type, attempts: msg.attempts, message: err instanceof Error ? err.message : String(err) });
        msg.retry({ delaySeconds: Math.min(delay, 3600) });
      }
    }
  },
};

export default worker;
