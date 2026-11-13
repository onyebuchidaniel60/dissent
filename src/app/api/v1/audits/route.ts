import { authenticateApiKey, hasScope } from "@/lib/api-keys";
import { listAudits } from "@/lib/audit-service";
import { apiError, apiSuccess, requestId } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const id = requestId(request);
  const principal = await authenticateApiKey(request);
  if (!principal) {
    return apiError("UNAUTHENTICATED", "A valid client API key is required.", 401, undefined, id);
  }
  if (!hasScope(principal, "audit:read:own")) {
    return apiError("FORBIDDEN", "This key does not have audit:read:own.", 403, undefined, id);
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const audits = await listAudits(principal, Number.isFinite(limit) ? limit : 20);

  return apiSuccess({ audits }, 200, id);
}
