import "server-only";

import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/db";
import {
  adjudications,
  attackerRuns,
  auditEvents,
  audits,
  certificates,
  conditionAssessments,
  evidenceRecords,
  failureConditions,
  findingEvidenceLinks,
  findings,
  theses,
} from "@/db/schema";
import type { ApiPrincipal } from "@/lib/api-keys";
import { getOwnedAudit } from "@/lib/audit-service";

export async function getAuditBundle(principal: ApiPrincipal, auditId: string) {
  const audit = await getOwnedAudit(principal, auditId);
  if (!audit) return null;

  const db = getDb();
  const [thesis] = await db.select().from(theses).where(eq(theses.auditId, audit.id)).limit(1);
  const conditions = await db
    .select()
    .from(failureConditions)
    .where(eq(failureConditions.auditId, audit.id))
    .orderBy(asc(failureConditions.conditionId));
  const runs = await db
    .select({
      id: attackerRuns.id,
      attackerId: attackerRuns.attackerId,
      runGeneration: attackerRuns.runGeneration,
      status: attackerRuns.status,
      startedAt: attackerRuns.startedAt,
      completedAt: attackerRuns.completedAt,
      inputTokens: attackerRuns.inputTokens,
      outputTokens: attackerRuns.outputTokens,
      estimatedCostMicrounits: attackerRuns.estimatedCostMicrounits,
    })
    .from(attackerRuns)
    .where(eq(attackerRuns.auditId, audit.id))
    .orderBy(asc(attackerRuns.attackerId));

  const runIds = runs.map((run) => run.id);
  const assessments = runIds.length
    ? await db
        .select()
        .from(conditionAssessments)
        .where(inArray(conditionAssessments.attackerRunId, runIds))
    : [];
  const findingRows = await db
    .select()
    .from(findings)
    .where(eq(findings.auditId, audit.id))
    .orderBy(asc(findings.createdAt));
  const evidenceRows = await db
    .select({
      id: evidenceRecords.id,
      sourceAdapter: evidenceRecords.sourceAdapter,
      resourceType: evidenceRecords.resourceType,
      observationAt: evidenceRecords.observationAt,
      freshnessStatus: evidenceRecords.freshnessStatus,
      payloadHash: evidenceRecords.payloadHash,
      limitations: evidenceRecords.limitations,
    })
    .from(evidenceRecords)
    .where(eq(evidenceRecords.auditId, audit.id));
  const links = findingRows.length
    ? await db
        .select()
        .from(findingEvidenceLinks)
        .where(inArray(findingEvidenceLinks.findingId, findingRows.map((finding) => finding.id)))
    : [];
  const [adjudication] = await db
    .select()
    .from(adjudications)
    .where(eq(adjudications.auditId, audit.id))
    .limit(1);
  const [certificate] = await db
    .select({
      id: certificates.id,
      certificateHash: certificates.certificateHash,
      anchorStatus: certificates.anchorStatus,
      chainTxHash: certificates.chainTxHash,
      publicCertificateJson: certificates.publicCertificateJson,
    })
    .from(certificates)
    .where(eq(certificates.auditId, audit.id))
    .limit(1);

  return {
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
      market_snapshot_at: audit.marketSnapshotAt,
      committed_at: audit.committedAt,
      funded_at: audit.fundedAt,
      completed_at: audit.completedAt,
      created_at: audit.createdAt,
    },
    thesis: thesis
      ? {
          asset: { chain: thesis.chain, asset_id: thesis.assetId, symbol: thesis.symbol },
          action: thesis.action,
          direction: thesis.direction,
          rationale: thesis.rationale,
          position: {
            amount: thesis.positionAmount,
            unit: thesis.positionUnit,
            notional_usd: thesis.notionalUsd,
          },
          time_horizon: { value: thesis.timeHorizonValue, unit: thesis.timeHorizonUnit },
          execution_venue: thesis.executionVenue,
        }
      : null,
    conditions: conditions.map((condition) => ({
      condition_id: condition.conditionId,
      description: condition.description,
      metric: condition.metric,
      operator: condition.operator,
      threshold: condition.threshold,
      unit: condition.unit,
      severity: condition.severity,
    })),
    runs,
    condition_assessments: assessments.map((assessment) => ({
      attacker_run_id: assessment.attackerRunId,
      condition_id: assessment.conditionId,
      assessment_status: assessment.assessmentStatus,
      status: assessment.status,
      rationale: assessment.rationale,
      limitations: assessment.limitations,
      review_status: assessment.reviewStatus,
    })),
    findings: findingRows.map((finding) => ({
      id: finding.id,
      attacker_run_id: finding.attackerRunId,
      finding_key: finding.findingKey,
      section: finding.section,
      category: finding.category,
      severity: finding.severity,
      claim: finding.claim,
      rationale: finding.rationale,
      novelty_explanation: finding.noveltyExplanation,
      review_status: finding.reviewStatus,
      evidence_status: finding.evidenceStatus,
      reproducibility_status: finding.reproducibilityStatus,
      evidence_ids: links.filter((link) => link.findingId === finding.id).map((link) => link.evidenceId),
    })),
    evidence: evidenceRows,
    adjudication: adjudication
      ? {
          verdict: adjudication.verdict,
          policy_version: adjudication.policyVersion,
          policy_hash: adjudication.policyHash,
          divergence_index: adjudication.divergenceIndex,
          gate_results: adjudication.gateResults,
          decision_trace: adjudication.decisionTrace,
          created_at: adjudication.createdAt,
        }
      : null,
    certificate: certificate
      ? {
          id: certificate.id,
          certificate_hash: certificate.certificateHash,
          anchor_status: certificate.anchorStatus,
          chain_tx_hash: certificate.chainTxHash,
          public_certificate: certificate.publicCertificateJson,
        }
      : null,
  };
}

export async function getAdminAudit(auditId: string) {
  const db = getDb();
  const [audit] = await db.select().from(audits).where(eq(audits.id, auditId)).limit(1);
  if (!audit) return null;
  const runs = await db
    .select({
      id: attackerRuns.id,
      attackerId: attackerRuns.attackerId,
      runGeneration: attackerRuns.runGeneration,
      status: attackerRuns.status,
      startedAt: attackerRuns.startedAt,
      completedAt: attackerRuns.completedAt,
      inputTokens: attackerRuns.inputTokens,
      outputTokens: attackerRuns.outputTokens,
      estimatedCostMicrounits: attackerRuns.estimatedCostMicrounits,
    })
    .from(attackerRuns)
    .where(eq(attackerRuns.auditId, auditId))
    .orderBy(asc(attackerRuns.attackerId));
  const [certificate] = await db
    .select({
      id: certificates.id,
      certificateHash: certificates.certificateHash,
      anchorStatus: certificates.anchorStatus,
      chainTxHash: certificates.chainTxHash,
    })
    .from(certificates)
    .where(eq(certificates.auditId, auditId))
    .limit(1);
  const [adjudication] = await db
    .select({
      verdict: adjudications.verdict,
      divergenceIndex: adjudications.divergenceIndex,
      gateResults: adjudications.gateResults,
    })
    .from(adjudications)
    .where(eq(adjudications.auditId, auditId))
    .limit(1);
  return { audit, runs, certificate, adjudication };
}

export async function getAdminRecentAudits(limit = 5) {
  return getDb()
    .select({
      id: audits.id,
      publicAuditId: audits.publicAuditId,
      status: audits.status,
      verdict: audits.verdict,
      createdAt: audits.createdAt,
      completedAt: audits.completedAt,
    })
    .from(audits)
    .orderBy(desc(audits.createdAt))
    .limit(limit);
}

export async function getAuditEvents(principal: ApiPrincipal, auditId: string) {
  const audit = await getOwnedAudit(principal, auditId);
  if (!audit) return null;
  return getDb()
    .select()
    .from(auditEvents)
    .where(and(eq(auditEvents.auditId, audit.id)))
    .orderBy(asc(auditEvents.createdAt))
    .limit(200);
}
