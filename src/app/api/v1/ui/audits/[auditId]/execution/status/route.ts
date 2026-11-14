import { getOwnedAudit } from "@/lib/audit-service";
import { getWalletSession } from "@/lib/auth";
import { apiError, apiSuccess, requestId } from "@/lib/http";
import { fetchExecutionVenueStatus } from "@/lib/proprietary/venue";
import { ensureWorkspaceForAccount } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
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

  const depositAddress = new URL(request.url).searchParams.get("deposit_address")?.trim() ?? "";
  if (!/^[0-9a-f]{64}$/i.test(depositAddress)) {
    return apiError("VALIDATION_ERROR", "A valid deposit address is required.", 400, undefined, id);
  }

  try {
    const status = await fetchExecutionVenueStatus(depositAddress);
    return apiSuccess({ status }, 200, id);
  } catch (error) {
    return apiError(
      "PROVIDER_UNAVAILABLE",
      "Could not read the execution venue status.",
      503,
      { reason: error instanceof Error ? error.message : "STATUS_FAILED" },
      id,
    );
  }
}
