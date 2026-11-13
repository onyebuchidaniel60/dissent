import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { workspaces } from "@/db/schema";
import { prepareAudit } from "@/lib/audit-service";
import { checkRefTestnetVenue, proprietaryLoopEnabled } from "@/lib/proprietary/venue";

export type ProprietaryLoopResult =
  | { status: "DISABLED" }
  | { status: "BLOCKED_VENUE"; reason: string }
  | { status: "ORIGINATED"; auditId: string; publicAuditId: string };

/**
 * Phase 10 loop guard. A live thesis is only originated after the Ref Finance
 * testnet pool API passes the precheck. The current venue is unreachable, so
 * this returns BLOCKED_VENUE rather than fabricating a market observation.
 */
export async function runProprietaryLoop(): Promise<ProprietaryLoopResult> {
  if (!proprietaryLoopEnabled()) return { status: "DISABLED" };

  const venue = await checkRefTestnetVenue();
  if (!venue.available) {
    return { status: "BLOCKED_VENUE", reason: venue.reason ?? "VENUE_UNAVAILABLE" };
  }

  const db = getDb();
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.clientAccountId, process.env.DEMO_CLIENT_ACCOUNT_ID ?? "demo-client.testnet"))
    .limit(1);

  if (!workspace) return { status: "BLOCKED_VENUE", reason: "DEMO_WORKSPACE_MISSING" };

  const prepared = await prepareAudit(
    {
      keyId: "proprietary-loop",
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      clientAccountId: workspace.clientAccountId ?? "demo-client.testnet",
      scopes: ["audit:create", "audit:read:own"],
    },
    {
      thesis: {
        asset: { chain: "near", asset_id: "nep141:wrap.near", symbol: "NEAR" },
        action: "ADD_LIQUIDITY",
        direction: "LONG",
        rationale:
          "Testnet proprietary thesis: NEAR/USDC LP yield remains attractive while executable depth and USDC peg stay within committed bounds.",
        position: { amount: "0.5", unit: "NEAR", notional_usd: null },
        time_horizon: { value: 7, unit: "DAY" },
        execution_venue: "REF_FINANCE_TESTNET",
      },
      conditions: [
        {
          condition_id: "PROP-001",
          description: "NEAR/USDC pool APY falls below the committed yield floor",
          metric: "LP_APY_PCT",
          operator: "LT",
          threshold: "5",
          unit: "PERCENT",
          evaluation_window: { value: 1, unit: "DAY" },
          severity: "CRITICAL",
        },
        {
          condition_id: "PROP-002",
          description: "USDC depeg exceeds 200 basis points on the independent observation",
          metric: "USDC_DEPEG_BPS",
          operator: "GT",
          threshold: "200",
          unit: "BPS",
          evaluation_window: { value: 1, unit: "DAY" },
          severity: "HIGH",
        },
      ],
    },
    `proprietary-${Date.now()}`,
  );

  return {
    status: "ORIGINATED",
    auditId: prepared.audit.id,
    publicAuditId: prepared.audit.publicAuditId,
  };
}
