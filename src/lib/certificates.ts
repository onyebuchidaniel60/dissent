import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { certificates } from "@/db/schema";
import { canonicalJson, sha256Hex } from "@/lib/canonical";
import { viewRegistry } from "@/lib/near";

export type CertificateView = {
  id: string;
  auditId: string;
  storedHash: string;
  recomputedHash: string;
  hashMatches: boolean;
  anchorStatus: string;
  chainTxHash: string | null;
  publicCertificate: Record<string, unknown>;
  execution: Record<string, unknown> | null;
  chainRecord: {
    certificate_hash?: string;
    verdict?: string;
    policy_hash?: string;
    finalized_at_block_height?: number;
    finalized_at_timestamp_ns?: number;
  } | null;
  chainHashMatches: boolean;
  chainVerdict: string | null;
};

export async function getCertificateView(certificateId: string): Promise<CertificateView | null> {
  const [row] = await getDb()
    .select()
    .from(certificates)
    .where(eq(certificates.id, certificateId))
    .limit(1);
  if (!row) return null;

  const recomputedHash = sha256Hex(canonicalJson(row.certificateJson));
  let chainRecord: CertificateView["chainRecord"] = null;
  try {
    chainRecord = await viewRegistry<NonNullable<CertificateView["chainRecord"]>>(
      "get_certificate",
      { audit_id: row.auditId },
    );
  } catch {
    chainRecord = null;
  }

  const body = row.certificateJson as {
    verdict?: string;
    execution?: Record<string, unknown> | null;
  };
  return {
    id: row.id,
    auditId: row.auditId,
    storedHash: row.certificateHash,
    recomputedHash,
    hashMatches: recomputedHash === row.certificateHash,
    anchorStatus: row.anchorStatus,
    chainTxHash: row.chainTxHash,
    publicCertificate: row.publicCertificateJson as Record<string, unknown>,
    execution: body.execution ?? null,
    chainRecord,
    chainHashMatches: chainRecord?.certificate_hash === row.certificateHash,
    chainVerdict: chainRecord?.verdict ?? body.verdict ?? null,
  };
}
