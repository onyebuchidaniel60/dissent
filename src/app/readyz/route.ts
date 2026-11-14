import { NextResponse } from "next/server";

import { checkDatabase } from "@/lib/db";
import { validateRuntimeConfig } from "@/lib/runtime-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const database = await checkDatabase();
  const config = validateRuntimeConfig();
  const ready = database.ok && config.ok;

  return NextResponse.json(
    {
      status: ready ? "ready" : "not_ready",
      service: "dissent-web",
      checks: {
        database: database.ok
          ? { status: "ok", latency_ms: database.latencyMs }
          : { status: "failed", reason: database.error },
        config: {
          status: config.ok ? "ok" : "failed",
          errors: config.errors,
          network: config.network,
          venue: config.venue,
        },
      },
      time: new Date().toISOString(),
    },
    {
      status: ready ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
