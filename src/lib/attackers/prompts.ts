import type { AttackerProfile } from "@/lib/attackers/profiles";
import type { ChatMessage } from "@/lib/providers/openai-compatible";

export type PromptCondition = {
  condition_id: string;
  description: string;
  metric: string;
  operator: string;
  threshold: string;
  unit: string;
  evaluation_window: { value: number; unit: string };
  severity: string;
};

export type PromptEvidence = {
  label: string;
  id: string;
  source: string;
  resourceType: string;
  summary: string;
  observedAt: string | null;
  freshness: string;
  limitations: string[];
};

export type PromptInput = {
  profile: AttackerProfile;
  auditId: string;
  runId: string;
  thesisHash: string;
  conditionsHash: string;
  conditionsVersion: string;
  thesis: unknown;
  conditions: PromptCondition[];
  evidence: PromptEvidence[];
  marketSnapshotAt: string;
  provider: string;
  modelId: string;
  startedAt: string;
  repairErrors?: string[];
};

const OUTPUT_CONTRACT = `Return exactly one JSON object with this envelope and no markdown:
{
  "schema_version": "1.0",
  "audit_id": "<audit id>",
  "run_id": "<run id>",
  "attacker": {
    "attacker_id": "<A01-A08>",
    "attacker_name": "<name>",
    "method": "<method>",
    "provider": "<provider>",
    "model_id": "<model id>",
    "model_version": "<provider model version or 'configured'>",
    "execution_environment": "dissent-worker"
  },
  "input_commitment": {
    "thesis_hash": "<64 hex>",
    "conditions_hash": "<64 hex>",
    "conditions_version": "1"
  },
  "evaluation": {
    "started_at": "<UTC ISO timestamp>",
    "completed_at": "<UTC ISO timestamp>",
    "market_snapshot_at": "<UTC ISO timestamp>",
    "status": "COMPLETED"
  },
  "section_a": {
    "condition_assessments": [
      {
        "condition_id": "<exact committed id>",
        "condition_text": "<exact committed description>",
        "assessment_status": "EVALUABLE" | "UNVERIFIABLE",
        "status": "HIT" | "PARTIAL" | "NOT_HIT" | "INVALID_TEST" | null,
        "observed_value": null | {"value": number|string|boolean|null, "unit": string|null, "observed_at": string|null},
        "threshold": null | {"operator": string|null, "value": number|string|boolean|null, "unit": string|null},
        "rationale": "<why the status follows from the evidence>",
        "evidence_refs": ["<evidence label from the bundle>"],
        "confidence": 0.0,
        "invalid_test_analysis": null | {
          "classification": "UNFALSIFIABLE" | "GAMEABLE" | "WRONG_RISK" | "AMBIGUOUS" | "CONTRADICTORY" | "OTHER",
          "explanation": "<why the test cannot test the intended risk>",
          "failure_reason": "<why no independent observer can decide it>",
          "proposed_repair": "<measurable repair or null>",
          "evidence_refs": ["<evidence label>"]
        },
        "limitations": ["<stale/missing/unavailable limitation>"]
      }
    ]
  },
  "section_b": {
    "outside_findings": [
      {
        "finding_id": "F-B-001",
        "title": "<title>",
        "category": "LIQUIDITY_RISK" | "EXECUTION_RISK" | "ASSET_SECURITY" | "DEPEG_RISK" | "LOGICAL_CONTRADICTION" | "PORTFOLIO_RISK" | "CORRELATION_RISK" | "DATA_INTEGRITY" | "ORACLE_RISK" | "MEV_RISK" | "TIMING_RISK" | "BASE_RATE_RISK" | "GOVERNANCE_RISK" | "COUNTERPARTY_RISK" | "ECONOMIC_RISK" | "OTHER",
        "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO",
        "confidence": 0.0,
        "claim": "<new material claim>",
        "detailed_rationale": "<reasoning>",
        "why_outside_conditions": "<which risk dimension is not covered by the client conditions>",
        "related_condition_ids": [],
        "falsification_test": {
          "test_description": "<how to test the claim>",
          "expected_observation": "<what would be observed if the claim is true>",
          "failure_criteria": "<what observation would refute it>"
        },
        "evidence_refs": ["<evidence label>"],
        "recommended_action": "REJECT" | "CAUTION" | "MONITOR" | "NO_OBJECTION",
        "limitations": []
      }
    ],
    "search_summary": {
      "areas_examined": ["<area>"],
      "data_sources_consulted": ["<evidence label / source>"],
      "limitations": ["<limitation>"],
      "empty_findings_justification": null
    }
  },
  "attacker_summary": {
    "overall_risk_level": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN",
    "overall_assessment": "<concise adversarial conclusion>",
    "recommended_action": "REJECT" | "CAUTION" | "NO_OBJECTION" | "INSUFFICIENT_DATA"
  }
}`;

export function buildAttackerMessages(input: PromptInput): ChatMessage[] {
  const { profile } = input;
  const system = `You are ${profile.name} (${profile.attackerId}), one of eight isolated specialist attackers in Dissent.
Your method is ${profile.method}. ${profile.focus}

You are not a general assistant and you do not issue a protocol verdict. Your job is adversarial analysis of one committed trading thesis.
You see the thesis, the committed failure conditions and a trusted evidence bundle created by Dissent. You never see sibling attackers, adjudicator state, prior verdicts or client credentials.
Never invent evidence IDs or provenance. Only cite evidence labels from the bundle. If the available evidence cannot establish a condition, use assessment_status=UNVERIFIABLE with status=null and a limitation. Missing data is never NOT_HIT.
Every committed condition must appear exactly once in section_a with the exact condition_id and exact condition_text.
Every section_b finding must introduce a materially new risk, contradiction or falsification argument outside the client's conditions and must include a falsification test. Every outside finding MUST cite at least one evidence label from the bundle; if no evidence supports a finding, do not submit that finding. Keep Section B to at most two concise findings. If you find nothing new, provide a meaningful empty-search justification with areas examined, sources consulted and limitations.
Do not reveal chain-of-thought. Keep the envelope compact: at most one outside finding, each rationale under 60 words, no repeated analysis and no prose outside the JSON object. Return only the JSON envelope.`;

  const conditionText = input.conditions
    .map(
      (condition) =>
        `- ${condition.condition_id}: ${condition.description}\n  metric=${condition.metric}; operator=${condition.operator}; threshold=${condition.threshold} ${condition.unit}; window=${condition.evaluation_window.value} ${condition.evaluation_window.unit}; severity=${condition.severity}`,
    )
    .join("\n");

  const evidenceText = input.evidence
    .map(
      (item) =>
        `- ${item.label} (${item.source}; ${item.resourceType}; freshness=${item.freshness}; observed_at=${item.observedAt ?? "unknown"})\n  ${item.summary}\n  limitations: ${item.limitations.join("; ") || "none"}`,
    )
    .join("\n");

  const user = `# Committed audit
audit_id: ${input.auditId}
run_id: ${input.runId}
thesis_hash: ${input.thesisHash}
conditions_hash: ${input.conditionsHash}
conditions_version: ${input.conditionsVersion}
market_snapshot_at: ${input.marketSnapshotAt}

# Thesis
${JSON.stringify(input.thesis, null, 2)}

# Committed failure conditions
${conditionText}

# Trusted evidence bundle
The following records were created by server-owned adapters. Use the label exactly as shown when citing evidence.
${evidenceText}

# Your method questions
${profile.questions.map((question) => `- ${question}`).join("\n")}

# Section B search hints (not an exhaustive list)
${profile.sectionBHints.map((hint) => `- ${hint}`).join("\n")}

# Output contract
${OUTPUT_CONTRACT}

# Run metadata
provider: ${input.provider}
model_id: ${input.modelId}
started_at: ${input.startedAt}

Return the JSON object only.`;

  const messages: ChatMessage[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  if (input.repairErrors?.length) {
    messages.push({
      role: "user",
      content: `Your previous response failed validation. Correct only these issues and return the full JSON envelope again:\n- ${input.repairErrors.join("\n- ")}`,
    });
  }

  return messages;
}
