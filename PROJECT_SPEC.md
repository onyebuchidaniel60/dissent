# Dissent — Project Specification

**Version:** 1.0  
**Status:** Implementation baseline derived from the frozen Dissent handoff  
**Product:** Adversarial Audit Protocol for AI Trading Agents  
**Network:** NEAR Protocol  
**Hackathon deadline:** 14 November 2026, 23:59 UTC

## 1. Product definition

### One-line description
Dissent is an evidence-backed adversarial audit protocol that challenges an AI trading agent's thesis before the agent executes a financially consequential decision.

### Problem
An autonomous trading agent can generate a thesis, select evidence that supports it, and execute without adequately testing its assumptions. A second general-purpose model often shares the first agent's assumptions. Multi-model agreement is not proof of independent analysis, and unsupported AI claims are difficult to reproduce or audit. An agent may also revise its original risk criteria after seeing inconvenient results.

### Current alternatives and workarounds
- Self-critique by the originating model.
- A second general-purpose model asked to review the thesis.
- Parallel-agent debate without enforced information isolation.
- Human analyst review and manual risk checklists.
- Oracle dashboards and on-chain explorers that provide data but do not challenge the thesis.
- Wallet spending limits that constrain losses but do not test investment reasoning.

Dissent combines adversarial analysis, evidence verification, a prior commitment to the failure conditions, and an immutable audit certificate. It complements, rather than replaces, portfolio controls, human governance, or smart-contract safeguards.

### Target users
1. **AI trading-agent developers:** need a pre-execution audit endpoint and machine-readable verdict.
2. **DeFi treasury and protocol operators:** need evidence that an autonomous financial decision was challenged.
3. **Operators of agent-managed portfolios:** need reproducible decisions, policy enforcement, and auditable risk records.
4. **Researchers and reviewers:** need to inspect evidence, coverage, model provenance, disagreement, and the final decision.

Not a retail investment-advice product. The first release is an API-first developer product with a small operator dashboard.

### Roles
- **Client agent:** submits an audit, commits the thesis and conditions, reads its own audit and certificate.
- **Client operator:** human owner of a client agent; can create/revoke that client's API credentials and inspect owned audits.
- **Dissent operator/admin:** manages providers, model assignments, source adapters, protocol policy, job recovery, and approved settlements.
- **Attacker runtime:** one of eight isolated system agents; no human login and no sibling access.
- **Evidence Auditor:** validates re-fetchable evidence and claim support.
- **Sycophancy Auditor:** evaluates whether attackers genuinely challenged the thesis.
- **Adjudicator:** deterministic policy engine; only component allowed to issue a protocol verdict.
- **Public verifier:** read-only consumer of public certificate metadata and on-chain hashes.

### Core value proposition
A trading agent receives a structured `TRADE`, `REFUSE`, or `ABSTAIN` result supported by independently retrievable evidence, eight specialist attack paths, explicit coverage, preserved minority findings, and a NEAR-anchored certificate.

### Differentiator
Independence is epistemic, not custodial: Dissent internalizes the audit workforce but enforces decorrelated failure modes through distinct model families, adversarial methods, source diets, execution contexts, and sibling blindness. Its certificate preserves disagreement instead of converting it into a majority vote.

### Primary use case
An AI agent proposes a NEAR DeFi trade, specifies a thesis and machine-testable failure conditions, commits the canonical condition hash on NEAR, receives eight isolated adversarial analyses, undergoes evidence and sycophancy review, and receives a final audit certificate before any execution decision.

### Secondary use cases
- Audit another agent's proposed staking, lending, liquidity, or swap decision.
- Review an existing portfolio for concentration and correlated protocol risk.
- Create a reproducible investment-thesis artifact for human review.
- Run Dissent-originated research through the same audit pipeline in the proprietary trading arm.

### Explicit non-goals
- Dissent is not a trading venue, broker, exchange, wallet, custodian, or investment adviser.
- Dissent does not guarantee profit, safety, or future performance.
- Dissent does not execute mainnet trades. The hackathon MVP includes testnet-only proprietary execution through a capped vault and approved venue adapter.
- Dissent does not create an open marketplace for external attackers.
- Dissent does not treat model consensus, model confidence, or a high finding count as truth.
- Dissent does not automatically trust client-supplied evidence or arbitrary URLs.
- Dissent does not put private thesis content, portfolio data, raw evidence, or model prompts on-chain.
- Dissent does not give LLMs wallet keys, arbitrary RPC access, shell access, or unrestricted HTTP access.

## 2. MVP scope

### MUST HAVE
- API-first audit submission and a usable operator/client web console.
- Typed thesis and structured failure conditions, including thresholds, units, time horizons, and severity.
- Canonical serialization and SHA-256 commitments for thesis and conditions.
- NEAR testnet registry transaction before attacker dispatch; client preimage is disclosed to attackers only after commitment finality is verified.
- Fixed, operator-configured testnet audit-fee quote and testnet bounty-vault funding confirmed before attacker dispatch; no mainnet money movement.
- Eight specialist attacker assignments, all using the same versioned output contract.
- At least three distinct model families across at least two model vendors; one open-weight model running in NEAR AI Cloud TEE with deployment attestation and response signature verification.
- Enforced sibling-blind execution contexts and restricted data-source adapters.
- Required Section A (every condition) and Section B (outside-condition search).
- Evidence store, re-fetch verification, Evidence Auditor, and Sycophancy Auditor.
- Deterministic, versioned adjudication policy with `TRADE`, `REFUSE`, `ABSTAIN`.
- Coverage table, minority findings, and machine-readable certificate.
- NEAR certificate hash registration.
- Testnet bounty accounting and at least one verifiable testnet settlement path if the escrow contract passes tests; no mainnet money movement in MVP.
- Reputation ledger with metrics derived from accepted/rejected findings.
- Seeded deterministic audit plus a real live audit run; fixtures must be labelled as fixtures.
- Proprietary market scanning and Dissent-originated theses through the same audit pipeline.
- Vault-controlled testnet trade execution using approved venue adapters, gated by `EXECUTION_ENABLED` and a TRADE verdict.
- Setup, testing, deployment, security, API, and operator documentation.

### SHOULD HAVE
- Contract-backed testnet bounty escrow and payouts to configured testnet payout accounts.
- Callback/webhook for audit completion (disabled by default; polling is sufficient for MVP).
- Attacker retry and operator-controlled bounded rerun.
- NearBlocks and Pikespeak source adapters in addition to FastNear/RPC, subject to credentials and API checks.
- RedStone NEAR connector; a second independently sourced price observation from a market-data adapter.
- Reproducibility replay against immutable stored snapshots.

### NICE TO HAVE
- Reputation explorer with historical per-attacker precision and false-positive metrics.
- Certificate public-verification page.
- Comparison of model outputs without disclosing internal chain-of-thought.
- Optional email notifications.

### FUTURE
- Tier 1 pre-screen followed by Tier 2 full audit for the proprietary arm.
- Mainnet bounty settlement after security review and explicit release authorization.
- Mainnet trade execution after a separate security review and explicit authorization.
- NEAR Intents 1Click standard deposit flow after independent integration testing.
- Externalized attacker pool only after quality can be priced and independently verified.

### OUT OF SCOPE
- Open attacker marketplace, agent bidding, or third-party attacker registration.
- Live mainnet autonomous trading during the hackathon.
- NEP-413 signed-intent execution using a Function Call Key.
- Direct custody of client assets.
- Chainlink NEAR integration, which is not assumed available for this build.
- Pyth Core as a required NEAR price feed; enable only if an actually maintained NEAR deployment is separately confirmed.
- Token issuance, governance token, social trading, and retail portfolio recommendations.

## 3. User flows

### Flow A — Submit and commit an audit
**Entry:** Client dashboard or `POST /api/v1/audits`.  
**Preconditions:** Authenticated client API key or session; client has `audit:create`; supported asset/action; at least one valid condition; audit capacity available.

1. Client submits thesis, action, asset, position size, time horizon, and typed conditions.
2. API validates the request and normalizes units, timestamps, identifiers, and condition expressions.
3. API calculates `thesis_hash` and `conditions_hash` using versioned RFC 8785 canonical JSON and SHA-256.
4. API creates audit in `AWAITING_COMMITMENT`; stores preimage privately.
5. API returns commitment payload and contract call parameters. A connected client wallet signs `commit_conditions` on NEAR testnet; an autonomous client submits the signed transaction or verified transaction hash.
6. Backend verifies the transaction receipt, signer/account, contract ID, method, audit ID, and both hashes using a trusted NEAR RPC/indexer.
7. On confirmed commitment, audit moves to `COMMITTED` / `AWAITING_FUNDING`. The API returns a fixed testnet fee quote.
8. Client signs a `fund_audit` payable transaction to the bounty vault. Backend verifies exact network, contract, audit ID, quote hash and amount.
9. Only after both commitment and fee funding are confirmed does audit move to `FUNDED` and the orchestrator enqueue attacker runs.

**State changes:** audit row, thesis row, condition rows, commitment event, on-chain tx reference, fee quote and fee-funding record.  
**Success:** commitment status and transaction link visible.  
**Failure:** invalid condition, hash mismatch, wrong signer, failed/expired commitment or fee transaction, insufficient amount, RPC unavailability; audit remains uncommitted or `AWAITING_FUNDING` and no attacker job is launched.  
**Edge cases:** duplicate submission idempotency key; repeated commitment; transaction reorg/unknown status; changed conditions require a new audit.  
**Permissions:** client can read only its own audit.  
**Exit:** after both commitment and testnet fee funding are confirmed, audit enters `FUNDED` then `QUEUED`.

### Flow B — Run the eight attackers
**Entry:** commitment and testnet fee funding verified; audit is queued.  
**Preconditions:** the client fee has been confirmed; exactly one immutable input snapshot; model-provider configuration meets minimum diversity; TEE provider preflight passes; data adapters available or limitations explicitly recorded.

1. Orchestrator creates eight run records and isolated input envelopes.
2. Each run receives the same thesis and visible conditions, its own method prompt, authorized data-source policy, and snapshot context.
3. Each attacker calls only typed Dissent tools; backend tools invoke allowlisted adapters.
4. Model response is parsed and validated against the attacker schema.
5. Invalid output gets a bounded schema-repair retry, then a bounded full retry; no infinite loops.
6. Evidence payloads are normalized, hashed server-side, and stored.
7. Valid output is sealed; no sibling can read it until all attacker execution is closed.

**State changes:** attacker runs, model usage, evidence records, output artifacts, job events.  
**Success:** all eight runs `COMPLETED`.  
**Failure:** provider timeout, rate limit, invalid schema, tool outage, TEE verification failure; run `FAILED` or `PARTIAL`, never `NOT_HIT`.  
**Edge cases:** model substitution must be explicitly recorded; a substitute that breaks family diversity prevents `TRADE`; retries reuse the same snapshot and cannot inspect sibling results.  
**Exit:** `EVIDENCE_REVIEW` when all runs complete or bounded retries exhaust.

### Flow C — Verify evidence and audit attackers
**Entry:** attacker output collection closes.  
**Preconditions:** stored outputs and evidence references are immutable for that run.

1. Evidence Auditor resolves all `evidence_refs`.
2. System re-fetches via provider-specific allowlisted adapters using stored locator and parameters—not a model-supplied arbitrary URL.
3. System compares source identity, block/time, payload hash, freshness, values, and derived calculations.
4. Evidence Auditor classifies each claim `VERIFIED`, `PARTIALLY_VERIFIED`, `UNVERIFIABLE`, or `CONTRADICTED` and records a reason.
5. Sycophancy Auditor checks repetition, condition paraphrase, ungrounded agreement, novelty, and whether Section B actually searched outside conditions.
6. Invalid-test declarations receive structural/methodological review. A mechanically malformed or unfalsifiable criterion can be established from the committed preimage itself.
7. Findings are deduplicated into clusters while preserving each original attacker attribution.

**Success:** each finding has evidence, novelty, and review dispositions.  
**Failure:** evidence provider unavailable or snapshot cannot be replayed; mark incomplete, do not infer a negative result.  
**Edge cases:** source changed since observation; evidence timestamp outside the approved freshness window; one finding refers to multiple records; duplicated finding submitted by multiple agents.  
**Exit:** `ADJUDICATING` when required reviews finish; otherwise `ABSTAIN` with explicit reason.

### Flow D — Adjudicate and certify
**Entry:** verification package complete.  
**Preconditions:** policy version pinned; all inputs frozen; no pending review task.

1. Deterministic adjudicator computes coverage, finding scores, disqualifying-risk gates, and unresolved divergence.
2. It applies verdict precedence: disqualifying verified failure → `REFUSE`; otherwise any critical uncertainty/coverage/divergence gate → `ABSTAIN`; otherwise all `TRADE` gates pass → `TRADE`; else `ABSTAIN`.
3. Certificate generator creates canonical JSON with all result references, coverage, minority findings, policy/version and hashes.
4. Certificate SHA-256 is calculated and registered on NEAR.
5. Bounty engine calculates accepted finding rewards and records the settlement instruction. Testnet settlement only if funded and authorized.
6. Reputation ledger updates idempotently from finalized accepted/rejected records.

**Success:** final certificate and public verification reference.  
**Failure:** policy input inconsistency, missing contract, chain unavailable, certificate hash mismatch; retain finalized off-chain artifact and mark anchoring pending; do not misreport `COMPLETED`.  
**Exit:** `COMPLETED` only when certificate stored and required registry transaction verified; otherwise `CERTIFICATE_PENDING`/`CERTIFICATE_FAILED`.

### Flow E — Inspect result
Client opens owned audit or reads result endpoint. Shows protocol verdict, verdict reasons, condition coverage, attacker run status, accepted/rejected findings, evidence links, preserved dissent, and on-chain verification. Client cannot edit finalized input or result.

### Flow F — Operator recovery
Admin inspects failed run and structured error. Admin may retry only the failed component within configured retry cap, using the original immutable input snapshot and same assigned family where available. Admin cannot change original thesis/conditions, replace a finding silently, or alter a finalized verdict. Any new model/provider configuration creates a new run version and is visible in the certificate.

## 4. Functional requirements

| ID | Feature | Requirement | Acceptance test |
|---|---|---|---|
| FR-01 | Client authentication | Validate scoped API keys; store hashes only | Invalid/revoked key receives 401; key cannot read another client audit |
| FR-02 | Audit intake | Validate typed thesis and conditions | Missing required fields rejected with field-level errors |
| FR-03 | Canonical commitment | Hash versioned canonical JSON | Same semantic normalized input produces same hash; changed condition changes hash |
| FR-04 | NEAR commit | Verify on-chain commit before queue | No attacker job exists before confirmed valid commit event |
| FR-05 | Isolation | Separate run context and data grants | Integration test proves attacker A01 cannot query A02 output or adjudicator store |
| FR-06 | Model diversity | Minimum 3 families / 2 vendors / attested open model | Audit cannot receive `TRADE` if preflight fails or diversity collapses |
| FR-07 | Attacker schema | Validate schema + cross-field rules | Missing/duplicate condition or invalid `INVALID_TEST` object rejected |
| FR-08 | Section B | Required outside-condition investigation | Empty Section B without justification flagged; accepted only after review |
| FR-09 | Evidence store | Store locator, observation, payload hash and retrieval metadata | Evidence ref resolves; server-generated hash matches stored payload |
| FR-10 | Evidence re-fetch | Re-fetch through allowlisted adapter | Unavailable source becomes `UNVERIFIABLE`, not `NOT_HIT` |
| FR-11 | Evidence auditor | Classify support outcome | Claim without supporting source cannot be accepted |
| FR-12 | Sycophancy auditor | Detect restatement/weak outside work | Pure condition paraphrase is flagged/rejected as Section B |
| FR-13 | Reproducibility | Replay same immutable snapshot/config where possible | New run records model/config/snapshot; no claim of reproducibility if unavailable |
| FR-14 | Adjudicator | Deterministic gates and precedence | Test vectors produce fixed expected verdicts |
| FR-15 | Dissent preservation | Keep minority accepted/qualified findings | Certificate contains non-winning findings and their dispositions |
| FR-16 | Certificate | Canonical, hashable and versioned | Independent recomputation equals on-chain hash |
| FR-17 | Reputation | Update from final accepted records once | Duplicate finalization does not double-count |
| FR-18 | Bounty | Reward only accepted findings; B Section multiplier >= A | Rejected finding payout is zero; identical severity B reward >= A |
| FR-19 | Safe failure | No trade on failed/abstained/incomplete audit | Any non-TRADE state blocks execution adapter |
| FR-20 | Audit trail | Record lifecycle and policy versions | Every final verdict traces to immutable inputs and decision record |
| FR-21 | UI console | Create, track, inspect, verify | Primary journey passes Playwright end-to-end |
| FR-22 | Operator recovery | Bounded retry with audit trail | Retry cannot duplicate payout or mutate original input |

## 5. Business logic and state machines

### Audit lifecycle states
`DRAFT → VALIDATING → AWAITING_COMMITMENT → COMMITTED → AWAITING_FUNDING → FUNDED → QUEUED → ATTACKING → EVIDENCE_REVIEW → SYCOPHANCY_REVIEW → REPRODUCIBILITY_CHECK → ADJUDICATING → CERTIFICATE_PENDING → COMPLETED`.

Terminal/exception states: `VALIDATION_FAILED`, `COMMITMENT_FAILED`, `ATTACKER_FAILED`, `REVIEW_FAILED`, `ADJUDICATION_FAILED`, `CERTIFICATE_FAILED`, `CANCELLED_BEFORE_COMMIT`. Post-commit cancellation is not allowed to erase an audit; it may set `CANCEL_REQUESTED` and stop only not-yet-started jobs, then produce an `ABSTAIN`/cancelled certificate record where applicable.

Rules:
- A committed audit is immutable. Changes create a new `audit_id` linked by `supersedes_audit_id`.
- `TRADE` requires all eight valid attacker outputs, model-diversity requirements, TEE evidence verification, all material conditions evaluable, required evidence review, no unresolved critical divergence, and no accepted disqualifying risk.
- `REFUSE` may be issued despite incomplete coverage only where a verified disqualifying finding establishes a clear no-go under the pinned policy.
- Otherwise incomplete coverage, missing evidence, unresolved material contradiction, or a critical invalid test yields `ABSTAIN`.
- A failed attacker is `FAILED`, never `NOT_HIT`.
- An unavailable source is `UNVERIFIABLE`, never proof of absence.
- Repeated API requests use idempotency keys. Repeated contract finalization and bounty settlements are blocked by unique IDs.
- No automatic trade execution is connected to MVP verdicts.

### Finding acceptance states
`SUBMITTED → EVIDENCE_REVIEW → SYCOPHANCY_REVIEW → ACCEPTED | REJECTED | NEEDS_REVIEW`.

- `ACCEPTED`: evidence is `VERIFIED`, finding is material and non-duplicate, novelty passes, and sycophancy review passes.
- `NEEDS_REVIEW`: evidence is partially verified, source replay is limited, novelty is uncertain, or a material conflict remains.
- `REJECTED`: evidence contradicted/unverifiable after bounded review, claim is unsupported, restates a condition, is duplicate without independent contribution, or violates schema.

### Adjudication policy v1.0
No majority vote and no single weighted average can override hard safety gates.

**Severity weights:** `CRITICAL=5`, `HIGH=4`, `MEDIUM=2`, `LOW=1`, `INFO=0.25`.

**Evidence factors:** `VERIFIED=1.0`, `PARTIALLY_VERIFIED=0.5`, `UNVERIFIABLE=0`, `CONTRADICTED=0`.

**Reproducibility factors:** `REPRODUCED=1.0`, `PARTIALLY_REPRODUCED=0.75`, `NOT_REPRODUCED=0.5`, `NOT_REPLAYABLE_SOURCE_LIMITATION=0.75`, `CONTRADICTED_ON_REPLAY=0`.

**Finding score:** `severity_weight × evidence_factor × reproducibility_factor`. Attacker self-reported confidence is not a multiplier and never substitutes for evidence. The score ranks findings and informs report prominence; it does not decide the verdict by summation.

**Bounty score:** `severity_weight × reproducibility_factor × section_multiplier`, where Section A multiplier is `1.0` and Section B multiplier is `1.25`. Payout is `min(per_finding_cap, base_unit × bounty_score)` and subject to per-audit/per-attacker caps and funded escrow. Only `ACCEPTED` findings are eligible. Duplicate cluster rewards are split across independently contributing attackers according to the same verified contribution rule; no duplicate full payout.

**Divergence index:** For each material condition, compare verified attacker statuses at the same market snapshot. `conflict_c=1.0` when at least one verified `HIT` and one verified `NOT_HIT` coexist; `0.5` when a verified `HIT` conflicts with `PARTIAL`, or `NOT_HIT` conflicts with `PARTIAL`; otherwise `0`. Weighted divergence `D = Σ(condition_weight × conflict_c) / Σ(condition_weight)` over material conditions with at least two valid assessments, where criticality weights are `CRITICAL=2`, `HIGH=1`, `NORMAL=0.5`. A critical unresolved direct conflict always forces `ABSTAIN` unless a disqualifying finding already forces `REFUSE`. `D >= 0.25` forces `ABSTAIN` unless evidence re-fetch resolves the conflict. Divergence is not a vote count.

**Verdict precedence:**
1. `REFUSE` if at least one `ACCEPTED` finding is explicitly marked `disqualifying` by the pinned policy, or a critical committed condition is verified `HIT`.
2. `ABSTAIN` if required attacker coverage/model diversity/TEE verification fails; a material condition is `INVALID_TEST` or not evaluable; a critical evidence source is unavailable; material contradictory evidence remains unresolved; `D >= 0.25`; or any required review is incomplete.
3. `TRADE` only if all eight attackers completed; minimum model-family/vendor/TEE requirements pass; all critical conditions are evaluable; no accepted disqualifying findings exist; no unresolved critical contradiction; no material data-quality block; and all reviews complete.
4. Any other state is `ABSTAIN`.

The policy file is versioned and included by hash in the certificate. A later policy change cannot rewrite prior verdicts.

## 6. Key product constraints

- Conditions are visible to attackers after on-chain commitment. Sibling outputs remain hidden.
- Section B is required and pays at least as well as Section A for comparable severity.
- Attackers can declare `INVALID_TEST`; it is a finding, not an automatic protocol-level invalidation.
- Evidence Auditor validates claim support, not the full investment decision.
- Sycophancy Auditor evaluates method quality, not whether the attacker agrees or disagrees.
- The adjudicator is deterministic and versioned; model assistance can classify inputs but cannot make the final verdict.
- The certificate preserves the full coverage matrix and material minority findings.
- No real financial execution is enabled in the MVP.

## 7. Success criteria

The demo must prove: a client commitment confirmed on NEAR before attack; eight independent runs; at least three model families/two vendors including a TEE-attested open-weight response; one controlled example of divergence; a validated `INVALID_TEST`; a verified Section B finding; evidence re-fetch; deterministic adjudication; a certificate whose hash matches NEAR; and an auditable bounty calculation/settlement path. Any fixture-backed result is explicitly labeled as a deterministic test fixture, not as a live model oracles' output.


## Economic MVP clarification

The hackathon flow includes a fixed, operator-configured **testnet** audit fee. The client first commits conditions on the registry, then funds the audit bounty vault using a quote-bound `fund_audit` transaction. Attacker jobs begin only after both transactions are verified. This is a testnet product-flow demonstration, not real revenue. Provider invoices are paid by Dissent's provider accounts; per-attacker inference costs are attributed to internal compute sub-ledgers unless provider billing genuinely supports separate agent payers. See [`docs/ECONOMICS_SPEC.md`](docs/ECONOMICS_SPEC.md).


## 8. Documented build deviations (2026-11-13)

These are operator-authorized deviations from the baseline above, recorded rather than silently resolved:

1. **TEE attestation (`WAIVED_BUDGET_CONSTRAINT`):** the direct NEAR AI Cloud API is not authorized under the zero-new-spend constraint, and OpenRouter's `near-ai` route is not an attested gateway. The TEE sub-clause is waived. No TEE badge or confidential-inference claim is made. The minimum three-family / two-vendor / one-open-weight gates remain enforced.
2. **Hosting/queue:** Render free Web Service + Neon free PostgreSQL replaces Railway. pg-boss runs in-process because the free plan has no background worker; concurrency is capped for the 512 MB instance.
3. **Providers:** OpenRouter primary + Groq secondary through one generic OpenAI-compatible adapter. No OpenAI/Anthropic SDKs.
4. **Human auth:** NEAR Wallet Selector + signed-nonce session cookie only. No email/password, Better Auth, magic link or public signup.

## 9. NEAR Hackathon track alignment

One Dissent submission spans four tracks; it is not four separate projects.

| Track | Positioning | Demonstrable proof |
|---|---|---|
| AI Security & Defense — primary | Pre-execution audit and safety gate for AI-controlled financial actions | Client conditions committed before review; `TRADE`/`REFUSE`/`ABSTAIN`; evidence checks; testnet settlement controls; no unrestricted agent key |
| Investment Thesis — primary | Reproducible, falsifiable, evidence-linked thesis artifact | Structured conditions, source-linked claims, coverage table, dissent-preserving certificate and verifiable hash |
| Agent Economy — secondary | Dissent earns audit fees and allocates rewards to internal specialist agents | Testnet client fee funding, accepted-finding bounty settlement, per-attacker compute-cost ledger and reputation; proprietary testnet execution via the capped vault; mainnet P&L remains future |
| AI Swarms — secondary | Eight internally managed specialist attackers with decorrelated failure modes | Distinct methods, minimum three model families/two vendors, TEE-attested open-weight model, source diversity, sibling isolation |

The project must be submitted once with the four selected tracks. Do not build separate repositories/projects to represent individual tracks.
