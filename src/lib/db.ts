import "server-only";

import { Pool, type PoolConfig } from "pg";

type DatabaseState = {
  pool: Pool | null;
};

const globalForDatabase = globalThis as typeof globalThis & {
  __dissentDatabase?: DatabaseState;
};

function buildPoolConfig(connectionString: string): PoolConfig {
  return {
    connectionString,
    max: 3,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 5_000,
    application_name: "dissent-web",
  };
}

export function getPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  if (!globalForDatabase.__dissentDatabase) {
    globalForDatabase.__dissentDatabase = { pool: null };
  }

  if (!globalForDatabase.__dissentDatabase.pool) {
    const pool = new Pool(buildPoolConfig(connectionString));
    pool.on("error", () => {
      // Pool-level errors are surfaced through readiness checks. Never log the URL.
    });
    globalForDatabase.__dissentDatabase.pool = pool;
  }

  return globalForDatabase.__dissentDatabase.pool;
}

export async function checkDatabase(): Promise<{
  ok: boolean;
  latencyMs: number;
  error?: "not_configured" | "connection_failed";
}> {
  const pool = getPool();
  if (!pool) return { ok: false, latencyMs: 0, error: "not_configured" };

  const startedAt = Date.now();
  try {
    await pool.query("select 1 as ok");
    return { ok: true, latencyMs: Date.now() - startedAt };
  } catch {
    return { ok: false, latencyMs: Date.now() - startedAt, error: "connection_failed" };
  }
}

export async function closeDatabase(): Promise<void> {
  const pool = globalForDatabase.__dissentDatabase?.pool;
  if (!pool) return;
  globalForDatabase.__dissentDatabase = { pool: null };
  await pool.end();
}
