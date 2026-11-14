import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { theses } from "@/db/schema";
import { getOwnedAudit } from "@/lib/audit-service";
import { getWalletSession } from "@/lib/auth";
import {
  fetchClientExecutionQuote,
  resolveClientExecutionPlan,
} from "@/lib/client-execution";
import { apiError, apiSuccess, requestId } from "@/lib/http";
import { ensureWorkspaceForAccount } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ auditId: string }> },
): Promise<Response> {
  const id = requestId(request);
  const session = await getWalletSession();
  if (!session) {
    return apiError("UNAUTHENTICATED", "Connect a NEAR wallet session first.", 401, undefined, id);
  }

  const workspace = await ensureWorkspaceForAccount(session.accountId);
  const { auditId } = await params;
  const audit = await getOwnedAudit(
    {
      keyId: `wallet:${session.sessionId}`,
      workspaceId: workspace.workspaceId,
      workspaceName: workspace.workspaceName,
      clientAccountId: workspace.clientAccountId ?? session.accountId,
      scopes: ["audit:read:own"],
    },
    auditId,
  );
  if (!audit) return apiError("NOT_FOUND", "Audit not found.", 404, undefined, id);

  if (audit.status !== "COMPLETED" || audit.verdict !== "TRADE") {
    return apiError(
      "CONFLICT",
      "Client execution is available only for a completed TRADE audit.",
      409,
      undefined,
      id,
    );
  }

  const [thesis] = await getDb()
    .select()
    .from(theses)
    .where(eq(theses.auditId, audit.id))
    .limit(1);
  if (!thesis) return apiError("NOT_FOUND", "Thesis not found.", 404, undefined, id);

  let plan;
  try {
    plan = resolveClientExecutionPlan({
      action: thesis.action,
      position: { amount: thesis.positionAmount, unit: thesis.positionUnit },
      assetId: thesis.assetId,
      symbol: thesis.symbol,
    });
  } catch (error) {
    return apiError(
      "UNSUPPORTED_EXECUTION",
      "This thesis is not a supported wNEAR/USDC swap for client execution.",
      400,
      { reason: error instanceof Error ? error.message : "UNSUPPORTED" },
      id,
    );
  }

  try {
    const quote = await fetchClientExecutionQuote({
      plan,
      clientAccountId: session.accountId,
    });
    const transferMemo = quote.quote.depositMemo ?? `Dissent ${audit.publicAuditId}`;

    return apiSuccess(
      {
        venue: plan.venue,
        client_account_id: session.accountId,
        quote: {
          deposit_address: quote.quote.depositAddress,
          deposit_memo: transferMemo,
          amount_in: quote.quote.amountIn,
          amount_in_formatted: quote.quote.amountInFormatted,
          amount_out: quote.quote.amountOut,
          amount_out_formatted: quote.quote.amountOutFormatted,
          min_amount_out: quote.quote.minAmountOut,
          deadline: quote.quote.deadline,
          time_when_inactive: quote.quote.timeWhenInactive,
        },
        pay: { symbol: plan.paySymbol, amount_yocto: plan.amountYocto },
        receive: { symbol: plan.receiveSymbol, amount_formatted: quote.quote.amountOutFormatted },
        transfer: {
          token_id: plan.tokenId,
          storage_deposit_yocto: plan.storageDepositYocto,
          memo: transferMemo,
        },
        copy:
          plan.venue === "ONECLICK"
            ? "Dissent audits the thesis. You execute the trade with your own funds via 1Click."
            : "Dissent audits the thesis. This Testnet preview executes with your own wallet via Tidepool staging; 1Click is the Mainnet path.",
      },
      200,
      id,
    );
  } catch (error) {
    return apiError(
      "PROVIDER_UNAVAILABLE",
      "Could not obtain a client execution quote. Try again shortly.",
      503,
      { reason: error instanceof Error ? error.message : "QUOTE_FAILED" },
      id,
    );
  }
}
