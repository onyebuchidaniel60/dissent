import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { workspaces } from "@/db/schema";
import { prepareAudit } from "@/lib/audit-service";
import { executionVenue } from "@/lib/network";
import {
  checkExecutionVenue,
  fetchExecutionVenueQuote,
  proprietaryLoopEnabled,
  type ExecutionVenueQuoteResponse,
} from "@/lib/proprietary/venue";

export type ProprietaryLoopResult =
  | { status: "DISABLED" }
  | { status: "BLOCKED_VENUE"; reason: string }
  | {
      status: "ORIGINATED";
      auditId: string;
      publicAuditId: string;
      quote: ExecutionVenueQuoteResponse;
    };

/**
 * Proprietary loop guard. A live thesis is only originated after the configured
 * execution venue passes the precheck. If the venue or quote accounts are
 * unavailable, return BLOCKED_VENUE rather than fabricating a market observation.
 */
export async function runProprietaryLoop(): Promise<ProprietaryLoopResult> {
  if (!proprietaryLoopEnabled()) return { status: "DISABLED" };

  const venue = await checkExecutionVenue();
  if (!venue.available) {
    return { status: "BLOCKED_VENUE", reason: venue.reason ?? "VENUE_UNAVAILABLE" };
  }

  const db = getDb();
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(
      eq(
        workspaces.clientAccountId,
        process.env.PROPRIETARY_CLIENT_ACCOUNT_ID?.trim() ??
          process.env.DEMO_CLIENT_ACCOUNT_ID?.trim() ??
          "",
      ),
    )
    .limit(1);

  if (!workspace) return { status: "BLOCKED_VENUE", reason: "CLIENT_WORKSPACE_MISSING" };

  const clientAccountId =
    workspace.clientAccountId ??
    process.env.PROPRIETARY_CLIENT_ACCOUNT_ID?.trim() ??
    process.env.DEMO_CLIENT_ACCOUNT_ID?.trim() ??
    "";
  if (!clientAccountId) {
    return { status: "BLOCKED_VENUE", reason: "CLIENT_ACCOUNT_NOT_CONFIGURED" };
  }

  let quote: ExecutionVenueQuoteResponse;
  try {
    quote = await fetchExecutionVenueQuote();
  } catch (error) {
    return {
      status: "BLOCKED_VENUE",
      reason: error instanceof Error ? error.message : "VENUE_QUOTE_FAILED",
    };
  }

  const prepared = await prepareAudit(
    {
      keyId: "proprietary-loop",
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      clientAccountId,
      scopes: ["audit:create", "audit:read:own"],
    },
    {
      thesis: {
        asset: {
          chain: "near",
          asset_id:
            executionVenue() === "TIDEPOOL"
              ? "nep141:wnear.tidepool-sandbox.testnet"
              : process.env.ONECLICK_ORIGIN_ASSET ?? "nep141:wrap.near",
          symbol: "wNEAR",
        },
        action: "SELL",
        direction: "SHORT",
        rationale: `${executionVenue() === "TIDEPOOL" ? "Tidepool staging" : "1Click mainnet"} quote at ${quote.timestamp}: ${quote.quote.amountInFormatted} wNEAR (${quote.quote.amountInUsd} USD) swaps to ${quote.quote.amountOutFormatted} USDC. The proprietary arm takes a small defensive wNEAR/USDC position and will execute only if the eight-attacker audit returns TRADE. The thesis is invalidated if NEAR spot rises above the committed ceiling or USDC depegs beyond the committed bound.`,
        position: {
          amount: quote.quote.amountInFormatted,
          unit: "wNEAR",
          notional_usd: quote.quote.amountInUsd,
        },
        time_horizon: { value: 1, unit: "DAY" },
        execution_venue: executionVenue(),
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
