import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";

import { getDb } from "@/db";
import {
  auditEvents,
  audits,
  failureConditions,
  theses,
  type Audit,
} from "@/db/schema";
import type { ApiPrincipal } from "@/lib/api-keys";
import {
  CANONICALIZATION_VERSION,
  computeAuditHashes,
  normalizeCondition,
  normalizeThesis,
} from "@/lib/canonical";
import { POLICY_HASH, POLICY_VERSION } from "@/lib/policy";
import type { PrepareAuditInput } from "@/lib/validation/audit";

export const CONDITIONS_VERSION = "1";

export type PreparedAudit = {
  audit: Audit;
  thesisHash: string;
  conditionsHash: string;
  canonicalizationVersion: string;
  conditionsVersion: string;
  policyVersion: string;
  policyHash: string;
  status: Audit["status"];
  commitment: {
    network: string;
    contractId: string | null;
    method: "commit_audit";
    args: {
      audit_id: string;
      thesis_hash: string;
      conditions_hash: string;
      canonicalization_version: string;
      conditions_version: string;
      policy_hash: string;
    };
  };
  conditionCount: number;
};

function publicAuditId(): string {
  const part = () => randomBytes(2).toString("hex").toUpperCase();
  return `AUD-${part()}-${part()}`;
}

export async function prepareAudit(
  principal: ApiPrincipal,
  input: PrepareAuditInput,
  idempotencyKey: string,
): Promise<PreparedAudit> {
  const normalized = {
    thesis: normalizeThesis(input.thesis),
    conditions: input.conditions.map(normalizeCondition),
  };
  const hashes = computeAuditHashes(normalized);
  const db = getDb();

  const existing = await db
    .select()
    .from(audits)
    .where(
      and(
        eq(audits.workspaceId, principal.workspaceId),
        eq(audits.idempotencyKey, idempotencyKey),
      ),
    )
    .limit(1);

  if (existing[0]) {
    if (existing[0].requestHash !== hashes.requestHash) {
      throw new Error("IDEMPOTENCY_CONFLICT");
    }
    return toPrepared(existing[0], input.conditions.length);
  }

  const audit = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(audits)
      .values({
        publicAuditId: publicAuditId(),
        workspaceId: principal.workspaceId,
        clientAccountId: principal.clientAccountId,
        status: "AWAITING_COMMITMENT",
        idempotencyKey,
        requestHash: hashes.requestHash,
        thesisHash: hashes.thesisHash,
        conditionsHash: hashes.conditionsHash,
        canonicalizationVersion: CANONICALIZATION_VERSION,
        conditionsVersion: CONDITIONS_VERSION,
        policyVersion: POLICY_VERSION,
      })
      .returning();

    if (!created) throw new Error("AUDIT_INSERT_FAILED");

    await tx.insert(theses).values({
      auditId: created.id,
      chain: normalized.thesis.asset.chain,
      assetId: normalized.thesis.asset.asset_id,
      symbol: normalized.thesis.asset.symbol,
      action: normalized.thesis.action,
      direction: normalized.thesis.direction,
      rationale: normalized.thesis.rationale,
      positionAmount: normalized.thesis.position.amount,
      positionUnit: normalized.thesis.position.unit,
      notionalUsd: normalized.thesis.position.notional_usd,
      timeHorizonValue: normalized.thesis.time_horizon.value,
      timeHorizonUnit: normalized.thesis.time_horizon.unit,
      executionVenue: normalized.thesis.execution_venue,
      canonicalPayload: normalized.thesis,
    });

    await tx.insert(failureConditions).values(
      normalized.conditions.map((condition) => ({
        auditId: created.id,
        conditionId: condition.condition_id,
        description: condition.description,
        metric: condition.metric,
        operator: condition.operator,
        threshold: condition.threshold,
        unit: condition.unit,
        evaluationWindowValue: condition.evaluation_window.value,
        evaluationWindowUnit: condition.evaluation_window.unit,
        severity: condition.severity,
        canonicalPayload: condition,
      })),
    );

    await tx.insert(auditEvents).values({
      auditId: created.id,
      actorType: "CLIENT",
      actorId: principal.keyId,
      eventType: "AUDIT_PREPARED",
      toStatus: "AWAITING_COMMITMENT",
      metadataRedacted: {
        canonicalization_version: CANONICALIZATION_VERSION,
        conditions_version: CONDITIONS_VERSION,
        policy_version: POLICY_VERSION,
        condition_count: normalized.conditions.length,
      },
    });

    return created;
  });

  return toPrepared(audit, normalized.conditions.length);
}

function toPrepared(audit: Audit, conditionCount: number): PreparedAudit {
  return {
    audit,
    thesisHash: audit.thesisHash,
    conditionsHash: audit.conditionsHash,
    canonicalizationVersion: audit.canonicalizationVersion,
    conditionsVersion: audit.conditionsVersion,
    policyVersion: audit.policyVersion,
    policyHash: POLICY_HASH,
    status: audit.status,
    commitment: {
      network: "testnet",
      contractId: process.env.NEAR_REGISTRY_ACCOUNT_ID ?? null,
      method: "commit_audit",
      args: {
        audit_id: audit.id,
        thesis_hash: audit.thesisHash,
        conditions_hash: audit.conditionsHash,
        canonicalization_version: audit.canonicalizationVersion,
        conditions_version: audit.conditionsVersion,
        policy_hash: POLICY_HASH,
      },
    },
    conditionCount,
  };
}

export async function listAudits(principal: ApiPrincipal, limit = 20) {
  return getDb()
    .select({
      id: audits.id,
      publicAuditId: audits.publicAuditId,
      status: audits.status,
      verdict: audits.verdict,
      thesisHash: audits.thesisHash,
      conditionsHash: audits.conditionsHash,
      policyVersion: audits.policyVersion,
      createdAt: audits.createdAt,
      committedAt: audits.committedAt,
      fundedAt: audits.fundedAt,
      completedAt: audits.completedAt,
    })
    .from(audits)
    .where(eq(audits.workspaceId, principal.workspaceId))
    .orderBy(desc(audits.createdAt))
    .limit(Math.min(Math.max(limit, 1), 50));
}

export async function listWorkspaceAudits(workspaceId: string, limit = 10) {
  return getDb()
    .select({
      id: audits.id,
      publicAuditId: audits.publicAuditId,
      status: audits.status,
      verdict: audits.verdict,
      createdAt: audits.createdAt,
      updatedAt: audits.updatedAt,
      committedAt: audits.committedAt,
      fundedAt: audits.fundedAt,
      completedAt: audits.completedAt,
      rationale: theses.rationale,
      assetId: theses.assetId,
      symbol: theses.symbol,
      action: theses.action,
      executionVenue: theses.executionVenue,
    })
    .from(audits)
    .leftJoin(theses, eq(theses.auditId, audits.id))
    .where(eq(audits.workspaceId, workspaceId))
    .orderBy(desc(audits.createdAt))
    .limit(Math.min(Math.max(limit, 1), 50));
}

export async function getOwnedAudit(principal: ApiPrincipal, auditId: string) {
  const [audit] = await getDb()
    .select()
    .from(audits)
    .where(and(eq(audits.id, auditId), eq(audits.workspaceId, principal.workspaceId)))
    .limit(1);
  return audit ?? null;
}
