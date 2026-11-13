# Dissent — Adjudication Policy Specification

**Policy ID:** `dissent-adjudication-v1.0`  
**Status:** Normative for MVP; immutable once used by an audit  
**Decision owner:** Deterministic policy engine  
**Prohibited:** Majority voting, free-form LLM verdict selection, silent missing-data substitution

## 1. Purpose and precedence

This document defines how Dissent converts validated attacker outputs and review records into `TRADE`, `REFUSE`, or `ABSTAIN`. It is the only normative source for verdict gates and bounty arithmetic. The PRD describes intent; this file defines executable rules.

**Verdict precedence:**
1. `REFUSE` if a policy-defined disqualifying condition/finding is independently verified and accepted.
2. Otherwise `ABSTAIN` if any mandatory confidence, coverage, model-diversity, TEE, evidence, review, or unresolved-conflict gate fails.
3. `TRADE` only if every positive gate passes and no disqualifier exists.
4. Default to `ABSTAIN` for any state not explicitly covered.

A `REFUSE` may be returned even when some attackers failed if one independently verified disqualifier conclusively establishes that the proposed trade must not proceed. A `TRADE` may never be returned with incomplete mandatory coverage.

## 2. Input contract

Adjudicator input is an immutable `AdjudicationInputV1` assembled by trusted services:

- audit ID, thesis hash, conditions hash, canonicalization version;
- pinned market/data snapshot IDs and timestamps;
- all eight attacker run records and validated schema outputs;
- Section A assessments, Section B findings and evidence records;
- Evidence Auditor and Sycophancy Auditor results;
- reproducibility outcomes;
- model provenance and NEAR AI attestation/signature verification;
- policy version and deterministic source-adapter verification outcomes.

Never pass sibling outputs into an attacker. Adjudication is the first stage that may access all eight outputs.

## 3. Section A status semantics

The original four status values remain frozen:

- `HIT`
- `PARTIAL`
- `NOT_HIT`
- `INVALID_TEST`

To avoid treating missing data as a negative result, the contract adds a separate `assessment_status`:

- `EVALUABLE`: `status` must be exactly one of the four frozen values.
- `UNVERIFIABLE`: `status` must be `null`; `limitations` must explain what was missing or stale. This is a data-quality state, not a fifth Section A verdict.

The Evidence Auditor determines whether the underlying evidence is adequate. A model cannot set an assessment to verified by assertion. `NOT_HIT` is only valid where sufficient evidence establishes that the threshold/event was not met at the common evaluation snapshot.

A condition is **material** when the client marks it `CRITICAL` or `HIGH`, or when the pinned risk policy identifies it as critical. Client-provided severity is committed and visible, but the policy may require a stricter configured class for known catastrophic risks.

## 4. Evidence outcomes

Evidence re-fetch results:

| Outcome | Meaning | Verdict eligibility |
|---|---|---|
| `VERIFIED` | Approved adapter independently retrieved the same observation or a deterministic replay of the same snapshot and the claim is supported | Eligible |
| `PARTIALLY_VERIFIED` | Some claim components are corroborated; material limitation remains | Cannot alone support a `TRADE`; may support a cautious report or `ABSTAIN` |
| `UNVERIFIABLE` | Source unavailable, historical snapshot absent, locator invalid, or retrieval not reproducible | No positive proof; material cases block `TRADE` |
| `CONTRADICTED` | Re-fetch or independent source directly contradicts the asserted observation/claim | Finding rejected or contradiction passed to adjudicator |

Important distinctions:
- A changed live value is not automatically a contradiction of an older observation. Compare the observation time and snapshot identity.
- A source outage is not proof the claim is false.
- A payload hash mismatch is not sufficient by itself to establish semantic contradiction; adapter-specific normalization and observation identity must be checked.
- Evidence locators are typed adapter requests, never arbitrary model-generated URLs.

## 5. Finding review states

Each finding/condition-derived claim has a review disposition:

- `ACCEPTED`: supported by evidence, materially relevant, non-duplicate (or independently additive), and not sycophantic/paraphrased.
- `NEEDS_REVIEW`: partial support, novelty ambiguity, limited replay, or unresolved conflict.
- `REJECTED`: unsupported, contradicted, duplicate without new contribution, malformed, untraceable, or merely restates thesis/conditions.

An `ACCEPTED` record must include verifier identity/version, evidence outcome, novelty result, rationale code, and timestamp. Model self-reported confidence is diagnostic only; it is not multiplied into verdict score.

## 6. Severity and scoring

Severity weights are used for ranking and bounty calculation, not as a vote or standalone verdict probability:

| Severity | Weight |
|---|---:|
| `CRITICAL` | 5 |
| `HIGH` | 4 |
| `MEDIUM` | 2 |
| `LOW` | 1 |
| `INFO` | 0.25 |

Evidence factors:

| Evidence result | Factor |
|---|---:|
| `VERIFIED` | 1.00 |
| `PARTIALLY_VERIFIED` | 0.50 |
| `UNVERIFIABLE` | 0.00 |
| `CONTRADICTED` | 0.00 |

Reproducibility factors:

| Result | Factor |
|---|---:|
| `REPRODUCED` | 1.00 |
| `PARTIALLY_REPRODUCED` | 0.75 |
| `NOT_REPRODUCED` | 0.50 |
| `NOT_REPLAYABLE_SOURCE_LIMITATION` | 0.75 |
| `CONTRADICTED_ON_REPLAY` | 0.00 |
| `NOT_ATTEMPTED` | 0.00 for a required replay |

`finding_rank_score = severity_weight × evidence_factor × reproducibility_factor`.

This score ranks accepted findings for display and review. It **does not** decide the verdict by summing scores. A Critical disqualifier cannot be outweighed by many Low or supportive findings.

## 7. Disqualifying rules

Disqualifiers must be represented in versioned policy configuration as deterministic predicates. LLMs cannot set `disqualifying=true`.

MVP disqualifier classes:

1. A committed `CRITICAL` failure condition is `HIT` with `VERIFIED` evidence and matching threshold semantics.
2. An accepted Section B finding matches an explicit policy rule such as a verified live exploit affecting the selected asset/contract, a proven execution path that cannot satisfy the proposed action, or an explicitly prohibited asset/contract state.
3. An objectively proven client-defined hard stop is reached.

Each disqualifier must include `rule_id`, `rule_version`, the structured facts used, evidence references, and a deterministic explanation. If a critical claim is disputed, contradicted, or only partially verified, do not force `REFUSE`; use `ABSTAIN` unless another independent disqualifier is verified.

The initial demo policy must include only rules that the team can test and demonstrate. The policy may be conservative; it must not invent broad asset danger rules from model prose.

## 8. Coverage gate

For a `TRADE` result:
- exactly eight attacker identities A01–A08 must have a successful, schema-valid terminal run;
- each successful run must assess every committed condition exactly once;
- each run must include a Section B search summary;
- all eight runs must be sealed before any sibling result becomes visible;
- all required evidence and red-team reviews must be complete;
- no required attacker can be silently replaced by a duplicate identity or a same-family model variant.

If any required run is missing, invalid, timed out after retries, or unable to evaluate a material condition, `TRADE` is forbidden. A conclusive independent disqualifier can still produce `REFUSE`; otherwise `ABSTAIN`.

## 9. Model-diversity and TEE gate

`diversity_pass = distinct_model_families >= 3 AND distinct_vendors >= 2 AND verified_open_weight_tee_attacker_count >= 1`.

TEE verification requires:
- model ID and model family match the approved assignment;
- model serving attestation is validated against an approved trust root;
- each relevant completion response signature is verified;
- signature kind is model/provider TEE (`provider_tee`) for the required TEE proof, not merely gateway-only signature;
- verified attestation/signature references are stored with the run;
- verification library/version and trust-root version are recorded.

If the provider returns only a gateway signature and this does not attest the model execution, it cannot satisfy the open-weight model TEE requirement. A gateway proof may be preserved as a separate transport/integrity signal. The implementation must consult current NEAR AI verification documentation and SDK behavior during intake and pin the chosen verification version.

## 10. Divergence measure

Divergence is a diagnostic of unresolved contradictory condition assessments, not a voting algorithm.

For each material condition `c`, consider only assessments that are `EVALUABLE` and whose supporting evidence is `VERIFIED` or `PARTIALLY_VERIFIED`. Define:

- `conflict_c = 1.0` if at least one verified `HIT` and one verified `NOT_HIT` coexist at the same normalized snapshot;
- `conflict_c = 0.5` if a verified `HIT` conflicts with a verified `PARTIAL`, or verified `NOT_HIT` conflicts with a verified `PARTIAL`;
- `conflict_c = 0` otherwise.

Assign committed condition criticality weights: `CRITICAL=2`, `HIGH=1`, `NORMAL=0.5`.

`D = sum(weight_c × conflict_c) / sum(weight_c)` over material conditions with at least two eligible assessments; if no condition has at least two eligible assessments, `D` is undefined and coverage fails instead.

`D >= 0.25` forces `ABSTAIN` unless the Evidence Auditor resolves the disagreement through a documented source/timestamp/threshold correction or a disqualifier independently forces `REFUSE`.

Do not resolve conflict by taking the modal status. Re-fetch and snapshot alignment come first. Findings grouped into the same fingerprint cluster are also reviewed for contradiction; a verified material opposing claim that cannot be resolved blocks `TRADE` even if the condition divergence calculation is below threshold.

## 11. Section B novelty

For each Section B finding:
- `why_outside_conditions` must specify the risk dimension absent from or not covered by the client's conditions;
- Sycophancy Auditor returns `NOVEL`, `PARTIAL_NOVELTY`, `RESTATEMENT`, or `UNCLEAR`;
- a Section B finding marked `RESTATEMENT` is rejected unless the auditor identifies a material independent extension;
- an empty Section B requires non-empty areas examined, sources consulted, limitations and justification;
- a rejected empty-Section-B justification causes incomplete coverage and blocks `TRADE` after one bounded follow-up attempt.

A Section B finding can agree with the thesis and still be valid if it independently establishes a relevant fact; agreement alone is not sycophancy.

## 12. Verdict algorithm (normative pseudocode)

```text
function adjudicate(input):
    assert input.policy_version == "dissent-adjudication-v1.0"
    if has_accepted_verified_disqualifier(input):
        return REFUSE

    if not all_eight_runs_valid_and_sealed(input):
        return ABSTAIN
    if not diversity_pass(input):
        return ABSTAIN
    if not all_material_conditions_evaluable(input):
        return ABSTAIN
    if not all_required_evidence_reviews_complete(input):
        return ABSTAIN
    if not both_red_team_reviews_complete(input):
        return ABSTAIN
    if not all_section_b_searches_valid(input):
        return ABSTAIN
    if has_unresolved_material_contradiction(input):
        return ABSTAIN
    if divergence_index(input) >= 0.25:
        return ABSTAIN
    if has_material_data_quality_block(input):
        return ABSTAIN
    if not certificate_inputs_complete(input):
        return ABSTAIN

    return TRADE
```

`REFUSE` takes precedence only when a rule is independently verified and accepted; incomplete data alone cannot produce `REFUSE`.

## 13. Bounty formula

Bounty allocation is deterministic and fixed by audit quote before attack dispatch.

`bounty_points = severity_weight × reproducibility_factor × section_multiplier`

Multipliers:
- Section A verified condition finding: `1.00`.
- Section B accepted outside-condition finding: `1.25`.
- Accepted `INVALID_TEST` analysis: `1.25` (condition-critique work is deliberately incentivized).

`raw_reward = configured_base_unit × bounty_points`.

`reward = min(raw_reward, per_finding_cap, remaining_per_attacker_cap, remaining_per_audit_pool)`.

Rules:
- Only `ACCEPTED` findings are reward-eligible.
- Rejected and `NEEDS_REVIEW` findings receive zero until a final accepted disposition exists.
- `NOT_HIT` condition assessments are not bounty findings.
- An accepted `PARTIAL` or `HIT` is reward-eligible only if a separate accepted finding record is created with evidence, severity and review dispositions.
- Section B payout for comparable severity/reproducibility is always at least Section A payout.
- Duplicate cluster reports do not each receive full reward. The policy allocates a single cluster pool to independently contributing attackers; if attribution cannot be established, the cluster receives one capped payout split equally among accepted independent contributions.
- All amounts are integer smallest units; no float arithmetic.
- Settlement uses idempotent `settlement_id`; no payment before certificate finalization and escrow funding.
- The on-chain contract is a testnet demonstration only in MVP. No mainnet settlement.

## 14. Test vectors

| ID | Conditions/runs | Evidence/reviews | Expected verdict | Reason |
|---|---|---|---|---|
| T01 | 8 complete; 3 families/2 vendors; TEE pass; all material conditions NOT_HIT | All verified; no accepted risk | TRADE | All positive gates pass |
| T02 | 8 complete | One verified critical condition HIT | REFUSE | Verified hard stop |
| T03 | 7 complete | No disqualifier | ABSTAIN | Incomplete coverage |
| T04 | 8 complete, 2 model families only | Reviews complete | ABSTAIN | Diversity gate fails |
| T05 | 8 complete, TEE signature absent | Other evidence good | ABSTAIN | TEE gate fails |
| T06 | Material assessment UNVERIFIABLE | Source unavailable | ABSTAIN | Missing data is not NOT_HIT |
| T07 | Critical condition INVALID_TEST accepted | No separate disqualifier | ABSTAIN | Critical policy test invalid |
| T08 | Verified critical disqualifier, 7 runs complete | Evidence verified | REFUSE | Disqualifier precedence |
| T09 | HIT vs NOT_HIT on same critical snapshot | Conflict unresolved, D >= 0.25 | ABSTAIN | No majority resolution |
| T10 | HIT/NOT_HIT disagreement resolved by timestamp normalization | All other gates pass | TRADE or REFUSE per resolved fact | Snapshot correction replaces raw disagreement |
| T11 | Empty Section B, weak justification rejected after bounded follow-up | No other issue | ABSTAIN | Mandatory outside search incomplete |
| T12 | Section B finding restates condition | Sycophancy = RESTATEMENT | Finding rejected; verdict based on remaining evidence | Restatement not rewardable |
| T13 | Section B verified accepted High finding, not disqualifying | Other gates pass | TRADE may be allowed, with minority finding preserved | High finding is not automatically a hard stop |
| T14 | Same report duplicated by 3 agents, one evidence cluster | Evidence only supports one contribution | One capped cluster pool | Prevent duplicate rewards |
| T15 | Historical source cannot replay but timestamped signed source record exists | Auditor marks NOT_REPLAYABLE_SOURCE_LIMITATION | Does not automatically become false; material policy decides ABSTAIN/continue | Repro limitation preserved |
| T16 | All gates pass except certificate hash anchoring fails | Chain registry unavailable | ABSTAIN / certificate pending; do not report completed | Verifiable artifact required |

The test harness must add boundary tests at D=`0.249999`, `0.25`, and `0.250001`, exact payout-cap equality, zero remaining pool, and retry/duplicate settlement replays.

## 15. Auditability

The final decision record stores every gate as `{gate_id, passed, input_refs, rule_version, explanation_code}`. It also stores divergence calculations, accepted/rejected findings, disqualifier evaluation, policy hash, implementation build/version and decision timestamp. The certificate generator must serialize this record deterministically. No model-generated narrative can override a failed deterministic gate.
