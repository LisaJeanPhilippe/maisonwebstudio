import { createApp, makeDeps, makeTransport } from "./app";
import type { Env, Job } from "./env";
import { processLead, runDiscovery } from "./pipeline";
import { sendQueuedMessage, tick } from "./sending";
import { TemporaryError } from "./email/transport";

const app = createApp();

const worker: ExportedHandler<Env, Job> = {
  fetch: (req, env, ctx) => app.fetch(req, env, ctx),

  async scheduled(controller, env, ctx) {
    const deps = makeDeps(env);
    if (controller.cron === "7 13 * * 1-5") {
      ctx.waitUntil(env.JOBS.send({ type: "discover" }));
      return;
    }
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
    for (const msg of batch.messages) {
      const job = msg.body;
      try {
        if (job.type === "process_lead") await processLead(deps, job.leadId);
        else if (job.type === "discover") await runDiscovery(deps, { manual: job.manual, targetIndex: job.targetIndex });
        else if (job.type === "send_message") await sendQueuedMessage(deps, makeTransport(env, deps.db), job.messageId);
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
