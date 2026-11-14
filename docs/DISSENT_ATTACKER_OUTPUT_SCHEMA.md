# Dissent — Attacker Output Schema

**Schema version:** `1.1`  
**Status:** Normative interface contract  
**Consumers:** Evidence Auditor, Sycophancy Auditor, Reproducibility Runner, Adjudicator, Certificate Generator, Bounty Engine

## 1. Contract purpose

All eight attackers return the same machine-readable envelope. Their identity, method, model assignment, prompt, tool permissions, and data-source diet differ; their output contract does not.

Every successful attacker must:
- Assess every committed client condition exactly once in Section A.
- Search for meaningful risks outside the conditions in Section B.
- Reference evidence records created by approved Dissent tools.
- Separate observation, calculation, inference, assumption, and limitation.
- Explicitly declare an invalid test when warranted.
- Never make a protocol-level `TRADE`, `REFUSE`, or `ABSTAIN` decision.

A model cannot invent evidence IDs or model provenance. The orchestrator overwrites provider/model/timestamp fields from trusted invocation logs.

## 2. Frozen attacker registry

| ID | Name | `method` |
|---|---|---|
| A01 | Liquidity / Execution | `LIQUIDITY_EXECUTION` |
| A02 | Asset Safety | `ASSET_SAFETY` |
| A03 | Logic / Coherence | `LOGIC_COHERENCE` |
| A04 | Correlation / Portfolio | `CORRELATION_PORTFOLIO` |
| A05 | Thesis Inversion | `THESIS_INVERSION` |
| A06 | Data Provenance | `DATA_PROVENANCE` |
| A07 | Timing / MEV | `TIMING_MEV` |
| A08 | Base Rate | `BASE_RATE` |

## 3. Normative top-level shape

```json
{
  "schema_version": "1.0",
  "audit_id": "uuid",
  "run_id": "uuid",
  "attacker": {
    "attacker_id": "A01",
    "attacker_name": "Liquidity / Execution",
    "method": "LIQUIDITY_EXECUTION",
    "provider": "openai",
    "model_id": "configured-model-id",
    "model_version": "provider-version-or-snapshot",
    "execution_environment": "worker-runtime-id"
  },
  "input_commitment": {
    "thesis_hash": "64-hex-sha256",
    "conditions_hash": "64-hex-sha256",
    "conditions_version": "1"
  },
  "evaluation": {
    "started_at": "2026-11-13T08:00:00Z",
    "completed_at": "2026-11-13T08:00:30Z",
    "market_snapshot_at": "2026-11-13T08:00:00Z",
    "status": "COMPLETED"
  },
  "section_a": { "condition_assessments": [] },
  "section_b": {
    "outside_findings": [],
    "search_summary": {
      "areas_examined": [],
      "data_sources_consulted": [],
      "limitations": [],
      "empty_findings_justification": null
    }
  },
  "attacker_summary": {
    "overall_risk_level": "HIGH",
    "overall_assessment": "Concise adversarial conclusion.",
    "recommended_action": "REJECT"
  }
}
```

## 4. Section A — condition assessment

Every committed condition must appear exactly once, using the exact `condition_id` and original committed `condition_text`.

Assessment fields:
- `assessment_status=EVALUABLE`: `status` is one of the four frozen statuses below.
- `assessment_status=UNVERIFIABLE`: `status=null`; `limitations` must explain the unavailable, stale, or incomplete evidence. This is a data-quality state, not a fifth Section A verdict.

Statuses (only when `assessment_status=EVALUABLE`):
- `HIT`: threshold/event is established by evidence for the evaluation snapshot.
- `PARTIAL`: evidence indicates partial/approaching satisfaction but does not establish the full criterion.
- `NOT_HIT`: evidence was available and demonstrates that the criterion was not met at the snapshot. Missing data is not `NOT_HIT`.
- `INVALID_TEST`: the criterion cannot reliably test the intended risk because it is unfalsifiable, gameable, ambiguous, contradictory, or tests the wrong risk.

```json
{
  "condition_id": "FC-001",
  "condition_text": "NEAR price is below USD 2.50 at the evaluation snapshot",
  "assessment_status": "EVALUABLE",
  "status": "HIT",
  "observed_value": {
    "value": 2.42,
    "unit": "USD",
    "observed_at": "2026-11-13T08:00:00Z"
  },
  "threshold": {
    "operator": "<",
    "value": 2.50,
    "unit": "USD"
  },
  "rationale": "The normalized observation is below the committed threshold.",
  "evidence_refs": ["EVID-001"],
  "confidence": 0.98,
  "invalid_test_analysis": null,
  "limitations": []
}
```

Field rules:
- `observed_value` and `threshold` are objects or `null`. For `INVALID_TEST`, either may be null.
- `confidence` is a model-reported diagnostic from 0 to 1; it is not proof and does not directly determine the verdict.
- `evidence_refs` must contain IDs returned by Dissent evidence tools. A model may not fabricate IDs.
- `limitations` must explicitly mention stale/missing/unavailable inputs.

For `UNVERIFIABLE`, `status` must be `null`, at least one limitation is required, and evidence references may be empty if no evidence record could be created. Never convert missing data into `NOT_HIT`.

For `INVALID_TEST`, `invalid_test_analysis` is mandatory:

```json
{
  "classification": "UNFALSIFIABLE",
  "explanation": "The criterion has no measurable threshold or observable event.",
  "failure_reason": "No independent observer can determine whether the criterion was met.",
  "proposed_repair": "Specify a measurable metric, operator, threshold and evaluation window.",
  "evidence_refs": ["EVID-CONDITION-FC-001"]
}
```

Allowed classifications: `UNFALSIFIABLE`, `GAMEABLE`, `WRONG_RISK`, `AMBIGUOUS`, `CONTRADICTORY`, `OTHER`.

The condition preimage itself is stored by Dissent as an evidence object, so a structural critique can cite it. An `INVALID_TEST` declaration is not automatically accepted: the Evidence Auditor checks the defect. An accepted invalid-test on a material condition may force `ABSTAIN`.

## 5. Section B — outside-condition findings

Every attacker must conduct a search outside the client's listed conditions. A finding must introduce an independently meaningful risk/contradiction/falsification argument, not paraphrase a client condition.

```json
{
  "finding_id": "F-B-001",
  "title": "Liquidity concentration creates execution risk",
  "category": "LIQUIDITY_RISK",
  "severity": "HIGH",
  "confidence": 0.91,
  "claim": "A large share of executable depth is concentrated in one pool.",
  "detailed_rationale": "The proposed size may experience greater market impact than the headline route quote suggests.",
  "why_outside_conditions": "The submitted conditions test price decline, not the concentration of executable liquidity.",
  "related_condition_ids": [],
  "falsification_test": {
    "test_description": "Simulate the intended notional against current pool depth.",
    "expected_observation": "Impact exceeds the approved execution limit.",
    "failure_criteria": "Price impact exceeds 3 percent."
  },
  "evidence_refs": ["EVID-003", "EVID-004"],
  "recommended_action": "REJECT",
  "limitations": []
}
```

Categories: `LIQUIDITY_RISK`, `EXECUTION_RISK`, `ASSET_SECURITY`, `DEPEG_RISK`, `LOGICAL_CONTRADICTION`, `PORTFOLIO_RISK`, `CORRELATION_RISK`, `DATA_INTEGRITY`, `ORACLE_RISK`, `MEV_RISK`, `TIMING_RISK`, `BASE_RATE_RISK`, `GOVERNANCE_RISK`, `COUNTERPARTY_RISK`, `ECONOMIC_RISK`, `OTHER`.

Severity: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`.  
Recommended action: `REJECT`, `CAUTION`, `MONITOR`, `NO_OBJECTION`.

`related_condition_ids` may be empty. If populated, the attacker must still explain why the new claim is outside or not adequately captured by those conditions.

### Empty Section B

An empty `outside_findings` array requires a non-empty `empty_findings_justification`, plus non-empty `areas_examined`, `data_sources_consulted`, and declared limitations. Evidence Auditor can reject the justification and request one bounded follow-up. Empty findings never automatically mean the thesis is safe.

## 6. Evidence record interface

Evidence records are created by trusted Dissent tools, not authored freely by the model. Each includes:
- `evidence_id` (stable ID)
- `source_provider`, `adapter`, `resource_type`, `resource_id`
- safe typed `locator` and approved parameters
- `observed_at`, `retrieved_at`, block height/hash if relevant
- normalized value/unit/summary
- `evidence_type`: `DIRECT_OBSERVATION`, `DERIVED_CALCULATION`, `HISTORICAL_RECORD`, `CROSS_SOURCE_COMPARISON`, `MODEL_INFERENCE`, `EXTERNAL_ATTESTATION`
- server-calculated `payload_sha256`, canonicalization version and private payload reference
- freshness result and limitations

Forbid arbitrary URLs from model outputs. Evidence Auditor fetches only approved resources through allowlisted adapters. Redirects, private IPs, local metadata services, unsupported schemes and credential forwarding are blocked.

## 7. Attacker summary

`overall_risk_level`: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `UNKNOWN`.  
`recommended_action`: `REJECT`, `CAUTION`, `NO_OBJECTION`, `INSUFFICIENT_DATA`.

This is an attacker-level opinion only. Only deterministic adjudication may issue the protocol verdict.

## 8. Trusted metadata versus model output

The orchestrator records actual `provider`, `model_id`, `model_version`, `execution_environment`, timing, token usage, provider request ID, prompt/config hash, source grants, and TEE verification metadata. It ignores or overwrites model-supplied claims for these fields. The model cannot assert `COMPLETED` if the invocation failed.

## 9. Cross-field validation (mandatory application rules)

| Rule | Requirement | Failure |
|---|---|---|
| S01 | Attacker ID and method match immutable registry | Reject response |
| S02 | Thesis/condition hashes match committed audit | Reject response |
| S03 | Exactly one assessment for every committed condition | Reject response |
| S04 | No unknown/duplicate condition IDs | Reject response |
| S05 | `INVALID_TEST` has analysis; other statuses have null analysis | Reject response |
| S06 | All evidence refs resolve to records created for this audit/run | Reject or mark incomplete |
| S07 | Finding IDs unique within audit/run namespace | Reject response |
| S08 | Empty Section B has meaningful justification and search coverage | Flag/review |
| S09 | Outside finding has non-empty novelty explanation and falsification test | Reject/needs review |
| S10 | Start <= complete; all times timezone-aware UTC | Reject response |
| S11 | Failed/partial execution cannot be marked complete | Reject response |
| S12 | No sibling output, adjudicator state or prior verdict refs | Reject and security alert |
| S13 | No unknown top-level properties | Reject unless schema version explicitly supports them |
| S14 | Any evidence payload hash is generated by server | Ignore model hash and regenerate |

Schema validation is JSON Schema Draft 2020-12 plus the cross-field rules above. Store original raw response, parsed response, validation report, and schema version for auditability.

## 10. Retry behavior

- First schema-invalid response: one schema-repair attempt containing validation errors only; no new context or sibling data.
- Second schema-invalid response: one fresh attacker call with same immutable inputs and assignment.
- After failure: `FAILED` run; preserve raw response and error. Do not synthesize a missing result.
- Rate-limit/timeout retries use bounded exponential backoff and configured total budget.
- Provider fallback must preserve model family diversity and record the exact substituted model; otherwise the audit cannot produce `TRADE`.

## 11. Acceptance criteria

All eight attackers produce this contract; exact condition coverage is enforced; invalid-test rules work; Section B is meaningful and required; evidence references resolve; output provenance is server-owned; model/TEE verification is stored; sibling isolation passes tests; adjudicator consumes only validated outputs; and all failures remain explicit.

## 12. JSON Schema implementation note

The normative payload JSON Schema (payload version `1.0`) is `schemas/attacker-output-v1.schema.json`; this Markdown document is revision `1.1`. The added `assessment_status`/nullable status rules preserve the frozen four-status set while making non-evaluability explicit. The versioned interface above is normative. In addition to JSON Schema, application validation must check identity-to-method matching, exact condition set equality, evidence ownership, uniqueness, chronology, empty Section B justification, and source provenance. These semantic rules cannot be reliably expressed by JSON Schema alone.
