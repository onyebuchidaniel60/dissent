import { NextResponse } from "next/server";

import { checkDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const database = await checkDatabase();
  const ready = database.ok;

  return NextResponse.json(
    {
      status: ready ? "ready" : "not_ready",
      service: "dissent-web",
      checks: {
        database: database.ok
          ? { status: "ok", latency_ms: database.latencyMs }
          : { status: "failed", reason: database.error },
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
