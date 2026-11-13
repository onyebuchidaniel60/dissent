import Ajv2020, { type ErrorObject } from "ajv/dist/2020";
import addFormats from "ajv-formats";

import schema from "../../../schemas/attacker-output-v1.schema.json";

export type ConditionAssessment = {
  condition_id: string;
  condition_text: string;
  assessment_status: "EVALUABLE" | "UNVERIFIABLE";
  status: "HIT" | "PARTIAL" | "NOT_HIT" | "INVALID_TEST" | null;
  observed_value: {
    value: number | string | boolean | null;
    unit: string | null;
    observed_at: string | null;
  } | null;
  threshold: { operator: string | null; value: number | string | boolean | null; unit: string | null } | null;
  rationale: string;
  evidence_refs: string[];
  confidence: number;
  invalid_test_analysis: {
    classification: string;
    explanation: string;
    failure_reason: string;
    proposed_repair: string | null;
    evidence_refs: string[];
  } | null;
  limitations: string[];
};

export type OutsideFinding = {
  finding_id: string;
  title: string;
  category: string;
  severity: string;
  confidence: number;
  claim: string;
  detailed_rationale: string;
  why_outside_conditions: string;
  related_condition_ids: string[];
  falsification_test: {
    test_description: string;
    expected_observation: string;
    failure_criteria: string;
  };
  evidence_refs: string[];
  recommended_action: string;
  limitations: string[];
};

export type AttackerOutput = {
  schema_version: string;
  audit_id: string;
  run_id: string;
  attacker: {
    attacker_id: string;
    attacker_name: string;
    method: string;
    provider: string;
    model_id: string;
    model_version: string;
    execution_environment: string;
  };
  input_commitment: { thesis_hash: string; conditions_hash: string; conditions_version: string };
  evaluation: {
    started_at: string;
    completed_at: string;
    market_snapshot_at: string | null;
    status: "COMPLETED" | "PARTIAL" | "FAILED";
  };
  section_a: { condition_assessments: ConditionAssessment[] };
  section_b: {
    outside_findings: OutsideFinding[];
    search_summary: {
      areas_examined: string[];
      data_sources_consulted: string[];
      limitations: string[];
      empty_findings_justification: string | null;
    };
  };
  attacker_summary: {
    overall_risk_level: string;
    overall_assessment: string;
    recommended_action: string;
  };
};

export type ValidationContext = {
  auditId: string;
  runId: string;
  attackerId: string;
  attackerName: string;
  method: string;
  thesisHash: string;
  conditionsHash: string;
  conditionsVersion: string;
  conditions: Array<{ condition_id: string; description: string }>;
  evidenceLabelToId: Record<string, string>;
  provider: string;
  modelId: string;
  startedAt: string;
  completedAt: string;
  marketSnapshotAt: string;
};

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validateSchema = ajv.compile(schema);

function parseModelJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("MODEL_JSON_NOT_FOUND");
  return JSON.parse(trimmed.slice(start, end + 1)) as unknown;
}

function schemaErrors(errors: ErrorObject[] | null | undefined): string[] {
  return (errors ?? []).map((error) => {
    const path = error.instancePath || "/";
    return `${path}: ${error.message ?? error.keyword}`;
  });
}

function resolveEvidence(
  refs: string[],
  context: ValidationContext,
  errors: string[],
  path: string,
): string[] {
  const resolved: string[] = [];
  for (const ref of refs) {
    const mapped = context.evidenceLabelToId[ref] ?? ref;
    if (!Object.values(context.evidenceLabelToId).includes(mapped)) {
      errors.push(`${path}: evidence ref ${ref} does not belong to this audit`);
      continue;
    }
    resolved.push(mapped);
  }
  return resolved;
}

export function validateAttackerOutput(
  rawText: string,
  context: ValidationContext,
): { ok: true; output: AttackerOutput } | { ok: false; errors: string[] } {
  let parsed: unknown;
  try {
    parsed = parseModelJson(rawText);
  } catch (error) {
    return { ok: false, errors: [error instanceof Error ? error.message : "MODEL_JSON_INVALID"] };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, errors: ["MODEL_JSON_NOT_OBJECT"] };
  }

  // Provenance and commitment fields are server-owned. Overwrite model-supplied claims before
  // schema validation; the model cannot make a run look different from the actual invocation.
  const candidate = parsed as Record<string, unknown>;
  candidate.schema_version = "1.0";
  candidate.audit_id = context.auditId;
  candidate.run_id = context.runId;
  candidate.input_commitment = {
    thesis_hash: context.thesisHash,
    conditions_hash: context.conditionsHash,
    conditions_version: context.conditionsVersion,
  };
  candidate.attacker = {
    attacker_id: context.attackerId,
    attacker_name: context.attackerName,
    method: context.method,
    provider: context.provider,
    model_id: context.modelId,
    model_version: context.modelId,
    execution_environment: "dissent-worker",
  };
  candidate.evaluation = {
    started_at: context.startedAt,
    completed_at: context.completedAt,
    market_snapshot_at: context.marketSnapshotAt,
    status: "COMPLETED",
  };

  // An outside finding without evidence is not acceptable. Drop it rather than accepting an
  // unsupported claim; the raw output remains stored on the run for audit.
  const sectionB = candidate.section_b as
    | { outside_findings?: Array<{ evidence_refs?: string[] }>; search_summary?: { limitations?: string[] } }
    | undefined;
  if (sectionB && Array.isArray(sectionB.outside_findings)) {
    const before = sectionB.outside_findings.length;
    sectionB.outside_findings = sectionB.outside_findings.filter(
      (finding) => Array.isArray(finding.evidence_refs) && finding.evidence_refs.length > 0,
    );
    if (sectionB.outside_findings.length !== before) {
      sectionB.search_summary = sectionB.search_summary ?? {};
      sectionB.search_summary.limitations = [
        ...(sectionB.search_summary.limitations ?? []),
        "Validation removed an outside finding that cited no evidence record.",
      ];
    }
  }

  if (!validateSchema(candidate)) {
    return { ok: false, errors: schemaErrors(validateSchema.errors) };
  }

  const output = candidate as AttackerOutput;
  const errors: string[] = [];

  if (output.schema_version !== "1.0") errors.push("schema_version must be 1.0");
  if (output.audit_id !== context.auditId) errors.push("audit_id does not match the committed audit");
  if (output.run_id !== context.runId) errors.push("run_id does not match this run");
  if (output.attacker.attacker_id !== context.attackerId) errors.push("attacker_id mismatch");
  if (output.attacker.method !== context.method) errors.push("attacker method mismatch");
  if (output.input_commitment.thesis_hash !== context.thesisHash) errors.push("thesis_hash mismatch");
  if (output.input_commitment.conditions_hash !== context.conditionsHash) {
    errors.push("conditions_hash mismatch");
  }
  if (output.input_commitment.conditions_version !== context.conditionsVersion) {
    errors.push("conditions_version mismatch");
  }

  const expectedIds = new Set(context.conditions.map((condition) => condition.condition_id));
  const seen = new Set<string>();
  for (const assessment of output.section_a.condition_assessments) {
    if (!expectedIds.has(assessment.condition_id)) {
      errors.push(`unknown condition_id ${assessment.condition_id}`);
    }
    if (seen.has(assessment.condition_id)) {
      errors.push(`duplicate condition_id ${assessment.condition_id}`);
    }
    seen.add(assessment.condition_id);
    const committed = context.conditions.find(
      (condition) => condition.condition_id === assessment.condition_id,
    );
    if (committed && assessment.condition_text.trim() !== committed.description.trim()) {
      errors.push(`condition_text mismatch for ${assessment.condition_id}`);
    }
    assessment.evidence_refs = resolveEvidence(
      assessment.evidence_refs,
      context,
      errors,
      `section_a.${assessment.condition_id}.evidence_refs`,
    );
    if (assessment.invalid_test_analysis) {
      assessment.invalid_test_analysis.evidence_refs = resolveEvidence(
        assessment.invalid_test_analysis.evidence_refs,
        context,
        errors,
        `section_a.${assessment.condition_id}.invalid_test_analysis.evidence_refs`,
      );
    }
  }
  if (seen.size !== expectedIds.size) {
    errors.push(`section_a must assess all ${expectedIds.size} committed conditions exactly once`);
  }

  const findingIds = new Set<string>();
  for (const finding of output.section_b.outside_findings) {
    if (findingIds.has(finding.finding_id)) errors.push(`duplicate finding_id ${finding.finding_id}`);
    findingIds.add(finding.finding_id);
    if (!finding.why_outside_conditions.trim()) {
      errors.push(`finding ${finding.finding_id} needs a why_outside_conditions explanation`);
    }
    if (!finding.falsification_test.test_description.trim()) {
      errors.push(`finding ${finding.finding_id} needs a falsification test`);
    }
    for (const related of finding.related_condition_ids) {
      if (!expectedIds.has(related)) errors.push(`finding ${finding.finding_id} references unknown condition ${related}`);
    }
    finding.evidence_refs = resolveEvidence(
      finding.evidence_refs,
      context,
      errors,
      `section_b.${finding.finding_id}.evidence_refs`,
    );
  }

  if (output.section_b.outside_findings.length === 0) {
    const summary = output.section_b.search_summary;
    if (!summary.empty_findings_justification?.trim()) {
      errors.push("empty Section B requires a non-empty justification");
    }
    if (summary.areas_examined.length === 0 || summary.data_sources_consulted.length === 0 || summary.limitations.length === 0) {
      errors.push("empty Section B requires areas examined, sources consulted and limitations");
    }
  }

  const start = Date.parse(output.evaluation.started_at);
  const end = Date.parse(output.evaluation.completed_at);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    errors.push("evaluation timestamps are invalid or reversed");
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, output };
}

export function validationContextFrom(input: {
  auditId: string;
  runId: string;
  attackerId: string;
  attackerName: string;
  method: string;
  thesisHash: string;
  conditionsHash: string;
  conditionsVersion: string;
  conditions: Array<{ condition_id: string; description: string }>;
  evidence: Array<{ id: string; label: string }>;
  provider: string;
  modelId: string;
  startedAt: string;
  completedAt: string;
  marketSnapshotAt: string;
}): ValidationContext {
  return {
    auditId: input.auditId,
    runId: input.runId,
    attackerId: input.attackerId,
    attackerName: input.attackerName,
    method: input.method,
    thesisHash: input.thesisHash,
    conditionsHash: input.conditionsHash,
    conditionsVersion: input.conditionsVersion,
    conditions: input.conditions,
    evidenceLabelToId: Object.fromEntries(
      input.evidence.map((item) => [item.label, item.id]),
    ),
    provider: input.provider,
    modelId: input.modelId,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    marketSnapshotAt: input.marketSnapshotAt,
  };
}
