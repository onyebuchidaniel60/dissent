import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { auditEvents, feeQuotes } from "@/db/schema";
import { authenticateApiKey, hasScope } from "@/lib/api-keys";
import { getOwnedAudit } from "@/lib/audit-service";
import { canonicalJson, sha256Hex } from "@/lib/canonical";
import { apiError, apiSuccess, requestId } from "@/lib/http";
import { callRegistry, registryAccountId } from "@/lib/near";
import { AUDIT_FEE_YOCTO, POLICY_HASH, QUOTE_EXPIRY_SECONDS } from "@/lib/policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

  const { auditId } = await params;
  const audit = await getOwnedAudit(principal, auditId);
  if (!audit) return apiError("NOT_FOUND", "Audit not found.", 404, undefined, id);
  if (audit.status !== "COMMITTED") {
    return apiError("CONFLICT", "Audit must be committed before a fee quote can be issued.", 409, undefined, id);
  }

  const db = getDb();
  const [open] = await db
    .select()
    .from(feeQuotes)
    .where(and(eq(feeQuotes.auditId, audit.id), eq(feeQuotes.status, "OPEN")))
    .orderBy(desc(feeQuotes.createdAt))
    .limit(1);

  if (open && open.expiresAt > new Date()) {
    return apiSuccess(
      {
        quote_id: open.id,
        quote_hash: open.quoteHash,
        amount_yocto: open.amountYocto,
        expires_at: open.expiresAt.toISOString(),
        network: "testnet",
        contract_id: registryAccountId(),
        bounty_share_bps: 8000,
        reserve_share_bps: 2000,
        policy_hash: POLICY_HASH,
        idempotent: true,
      },
      200,
      id,
    );
  }

  const quoteId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + QUOTE_EXPIRY_SECONDS * 1000);
  const amount = AUDIT_FEE_YOCTO.toString();
  const quoteHash = sha256Hex(
    canonicalJson({
      quote_id: quoteId,
      audit_id: audit.id,
      amount_yocto: amount,
      expires_at: expiresAt.toISOString(),
      contract_id: registryAccountId(),
      policy_hash: POLICY_HASH,
    }),
  );

  try {
    const chain = await callRegistry("issue_quote", {
      audit_id: audit.id,
      quote_id: quoteId,
      amount_yocto: amount,
      quote_hash: quoteHash,
      expires_at_ns: expiresAt.getTime() * 1_000_000,
    });

    await db.insert(feeQuotes).values({
      id: quoteId,
      auditId: audit.id,
      amountYocto: amount,
      quoteHash,
      expiresAt,
      status: "OPEN",
    });

    await db.insert(auditEvents).values({
      auditId: audit.id,
      actorType: "SYSTEM",
      actorId: "quote-service",
      eventType: "FEE_QUOTE_ISSUED",
      metadataRedacted: {
        quote_id: quoteId,
        amount_yocto: amount,
        transaction_hash: chain.transactionHash,
      },
    });

    return apiSuccess(
      {
        quote_id: quoteId,
        quote_hash: quoteHash,
        amount_yocto: amount,
        expires_at: expiresAt.toISOString(),
        network: "testnet",
        contract_id: registryAccountId(),
        bounty_share_bps: 8000,
        reserve_share_bps: 2000,
        policy_hash: POLICY_HASH,
        issuance_transaction_hash: chain.transactionHash,
      },
      201,
      id,
    );
  } catch (error) {
    return apiError(
      "PROVIDER_UNAVAILABLE",
      "Could not issue the on-chain quote.",
      503,
      { reason: error instanceof Error ? error.message : "unknown" },
      id,
    );
  }
}
