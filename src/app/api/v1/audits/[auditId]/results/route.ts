import { authenticateApiKey, hasScope } from "@/lib/api-keys";
import { getAuditBundle } from "@/lib/audit-read";
import { apiError, apiSuccess, requestId } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ auditId: string }> },
) {
  const id = requestId(request);
  const principal = await authenticateApiKey(request);
  if (!principal) return apiError("UNAUTHENTICATED", "A valid client API key is required.", 401, undefined, id);
  if (!hasScope(principal, "audit:read:own")) {
    return apiError("FORBIDDEN", "This key does not have audit:read:own.", 403, undefined, id);
  }
  const { auditId } = await params;
  const bundle = await getAuditBundle(principal, auditId);
  if (!bundle) return apiError("NOT_FOUND", "Audit not found.", 404, undefined, id);
  return apiSuccess(bundle, 200, id);
}
