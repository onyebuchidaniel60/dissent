import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { auditEvents, audits, commitments } from "@/db/schema";
import { resolveAuditPrincipal } from "@/lib/audit-principal";
import { getOwnedAudit } from "@/lib/audit-service";
import { apiError, apiSuccess, requestId, zodDetails } from "@/lib/http";
import { verifyCommitmentTransaction } from "@/lib/near";
import { NEAR_NETWORK } from "@/lib/network";
import { POLICY_HASH } from "@/lib/policy";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z
  .object({
    transaction_hash: z
      .string()
      .trim()
      .regex(/^[1-9A-HJ-NP-Za-km-z]{40,64}$/, "Invalid NEAR transaction hash"),
  })
  .strict();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ auditId: string }> },
) {
  const id = requestId(request);
  const resolved = await resolveAuditPrincipal(request, "audit:commit");
  if ("status" in resolved) {
    return apiError(
      resolved.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN",
      resolved.message,
      resolved.status,
      undefined,
      id,
    );
  }
  const { principal } = resolved;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Request body must be valid JSON.", 400, undefined, id);
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "One or more fields are invalid.", 400, zodDetails(parsed.error), id);
  }

  const { auditId } = await params;
  const audit = await getOwnedAudit(principal, auditId);
  if (!audit) return apiError("NOT_FOUND", "Audit not found.", 404, undefined, id);

  const db = getDb();
  const [existing] = await db
    .select()
    .from(commitments)
    .where(eq(commitments.auditId, audit.id))
    .limit(1);

  if (existing) {
    if (existing.transactionHash === parsed.data.transaction_hash) {
      return apiSuccess(
        {
          status: audit.status,
          transaction_hash: existing.transactionHash,
          block_height: existing.blockHeight,
          block_hash: existing.blockHash,
          idempotent: true,
        },
        200,
        id,
      );
    }
    return apiError("CONFLICT", "This audit already has a different commitment transaction.", 409, undefined, id);
  }

  if (audit.status !== "AWAITING_COMMITMENT") {
    return apiError("CONFLICT", "Audit is not awaiting a commitment.", 409, undefined, id);
  }

  try {
    const verified = await verifyCommitmentTransaction(parsed.data.transaction_hash, {
      auditId: audit.id,
      clientAccountId: audit.clientAccountId,
      thesisHash: audit.thesisHash,
      conditionsHash: audit.conditionsHash,
      canonicalizationVersion: audit.canonicalizationVersion,
      conditionsVersion: audit.conditionsVersion,
      policyHash: POLICY_HASH,
    });

    await db.transaction(async (tx) => {
      await tx.insert(commitments).values({
        auditId: audit.id,
        networkId: NEAR_NETWORK,
        contractAccountId: process.env.NEAR_REGISTRY_ACCOUNT_ID ?? "",
        clientAccountId: audit.clientAccountId,
        transactionHash: parsed.data.transaction_hash,
        blockHeight: verified.blockHeight,
        blockHash: verified.blockHash,
        thesisHash: audit.thesisHash,
        conditionsHash: audit.conditionsHash,
        policyHash: POLICY_HASH,
        status: "FINAL",
        committedAt: new Date(),
      });
      await tx
        .update(audits)
        .set({ status: "COMMITTED", committedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(audits.id, audit.id), eq(audits.status, "AWAITING_COMMITMENT")));
      await tx.insert(auditEvents).values({
        auditId: audit.id,
        actorType: "CLIENT",
        actorId: principal.keyId,
        eventType: "COMMITMENT_VERIFIED",
        fromStatus: "AWAITING_COMMITMENT",
        toStatus: "COMMITTED",
        metadataRedacted: {
          transaction_hash: parsed.data.transaction_hash,
          block_height: verified.blockHeight,
        },
      });
    });

    return apiSuccess(
      {
        status: "COMMITTED",
        transaction_hash: parsed.data.transaction_hash,
        block_height: verified.blockHeight,
        block_hash: verified.blockHash,
      },
      200,
      id,
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "COMMITMENT_NOT_FINAL") {
      return apiError("COMMITMENT_NOT_FINAL", "The transaction is not final yet.", 409, undefined, id);
    }
    return apiError(
      "CONFLICT",
      "The commitment transaction did not match this audit.",
      409,
      { reason: code },
      id,
    );
  }
}
