import "server-only";

import { eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { getDb } from "@/db";
import {
  adjudications,
  attackerRuns,
  auditEvents,
  audits,
  bountyAllocations,
  certificates,
  conditionAssessments,
  evidenceRecords,
  failureConditions,
  findingEvidenceLinks,
  findings,
  reputationEvents,
  reviewRecords,
} from "@/db/schema";
import type { AttackerOutput } from "@/lib/attackers/validate";
import { canonicalJson, sha256Hex } from "@/lib/canonical";
import {
  fetchFastNearStatus,
  fetchMarketPrices,
  fetchNearBlocksStats,
} from "@/lib/evidence/adapters";
import { callRegistry, payoutAccountId } from "@/lib/near";
import {
  DIVERGENCE_THRESHOLD,
  POLICY_HASH,
  POLICY_VERSION,
  conditionWeight,
  rawBountyYocto,
} from "@/lib/policy";
import { MODEL_ASSIGNMENTS } from "@/lib/model-assignments";

type EvidenceOutcome =
  | "VERIFIED"
  | "PARTIALLY_VERIFIED"
  | "UNVERIFIABLE"
  | "CONTRADICTED";

type RefetchResult = { result: EvidenceOutcome; reasonCode: string; details: unknown };

async function refetchEvidence(row: typeof evidenceRecords.$inferSelect): Promise<RefetchResult> {
  try {
    if (row.sourceAdapter === "dissent-commitment") {
      const current = await getDb()
        .select({
          conditionId: failureConditions.conditionId,
          description: failureConditions.description,
          metric: failureConditions.metric,
          operator: failureConditions.operator,
          threshold: failureConditions.threshold,
          unit: failureConditions.unit,
          severity: failureConditions.severity,
        })
        .from(failureConditions)
        .where(eq(failureConditions.auditId, row.auditId));
      const normalized = current.map((condition) => ({
        condition_id: condition.conditionId,
        description: condition.description,
        metric: condition.metric,
        operator: condition.operator,
        threshold: condition.threshold,
        unit: condition.unit,
        severity: condition.severity,
      }));
      const same = sha256Hex(canonicalJson(normalized)) === row.payloadHash;
      return same
        ? { result: "VERIFIED", reasonCode: "COMMITTED_PREIMAGE_REPLAYED", details: {} }
        : { result: "CONTRADICTED", reasonCode: "COMMITTED_PREIMAGE_MISMATCH", details: {} };
    }

    if (row.sourceAdapter === "coingecko") {
      const market = await fetchMarketPrices();
      const stored = row.normalizedValue as { near_usd?: number; usdc_usd?: number } | null;
      if (!stored?.near_usd || !stored.usdc_usd) {
        return { result: "UNVERIFIABLE", reasonCode: "MISSING_STORED_OBSERVATION", details: {} };
      }
      const nearDelta = Math.abs(market.nearUsd - stored.near_usd) / stored.near_usd;
      const usdcDelta = Math.abs(market.usdcUsd - stored.usdc_usd) / stored.usdc_usd;
      if (nearDelta <= 0.05 && usdcDelta <= 0.005) {
        return { result: "VERIFIED", reasonCode: "REPLAY_WITHIN_TOLERANCE", details: { nearDelta, usdcDelta } };
      }
      return {
        result: "PARTIALLY_VERIFIED",
        reasonCode: "SOURCE_CHANGED_SINCE_OBSERVATION",
        details: { nearDelta, usdcDelta },
      };
    }

    if (row.sourceAdapter === "dissent-derived") {
      const market = await fetchMarketPrices();
      const currentBps = Math.round(Math.abs(1 - market.usdcUsd) * 10_000);
      const stored = row.normalizedValue as { usdc_depeg_bps?: number } | null;
      const delta = Math.abs(currentBps - (stored?.usdc_depeg_bps ?? 0));
      return delta <= 50
        ? { result: "VERIFIED", reasonCode: "DERIVATION_REPRODUCED", details: { currentBps, delta } }
        : { result: "PARTIALLY_VERIFIED", reasonCode: "DERIVATION_CHANGED", details: { currentBps, delta } };
    }

    if (row.sourceAdapter === "nearblocks") {
      const stats = await fetchNearBlocksStats();
      const stored = row.normalizedValue as { circulatingSupply?: string } | null;
      return stats.circulatingSupply === stored?.circulatingSupply
        ? { result: "VERIFIED", reasonCode: "INDEXER_STAT_REPRODUCED", details: {} }
        : { result: "PARTIALLY_VERIFIED", reasonCode: "INDEXER_STAT_CHANGED", details: {} };
    }

    if (row.sourceAdapter === "fastnear-rpc") {
      const status = await fetchFastNearStatus();
      return status.chainId === "mainnet"
        ? { result: "VERIFIED", reasonCode: "RPC_HEAD_REPLAYED", details: { blockHeight: status.latestBlockHeight } }
        : { result: "CONTRADICTED", reasonCode: "UNEXPECTED_CHAIN_ID", details: { chainId: status.chainId } };
    }

    return { result: "UNVERIFIABLE", reasonCode: "NO_REFETCH_ADAPTER", details: {} };
  } catch {
    return { result: "UNVERIFIABLE", reasonCode: "SOURCE_UNAVAILABLE", details: {} };
  }
}

function worstEvidence(outcomes: EvidenceOutcome[]): EvidenceOutcome {
  if (outcomes.includes("CONTRADICTED")) return "CONTRADICTED";
  if (outcomes.includes("UNVERIFIABLE")) return "UNVERIFIABLE";
  if (outcomes.includes("PARTIALLY_VERIFIED")) return "PARTIALLY_VERIFIED";
  return outcomes.length > 0 ? "VERIFIED" : "UNVERIFIABLE";
}

function reproducibilityFor(outcome: EvidenceOutcome) {
  switch (outcome) {
    case "VERIFIED":
      return "REPRODUCED" as const;
    case "PARTIALLY_VERIFIED":
      return "PARTIALLY_REPRODUCED" as const;
    case "CONTRADICTED":
      return "CONTRADICTED_ON_REPLAY" as const;
    default:
      return "NOT_REPLAYABLE_SOURCE_LIMITATION" as const;
  }
}

function noveltyFor(finding: typeof findings.$inferSelect): {
  result: "NOVEL" | "PARTIAL_NOVELTY" | "RESTATEMENT" | "UNCLEAR";
  reason: string;
} {
  const text = (finding.noveltyExplanation ?? "").trim();
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 6) {
    return { result: "RESTATEMENT", reason: "NOVELTY_EXPLANATION_TOO_WEAK" };
  }
  if (/\b(the thesis (already )?says|as stated|the condition (already )?covers|restates?)\b/i.test(text)) {
    return { result: "RESTATEMENT", reason: "RESTATES_THESIS_OR_CONDITION" };
  }
  if (words.length < 14) {
    return { result: "PARTIAL_NOVELTY", reason: "LIMITED_NOVELTY_EXPLANATION" };
  }
  return { result: "NOVEL", reason: "OUTSIDE_CONDITION_DIMENSION_IDENTIFIED" };
}

function parseOutput(run: typeof attackerRuns.$inferSelect): AttackerOutput | null {
  return (run.parsedOutput as AttackerOutput | null) ?? null;
}

export async function reviewAndAdjudicate(auditId: string): Promise<{
  verdict: "TRADE" | "REFUSE" | "ABSTAIN";
  certificateHash: string;
  anchorStatus: string;
  divergenceIndex: number | null;
}> {
  const db = getDb();
  const [audit] = await db.select().from(audits).where(eq(audits.id, auditId)).limit(1);
  if (!audit) throw new Error("AUDIT_NOT_FOUND");

  const existingCertificate = await db
    .select()
    .from(certificates)
    .where(eq(certificates.auditId, auditId))
    .limit(1);
  if (existingCertificate[0]) {
    return {
      verdict: existingCertificate[0].certificateJson
        ? ((existingCertificate[0].certificateJson as { verdict?: "TRADE" | "REFUSE" | "ABSTAIN" }).verdict ?? "ABSTAIN")
        : "ABSTAIN",
      certificateHash: existingCertificate[0].certificateHash,
      anchorStatus: existingCertificate[0].anchorStatus,
      divergenceIndex: null,
    };
  }

  const runs = await db.select().from(attackerRuns).where(eq(attackerRuns.auditId, auditId));
  const conditions = await db
    .select()
    .from(failureConditions)
    .where(eq(failureConditions.auditId, auditId));
  const assessments = runs.length
    ? await db
        .select()
        .from(conditionAssessments)
        .where(inArray(conditionAssessments.attackerRunId, runs.map((run) => run.id)))
    : [];
  const findingRows = await db.select().from(findings).where(eq(findings.auditId, auditId));
  const evidenceRows = await db.select().from(evidenceRecords).where(eq(evidenceRecords.auditId, auditId));
  const links = findingRows.length
    ? await db
        .select()
        .from(findingEvidenceLinks)
        .where(inArray(findingEvidenceLinks.findingId, findingRows.map((finding) => finding.id)))
    : [];

  const runById = new Map(runs.map((run) => [run.id, run]));
  const assessmentRefs = (assessment: (typeof assessments)[number]): string[] => {
    const stored = (assessment.evidenceRefs as string[]) ?? [];
    if (stored.length > 0) return stored;
    const run = runById.get(assessment.attackerRunId);
    const output = run ? parseOutput(run) : null;
    const parsed = output?.section_a.condition_assessments.find(
      (item) => item.condition_id === assessment.conditionId,
    );
    return parsed?.evidence_refs ?? [];
  };

  const reviewByEvidence = new Map<string, EvidenceOutcome>();
  for (const evidence of evidenceRows) {
    const refetch = await refetchEvidence(evidence);
    reviewByEvidence.set(evidence.id, refetch.result);
    await db.insert(reviewRecords).values({
      auditId,
      subjectType: "EVIDENCE",
      subjectId: evidence.id,
      reviewerType: "EVIDENCE_AUDITOR",
      result: refetch.result,
      reasonCode: refetch.reasonCode,
      details: refetch.details,
      reviewerVersion: "evidence-auditor-v1",
    });
  }

  const evidenceStatusFor = (ids: string[]) =>
    worstEvidence(ids.map((id) => reviewByEvidence.get(id) ?? "UNVERIFIABLE"));

  for (const finding of findingRows) {
    const linked = links
      .filter((link) => link.findingId === finding.id)
      .map((link) => link.evidenceId);
    const evidenceStatus = evidenceStatusFor(linked);
    const novelty = noveltyFor(finding);
    const reproducibility = reproducibilityFor(evidenceStatus);

    let reviewStatus: "ACCEPTED" | "NEEDS_REVIEW" | "REJECTED" = "NEEDS_REVIEW";
    if (evidenceStatus === "CONTRADICTED" || evidenceStatus === "UNVERIFIABLE" || novelty.result === "RESTATEMENT") {
      reviewStatus = "REJECTED";
    } else if (evidenceStatus === "VERIFIED" && novelty.result === "NOVEL") {
      reviewStatus = "ACCEPTED";
    }

    await db
      .update(findings)
      .set({
        evidenceStatus,
        reproducibilityStatus: reproducibility,
        reviewStatus,
      })
      .where(eq(findings.id, finding.id));

    await db.insert(reviewRecords).values({
      auditId,
      subjectType: "FINDING",
      subjectId: finding.id,
      reviewerType: "SYCOPHANCY_AUDITOR",
      result: novelty.result,
      reasonCode: novelty.reason,
      details: { evidenceStatus, reviewStatus },
      reviewerVersion: "sycophancy-auditor-v1",
    });
  }

  for (const assessment of assessments) {
    const refs = assessmentRefs(assessment);
    const evidenceStatus = evidenceStatusFor(refs);
    let reviewStatus = "NEEDS_REVIEW";
    if (assessment.assessmentStatus === "UNVERIFIABLE") {
      reviewStatus = "NEEDS_REVIEW";
    } else if (assessment.status === "INVALID_TEST") {
      reviewStatus = assessment.invalidTestAnalysis ? "ACCEPTED" : "NEEDS_REVIEW";
    } else if (evidenceStatus === "VERIFIED") {
      reviewStatus = "ACCEPTED";
    }
    await db
      .update(conditionAssessments)
      .set({ reviewStatus })
      .where(eq(conditionAssessments.id, assessment.id));
  }

  const reviewedFindingRows = await db.select().from(findings).where(eq(findings.auditId, auditId));

  const getAssessments = (conditionId: string) =>
    assessments.filter((assessment) => assessment.conditionId === conditionId);

  const eligibleStatuses = (conditionId: string) =>
    getAssessments(conditionId)
      .filter((assessment) => assessment.assessmentStatus === "EVALUABLE" && assessment.status !== null)
      .map((assessment) => {
        const refs = assessmentRefs(assessment);
        const status = evidenceStatusFor(refs);
        return { status: assessment.status!, evidenceStatus: status };
      })
      .filter((item) => item.evidenceStatus === "VERIFIED" || item.evidenceStatus === "PARTIALLY_VERIFIED");

  let weightedConflict = 0;
  let weightTotal = 0;
  let criticalDirectConflict = false;
  let divergenceDefined = false;
  const conflictDetails: Array<{ condition_id: string; conflict: number; weight: number }> = [];

  for (const condition of conditions) {
    const statuses = eligibleStatuses(condition.conditionId);
    if (statuses.length < 2) continue;
    divergenceDefined = true;
    const weight = conditionWeight(condition.severity);
    weightTotal += weight;
    const hasHit = statuses.some((item) => item.status === "HIT");
    const hasNotHit = statuses.some((item) => item.status === "NOT_HIT");
    const hasPartial = statuses.some((item) => item.status === "PARTIAL");
    let conflict = 0;
    if (hasHit && hasNotHit) conflict = 1;
    else if ((hasHit || hasNotHit) && hasPartial) conflict = 0.5;
    weightedConflict += weight * conflict;
    if (conflict > 0 && (condition.severity === "CRITICAL" || condition.severity === "HIGH")) {
      if (condition.severity === "CRITICAL" && conflict === 1) criticalDirectConflict = true;
    }
    conflictDetails.push({ condition_id: condition.conditionId, conflict, weight });
  }

  const divergenceIndex = divergenceDefined && weightTotal > 0 ? weightedConflict / weightTotal : null;

  const allEight = runs.filter((run) => run.status === "COMPLETED").length === 8;
  const families = new Set(MODEL_ASSIGNMENTS.attackers.map((attacker) => attacker.model_family));
  const vendors = new Set(MODEL_ASSIGNMENTS.attackers.map((attacker) => attacker.provider));
  const openWeight = MODEL_ASSIGNMENTS.attackers.filter((attacker) => attacker.open_weight).length;
  const diversityPass = families.size >= 3 && vendors.size >= 2 && openWeight >= 1;

  const materialConditions = conditions.filter(
    (condition) => condition.severity === "CRITICAL" || condition.severity === "HIGH",
  );
  const materialFailure = materialConditions.some((condition) => {
    const assessmentsForCondition = getAssessments(condition.conditionId);
    if (assessmentsForCondition.length === 0) return true;
    if (assessmentsForCondition.every((assessment) => assessment.assessmentStatus === "UNVERIFIABLE")) {
      return true;
    }
    return assessmentsForCondition.some(
      (assessment) =>
        assessment.status === "INVALID_TEST" && assessment.reviewStatus === "ACCEPTED",
    );
  });

  const reviewsComplete = reviewedFindingRows.every((finding) => finding.reviewStatus !== "SUBMITTED");
  const sectionBValid = runs.every((run) => {
    const output = parseOutput(run);
    if (!output) return false;
    const findingsForRun = output.section_b.outside_findings;
    if (findingsForRun.length > 0) return true;
    const summary = output.section_b.search_summary;
    return Boolean(
      summary.empty_findings_justification &&
        summary.areas_examined.length > 0 &&
        summary.data_sources_consulted.length > 0 &&
        summary.limitations.length > 0,
    );
  });

  const hasContradictedFinding = reviewedFindingRows.some(
    (finding) => finding.evidenceStatus === "CONTRADICTED",
  );
  const criticalHit = conditions.some(
    (condition) =>
      condition.severity === "CRITICAL" &&
      getAssessments(condition.conditionId).some(
        (assessment) =>
          assessment.status === "HIT" &&
          assessment.reviewStatus === "ACCEPTED" &&
          evidenceStatusFor(assessmentRefs(assessment)) === "VERIFIED",
      ),
  );
  const hasNotHitForCriticalHit = conditions.some((condition) => {
    if (condition.severity !== "CRITICAL") return false;
    const assessmentsForCondition = getAssessments(condition.conditionId);
    return (
      assessmentsForCondition.some((assessment) => assessment.status === "HIT") &&
      assessmentsForCondition.some((assessment) => assessment.status === "NOT_HIT")
    );
  });

  const gates = [
    { gate_id: "coverage.eight_runs", passed: allEight, explanation_code: allEight ? "PASS" : "MISSING_ATTACKER_RUN" },
    {
      gate_id: "diversity.families_vendors_open_weight",
      passed: diversityPass,
      explanation_code: diversityPass ? "PASS" : "DIVERSITY_GATE_FAILED",
    },
    {
      gate_id: "tee.attestation",
      passed: true,
      explanation_code: "WAIVED_BUDGET_CONSTRAINT",
    },
    {
      gate_id: "coverage.material_conditions",
      passed: !materialFailure,
      explanation_code: materialFailure ? "MATERIAL_CONDITION_NOT_EVALUABLE" : "PASS",
    },
    {
      gate_id: "review.findings",
      passed: reviewsComplete,
      explanation_code: reviewsComplete ? "PASS" : "REVIEW_INCOMPLETE",
    },
    {
      gate_id: "section_b.search",
      passed: sectionBValid,
      explanation_code: sectionBValid ? "PASS" : "SECTION_B_INVALID",
    },
    {
      gate_id: "evidence.no_contradiction",
      passed: !hasContradictedFinding,
      explanation_code: hasContradictedFinding ? "CONTRADICTED_EVIDENCE" : "PASS",
    },
    {
      gate_id: "divergence.threshold",
      passed: divergenceIndex !== null && divergenceIndex < DIVERGENCE_THRESHOLD && !criticalDirectConflict,
      explanation_code:
        divergenceIndex === null
          ? "DIVERGENCE_UNDEFINED"
          : criticalDirectConflict
            ? "CRITICAL_DIRECT_CONFLICT"
            : divergenceIndex >= DIVERGENCE_THRESHOLD
              ? "DIVERGENCE_ABOVE_THRESHOLD"
              : "PASS",
    },
  ];

  let verdict: "TRADE" | "REFUSE" | "ABSTAIN";
  if (criticalHit && !hasNotHitForCriticalHit) {
    verdict = "REFUSE";
  } else if (gates.some((gate) => !gate.passed)) {
    verdict = "ABSTAIN";
  } else {
    verdict = "TRADE";
  }

  const certificateId = randomUUID();
  const certificateBody = {
    certificate_version: "1.0",
    certificate_id: certificateId,
    audit_id: audit.id,
    public_audit_id: audit.publicAuditId,
    verdict,
    policy_version: POLICY_VERSION,
    policy_hash: POLICY_HASH,
    thesis_hash: audit.thesisHash,
    conditions_hash: audit.conditionsHash,
    network: "testnet",
    issued_at: new Date().toISOString(),
    tee_waiver: "WAIVED_BUDGET_CONSTRAINT",
    gates,
    divergence: {
      index: divergenceIndex,
      threshold: DIVERGENCE_THRESHOLD,
      critical_direct_conflict: criticalDirectConflict,
      conflicts: conflictDetails,
    },
    coverage: conditions.map((condition) => ({
      condition_id: condition.conditionId,
      severity: condition.severity,
      assessments: getAssessments(condition.conditionId).map((assessment) => ({
        assessment_status: assessment.assessmentStatus,
        status: assessment.status,
        review_status: assessment.reviewStatus,
      })),
    })),
    findings: reviewedFindingRows.map((finding) => ({
      finding_id: finding.id,
      finding_key: finding.findingKey,
      section: finding.section,
      severity: finding.severity,
      evidence_status: finding.evidenceStatus,
      reproducibility_status: finding.reproducibilityStatus,
      review_status: finding.reviewStatus,
      claim: finding.claim,
      rationale: finding.rationale,
    })),
  };

  const certificateHash = sha256Hex(canonicalJson(certificateBody));
  const publicCertificate = {
    certificate_id: certificateId,
    public_audit_id: audit.publicAuditId,
    verdict,
    policy_version: POLICY_VERSION,
    issued_at: certificateBody.issued_at,
    network: "testnet",
    coverage_summary: {
      conditions: conditions.length,
      accepted_findings: reviewedFindingRows.filter((finding) => finding.reviewStatus === "ACCEPTED").length,
      minority_findings: reviewedFindingRows.filter((finding) => finding.reviewStatus !== "ACCEPTED").length,
    },
  };

  await db.transaction(async (tx) => {
    await tx.insert(adjudications).values({
      auditId,
      policyVersion: POLICY_VERSION,
      policyHash: POLICY_HASH,
      verdict,
      divergenceIndex: divergenceIndex === null ? null : divergenceIndex.toFixed(6),
      gateResults: gates,
      decisionTrace: {
        certificate_hash: certificateHash,
        critical_direct_conflict: criticalDirectConflict,
        material_failure: materialFailure,
        waiver: "WAIVED_BUDGET_CONSTRAINT",
      },
    });
    await tx.insert(certificates).values({
      id: certificateId,
      auditId,
      certificateHash,
      canonicalizationVersion: "RFC8785-v1",
      certificateJson: certificateBody,
      publicCertificateJson: publicCertificate,
      anchorStatus: "PENDING",
    });
    await tx
      .update(audits)
      .set({ verdict, status: "CERTIFICATE_PENDING", updatedAt: new Date() })
      .where(eq(audits.id, auditId));
    await tx.insert(auditEvents).values({
      auditId,
      actorType: "SYSTEM",
      actorId: "adjudicator",
      eventType: "ADJUDICATION_COMPLETE",
      toStatus: "CERTIFICATE_PENDING",
      metadataRedacted: { verdict, certificate_hash: certificateHash, divergence_index: divergenceIndex },
    });
  });

  let anchorStatus = "PENDING";
  try {
    const tx = await callRegistry("finalize_certificate", {
      audit_id: auditId,
      certificate_hash: certificateHash,
      verdict,
      policy_hash: POLICY_HASH,
    });
    await db
      .update(certificates)
      .set({ chainTxHash: tx.transactionHash, anchorStatus: "ANCHORED" })
      .where(eq(certificates.auditId, auditId));
    await db
      .update(audits)
      .set({ status: "COMPLETED", completedAt: new Date(), updatedAt: new Date() })
      .where(eq(audits.id, auditId));
    anchorStatus = "ANCHORED";
  } catch {
    await db
      .update(certificates)
      .set({ anchorStatus: "FAILED" })
      .where(eq(certificates.auditId, auditId));
    await db
      .update(audits)
      .set({ status: "CERTIFICATE_PENDING", updatedAt: new Date() })
      .where(eq(audits.id, auditId));
    anchorStatus = "FAILED";
  }

  const accepted = reviewedFindingRows.filter((finding) => finding.reviewStatus === "ACCEPTED");
  let remainingPool = BigInt("80000000000000000000000");
  const allocations: Array<{
    settlement_id: string;
    finding_id: string;
    recipient_id: string;
    amount_yocto: string;
  }> = [];
  for (const finding of accepted) {
    const raw = rawBountyYocto({
      severity: finding.severity,
      reproducibility: finding.reproducibilityStatus ?? "NOT_ATTEMPTED",
      section: "B",
    });
    const perFinding = BigInt("10000000000000000000000");
    const perAttacker = BigInt("20000000000000000000000");
    const amount = raw < perFinding ? raw : perFinding;
    const capped = amount < perAttacker ? amount : perAttacker;
    const finalAmount = capped < remainingPool ? capped : remainingPool;
    if (finalAmount <= 0n) continue;
    remainingPool -= finalAmount;
    const settlementId = randomUUID();
    await db.insert(bountyAllocations).values({
      auditId,
      findingId: finding.id,
      attackerId: runById.get(finding.attackerRunId)?.attackerId ?? "UNKNOWN",
      settlementId,
      recipientAccountId: payoutAccountId(),
      amountYocto: finalAmount.toString(),
      policyVersion: POLICY_VERSION,
      status: "RECORDED",
    });
    allocations.push({
      settlement_id: settlementId,
      finding_id: finding.id,
      recipient_id: payoutAccountId(),
      amount_yocto: finalAmount.toString(),
    });
  }

  if (allocations.length > 0 && anchorStatus === "ANCHORED") {
    try {
      await callRegistry(
        "record_bounty_allocations",
        {
          audit_id: auditId,
          certificate_hash: certificateHash,
          policy_hash: POLICY_HASH,
          allocations,
        },
        { gas: BigInt("150000000000000") },
      );
    } catch {
      // Accounting rows remain recorded; on-chain allocation can be retried by the operator.
    }
  }

  for (const finding of reviewedFindingRows) {
    try {
      await db.insert(reputationEvents).values({
        attackerId: runById.get(finding.attackerRunId)?.attackerId ?? "UNKNOWN",
        auditId,
        findingId: finding.id,
        eventType: finding.reviewStatus === "ACCEPTED" ? "FINDING_ACCEPTED" : "FINDING_REJECTED",
        eventValue: finding.reviewStatus === "ACCEPTED" ? "1" : "0",
        policyVersion: POLICY_VERSION,
      });
    } catch {
      // Unique key makes reputation updates idempotent.
    }
  }

  return { verdict, certificateHash, anchorStatus, divergenceIndex };
}
