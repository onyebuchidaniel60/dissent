import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { auditEvents, audits, feePayments, feeQuotes } from "@/db/schema";
import { authenticateApiKey, hasScope } from "@/lib/api-keys";
import { getOwnedAudit } from "@/lib/audit-service";
import { apiError, apiSuccess, requestId, zodDetails } from "@/lib/http";
import { verifyFundingTransaction } from "@/lib/near";

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
  const principal = await authenticateApiKey(request);
  if (!principal) return apiError("UNAUTHENTICATED", "A valid client API key is required.", 401, undefined, id);
  if (!hasScope(principal, "audit:fund")) {
    return apiError("FORBIDDEN", "This key does not have audit:fund.", 403, undefined, id);
  }

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
  const [existingPayment] = await db
    .select()
    .from(feePayments)
    .where(eq(feePayments.auditId, audit.id))
    .limit(1);

  if (existingPayment) {
    if (existingPayment.txHash === parsed.data.transaction_hash) {
      return apiSuccess(
        {
          status: "FUNDED",
          transaction_hash: existingPayment.txHash,
          amount_yocto: existingPayment.amountYocto,
          idempotent: true,
        },
        200,
        id,
      );
    }
    return apiError("CONFLICT", "This audit already has a different funding transaction.", 409, undefined, id);
  }

  if (audit.status !== "COMMITTED") {
    return apiError("CONFLICT", "Audit is not awaiting funding.", 409, undefined, id);
  }

  const [quote] = await db
    .select()
    .from(feeQuotes)
    .where(and(eq(feeQuotes.auditId, audit.id), eq(feeQuotes.status, "OPEN")))
    .orderBy(desc(feeQuotes.createdAt))
    .limit(1);

  if (!quote || quote.expiresAt <= new Date()) {
    return apiError("FUNDING_REQUIRED", "No unexpired quote is available.", 409, undefined, id);
  }

  try {
    const verified = await verifyFundingTransaction(parsed.data.transaction_hash, {
      auditId: audit.id,
      clientAccountId: audit.clientAccountId,
      quoteId: quote.id,
      quoteHash: quote.quoteHash,
      amountYocto: quote.amountYocto,
    });

    await db.transaction(async (tx) => {
      await tx.insert(feePayments).values({
        auditId: audit.id,
        quoteId: quote.id,
        txHash: parsed.data.transaction_hash,
        amountYocto: quote.amountYocto,
        status: "VERIFIED",
        verifiedAt: new Date(),
      });
      await tx
        .update(feeQuotes)
        .set({ status: "USED" })
        .where(and(eq(feeQuotes.id, quote.id), eq(feeQuotes.status, "OPEN")));
      await tx
        .update(audits)
        .set({ status: "FUNDED", fundedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(audits.id, audit.id), eq(audits.status, "COMMITTED")));
      await tx.insert(auditEvents).values({
        auditId: audit.id,
        actorType: "CLIENT",
        actorId: principal.keyId,
        eventType: "FUNDING_VERIFIED",
        fromStatus: "COMMITTED",
        toStatus: "FUNDED",
        metadataRedacted: {
          transaction_hash: parsed.data.transaction_hash,
          quote_id: quote.id,
          amount_yocto: quote.amountYocto,
          block_height: verified.blockHeight,
        },
      });
    });

    // The orchestrator is enqueued after the funding state is committed. The Phase 4
    // worker claims it; a queue failure is recoverable by the operator.
    try {
      const { getQueue, startQueue } = await import("@/lib/queue");
      await startQueue();
      await getQueue()?.send("audit.dispatch", { auditId: audit.id });
    } catch {
      // State remains FUNDED; the operator recovery path can enqueue dispatch.
    }

    return apiSuccess(
      {
        status: "FUNDED",
        transaction_hash: parsed.data.transaction_hash,
        amount_yocto: quote.amountYocto,
        block_height: verified.blockHeight,
      },
      200,
      id,
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "FUNDING_NOT_FINAL") {
      return apiError("COMMITMENT_NOT_FINAL", "The funding transaction is not final yet.", 409, undefined, id);
    }
    return apiError(
      "FUNDING_REQUIRED",
      "The funding transaction did not match the audit quote.",
      409,
      { reason: code },
      id,
    );
  }
}
