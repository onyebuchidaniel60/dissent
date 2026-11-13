import { authenticateApiKey, hasScope } from "@/lib/api-keys";
import { getOwnedAudit } from "@/lib/audit-service";
import { apiError, apiSuccess, requestId } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ auditId: string }> },
) {
  const id = requestId(request);
  const principal = await authenticateApiKey(request);
  if (!principal) {
    return apiError("UNAUTHENTICATED", "A valid client API key is required.", 401, undefined, id);
  }
  if (!hasScope(principal, "audit:read:own")) {
    return apiError("FORBIDDEN", "This key does not have audit:read:own.", 403, undefined, id);
  }

  const { auditId } = await params;
  const audit = await getOwnedAudit(principal, auditId);
  if (!audit) {
    return apiError("NOT_FOUND", "Audit not found.", 404, undefined, id);
  }

  return apiSuccess(
    {
      audit: {
        id: audit.id,
        public_audit_id: audit.publicAuditId,
        status: audit.status,
        verdict: audit.verdict,
        thesis_hash: audit.thesisHash,
        conditions_hash: audit.conditionsHash,
        canonicalization_version: audit.canonicalizationVersion,
        conditions_version: audit.conditionsVersion,
        policy_version: audit.policyVersion,
        created_at: audit.createdAt,
        committed_at: audit.committedAt,
        funded_at: audit.fundedAt,
        completed_at: audit.completedAt,
      },
    },
    200,
    id,
  );
}
