import "server-only";

import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";

import { getPool } from "@/lib/db";
import * as schema from "./schema";

let db: NodePgDatabase<typeof schema> | null = null;

export function getDb(): NodePgDatabase<typeof schema> {
  if (db) return db;
  const pool = getPool();
  if (!pool) {
    throw new Error("DATABASE_URL is not configured");
  }
  db = drizzle(pool, { schema });
  return db;
}

export { schema };
