import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { workspaces } from "@/db/schema";
import { prepareAudit } from "@/lib/audit-service";
import {
  checkTidepoolVenue,
  fetchTidepoolLiveQuote,
  proprietaryLoopEnabled,
  type TidepoolQuoteResponse,
} from "@/lib/proprietary/venue";

export type ProprietaryLoopResult =
  | { status: "DISABLED" }
  | { status: "BLOCKED_VENUE"; reason: string }
  | {
      status: "ORIGINATED";
      auditId: string;
      publicAuditId: string;
      quote: TidepoolQuoteResponse;
    };

/**
 * Phase 10 loop guard. A live thesis is only originated after the Ref Finance
 * testnet pool API passes the precheck. The current venue is unreachable, so
 * this returns BLOCKED_VENUE rather than fabricating a market observation.
 */
export async function runProprietaryLoop(): Promise<ProprietaryLoopResult> {
  if (!proprietaryLoopEnabled()) return { status: "DISABLED" };

  const venue = await checkTidepoolVenue();
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

  let quote: TidepoolQuoteResponse;
  try {
    quote = await fetchTidepoolLiveQuote();
  } catch (error) {
    return {
      status: "BLOCKED_VENUE",
      reason: error instanceof Error ? error.message : "TIDEPOOL_QUOTE_FAILED",
    };
  }

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
        asset: {
          chain: "near",
          asset_id: "nep141:wnear.tidepool-sandbox.testnet",
          symbol: "wNEAR",
        },
        action: "SELL",
        direction: "SHORT",
        rationale: `Tidepool testnet quote at ${quote.timestamp}: ${quote.quote.amountInFormatted} wNEAR (${quote.quote.amountInUsd} USD) swaps to ${quote.quote.amountOutFormatted} USDC. The proprietary arm takes a small defensive wNEAR/USDC position and will execute only if the eight-attacker audit returns TRADE. The thesis is invalidated if NEAR spot rises above the committed ceiling or USDC depegs beyond the committed bound.`,
        position: {
          amount: quote.quote.amountInFormatted,
          unit: "wNEAR",
          notional_usd: quote.quote.amountInUsd,
        },
        time_horizon: { value: 1, unit: "DAY" },
        execution_venue: "TIDEPOOL_TESTNET",
      },
      conditions: [
        {
          condition_id: "PROP-001",
          description: "NEAR spot price is above USD 5.00 at the evaluation snapshot",
          metric: "PRICE_USD",
          operator: "GT",
          threshold: "5.00",
          unit: "USD",
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
    quote,
  };
}
