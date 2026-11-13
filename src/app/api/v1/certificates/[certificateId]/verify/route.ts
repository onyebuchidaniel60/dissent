import { getCertificateView } from "@/lib/certificates";
import { apiError, apiSuccess, requestId } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ certificateId: string }> },
) {
  const id = requestId(request);
  if (!rateLimit(`verify:${clientIp(request)}`, 60, 60_000)) {
    return apiError("RATE_LIMITED", "Too many verification requests.", 429, undefined, id);
  }

  const { certificateId } = await params;
  const view = await getCertificateView(certificateId).catch(() => null);
  if (!view) {
    return apiSuccess(
      {
        status: "NOT_FOUND",
        certificate_id: certificateId,
        message: "No certificate with this identifier is stored.",
      },
      200,
      id,
    );
  }

  const verified =
    view.hashMatches && view.chainHashMatches && view.anchorStatus === "ANCHORED";

  return apiSuccess(
    {
      status: verified ? "VERIFIED" : "MISMATCH",
      certificate_id: view.id,
      audit_id: view.auditId,
      public_certificate: view.publicCertificate,
      execution_readiness:
        (view.publicCertificate as { execution_readiness?: string }).execution_readiness ?? null,
      execution: view.execution,
      stored_hash: view.storedHash,
      recomputed_hash: view.recomputedHash,
      hash_matches: view.hashMatches,
      registry: {
        anchor_status: view.anchorStatus,
        transaction_hash: view.chainTxHash,
        certificate_hash: view.chainRecord?.certificate_hash ?? null,
        verdict: view.chainVerdict,
        policy_hash: view.chainRecord?.policy_hash ?? null,
        finalized_at_block_height: view.chainRecord?.finalized_at_block_height ?? null,
        hash_matches: view.chainHashMatches,
      },
      tee_waiver: "WAIVED_BUDGET_CONSTRAINT",
    },
    200,
    id,
  );
}
