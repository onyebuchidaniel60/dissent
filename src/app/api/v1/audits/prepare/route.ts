import { authenticateApiKey, hasScope } from "@/lib/api-keys";
import { prepareAudit } from "@/lib/audit-service";
import { apiError, apiSuccess, requestId, zodDetails } from "@/lib/http";
import { prepareAuditSchema } from "@/lib/validation/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const id = requestId(request);
  const principal = await authenticateApiKey(request);
  if (!principal) {
    return apiError("UNAUTHENTICATED", "A valid client API key is required.", 401, undefined, id);
  }
  if (!hasScope(principal, "audit:create")) {
    return apiError("FORBIDDEN", "This key does not have audit:create.", 403, undefined, id);
  }

  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > 128 * 1024) {
    return apiError("VALIDATION_ERROR", "Request body is too large.", 400, undefined, id);
  }

  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? "";
  if (!/^[\x20-\x7E]{16,128}$/.test(idempotencyKey)) {
    return apiError(
      "VALIDATION_ERROR",
      "Idempotency-Key is required (16–128 printable characters).",
      400,
      undefined,
      id,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Request body must be valid JSON.", 400, undefined, id);
  }

  const parsed = prepareAuditSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "One or more fields are invalid.",
      400,
      zodDetails(parsed.error),
      id,
    );
  }

  try {
    const prepared = await prepareAudit(principal, parsed.data, idempotencyKey);
    return apiSuccess(
      {
        audit_id: prepared.audit.id,
        public_audit_id: prepared.audit.publicAuditId,
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
      return apiError(
        "CONFLICT",
        "This Idempotency-Key was already used with a different payload.",
        409,
        undefined,
        id,
      );
    }
    return apiError("INTERNAL_ERROR", "Could not prepare the audit.", 500, undefined, id);
  }
}
