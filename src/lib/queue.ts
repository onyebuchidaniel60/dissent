import "server-only";

import { PgBoss } from "pg-boss";

type QueueState = {
  boss: Promise<PgBoss | null> | null;
  instance: PgBoss | null;
};

const globalForQueue = globalThis as typeof globalThis & {
  __dissentQueue?: QueueState;
};

function state(): QueueState {
  if (!globalForQueue.__dissentQueue) {
    globalForQueue.__dissentQueue = { boss: null, instance: null };
  }
  return globalForQueue.__dissentQueue;
}

/**
 * Starts pg-boss inside the web process. The free Render web service has no
 * separate worker, so all durable work is claimed by this in-process runner.
 * Keep the pool small: the service is limited to 512 MB RAM.
 */
export async function startQueue(): Promise<PgBoss | null> {
  if (process.env.DISABLE_IN_PROCESS_QUEUE === "true") return null;

  const current = state();
  if (current.boss) return current.boss;

  const connectionString = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("[queue] DATABASE_URL not configured; in-process queue disabled");
    return null;
  }

  current.boss = (async () => {
    const boss = new PgBoss({
      connectionString,
      schema: process.env.PG_BOSS_SCHEMA ?? "pgboss",
      max: 2,
      application_name: "dissent-in-process-runner",
      supervise: true,
      migrate: true,
    });

    boss.on("error", (error) => {
      console.error("[queue] pg-boss error", { name: error.name });
    });
    boss.on("warning", (warning) => {
      console.warn("[queue] pg-boss warning", { message: warning.message });
    });

    await boss.start();
    await boss.createQueue("system.heartbeat", {
      retryLimit: 1,
      expireInSeconds: 60,
      deleteAfterSeconds: 3600,
    });
    const queues = [
      "audit.dispatch",
      "attacker.run",
      "evidence.verify",
      "redteam.review",
      "audit.reproduce",
      "audit.adjudicate",
      "certificate.anchor",
      "bounty.settle",
      "proprietary.loop",
    ];
    for (const queue of queues) {
      await boss.createQueue(queue, {
        retryLimit: 1,
        expireInSeconds: 900,
        deleteAfterSeconds: 3600,
      });
    }

    await boss.work("system.heartbeat", { pollingIntervalSeconds: 30 }, async () => {
      return { ok: true };
    });

    await boss.work<{ auditId: string }>(
      "audit.dispatch",
      { pollingIntervalSeconds: 5, batchSize: 1 },
      async (jobs) => {
        for (const job of jobs) {
          const { dispatchAudit } = await import("@/lib/orchestrator");
          await dispatchAudit(job.data.auditId);
        }
        return { ok: true };
      },
    );

    await boss.work<{ auditId: string }>(
      "evidence.verify",
      { pollingIntervalSeconds: 5, batchSize: 1 },
      async (jobs) => {
        for (const job of jobs) {
          const { reviewAndAdjudicate } = await import("@/lib/finalize");
          await reviewAndAdjudicate(job.data.auditId);
        }
        return { ok: true };
      },
    );

    if (process.env.PROPRIETARY_LOOP_ENABLED === "true") {
      await boss.schedule("proprietary.loop", "*/5 * * * *");
      await boss.work("proprietary.loop", { pollingIntervalSeconds: 20, batchSize: 1 }, async () => {
        const { runProprietaryLoop } = await import("@/lib/proprietary/loop");
        return runProprietaryLoop();
      });
    }

    current.instance = boss;
    console.info("[queue] in-process pg-boss started");
    return boss;
  })().catch((error: unknown) => {
    console.error("[queue] failed to start", {
      name: error instanceof Error ? error.name : "unknown",
    });
    current.boss = null;
    return null;
  });

  return current.boss;
}

export async function stopQueue(): Promise<void> {
  const current = state();
  if (!current.instance) return;
  await current.instance.stop({ graceful: true, timeout: 5_000 });
  current.instance = null;
  current.boss = null;
}

export function getQueue(): PgBoss | null {
  return state().instance;
}
