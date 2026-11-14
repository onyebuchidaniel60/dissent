import { CLIENT_SCOPES, type ApiPrincipal } from "@/lib/api-keys";
import { prepareAudit } from "@/lib/audit-service";
import { getWalletSession } from "@/lib/auth";
import { apiError, apiSuccess, requestId, zodDetails } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { ensureWorkspaceForAccount } from "@/lib/workspace";
import { prepareAuditSchema } from "@/lib/validation/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const id = requestId(request);
  const session = await getWalletSession();
  if (!session) {
    return apiError("UNAUTHENTICATED", "Connect a NEAR wallet session first.", 401, undefined, id);
  }

  const origin = request.headers.get("origin");
  const expected = process.env.APP_BASE_URL;
  if (origin && expected && origin !== expected) {
    return apiError("FORBIDDEN", "Cross-origin request is not allowed.", 403, undefined, id);
  }

  if (!rateLimit(`ui-prepare:${session.accountId}`, 10, 60_000)) {
    return apiError("RATE_LIMITED", "Too many draft attempts. Try again shortly.", 429, undefined, id);
  }

  const workspace = await ensureWorkspaceForAccount(session.accountId);

  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? "";
  if (!/^[\x20-\x7E]{16,128}$/.test(idempotencyKey)) {
    return apiError("VALIDATION_ERROR", "Idempotency-Key is required.", 400, undefined, id);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Request body must be valid JSON.", 400, undefined, id);
  }
  const parsed = prepareAuditSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "One or more fields are invalid.", 400, zodDetails(parsed.error), id);
  }

  const principal: ApiPrincipal = {
    keyId: `wallet:${session.sessionId}`,
    workspaceId: workspace.workspaceId,
    workspaceName: workspace.workspaceName,
    clientAccountId: workspace.clientAccountId ?? session.accountId,
    scopes: [...CLIENT_SCOPES],
  };

  try {
    const prepared = await prepareAudit(principal, parsed.data, idempotencyKey);
    return apiSuccess(
      {
        audit_id: prepared.audit.id,
        public_audit_id: prepared.audit.publicAuditId,
        client_account_id: prepared.audit.clientAccountId,
        status: prepared.status,
        thesis_hash: prepared.thesisHash,
        conditions_hash: prepared.conditionsHash,
        canonicalization_version: prepared.canonicalizationVersion,
        conditions_version: prepared.conditionsVersion,
        policy_version: prepared.policyVersion,
        policy_hash: prepared.policyHash,
        condition_count: prepared.conditionCount,
        commitment: prepared.commitment,
      },
      201,
      id,
    );
  } catch (error) {
    if (error instanceof Error && error.message === "IDEMPOTENCY_CONFLICT") {
      return apiError("CONFLICT", "This Idempotency-Key was used with a different payload.", 409, undefined, id);
    }
    return apiError("INTERNAL_ERROR", "Could not prepare the audit.", 500, undefined, id);
  }
}
