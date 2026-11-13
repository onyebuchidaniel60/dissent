import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import {
  attackerRuns,
  auditEvents,
  audits,
  conditionAssessments,
  failureConditions,
  findingEvidenceLinks,
  findings,
  teeVerifications,
  theses,
} from "@/db/schema";
import { profileFor } from "@/lib/attackers/profiles";
import { buildAttackerMessages, type PromptEvidence } from "@/lib/attackers/prompts";
import {
  validateAttackerOutput,
  validationContextFrom,
  type AttackerOutput,
} from "@/lib/attackers/validate";
import { canonicalJson, sha256Hex } from "@/lib/canonical";
import { captureAuditSnapshot, getAuditEvidence } from "@/lib/evidence/service";
import { MODEL_POLICY } from "@/lib/model-assignments";
import { callAttackerModel, ProviderError } from "@/lib/providers/openai-compatible";

const MAX_ATTEMPTS = 3;

function labelEvidence(evidence: Awaited<ReturnType<typeof getAuditEvidence>>): PromptEvidence[] {
  const used = new Set<string>();
  return evidence.map((item) => {
    let label = "EVID-EXTRA";
    if (item.resourceType === "CONDITION_PREIMAGE") label = "EVID-CONDITIONS";
    else if (item.resourceType === "MARKET_PRICE") label = "EVID-PRICE";
    else if (item.resourceType === "DERIVED_CALCULATION") label = "EVID-DEPEG";
    else if (item.resourceType === "CHAIN_STATS") label = "EVID-NB-STATS";
    else if (item.resourceType === "NETWORK_STATUS") label = "EVID-RPC";
    if (used.has(label)) label = `${label}-${used.size + 1}`;
    used.add(label);
    return {
      label,
      id: item.id,
      source: item.source,
      resourceType: item.resourceType,
      summary:
        typeof item.summary === "string" && item.summary.length > 1800
          ? `${item.summary.slice(0, 1800)}…`
          : item.summary,
      observedAt: item.observedAt,
      freshness: item.freshness,
      limitations: item.limitations,
    };
  });
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await fn(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function dispatchAudit(auditId: string): Promise<{ status: string; runs: number }> {
  const db = getDb();
  const [audit] = await db.select().from(audits).where(eq(audits.id, auditId)).limit(1);
  if (!audit) throw new Error("AUDIT_NOT_FOUND");
  if (audit.status === "ATTACKING" || audit.status === "EVIDENCE_REVIEW" || audit.status === "COMPLETED") {
    return { status: audit.status, runs: 0 };
  }
  if (audit.status !== "FUNDED" && audit.status !== "QUEUED") {
    throw new Error(`AUDIT_NOT_FUNDED:${audit.status}`);
  }

  const conditions = await db
    .select()
    .from(failureConditions)
    .where(eq(failureConditions.auditId, audit.id));
  const [thesis] = await db.select().from(theses).where(eq(theses.auditId, audit.id)).limit(1);
  if (!thesis || conditions.length === 0) throw new Error("AUDIT_INPUT_MISSING");

  let evidence = await getAuditEvidence(audit.id);
  if (evidence.length === 0) {
    await captureAuditSnapshot(audit.id);
    evidence = await getAuditEvidence(audit.id);
  }
  if (evidence.length === 0) throw new Error("EVIDENCE_CAPTURE_FAILED");

  const snapshotAt = new Date().toISOString();
  await db
    .update(audits)
    .set({ status: "ATTACKING", marketSnapshotAt: new Date(snapshotAt), updatedAt: new Date() })
    .where(and(eq(audits.id, audit.id), eq(audits.status, "FUNDED")));

  await db.insert(auditEvents).values({
    auditId: audit.id,
    actorType: "SYSTEM",
    actorId: "orchestrator",
    eventType: "ATTACKS_QUEUED",
    fromStatus: "FUNDED",
    toStatus: "ATTACKING",
    metadataRedacted: {
      attacker_count: 8,
      evidence_count: evidence.length,
      max_parallel: MODEL_POLICY.max_parallel_attackers,
    },
  });

  const existing = await db
    .select()
    .from(attackerRuns)
    .where(eq(attackerRuns.auditId, audit.id));

  let runs = existing;
  if (runs.length === 0) {
    const values = Array.from({ length: 8 }, (_, index) => {
      const attackerId = `A${String(index + 1).padStart(2, "0")}`;
      return {
        auditId: audit.id,
        attackerId,
        runGeneration: 1,
        status: "QUEUED" as const,
        inputSnapshotId: null,
        schemaVersion: "1.0",
      };
    });
    runs = await db.insert(attackerRuns).values(values).returning();
  }

  const labeled = labelEvidence(evidence);
  const conditionForPrompt = conditions.map((condition) => ({
    condition_id: condition.conditionId,
    description: condition.description,
    metric: condition.metric,
    operator: condition.operator,
    threshold: condition.threshold,
    unit: condition.unit,
    evaluation_window: {
      value: condition.evaluationWindowValue ?? 1,
      unit: condition.evaluationWindowUnit ?? "DAY",
    },
    severity: condition.severity,
  }));

  const runnable = runs.filter(
    (run) =>
      run.status === "QUEUED" ||
      run.status === "FAILED" ||
      run.status === "INVALID_OUTPUT" ||
      run.status === "TEE_UNVERIFIED",
  );

  if (runnable.length === 0) {
    return { status: audit.status, runs: 0 };
  }

  const results = await mapLimit(runnable, MODEL_POLICY.max_parallel_attackers, async (run) => {
    const profile = profileFor(run.attackerId);
    const assignment = (await import("@/lib/model-assignments")).MODEL_ASSIGNMENTS.attackers.find(
      (candidate) => candidate.attacker_id === run.attackerId,
    );
    if (!assignment) throw new Error(`ASSIGNMENT_MISSING:${run.attackerId}`);

    const startedAt = new Date().toISOString();
    await db
      .update(attackerRuns)
      .set({ status: "RUNNING", startedAt: new Date(startedAt) })
      .where(eq(attackerRuns.id, run.id));

    const context = validationContextFrom({
      auditId: audit.id,
      runId: run.id,
      attackerId: run.attackerId,
      attackerName: profile.name,
      method: profile.method,
      thesisHash: audit.thesisHash,
      conditionsHash: audit.conditionsHash,
      conditionsVersion: audit.conditionsVersion,
      conditions: conditions.map((condition) => ({
        condition_id: condition.conditionId,
        description: condition.description,
      })),
      evidence: labeled.map((item) => ({ id: item.id, label: item.label })),
      provider: assignment.provider,
      modelId: assignment.model_id,
      startedAt,
      completedAt: new Date().toISOString(),
      marketSnapshotAt: snapshotAt,
    });

    let lastRaw = "";
    let lastErrors: string[] = [];
    let output: AttackerOutput | null = null;
    let lastCall = null as Awaited<ReturnType<typeof callAttackerModel>> | null;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const repairErrors = attempt === 0 ? undefined : lastErrors.slice(0, 10);
      try {
        const call = await callAttackerModel({
          attackerId: run.attackerId,
          messages: buildAttackerMessages({
            profile,
            auditId: audit.id,
            runId: run.id,
            thesisHash: audit.thesisHash,
            conditionsHash: audit.conditionsHash,
            conditionsVersion: audit.conditionsVersion,
            thesis: thesis.canonicalPayload,
            conditions: conditionForPrompt,
            evidence: labeled,
            marketSnapshotAt: snapshotAt,
            provider: assignment.provider,
            modelId: assignment.model_id,
            startedAt,
            repairErrors,
          }),
          temperature: attempt === 0 ? 0.2 : 0,
          maxTokens:
            assignment.provider === "groq"
              ? 3000
              : 8000,
          jsonMode: false,
        });
        lastCall = call;
        lastRaw = call.text;
        const validation = validateAttackerOutput(call.text, context);
        if (validation.ok) {
          output = validation.output;
          break;
        }
        lastErrors = validation.errors;
      } catch (error) {
        lastErrors = [
          error instanceof ProviderError
            ? `${error.code}: ${error.message}`
            : error instanceof Error
              ? error.message
              : "provider failure",
        ];
        if (error instanceof ProviderError && error.code === "AUTH") break;
        if (error instanceof ProviderError && error.code === "RATE_LIMITED") {
          await new Promise((resolve) => setTimeout(resolve, 61_000));
        }
      }
    }

    if (!output) {
      await db
        .update(attackerRuns)
        .set({
          status: "INVALID_OUTPUT",
          rawOutput: lastRaw || null,
          validationReport: { errors: lastErrors, attempts: MAX_ATTEMPTS },
          completedAt: new Date(),
          inputTokens: lastCall?.inputTokens ?? null,
          outputTokens: lastCall?.outputTokens ?? null,
          estimatedCostMicrounits: lastCall ? Math.round(lastCall.estimatedCostUsd * 1_000_000) : null,
        })
        .where(eq(attackerRuns.id, run.id));
      await db.insert(teeVerifications).values({
        attackerRunId: run.id,
        modelId: assignment.model_id,
        result: "WAIVED",
        reason: "TEE_VERIFICATION_DISABLED",
        verifierVersion: "waived-budget-constraint",
      });
      return { runId: run.id, ok: false };
    }

    const completedAt = new Date().toISOString();
    output.audit_id = audit.id;
    output.run_id = run.id;
    output.attacker = {
      attacker_id: run.attackerId,
      attacker_name: profile.name,
      method: profile.method,
      provider: lastCall?.provider ?? assignment.provider,
      model_id: lastCall?.modelId ?? assignment.model_id,
      model_version: lastCall?.publicModelName ?? assignment.model_id,
      execution_environment: "dissent-worker",
    };
    output.evaluation.market_snapshot_at = snapshotAt;
    output.evaluation.completed_at = completedAt;
    output.evaluation.status = "COMPLETED";

    const fingerprint = sha256Hex(
      canonicalJson({
        audit_id: audit.id,
        attacker_id: run.attackerId,
        findings: output.section_b.outside_findings.map((finding) => ({
          title: finding.title,
          claim: finding.claim,
        })),
      }),
    );

    await db.transaction(async (tx) => {
      await tx
        .update(attackerRuns)
        .set({
          status: "COMPLETED",
          rawOutput: lastRaw,
          parsedOutput: output,
          validationReport: { errors: [], attempts: 1 },
          completedAt: new Date(completedAt),
          inputTokens: lastCall?.inputTokens ?? null,
          outputTokens: lastCall?.outputTokens ?? null,
          estimatedCostMicrounits: lastCall ? Math.round(lastCall.estimatedCostUsd * 1_000_000) : null,
        })
        .where(eq(attackerRuns.id, run.id));

      await tx.insert(conditionAssessments).values(
        output.section_a.condition_assessments.map((assessment) => ({
          attackerRunId: run.id,
          conditionId: assessment.condition_id,
          assessmentStatus: assessment.assessment_status,
          status: assessment.status,
          rationale: assessment.rationale,
          confidence: assessment.confidence.toFixed(3),
          invalidTestAnalysis: assessment.invalid_test_analysis,
          evidenceRefs: assessment.evidence_refs,
          limitations: assessment.limitations,
        })),
      );

      for (const finding of output.section_b.outside_findings) {
        const [created] = await tx
          .insert(findings)
          .values({
            auditId: audit.id,
            attackerRunId: run.id,
            findingKey: finding.finding_id,
            section: "B",
            category: finding.category,
            severity: finding.severity,
            claim: finding.claim,
            rationale: `${finding.detailed_rationale}\n\nOutside conditions: ${finding.why_outside_conditions}`,
            noveltyExplanation: finding.why_outside_conditions,
            fingerprint,
            reviewStatus: "SUBMITTED",
          })
          .returning();
        if (created && finding.evidence_refs.length > 0) {
          await tx.insert(findingEvidenceLinks).values(
            finding.evidence_refs.map((evidenceId) => ({
              findingId: created.id,
              evidenceId,
            })),
          );
        }
      }

      await tx.insert(teeVerifications).values({
        attackerRunId: run.id,
        modelId: lastCall?.modelId ?? assignment.model_id,
        result: "WAIVED",
        reason: "TEE_VERIFICATION_DISABLED",
        verifierVersion: "waived-budget-constraint",
      });
    });

    return { runId: run.id, ok: true };
  });

  await db
    .update(audits)
    .set({ status: "EVIDENCE_REVIEW", updatedAt: new Date() })
    .where(eq(audits.id, audit.id));

  await db.insert(auditEvents).values({
    auditId: audit.id,
    actorType: "SYSTEM",
    actorId: "orchestrator",
    eventType: "ATTACKER_SET_SEALED",
    fromStatus: "ATTACKING",
    toStatus: "EVIDENCE_REVIEW",
    metadataRedacted: {
      completed: results.filter((result) => result.ok).length,
      invalid: results.filter((result) => !result.ok).length,
    },
  });

  try {
    const { getQueue } = await import("@/lib/queue");
    await getQueue()?.send("evidence.verify", { auditId: audit.id });
  } catch {
    // The audit remains EVIDENCE_REVIEW and can be recovered by an operator.
  }

  return {
    status: "EVIDENCE_REVIEW",
    runs: results.filter((result) => result.ok).length,
  };
}

export async function auditCostMicros(auditId: string): Promise<number> {
  const [row] = await getDb()
    .select({
      total: sql<number>`coalesce(sum(${attackerRuns.estimatedCostMicrounits}), 0)`,
    })
    .from(attackerRuns)
    .where(eq(attackerRuns.auditId, auditId));
  return Number(row?.total ?? 0);
}
