# Dissent — Project Specification

**Document status:** Implementation baseline for operator intake and coding-agent handoff  
**Product:** Dissent  
**Hackathon:** RYO-CHAN Hackathon 2026 — Track 1: Autonomous Agents  
**Specification version:** 1.0  
**Last updated:** 11 November 2026

> The operator makes product and architecture decisions before implementation. The coding agent is the implementation engineer, not an independent product manager.

---

# 1. Product definition

## 1.1 Product identity

**Name:** Dissent  
**One-line description:** An adversarial audit system that tests AI-generated crypto trading theses against independent failure domains and produces deterministic, evidence-linked decision certificates.  
**Positioning:** An adversarial audit system for autonomous trading decisions.  
**Tagline:** It doesn't predict. It audits conviction.

## 1.2 Problem

AI-assisted trading tools can produce persuasive theses, but the user may not know whether the reasoning is complete, whether the evidence actually supports the claim, or whether material risks were considered. An agent can selectively use evidence, overstate weak market data, ignore a conflicting market regime, or generate a plausible explanation without preserving an auditable trail.

The product addresses a narrower problem than market prediction: **how to challenge and record the reasoning behind an autonomous trading decision before that decision is treated as a practice-trade candidate.**

## 1.3 Current alternatives and workarounds

Users currently rely on some combination of:

- Manually checking a token with several market-analysis tools.
- Asking a second LLM to critique the first LLM's thesis.
- Running bull/bear prompts or multi-agent debates.
- Reading safety, liquidity, derivatives, and catalyst panels separately.
- Keeping screenshots, notes, spreadsheets, or chat histories as informal decision records.

These methods may help, but they do not necessarily enforce pre-registered failure conditions, conceal those conditions from the attackers, validate every finding against source evidence, or distinguish an anticipated failure from a newly discovered blind spot through deterministic rules.

## 1.4 Target users

1. Developers building autonomous trading agents.
2. Crypto market researchers who want a documented challenge process.
3. Quantitative or systematic trading researchers testing thesis quality.
4. Hackathon judges evaluating agent design, evidence provenance, and repeatability.

## 1.5 Roles

| Role | Description | Permissions |
|---|---|---|
| Visitor | Unauthenticated product visitor | View product information and deterministic sample demonstrations only |
| Analyst | Authenticated workspace user | Create and inspect own live analysis runs, theses, findings, and certificates; verify own certificates |
| Operator/Admin | Explicitly configured maintainer | Analyst permissions plus operational health, safe demo fixtures, and system configuration visibility; no ability to rewrite completed certificates |
| Background worker | Non-human service identity | Process queued runs using server-side credentials; cannot use browser sessions or expose secrets |

There are no organization/team workspaces, public user profiles, social feeds, or multi-user collaboration features in the MVP.

## 1.6 Core value proposition

The user receives more than an AI verdict. They receive a reproducible record of:

- The market evidence used to form the thesis.
- The thesis and its explicit horizon.
- Failure conditions committed before adversarial evaluation.
- The specialist domains that actually ran.
- Every attacker's finding and its exact evidence reference.
- The deterministic rule that produced the verdict.
- Evidence gaps and unsupported surfaces.

## 1.7 Key differentiator

The central mechanism is **pre-registered, concealed failure criteria + isolated specialist attackers + deterministic anticipated/unanticipated failure adjudication + an evidence-linked certificate**.

Multi-agent financial analysis and adversarial critique already exist as broad approaches. The product must not claim to have invented them. Its differentiation is the enforcement and audit design described above. The exact combination's uniqueness has not been established by a comprehensive prior-art or patent search.

## 1.8 Primary use case

An analyst selects a supported token. The system retrieves RYO evidence, validates it, generates a falsifiable thesis, seals its failure criteria, executes the enabled attackers in isolation, validates their evidence, adjudicates the findings deterministically, and stores a Decision Certificate.

## 1.9 Secondary use cases

- Inspect an earlier decision and its certificate.
- Re-run certificate integrity verification.
- Replay the deterministic adjudication from stored validated findings without calling an LLM again.
- Run fixed, clearly labelled demonstration scenarios without external credentials.
- Compare the coverage of different analysis runs for the same token (future; not a ranking or performance claim).

## 1.10 Explicit product boundaries

The product is **not**:

- A trading terminal or exchange interface.
- A wallet, custody service, broker, or execution engine.
- A source of guaranteed trading signals or profitability.
- A portfolio manager or personalized financial adviser.
- A market-data vendor.
- Proof that a token is safe, liquid, legitimate, or certain to rise/fall.
- A replacement for independent human due diligence.

No live order, wallet connection, asset transfer, real-money trade, position management, or automatic execution is permitted in the MVP. The `TRADE` verdict means only **survived the configured practice-trade evaluation**. The interface must always display this limitation next to the verdict.

---

# 2. MVP scope

## 2.1 MUST HAVE

1. Authenticated analyst workspace, plus public read-only demo mode.
2. RYO adapter using the official read-only REST interface; MCP is not implemented unless REST is unavailable and the operator explicitly supplies the supported MCP connection details.
3. Supported-token lookup and validation.
4. Raw RYO request/response snapshots with retrieval timestamps, source status, canonical hashes, and provenance.
5. Deterministic Data Integrity Gate.
6. Thesis Agent with a strict structured output contract.
7. Pre-registration and cryptographic commitment of thesis kill criteria.
8. Six-domain attacker registry with explicit per-run activation/unsupported states.
9. At least three fully working attackers in the MVP. Initial implementation order: Internal Logic & Evidence; Asset & Contract Safety; Liquidity & Exit. Other attackers activate only when actual RYO evidence supports them.
10. Isolated attacker execution with no access to criteria or other findings.
11. Deterministic evidence and schema validation.
12. Deterministic adjudicator with `TRADE`, `REFUSE`, and `ABSTAIN` verdicts.
13. Immutable, hash-verifiable Decision Certificate.
14. Complete history and run-detail views for the authenticated user.
15. Deterministic fixture-based demo with visible `SIMULATED` labels.
16. Unit, integration, negative, security, and Playwright E2E tests.
17. Responsive, accessible, reference-image-led final UI.
18. README, project docs, handoff files, build log, and <=180-second reviewed demo video.

## 2.2 SHOULD HAVE

- Market Regime & Sentiment attacker, when the returned `market_overview`/`deep_analysis` evidence supports it.
- Derivatives & Leverage attacker, when `deep_analysis` actually provides the required derivatives fields.
- Catalyst & Event Risk attacker, only when `deep_analysis` provides timestamped, attributable catalyst/event evidence.
- Server-sent progress events (SSE) for live run tracking; polling remains the fallback.
- Download certificate as JSON.
- Certificate verification screen and copyable certificate hash.

## 2.3 NICE TO HAVE

- JSON export of a complete run bundle, including source snapshots and prompts' version identifiers.
- A compact compare view for two historical certificates.
- Keyboard shortcuts for analyst workflows.
- Additional deterministic demo scenarios beyond the required set.

## 2.4 FUTURE

- Additional independent risk domains after evidence mapping and validation.
- External market-data providers for order-book depth, slippage, raw holder distribution, unlock calendars, and cross-venue fragmentation.
- Forward paper-trading evaluation and calibration research.
- Historical attacker-quality evaluation.
- A general-purpose adversarial decision-audit framework outside crypto markets.
- Public, selectively redacted certificate sharing.

## 2.5 OUT OF SCOPE

- Real trading, wallet connection, custody, or transaction signing.
- Real-money portfolio simulation or P&L claims.
- On-chain execution or exchange order placement.
- External news search or social-media sentiment ingestion in the MVP.
- External data providers not explicitly approved in operator intake.
- User-created attacker charters or editable adjudication rules.
- Agent voting, agent debate, or LLM-based final adjudication.
- Public sharing of private user data or unrestricted certificate publishing.
- Subscriptions, billing, payments, or monetization.

## 2.6 MVP run coverage rule

- The registry defines six specialist attacker domains.
- A run must execute at least three enabled attackers with valid outputs to be eligible for a normal verdict.
- Each attacker not run must have a recorded reason: `unsupported_evidence`, `disabled_by_policy`, or `not_in_mvp_build`.
- Unsupported attackers do not count as `NO_BREAK`.
- A run with fewer than three successful-or-valid-inconclusive attacker results is `INCOMPLETE` and has no verdict.
- A valid `INCONCLUSIVE` is different from a failed/timed-out/malformed execution. The latter is an execution failure, not a finding.
- If the Data Integrity Gate returns `BLOCK`, the run does not enter normal adjudication.

---

# 3. User roles and permissions

| Capability | Visitor | Analyst | Admin/Operator | Worker |
|---|---:|---:|---:|---:|
| View landing/product explanation | Yes | Yes | Yes | No |
| Run deterministic sample demo | Yes | Yes | Yes | No |
| Create live RYO analysis | No | Yes | Yes | Only as queued job |
| View own analysis runs | No | Yes | Yes | Only while processing |
| View another user's run | No | No | Only via explicit support procedure; not in default UI | Only as worker task requires |
| View/edit sealed criteria | No | Own runs, read-only after seal | Read-only | No attacker process access |
| Change attacker registry | No | No | Server configuration only; not through normal UI | No |
| Change adjudication logic | No | No | No through UI | No |
| Rewrite completed certificate | No | No | No | No |
| Verify certificate hash | Public for simulated demo; own certificates for live runs | Yes | Yes | Yes before persistence |
| Access secrets | No | No | No browser access | Server-side only |

Admin is an operational role, not a superuser capable of mutating historical records. Certificate correction creates a superseding certificate; it never overwrites the original.

---

# 4. Complete user flows

## 4.1 Visitor — inspect a deterministic demo

**Entry:** Home page → `Try a sample evaluation`.  
**Preconditions:** Public demo fixtures deployed; no authentication required.  
**Action:** Visitor selects one of the fixed sample scenarios (anticipated failure, unanticipated risk, or survived configured attacks).  
**System:** Loads versioned fixture data; marks every market observation and attacker result `SIMULATED`; executes the real deterministic validator/adjudicator/certificate hashing code; does not call RYO or the LLM provider.  
**State changes:** Creates a demo-run record or renders a prebuilt fixture record; no private analyst data is written.  
**Validation:** Scenario ID must be in the server-side allowlist.  
**Success:** A clearly labelled sample certificate is displayed and hash verification succeeds.  
**Failure:** Show demo unavailable and preserve the visitor's ability to inspect product documentation.  
**Edge cases:** Unknown scenario ID, invalid fixture hash, outdated schema, browser refresh.  
**Permissions:** Public, read-only, no live analysis.  
**Exit:** Demo certificate or home page.

Flow:

```text
Visitor
  -> Demo scenario allowlist
  -> Deterministic fixture loader
  -> Evidence/criteria/finding validators
  -> Deterministic adjudicator
  -> Certificate hasher
  -> SIMULATED certificate UI
```

## 4.2 Analyst — sign in

**Entry:** Sign-in route.  
**Preconditions:** Supabase Auth configured; operator has provided allowed auth redirect URLs.  
**Action:** Analyst requests email OTP/magic link and follows it.  
**System:** Supabase verifies the identity and issues a session. Frontend stores the session using the supported Supabase client flow; backend validates access-token signature, issuer, audience, expiry, and subject.  
**State changes:** Supabase Auth user record; profile is created lazily on first authenticated request if required.  
**Validation:** Valid email, rate limits, valid state/nonce, allowed redirect origin.  
**Success:** Analyst lands on workspace.  
**Failure:** Display neutral errors; do not reveal whether an email has an account.  
**Edge cases:** Expired link, reused OTP, provider outage, unverified email, revoked session.  
**Permissions:** Only authenticated user gets analyst access.  
**Exit:** Workspace or sign-in error state.

## 4.3 Analyst — create a live analysis

**Entry:** Workspace → `New analysis`.  
**Preconditions:** Valid authenticated session; RYO and OpenAI credentials configured; at least one supported token available; run budget not exceeded.  
**Action:** Analyst selects a token from `supported_tokens`/search results or enters a token identifier and confirms it resolves to a supported asset. The user may optionally supply a hypothesis to test; if omitted, the Thesis Agent proposes one. Attacker activation is computed by the backend from the registry, evidence availability, and configured MVP policy; the browser cannot request, disable, or force individual attackers.  
**System:** API validates the asset identifier, applies user/run rate limits, creates an analysis run, records an idempotency key, and inserts a durable job in the database queue within the same transaction. It returns `202 Accepted`.  
**State changes:** `analysis_runs`, `analysis_jobs`, and `audit_events` rows created.  
**Validation:** Supported asset identity, no duplicate active submission for same idempotency key, valid optional hypothesis length, per-user concurrency cap.  
**Success:** User is routed to run progress view.  
**Failure:** No job created on validation failure; API returns structured error. If worker queue transaction fails, the run is not left queued without a job.  
**Edge cases:** Double-click, browser retry, unsupported symbol, token alias collision, user loses network after 202, account disabled, run budget exhausted.  
**Permissions:** Analyst can create only in own workspace.  
**Exit:** Run detail/progress screen.

## 4.4 Worker — retrieve and preserve RYO evidence

**Entry:** Durable analysis job claimed by worker.  
**Preconditions:** Run is queued; credentials are present; worker lease acquired.  
**System:** Fetches `supported_tokens` as needed for identity resolution, then calls the minimum required evidence tools: `market_overview`, `analyze_token`, `deep_analysis`, and `check_safety`; `scan_market` may be used only when candidate discovery is required. `compare_tokens` is not required for a single-token audit and is not an attacker surface.  
**State changes:** Raw request/response stored as market snapshots with source, timestamps, response status, canonical hash, and correlation IDs.  
**Validation:** Parse response schema without assuming undocumented properties. Detect explicit source failure/unavailable fields.  
**Success:** Evidence snapshot complete enough for integrity gate.  
**Failure:** Store each failed tool call as an explicit unavailable/error record; do not replace missing values with zero, null-derived estimates, or fabricated text. If core evidence is insufficient, block normal thesis generation.  
**Edge cases:** RYO rate limit, timeout, partial payload, schema drift, source fallback, stale cache, mismatched token identity.  
**Permissions:** Worker only; user cannot directly call arbitrary RYO endpoints.  
**Exit:** `validating_data`.

## 4.5 Worker — Data Integrity Gate

**Preconditions:** Evidence snapshots stored.  
**System:** Deterministic validators inspect asset identity, schema, freshness, timestamps, missing required data, source status, compatible timeframes, and content hashes.  
**State changes:** Data-gate report stored with `PASS`, `WARN`, or `BLOCK`; reason codes and affected evidence references are preserved.  
**Success:** PASS or WARN permits thesis generation. WARN must travel into the thesis context and certificate.  
**Failure:** BLOCK prevents normal run; run becomes `BLOCKED` with a machine-readable reason.  
**Edge cases:** One optional source unavailable; core price unavailable; data timestamps missing; same asset different contract; conflicting snapshots.  
**Permissions:** Deterministic backend only.  
**Exit:** `generating_thesis` or `blocked`.

## 4.6 Worker — generate thesis and commit criteria

**Preconditions:** Data Gate PASS/WARN; sufficient required evidence; enabled attacker registry known.  
**System:** Thesis Agent receives normalized raw evidence and asks for one falsifiable thesis. It returns asset, direction, horizon, claim, evidence references, assumptions, criteria, invalidation condition, what would change its mind, and limitations. Code validates the thesis and criteria against the registered vocabularies. The criteria are committed and sealed before any attacker prompt is constructed.  
**State changes:** Thesis package saved; criteria rows saved; `criteria_hash` and `committed_at` persisted; immutable commit event appended; run enters `criteria_sealed`.  
**Validation:** At least one criterion per enabled attacker surface; 3–8 total criteria; valid unique surface/defeat pairs; evidence-supported wording; explicit horizon; criteria hash verifies.  
**Success:** Attacker execution may start.  
**Failure:** No attacker starts. Run becomes `INCOMPLETE` or `BLOCKED` with validation detail.  
**Edge cases:** Unsupported defeat, duplicate criterion, model invents evidence reference, invalid token identity, incomplete thesis, criteria commit write failure.  
**Permissions:** Thesis service and registry only. Analysts may inspect their sealed criteria in UI; attackers cannot.  
**Exit:** `attacking`.

## 4.7 Worker — execute isolated attackers

**Preconditions:** Criteria successfully committed; evidence pack built; at least three attackers enabled.  
**System:** Creates one stateless model request per attacker. Each request receives only that attacker's charter, thesis view with `kill_criteria` removed, permitted raw RYO evidence, output schema, and prompt version. No tools, shared chat history, criteria, or other findings are included. Requests run concurrently subject to configured concurrency and cost limits.  
**State changes:** Attacker execution rows transition queued → running → succeeded/failed/timed_out. Raw model outputs and token usage are retained.  
**Validation:** Schema validation followed by evidence-reference validation. One constrained repair retry is allowed for malformed JSON/schema, using the same evidence and no extra market data.  
**Success:** Each enabled attacker has a validated `BREAK`, `NO_BREAK`, or `INCONCLUSIVE` finding.  
**Failure:** Execution timeout/failure or invalid evidence after retry is not silently treated as NO_BREAK. If fewer than three valid findings exist, run is `INCOMPLETE`; if at least three valid findings exist but a domain is intentionally unsupported, coverage is limited and disclosed.  
**Edge cases:** Prompt injection in token metadata, model provider outage, invalid JSON, duplicate evidence, fabricated quote, zero evidence, agent returns wrong surface.  
**Permissions:** Isolated attacker worker only.  
**Exit:** `validating_findings`.

## 4.8 Worker — adjudicate and persist certificate

**Preconditions:** At least three validated findings; valid sealed criteria hash; Data Integrity not BLOCK.  
**System:** Runs the pure deterministic adjudicator. It maps valid BREAK findings to the sealed criteria and applies fixed precedence. The result is persisted in a certificate with raw evidence references, attacker results, coverage state, rules version, prompt/model versions, and hashes.  
**State changes:** Final verdict and certificate record are committed atomically; run becomes `COMPLETED`.  
**Validation:** Recompute criteria hash, evidence hashes, certificate hash, and adjudication result from stored inputs before persistence.  
**Success:** Certificate detail page is available.  
**Failure:** Hash mismatch or persistence failure means `INCOMPLETE`; no completed verdict is displayed.  
**Edge cases:** DB connection lost during write, duplicate worker execution, hash canonicalization mismatch, two workers race to complete.  
**Permissions:** Worker only.  
**Exit:** Completed certificate or incomplete run.

## 4.9 Analyst — inspect and verify certificate

**Entry:** Completed run detail or history.  
**Action:** Analyst opens findings, evidence, coverage, limitations, and certificate. Can request verification.  
**System:** API checks ownership, recalculates hashes, replays deterministic adjudication from stored findings/criteria, and returns integrity status. It does not re-call LLM or RYO.  
**State changes:** Append verification audit event. The certificate itself is unchanged.  
**Success:** Show `VERIFIED` or a precise mismatch status.  
**Failure:** Do not label as verified; show the mismatch and record verification failure.  
**Edge cases:** Old schema version, deleted external provider record, partial historical snapshot, corrupted record.  
**Permissions:** Owner or admin support pathway; public visitor only for published sample fixtures.  
**Exit:** Certificate/history.

## 4.10 Cancellation and recovery

A user may request cancellation before `criteria_sealed`. After criteria are sealed, cancellation cannot delete the commitment or erase attacker attempts; the system may stop remaining work and mark the run `INCOMPLETE` with an explicit cancellation reason. Worker leases expire and can be reclaimed safely. Completed certificates are immutable.

---

# 5. Functional requirements

| ID | Feature | Actor | Inputs | Processing and business logic | Outputs | Validation/permissions | Acceptance criteria |
|---|---|---|---|---|---|---|---|
| FR-01 | Authentication | Visitor/Analyst | Email OTP/magic link | Supabase Auth issues session; API verifies JWT | Analyst session | Rate-limited; allowed redirect origins | Unauthenticated user cannot read live runs; expired token is rejected |
| FR-02 | Supported-token lookup | Analyst | Query/token identifier | Calls RYO `supported_tokens`; caches only with explicit TTL and timestamp | Supported assets | Validate identifier and returned asset identity | Unsupported token never starts a live run |
| FR-03 | RYO evidence retrieval | Worker | Asset ID and approved tool list | Calls allowlisted read-only tools and stores raw outputs | Market snapshots | No arbitrary URL/tool invocation; provider errors preserved | Every used value points to a snapshot/hash; unavailable data remains unavailable |
| FR-04 | Data Integrity Gate | Worker | Market snapshots | Deterministic schema, freshness, identity, completeness, and hash checks | PASS/WARN/BLOCK report | Versioned rules | BLOCK prevents thesis/normal verdict; WARN appears in certificate |
| FR-05 | Thesis generation | Thesis Agent | Valid evidence bundle, optional user hypothesis | Structured model response; facts and interpretations separated | Thesis package | Zod/JSON Schema and evidence pointer checks | No unsupported evidence claims accepted |
| FR-06 | Criteria sealing | Registry service | Thesis criteria | Validate controlled vocabulary, enabled surface, duplicates, count; hash and commit | Immutable criteria commitment | Atomic DB transaction before attacker start | Tests prove every attacker starts after persisted commit; attackers never receive criteria |
| FR-07 | Attacker registry | System | Static registry version | Exposes six charters and activation status | Per-run attacker manifest | Registry immutable to normal users | Each run records enabled, unsupported, disabled domains and reasons |
| FR-08 | Specialist attack | Worker/LLM | Isolated charter, thesis view, evidence | One independent stateless request per attacker | Structured finding | No tools, criteria, peer findings, or shared conversation | Automated tests verify payload contains none of the forbidden fields |
| FR-09 | Finding validation | Worker | Model output | Schema, surface, vocabulary, snapshot hash, JSON Pointer/value validation | Validated finding or execution error | One repair retry max | Fabricated/missing evidence cannot become BREAK or NO_BREAK |
| FR-10 | Adjudication | Deterministic core | Valid findings, sealed criteria, coverage | Apply fixed precedence; no LLM call | TRADE/REFUSE/ABSTAIN | Pure function, versioned rules | Same inputs always return same verdict; all scenario tests pass |
| FR-11 | Certificate | Worker | Run artifacts and adjudication | Canonicalize, hash, persist write-once | Decision Certificate | Immutable record; supersedes for corrections | Recomputed hash and replayed adjudication match stored certificate |
| FR-12 | Run history | Analyst | Authenticated user | Query by owner and cursor pagination | List/detail | Owner checks on every route | User A cannot read User B's run by guessing UUID |
| FR-13 | Demo | Visitor | Allowlisted scenario ID | Deterministic fixtures, same validators/adjudicator, simulated label | Sample certificate | No RYO/LLM call | Demo works without secrets and never presents simulated values as live |
| FR-14 | Progress | Analyst | Run ID | SSE/polling from persisted statuses | Current phase/status | Owner authorization | Refresh does not lose current status; terminal state visible |
| FR-15 | Verify/replay | Analyst | Certificate ID | Recompute hashes and adjudication locally from stored artifacts | Verification report | Read-only, owner-scoped | Verification does not call RYO or LLM and does not mutate certificate |
| FR-16 | Operational health | Admin/Operator | Authenticated admin | Reports dependency health without secrets | Health report | Secret values never returned | Public health endpoint reveals no keys, URLs containing credentials, or user data |

## 5.1 Required thesis contract

```json
{
  "asset": {
    "symbol": "ETH",
    "name": "Ethereum",
    "chain": "...",
    "asset_id": "provider-resolved-id"
  },
  "direction": "LONG",
  "horizon": "24h",
  "claim": "A falsifiable, bounded statement supported by the captured evidence.",
  "supporting_evidence": [
    {
      "snapshot_id": "uuid",
      "tool": "analyze_token",
      "json_pointer": "/data/technical/rsi_14",
      "observed_value": "...",
      "interpretation": "..."
    }
  ],
  "assumptions": ["..."],
  "kill_criteria": [
    {"surface": "internal_logic", "defeat": "citation_missing", "description": "..."}
  ],
  "invalidation_condition": "...",
  "what_would_change_my_mind": ["..."],
  "limitations": ["..."]
}
```

The example is illustrative, not a claim that the listed JSON Pointer exists in RYO responses. The implementation must validate pointers against actual captured payloads and use the provider's real schema.

## 5.2 Required attacker finding contract

```json
{
  "surface": "internal_logic",
  "strongest_attack": "...",
  "defeats": ["citation_missing"],
  "evidence": [
    {
      "snapshot_id": "uuid",
      "tool": "analyze_token",
      "output_hash": "sha256:...",
      "json_pointer": "/data/example/path",
      "observed_value": "exact value resolved from the stored output",
      "reasoning": "Why this observation challenges the thesis"
    }
  ],
  "finding": "BREAK",
  "severity": "high",
  "reasoning_note": "..."
}
```

`observed_value` must be derived from the stored output using the supplied pointer. Do not rely solely on a free-form model quote. If the source output is textual, a literal excerpt may be stored and checked as an exact substring. `NO_BREAK` requires an empty `defeats` array. `INCONCLUSIVE` requires a reason and must not pretend that missing data disproves the thesis.

---

# 6. Business logic and state machines

## 6.1 Six attacker domains

The registry contains the following six specialist attackers. Their existence in the registry does not imply that RYO provides all required evidence. The per-run manifest is the source of truth for what actually executed.

### A1 — Liquidity & Exit Feasibility (`liquidity_exit`)

**Question:** Does the available market evidence support a realistic entry/exit assumption for the thesis horizon?  
**RYO evidence candidates:** `analyze_token`, `market_overview`, `deep_analysis`.  
**Defeat vocabulary:**
- `volume_collapse`
- `liquidity_signal_deterioration`
- `volume_horizon_mismatch`
- `venue_concentration`

The terms `insufficient_depth` and `slippage_exceeds_horizon` are **not enabled in the MVP** unless the actual RYO response contains direct depth/slippage data. Volume/market-cap proxies must not be described as order-book depth or executable slippage. `venue_concentration` requires actual venue breakdown evidence.

### A2 — Asset & Contract Safety (`safety_contract`)

**Question:** Is there a reported token/contract safety issue that materially challenges the thesis?  
**RYO evidence candidates:** `check_safety`, `deep_analysis`, `analyze_token`.  
**Candidate defeat vocabulary:**
- `holder_concentration`
- `mint_authority`
- `freeze_authority`
- `liquidity_unlocked`
- `unlock_within_horizon`
- `honeypot_like`
- `safety_flag`

Each term is enabled only when the returned RYO data exposes evidence capable of supporting it. A generic `safety_flag` can be used only when the source explicitly reports a warning. Never infer verified contract permissions, ownership concentration, or unlock schedules from silence or a generic score.

### A3 — Internal Logic & Evidence (`internal_logic`)

**Question:** Does the thesis logically follow from its cited evidence?  
**Evidence:** Thesis package plus the exact cited RYO snapshots; no new market-data call.  
**Defeat vocabulary:**
- `citation_missing`
- `correlation_as_causation`
- `horizon_mismatch`
- `claim_overreach`
- `circular_evidence`
- `cherry_picking`

This attacker challenges reasoning. It cannot create new market observations or claim contract/market facts not present in the evidence.

### A4 — Market Regime & Sentiment (`market_regime`)

**Question:** Does the broader market environment materially conflict with the thesis?  
**RYO evidence candidates:** `market_overview`, `deep_analysis`.  
**Defeat vocabulary:**
- `regime_conflict`
- `sentiment_reversal`
- `market_breadth_deterioration`
- `market_phase_mismatch`
- `macro_timing_conflict`

The current official hackathon tool catalog does not list a dedicated `monitor_market_sentiment_shift` tool. This attacker may use only sentiment/regime fields actually present in the published RYO tools. If such evidence is absent, mark it unsupported for that run. No external news or social sentiment is introduced in the MVP.

### A5 — Derivatives & Leverage (`derivatives_leverage`)

**Question:** Does derivatives positioning or leverage create a material fragility for the thesis?  
**RYO evidence candidates:** `deep_analysis`, and `market_overview` only if derivatives fields are actually returned.  
**Defeat vocabulary:**
- `funding_extreme`
- `crowded_positioning`
- `open_interest_divergence`
- `liquidation_vulnerability`
- `derivatives_regime_shift`

Only enable terms supported by actual returned fields. Do not infer long/short positioning, funding, open interest, or liquidation levels if the payload does not include them.

### A6 — Catalyst & Event Risk (`catalyst_event`)

**Question:** Is a documented catalyst/event likely to conflict with the thesis or its holding horizon?  
**RYO evidence candidates:** `deep_analysis` only if it supplies attributable, timestamped catalyst/event material.  
**Defeat vocabulary:**
- `major_unlock_event`
- `adverse_governance_event`
- `protocol_incident`
- `exchange_risk_event`
- `catalyst_horizon_conflict`

A generic market-intelligence statement is not a verified event. If sources, timestamps, or event details are absent, the attacker is unsupported or returns INCONCLUSIVE; it does not invent news.

## 6.2 Data Integrity Gate (not a seventh attacker)

The gate is deterministic and cross-cutting. It checks asset identity, tool/schema validity, freshness, timestamps, missing required fields, timeframe compatibility, explicit provider source status, and output hashes.

**Reason vocabulary:** `stale_data`, `conflicting_observations`, `incomplete_coverage`, `asset_identity_mismatch`, `incompatible_timeframes`, `data_integrity_failure`.

Outcomes:
- `PASS`: all required evidence checks pass.
- `WARN`: a non-critical source/field is unavailable or questionable; limitation is carried forward.
- `BLOCK`: identity, required evidence, integrity, or freshness is too compromised for normal thesis evaluation.

The gate is not allowed to declare a token safe or a thesis valid. It only determines whether the evidence package is usable.

## 6.3 RYO tool catalog baseline

Use the current official hackathon catalog as the baseline:

| Tool | Planned use |
|---|---|
| `market_overview` | Broad market context and regime inputs |
| `scan_market` | Optional candidate discovery; not a core single-token attacker call |
| `analyze_token` | Token market/technical evidence |
| `deep_analysis` | Detailed technical, risk, derivatives, and other returned analysis fields |
| `compare_tokens` | Optional comparison; not a core attacker surface |
| `check_safety` | Primary A2 safety evidence |
| `supported_tokens` | Asset discovery/identity validation |

The previously mentioned `monitor_market_sentiment_shift` is not in the current published seven-tool catalog and must not be called unless the organizer provides current documentation showing it is available to this project. The exact REST path, authentication header, request parameters, response schemas, rate limits, and quotas must be obtained from organizer-provided developer documentation/credentials during intake. Never invent these details.

## 6.4 Run state machine

```text
CREATED
  -> QUEUED
  -> FETCHING_DATA
  -> VALIDATING_DATA
      -> BLOCKED                         (if Data Gate = BLOCK)
      -> GENERATING_THESIS               (if PASS/WARN)
  -> VALIDATING_CRITERIA
      -> INCOMPLETE                      (if invalid)
      -> CRITERIA_SEALED                 (only after committed hash)
  -> ATTACKING
  -> VALIDATING_FINDINGS
      -> INCOMPLETE                      (if fewer than 3 valid findings or execution failure)
  -> ADJUDICATING
  -> GENERATING_CERTIFICATE
      -> INCOMPLETE                      (if validation/persistence fails)
      -> COMPLETED                       (certificate persisted and verified)
```

Terminal states: `COMPLETED`, `INCOMPLETE`, `BLOCKED`, `CANCELLED`. A terminal run is immutable except for appended verification/audit events and a superseding certificate.

## 6.5 Attacker execution state

`QUEUED -> RUNNING -> SUCCEEDED | INCONCLUSIVE | FAILED | TIMED_OUT | INVALID | SKIPPED_UNSUPPORTED`.

- `SUCCEEDED` contains a valid `BREAK` or `NO_BREAK`.
- `INCONCLUSIVE` is a valid structured finding stating evidence is insufficient.
- `FAILED`, `TIMED_OUT`, and `INVALID` are execution/validation failures, never NO_BREAK.
- `SKIPPED_UNSUPPORTED` records a missing-evidence limitation and is not counted as a finding.

## 6.6 Criteria sealing rules

- Criteria count: 3–8 for the MVP.
- At least one criterion maps to each enabled attacker surface.
- A criterion must reference a defeat term enabled for that attacker in the current registry version.
- No duplicate `(surface, defeat)` pair.
- Criteria hash uses canonical JSON with stable key ordering and UTF-8 encoding.
- Commit timestamp is written in the same database transaction as the criteria set and commit audit event.
- An attacker job may be enqueued only after the transaction commits and hash verification passes.
- Attack payload builder receives a thesis projection from which `kill_criteria`, criteria IDs, hashes, and commit metadata are removed.

## 6.7 Adjudication rules and precedence

The adjudicator is a pure deterministic function. It receives validated findings, sealed criteria, Data Gate status, and the enabled attacker manifest. It does not receive raw LLM reasoning beyond validated structured findings.

1. If Data Gate is `BLOCK`, do not adjudicate; run is `BLOCKED`.
2. If fewer than three enabled attacker results are valid, do not issue a verdict; run is `INCOMPLETE`.
3. If any valid `BREAK` maps to a pre-registered criterion on the same surface, verdict is `REFUSE`.
4. Otherwise, if any valid `BREAK` does not map to a pre-registered criterion, verdict is `ABSTAIN`.
5. Otherwise, if two or more required attackers return valid `INCONCLUSIVE`, verdict is `ABSTAIN`.
6. Otherwise, verdict is `TRADE` (practice-only). If exactly one valid INCONCLUSIVE exists or optional surfaces were unsupported, mark `coverage_status=LIMITED` and show the limitations prominently.

**Precedence rule:** If an anticipated BREAK and an unanticipated BREAK both occur, final verdict is REFUSE, but both findings remain in the certificate. The unanticipated BREAK must never be dropped.

`severity` does not change the verdict. Agent confidence does not change the verdict. A majority vote does not exist. A missing attacker is not NO_BREAK. The system does not compute probability of profit.

## 6.8 Idempotency, cancellation, and retries

- `POST /analyses` requires an idempotency key. Same user + same key returns the existing run.
- Worker job claims use PostgreSQL row locking and expiring leases.
- Tool retries: at most two attempts for transient network/rate-limit errors, with bounded exponential backoff respecting provider retry-after.
- LLM schema repair: at most one constrained retry per model step.
- No unbounded retry loops.
- Cancellation is allowed before criteria sealing. After sealing, cancellation preserves the commit and records an incomplete run.
- Certificate writes use unique `run_id` for the first version; duplicate workers cannot create competing final certificates.

---

# 7. Data model

PostgreSQL is the system of record. IDs are UUIDs. All timestamps are UTC `timestamptz`. JSON payloads use `jsonb`; large raw provider responses may be stored in object storage only if later approved, otherwise Postgres stores them within configured response-size limits.

## 7.1 Entities

### `profiles`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | uuid PK | Yes | Same ID as Supabase Auth `auth.users.id` |
| `display_name` | text | No | User-provided, optional |
| `role` | enum `analyst/admin` | Yes | Default `analyst`; admin provisioned out of band |
| `created_at` | timestamptz | Yes | Server default |
| `updated_at` | timestamptz | Yes | Server maintained |

### `analysis_runs`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | uuid PK | Yes | Run identifier |
| `user_id` | uuid FK profiles | Yes | Owner |
| `asset_id` | text | Yes | Provider-resolved stable identifier |
| `symbol` | text | Yes | Display symbol, not identity key alone |
| `asset_name` | text | No | Source-derived |
| `chain` | text | No | Source-derived |
| `status` | enum | Yes | Run state machine |
| `verdict` | enum `TRADE/REFUSE/ABSTAIN` | No | Only for completed runs |
| `coverage_status` | enum `COMPLETE/LIMITED` | No | Not a profit-confidence score |
| `data_gate_status` | enum | No | PASS/WARN/BLOCK |
| `enabled_surfaces` | text[] | Yes | Per-run manifest |
| `registry_version` | text | Yes | Attacker contract version |
| `rules_version` | text | Yes | Adjudicator version |
| `prompt_set_version` | text | Yes | Prompt bundle version |
| `idempotency_key` | text | Yes | Unique per user |
| `error_code` | text | No | Stable machine code |
| `error_summary` | text | No | Redacted user-safe explanation |
| `created_at` | timestamptz | Yes | UTC |
| `started_at` | timestamptz | No | UTC |
| `completed_at` | timestamptz | No | UTC |

Unique: `(user_id, idempotency_key)`. Index: `(user_id, created_at desc)`, `(status, created_at)`, `(asset_id, created_at desc)`.

### `analysis_jobs`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | uuid PK | Yes | Job identifier |
| `run_id` | uuid FK analysis_runs | Yes | Unique for initial run job |
| `status` | enum `QUEUED/RUNNING/RETRY/COMPLETED/FAILED` | Yes | Durable job state |
| `attempt_count` | int | Yes | Default 0 |
| `available_at` | timestamptz | Yes | Default now |
| `locked_at` | timestamptz | No | Worker lease start |
| `locked_by` | text | No | Worker instance ID |
| `lease_expires_at` | timestamptz | No | Recovery after crash |
| `last_error_code` | text | No | No secret values |
| `created_at` | timestamptz | Yes | UTC |
| `updated_at` | timestamptz | Yes | UTC |

Indexes: `(status, available_at)`, `(lease_expires_at)`. Unique: `run_id` for the single initial job.

### `market_snapshots`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | uuid PK | Yes | Snapshot ID |
| `run_id` | uuid FK analysis_runs | Yes | Parent run |
| `tool_name` | text | Yes | Allowlisted RYO tool |
| `request_fingerprint` | text | Yes | Hash of normalized safe request parameters |
| `raw_response` | jsonb | Yes | Exact parsed provider response, redacted for secrets |
| `response_hash` | text | Yes | SHA-256 of canonical raw response |
| `source_status` | text | Yes | Provider status as returned/normalized |
| `retrieved_at` | timestamptz | Yes | Server timestamp |
| `provider_timestamp` | timestamptz | No | If present in source |
| `schema_version` | text | No | Adapter schema version |
| `latency_ms` | int | No | Observability |
| `error_code` | text | No | If call failed |

Indexes: `(run_id, tool_name)`, `(retrieved_at desc)`, `(response_hash)`. Immutable after insert.

### `data_gate_reports`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | uuid PK | Yes | Report ID |
| `run_id` | uuid FK unique | Yes | One gate report per run |
| `status` | enum `PASS/WARN/BLOCK` | Yes | Gate output |
| `reason_codes` | text[] | Yes | Deterministic reason vocabulary |
| `checks` | jsonb | Yes | Check outcomes + snapshot references |
| `rule_version` | text | Yes | Data-gate rules version |
| `created_at` | timestamptz | Yes | UTC |

### `thesis_packages`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | uuid PK | Yes | Thesis ID |
| `run_id` | uuid FK unique | Yes | One thesis per run in MVP |
| `thesis_json` | jsonb | Yes | Structured thesis; UI may show criteria after commit |
| `thesis_hash` | text | Yes | Canonical thesis hash excluding mutable status metadata |
| `model_id` | text | Yes | Actual model identifier |
| `prompt_version` | text | Yes | Prompt version |
| `created_at` | timestamptz | Yes | UTC |

### `kill_criteria`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | uuid PK | Yes | Criterion ID |
| `thesis_id` | uuid FK thesis_packages | Yes | Parent thesis |
| `surface` | text | Yes | One of six registry IDs |
| `defeat` | text | Yes | Controlled term |
| `description` | text | Yes | Clear testable description |
| `created_at` | timestamptz | Yes | UTC |

Unique: `(thesis_id, surface, defeat)`.

### `criteria_commitments`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | uuid PK | Yes | Commitment ID |
| `thesis_id` | uuid FK unique | Yes | One commit per thesis |
| `criteria_hash` | text | Yes | Canonical SHA-256 |
| `registry_version` | text | Yes | Defeat vocabulary version |
| `committed_at` | timestamptz | Yes | Server timestamp |
| `commit_event_id` | uuid FK audit_events | Yes | Append-only event reference |

### `attacker_executions`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | uuid PK | Yes | Execution ID |
| `run_id` | uuid FK analysis_runs | Yes | Parent run |
| `surface` | text | Yes | One of six surfaces |
| `status` | enum | Yes | Attacker execution state |
| `evidence_snapshot_ids` | uuid[] | Yes | Exact inputs |
| `input_hash` | text | Yes | Hash of attacker payload |
| `output_json` | jsonb | No | Raw structured response after secret/redaction checks |
| `output_hash` | text | No | Canonical output hash |
| `model_id` | text | No | Provider model |
| `prompt_version` | text | Yes | Charter prompt version |
| `attempt_count` | int | Yes | Default 0 |
| `usage_json` | jsonb | No | Token usage/cost metadata where available |
| `started_at` | timestamptz | No | UTC |
| `completed_at` | timestamptz | No | UTC |
| `error_code` | text | No | Stable code |

Unique: `(run_id, surface)`. Index: `(run_id, status)`.

### `attack_findings`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | uuid PK | Yes | Finding ID |
| `execution_id` | uuid FK unique | Yes | One validated finding per execution |
| `surface` | text | Yes | Must match execution |
| `finding` | enum `BREAK/NO_BREAK/INCONCLUSIVE` | Yes | Validated result |
| `severity` | enum `high/medium/low` | Yes | Descriptive only |
| `defeats` | text[] | Yes | Controlled terms |
| `evidence` | jsonb | Yes | Exact snapshot/pointer/value references |
| `reasoning_note` | text | Yes | Bounded explanation |
| `validation_status` | enum `VALID/INVALID` | Yes | Only VALID may adjudicate |
| `validation_report` | jsonb | Yes | Deterministic checks |
| `created_at` | timestamptz | Yes | UTC |

### `decision_certificates`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | uuid PK | Yes | Certificate ID |
| `run_id` | uuid FK unique | Yes | One first certificate per run |
| `version` | int | Yes | Starts at 1 |
| `certificate_json` | jsonb | Yes | Canonical certificate payload |
| `certificate_hash` | text | Yes | Hash excluding its own hash field |
| `supersedes_id` | uuid FK nullable | No | Correction chain |
| `created_at` | timestamptz | Yes | UTC |

Unique: `(run_id, version)` and `(certificate_hash)`. Completed versions are immutable.

### `audit_events`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | uuid PK | Yes | Event ID |
| `run_id` | uuid FK nullable | No | Related run |
| `actor_type` | enum `USER/SYSTEM/WORKER/ADMIN` | Yes | Actor category |
| `actor_id` | text nullable | No | User or service ID; no secret |
| `event_type` | text | Yes | Stable event name |
| `payload` | jsonb | Yes | Redacted metadata only |
| `previous_event_hash` | text nullable | No | Optional append-chain integrity |
| `event_hash` | text | Yes | SHA-256 of canonical event |
| `created_at` | timestamptz | Yes | UTC |

Insert-only; application DB role has no UPDATE/DELETE permission.

### `idempotency_records`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | uuid PK | Yes | Record |
| `user_id` | uuid FK profiles | Yes | Owner |
| `key` | text | Yes | Client-supplied opaque key |
| `request_hash` | text | Yes | Canonical request hash |
| `resource_id` | uuid | Yes | Analysis run ID |
| `created_at` | timestamptz | Yes | UTC |

Unique: `(user_id, key)`.

### `certificate_verifications`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | uuid PK | Yes | Verification event |
| `certificate_id` | uuid FK | Yes | Certificate |
| `user_id` | uuid FK profiles | Yes | Requester |
| `status` | enum `VERIFIED/HASH_MISMATCH/EVIDENCE_MISMATCH/ADJUDICATION_MISMATCH/UNSUPPORTED_VERSION` | Yes | Result |
| `details` | jsonb | Yes | Checks and precise error codes |
| `created_at` | timestamptz | Yes | UTC |

## 7.2 Relationships

```text
Supabase Auth User
  1 ── 1 profiles
  1 ── N analysis_runs
          1 ── N market_snapshots
          1 ── 1 data_gate_reports
          1 ── 1 thesis_packages
                    1 ── N kill_criteria
                    1 ── 1 criteria_commitments
          1 ── N attacker_executions
                    1 ── 0..1 attack_findings
          1 ── 0..N decision_certificates (versioned/superseding)
          1 ── N audit_events
analysis_runs 1 ── 1 analysis_jobs
certificates 1 ── N certificate_verifications
```

## 7.3 Visibility and sensitivity

- `market_snapshots`, thesis packages, criteria, attacker findings, and certificates are private to the owning analyst by default.
- `kill_criteria` are private application data and must never appear in attacker requests, logs, telemetry, or error traces.
- RYO keys, OpenAI keys, database URLs, auth secrets, access/refresh tokens, and SMTP credentials are server-only secrets and are never persisted in user-visible records.
- Public visitors can read only fixed, deterministic, redacted sample fixtures.
- Admin access does not permit editing or deleting completed artifacts.
- No sensitive financial account or wallet data is collected because wallet connectivity and trading are out of scope.

---

# 8. System architecture

## 8.1 Architecture decision

Use a small TypeScript monorepo with a separate browser frontend and Fastify API/worker. PostgreSQL is both the system of record and the durable job queue. No Redis, Kafka, microservices, vector database, or separate queue service is needed for the MVP.

## 8.2 Components

### Frontend

- React + Vite + TypeScript.
- React Router for routes.
- TanStack Query for server state and retry/polling.
- Tailwind CSS + shadcn/ui primitives for accessible components.
- React Hook Form + Zod for forms and client-side contract validation.
- Supabase Auth client for sign-in/session acquisition.
- No direct privileged database access.

### Backend/API

- Fastify + TypeScript.
- Versioned REST JSON API under `/api/v1`.
- Zod schemas shared through `packages/contracts`.
- Drizzle ORM for typed database access/migrations.
- PostgreSQL job queue table with `FOR UPDATE SKIP LOCKED` and expiring worker leases.
- Fastify serves API and starts the worker loop in the same Render service process for MVP.
- Pino structured logs with redaction.

### Database/Auth

- Supabase-managed PostgreSQL.
- Supabase Auth using email OTP/magic link.
- PostgreSQL RLS and owner-scoped access policies.
- Separate least-privilege runtime, worker, and migration DB credentials where the Supabase project supports these roles.
- Migrations use the migration credential; API and worker use separate restricted credentials.

### AI

- OpenAI Responses API through the official server-side SDK.
- One configured model ID for thesis and attacker generation in MVP; model ID is an operator-supplied configuration value verified during intake.
- JSON Schema/Zod structured output validation.
- No LLM-based adjudication.

### RYO

- Custom RYO REST client behind a typed adapter.
- Only seven published tool names are allowlisted.
- Provider credentials and exact REST auth/request/response contract come from the organizer's current developer docs and operator intake.
- If REST is not provisioned for the account, stop live integration and request the supported organizer MCP details; do not guess endpoints.

### Hosting

- Frontend: Vercel preview and production projects.
- API/worker: Render web service running the Fastify process and worker loop.
- Database/Auth: Supabase project.
- Git: existing repository if supplied; otherwise create a private GitHub repository only after operator confirms account/repo permissions. No public repo assumption.

## 8.3 Request and job topology

```text
Browser (React/Vite)
  ├─ Supabase Auth: OTP/session
  └─ HTTPS JSON/SSE
        ↓
Fastify API (Render)
  ├─ JWT verification + authorization
  ├─ request validation + rate limits
  ├─ Drizzle → Supabase Postgres
  └─ durable analysis_jobs table
        ↓
Worker loop (same service process)
  ├─ RYO REST adapter (read-only allowlist)
  ├─ Data Integrity Gate (deterministic)
  ├─ Thesis Agent (OpenAI Responses API)
  ├─ Criteria registry + commit (deterministic)
  ├─ specialist attackers (separate OpenAI calls)
  ├─ Finding Validator (deterministic)
  ├─ Adjudicator (pure deterministic function)
  └─ Certificate generator + hash (deterministic)
        ↓
Supabase Postgres: snapshots, run state, criteria, findings, certificates, audit events
```

## 8.4 Data flow and isolation

1. RYO responses are stored as immutable snapshots before any LLM sees them.
2. The Data Integrity Gate runs against snapshots.
3. Thesis Agent receives only the normalized evidence bundle, not secrets or unrelated user records.
4. Criteria are stored and sealed in a committed transaction.
5. Attack payloads are generated from explicit allowlisted fields. `kill_criteria`, commitment metadata, peer findings, and adjudication state are removed at the projection layer.
6. Each attacker gets a distinct stateless provider request, a distinct evidence subset, and no tools.
7. Model output is validated against both schema and referenced source values.
8. Adjudication is local deterministic code.
9. Certificate hashing and verification are local deterministic code.

## 8.5 Caching

- No caching of completed analysis decisions across users.
- A short-lived cache may be used for `supported_tokens` and `market_overview`, but cache age and cache-hit status must be visible and included in run provenance.
- A live analysis uses its own snapshots; never silently replace a snapshot with a newer cache result after thesis generation.
- Model response cache is not required for the MVP; replay uses persisted outputs.

## 8.6 Logging and monitoring

- Pino structured logs with `request_id`, `run_id`, `job_id`, `surface`, and stable error codes.
- Redact authorization headers, cookies, API keys, database URLs, criteria payloads, and private thesis content from general logs.
- Render logs for server health; Supabase logs for DB/Auth; provider usage counters stored per run.
- Health routes: liveness and readiness. Readiness checks database connectivity and configured dependency presence, not secret values.
- No third-party error-monitoring service is mandatory; adding Sentry requires operator authorization and a cost/privacy check.

## 8.7 Deployment environments

- Local: Vite + Fastify + local/test PostgreSQL or Supabase local development environment; fixture mode works without RYO/OpenAI keys.
- Preview: Vercel preview frontend + protected Render preview API + non-production Supabase project; only demo fixtures or sandbox/authorized RYO access. No production user data/secrets.
- Production: separate Vercel/Render/Supabase projects or explicitly isolated environments; release only if production authorization is given during intake.

---

# 9. Technology stack

| Layer | Selected technology | Responsibility / rationale | Rejected alternative |
|---|---|---|---|
| Language | TypeScript (strict) | Shared contracts and end-to-end typing | Split Python/TS adds cross-language coordination without MVP benefit |
| Monorepo | pnpm workspaces | Shared contracts, prompts, core logic | Nx/Turborepo unnecessary for this small project |
| Frontend | React + Vite | Fast, straightforward dashboard and preview deploy | Next.js SSR is unnecessary for an authenticated analytical workspace |
| Routing | React Router | Explicit client-side app routes | Multiple routing frameworks unnecessary |
| UI | Tailwind CSS + shadcn/ui + Lucide | Accessible primitives with controlled visual styling | Heavy component suite not needed |
| Server state | TanStack Query | Polling, retries, cache invalidation | Duplicating API state in Zustand/Redux unnecessary |
| Forms | React Hook Form + Zod | Typed validation | Custom form state unnecessary |
| API | Fastify | Lightweight Node API with schema validation and `inject` test support | Express offers no product-specific advantage |
| Validation | Zod + JSON Schema boundary | Shared runtime contracts and provider payload checks | Loose interfaces alone do not validate LLM output |
| DB | Supabase Postgres | Relational integrity, JSONB evidence storage, durable job queue | SQLite is unsuitable for concurrent hosted users and durable workers |
| ORM/migrations | Drizzle | Typed SQL and explicit migrations | Prisma is viable but not required; do not combine ORMs |
| Auth | Supabase Auth | Managed email OTP/magic-link identity | Custom password/auth system adds risk |
| Job queue | PostgreSQL `analysis_jobs` + row locking | No Redis/service dependency; transactional enqueue with run creation | Redis/BullMQ adds infrastructure and failure surface |
| AI | OpenAI Responses API | Structured thesis/attacker generation | Multiple LLM vendors not needed in MVP |
| RYO integration | Typed REST adapter | Uses published official REST access | MCP adapter only if organizer provisioning makes REST unavailable |
| Frontend hosting | Vercel | Stable previews and frontend deployment | Self-hosting static frontend unnecessary |
| API hosting | Render Node web service | Long-running API + worker process | Serverless-only function execution complicates long-running jobs |
| Tests | Vitest, Fastify.inject, Playwright | Unit, API/integration, browser E2E | Multiple test runners unnecessary |

**Version policy:** Use current stable compatible releases at implementation time, commit exact versions in the lockfile, pin Node LTS, and do not use floating wildcard dependencies. The coding agent may choose patch versions but may not substitute major frameworks or replace the architecture.

---

# 10. API specification

Base path: `/api/v1`. All error responses use the same format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The token identifier is not supported.",
    "request_id": "uuid",
    "details": [{"field": "asset_id", "reason": "unsupported_asset"}]
  }
}
```

Do not include stack traces, credentials, raw provider errors, private criteria, or other users' data in errors.

## 10.1 `GET /health/live`

- **Purpose:** Process liveness.
- **Auth:** None.
- **Success:** `200 {"status":"ok"}`.
- **Side effects:** None.

## 10.2 `GET /health/ready`

- **Purpose:** Check whether API can accept work.
- **Auth:** None, minimal output.
- **Success:** `200 {"status":"ready","database":"ok","worker":"ok"}`.
- **Failure:** `503` with dependency status codes only. Never expose secret presence beyond configured/not-configured or provider raw details.

## 10.3 `GET /api/v1/me`

- **Purpose:** Current analyst profile.
- **Auth:** Supabase access JWT.
- **Authorization:** Subject must map to current profile.
- **Success:** `200 {"id":"uuid","display_name":null,"role":"analyst"}`.

## 10.4 `GET /api/v1/tokens/supported?q=...`

- **Purpose:** Supported-token search.
- **Auth:** Analyst.
- **Validation:** `q` length 1–80; limit max 50; response from allowlisted `supported_tokens` tool.
- **Success:** `200 {"items":[{"asset_id":"...","symbol":"...","name":"...","chain":"..."}],"source":"ryo","retrieved_at":"..."}`.
- **Errors:** `401`, `429`, `502 RYO_UNAVAILABLE`, `503 RYO_NOT_CONFIGURED`.
- **Side effects:** Optional timestamped short-TTL cache entry.

## 10.5 `GET /api/v1/market/overview`

- **Purpose:** Display broad RYO market snapshot if product screen needs it.
- **Auth:** Analyst.
- **Success:** `200` with normalized response and source timestamp.
- **Errors:** `401`, `429`, `502`, `503`.
- **Note:** This route is not the adjudicator. The run always stores its own market snapshot.

## 10.6 `POST /api/v1/analyses`

- **Purpose:** Create one live analysis job.
- **Auth:** Analyst.
- **Headers:** `Idempotency-Key: <opaque random value>`.
- **Request:**

```json
{
  "asset_id": "provider-resolved-asset-id",
  "optional_hypothesis": "Optional bounded hypothesis to test"
  }
```

- **Validation:** Asset must resolve from supported-token data; hypothesis <= 1,000 chars; attacker surfaces are not accepted from the client; the backend selects enabled surfaces after evidence validation; at least three valid attacker results are required for a verdict; user rate/concurrency and cost caps enforced. User cannot supply criteria or adjudication rules.
- **Business logic:** Transaction inserts run, idempotency record, audit event, and durable job. If a key is reused with same request hash, return existing resource. If same key with different request hash, return `409 IDEMPOTENCY_CONFLICT`.
- **Success:** `202 Accepted`.

```json
{
  "run_id": "uuid",
  "status": "QUEUED",
  "status_url": "/api/v1/analyses/uuid",
  "events_url": "/api/v1/analyses/uuid/events"
}
```

- **Errors:** `400`, `401`, `409`, `422`, `429`, `503`.
- **Side effects:** One analysis run and one durable job.

## 10.7 `GET /api/v1/analyses`

- **Purpose:** List current analyst's runs.
- **Auth:** Analyst.
- **Query:** `cursor`, `limit` (1–50), optional `status`, `asset_id`.
- **Authorization:** Always filtered by authenticated user ID.
- **Success:** `200 {"items":[...],"next_cursor":"..."}`.

## 10.8 `GET /api/v1/analyses/:runId`

- **Purpose:** Run progress/detail.
- **Auth:** Analyst.
- **Authorization:** Owner only, or explicit admin support policy.
- **Success:** Run state, phase, enabled/unsupported surfaces, safe progress messages, coverage, verdict if completed, certificate ID if present.
- **Errors:** `401`, `404` for both nonexistent and not-owned IDs to prevent enumeration.

## 10.9 `GET /api/v1/analyses/:runId/events`

- **Purpose:** Server-sent progress events.
- **Auth:** Analyst; JWT validated before stream begins.
- **Authorization:** Owner only.
- **Events:** `status`, `attacker_status`, `completed`, `error`; event IDs are monotonic per run.
- **Fallback:** Frontend polls `GET /analyses/:runId` if SSE disconnects or is unavailable.
- **No side effects:** Stream is read-only.

## 10.10 `POST /api/v1/analyses/:runId/cancel`

- **Purpose:** Cancel a queued/pre-seal run.
- **Auth:** Analyst, owner only.
- **Rule:** Cancellation before `CRITERIA_SEALED` marks run cancelled and worker stops. After sealing, request returns `409 CANNOT_CANCEL_AFTER_COMMIT`; operator can use a stop-work control only to mark run incomplete while preserving commitment and executed findings.

## 10.11 `GET /api/v1/certificates/:certificateId`

- **Purpose:** Certificate detail.
- **Auth:** Analyst, owner only; public sample route uses separate fixture IDs.
- **Success:** Full owner-scoped certificate payload, evidence summaries and coverage.
- **Errors:** `401`, `404`.

## 10.12 `POST /api/v1/certificates/:certificateId/verify`

- **Purpose:** Recompute integrity and adjudication.
- **Auth:** Analyst, owner only.
- **Request:** Empty JSON.
- **Success:** `200 {"status":"VERIFIED","checks":{"criteria_hash":true,"snapshot_hashes":true,"certificate_hash":true,"adjudication_replay":true}}`.
- **Failure:** `200` with explicit non-verified status so the UI can display the exact mismatch; verification event is stored. Do not mutate the certificate.

## 10.13 `GET /api/v1/attacker-registry`

- **Purpose:** Display supported attacker domains and evidence requirements.
- **Auth:** Public read-only metadata may be exposed; no prompts or secret config.
- **Success:** Registry ID, name, description, defeat terms, and current product support status. Per-run active status comes from run detail.

## 10.14 `POST /api/v1/demo/runs`

- **Purpose:** Execute an allowlisted deterministic demo scenario.
- **Auth:** None; rate-limited.
- **Request:** `{"scenario_id":"anticipated_refuse"}`.
- **Success:** `200` or `201` with `SIMULATED` certificate identifier and all data marked simulated.
- **Business logic:** Uses fixture data and the same deterministic validation/adjudication/hash code. It does not call RYO/OpenAI.
- **Errors:** `400`, `404`, `429`, `500 DEMO_FIXTURE_INVALID`.

## 10.15 Rate limits and idempotency

- Auth endpoints: provider-managed + app-level throttling.
- Token lookup: 30 requests/minute/user by default, adjusted to organizer quotas.
- Analysis creation: 3 concurrent runs/user; 10 new runs/day/user default, operator adjustable.
- Demo endpoint: 20 requests/hour/IP default.
- Verification: 30 requests/minute/user.
- Analysis creation must be idempotent.
- Verification and demo endpoints must not produce financial or irreversible side effects.

---

# 11. Database behavior and concurrency

## 11.1 Create analysis

```text
BEGIN
  validate authenticated user
  check (user_id, idempotency_key)
  if existing key + same request_hash: return existing run
  if existing key + different request_hash: conflict
  INSERT analysis_runs(status=QUEUED, owner=user_id, ...)
  INSERT idempotency_records(...)
  INSERT analysis_jobs(status=QUEUED, run_id=...)
  INSERT audit_events(event_type=analysis.created, ...)
COMMIT
```

The run and job must be committed atomically. The worker only claims committed jobs.

## 11.2 Claim job

Use a short database transaction with `SELECT ... FOR UPDATE SKIP LOCKED` over the earliest eligible queued/retry job. Set `RUNNING`, `locked_by`, `locked_at`, `lease_expires_at`, increment attempt count, and commit. Long AI/RYO calls happen outside the row-lock transaction. Worker heartbeats extend the lease. A crashed worker's expired lease allows re-claiming; all processing steps are idempotent and check whether their artifact already exists.

## 11.3 Store RYO snapshot

- Insert snapshot once per actual provider call.
- Canonicalize response for hashing; preserve raw parsed body and source status.
- Never overwrite a snapshot when a retry occurs; create another snapshot with call-attempt metadata.
- Store errors explicitly with no fake `data` object.
- Snapshot insert and corresponding audit event should commit together.

## 11.4 Seal criteria

```text
BEGIN
  lock thesis/run row
  verify run.status = VALIDATING_CRITERIA
  validate criterion count, surface, vocabulary, uniqueness, evidence support
  INSERT kill_criteria rows
  compute canonical criteria hash from exact inserted rows sorted by surface/defeat/id
  INSERT criteria_commitments(criteria_hash, committed_at, registry_version)
  INSERT audit_events(event_type=criteria.sealed, payload={hash, count, registry_version})
  UPDATE run.status = CRITERIA_SEALED
COMMIT
```

Attacker jobs are created only after this transaction commits. The attacker payload builder explicitly selects permitted thesis/evidence fields; it never serializes the full thesis object.

## 11.5 Store findings

- One execution row per `(run_id, surface)`.
- Model output is saved before final validation to preserve audit of malformed outputs, but is not considered a finding until validated.
- A valid finding and its validation report are committed together.
- A retry is a new attempt entry or versioned payload, not a replacement that hides the first output.
- No findings can be changed after certificate completion.

## 11.6 Adjudication and certificate

- Acquire run row lock; ensure run is `VALIDATING_FINDINGS` and all required results are final.
- Recompute criteria and evidence hashes.
- Compute verdict using deterministic rules.
- Build canonical certificate payload and hash.
- Insert certificate and set run verdict/status in one transaction.
- Add audit event with certificate ID/hash.
- Unique constraints prevent multiple first certificates or concurrent finalization.

## 11.7 Ownership and row-level protection

Every user-facing query must constrain by authenticated `user_id`; UUID secrecy is not authorization. Enable RLS for user-owned tables. Use a restricted runtime DB role without `BYPASSRLS` for user-scoped operations where supported. Use a separate server-only worker credential for cross-user job processing with minimal table privileges. The migration credential is never available to frontend or normal runtime. If the selected Supabase plan/project cannot support separate roles, document the limitation and enforce strict API ownership checks as an additional control; do not claim RLS protects a privileged service-role connection that bypasses it.

---

# 12. Authentication and authorization

- Authentication: Supabase Auth email OTP/magic link; password auth is not required in MVP.
- Frontend uses Supabase public URL + anon key only.
- API verifies Supabase access JWT using the project's JWKS/public signing keys; validate signature, issuer, audience, expiry, and subject.
- API derives `user_id` from verified JWT only; never trust a request body `user_id`.
- All run/certificate queries are owner-scoped.
- `admin` is assigned out of band by an operator, never by user-supplied profile updates.
- Background worker has service identity and server-side DB credentials; it does not reuse user browser tokens.
- Auth callbacks permit only exact approved redirect origins.
- Sign-out revokes/clears local session; backend still validates expiry/revocation strategy supported by Supabase.
- Demo mode is separate and read-only; it cannot be used to invoke live API operations.

---

# 13. Security architecture

## 13.1 Threat model

Protect user-owned research, sealed criteria, API credentials, RYO/OpenAI access, certificate integrity, and adjudication correctness. Assume malicious users can alter browser requests, guess resource IDs, submit prompt-injection text in hypotheses/token metadata, replay requests, and attempt to make agents fabricate evidence.

## 13.2 Controls

| Risk | Required mitigation |
|---|---|
| Authentication bypass | Verify JWT signature, issuer, audience, expiry; secure auth redirects; rate-limit sign-in |
| IDOR / cross-user access | Owner filter on every read/write; return 404 for not-owned IDs; RLS defense-in-depth |
| Mass assignment | Strict Zod request schemas; reject unknown fields where appropriate; never accept `user_id`, `verdict`, `status`, criteria hash, or certificate JSON from browser |
| SQL injection | Drizzle parameterized queries; no string-concatenated SQL; restricted DB roles |
| XSS | React escaping; no `dangerouslySetInnerHTML` for model output; sanitize Markdown if rendering; strict CSP |
| CSRF | Bearer-token API; exact CORS allowlist; if cookies are introduced, add CSRF tokens and SameSite/secure settings |
| CORS abuse | Allow only configured frontend origins; no wildcard credentials |
| Brute force/enumeration | Supabase Auth controls + app/IP limits + neutral responses |
| Sensitive data leakage | Server-only secrets; Pino redaction; sanitized errors; no criteria/prompts in frontend/network events beyond permitted fields |
| RYO SSRF | No user-supplied endpoint/base URL; hard-coded configured provider origin; egress allowlist if supported |
| RYO tool abuse | Server-side tool allowlist; no arbitrary tool name/arguments from client; read-only calls only |
| Prompt injection | Treat all RYO/user strings as untrusted data; no agent tools; explicit JSON evidence context; no instructions from tool output; bounded context |
| Criteria leakage | Separate DB object and attack payload projection; automated tests search serialized request for `kill_criteria`, criteria hash, commit timestamp; never write criteria to general logs |
| Agent collusion/contamination | Stateless separate requests; no shared transcript; no peer findings; no criteria |
| Fabricated evidence | Evidence references require snapshot ID/hash + JSON Pointer + exact observed value; deterministic resolver verifies value in source JSON |
| Unsupported inference | Controlled vocabulary; terms activated only when fields available; no proxy relabeling as direct measurement |
| Replay attack | Idempotency key, unique constraints, authenticated ownership, no destructive endpoint |
| Race condition | DB row locks, unique keys, worker lease, atomic finalization |
| Certificate tampering | Canonical hashes, immutable row permissions, append-only audit events, verification endpoint |
| Privilege escalation | Role assignment only out of band; no user role update API; separate worker/migration credentials |
| Denial of service/cost abuse | Per-user run quotas, max concurrent jobs, input size/token limits, per-run budget cap, bounded retries |
| Dependency compromise | Lockfile, pinned versions, minimal deps, audit step, no unreviewed lifecycle scripts where avoidable |
| Preview data leak | Separate preview DB/project/keys, no production secrets, fixture-only demo by default |

## 13.3 Secret handling

- Keep secrets in Vercel/Render/Supabase secret stores.
- Never commit `.env`, keys, service-role key, DB URLs, or TTS credentials.
- Provide `.env.example` with names and descriptions only.
- Redact secrets in logs and issue reports.
- Rotate exposed keys immediately and document the incident.
- Do not include secrets in demo recordings or screenshots.

## 13.4 Model/data governance

- Do not send personal user data to the LLM; only necessary market evidence, hypotheses, and asset data.
- User-supplied hypothesis is untrusted data, not system instruction.
- Tool output may contain arbitrary strings; encode it as data, never concatenate it into privileged instructions.
- Store model ID, prompt version, output, usage, and input hash for traceability.
- No training on user data is configured by this application; provider data-retention terms must be reviewed during intake.

## 13.5 Release boundary

The agent may deploy preview to agreed domains/services within intake authority. Production deployment, paid resource upgrades, public repo creation, domain changes, user-data migrations, and any irreversible operation require exact scope authorization in intake.

---

# 14. UI/UX architecture

## 14.1 Information architecture

```text
/
├── /demo
├── /auth
├── /app
│   ├── /app/new
│   ├── /app/history
│   ├── /app/runs/:runId
│   └── /app/certificates/:certificateId
└── /docs (real documentation destination; external or app route)
```

## 14.2 Global shell

- Product name/logo text and short positioning.
- Primary navigation: Overview, New Analysis, History.
- Help/docs link.
- Account/session menu when signed in.
- Clear demo/live mode indicator.
- Footer with verified Documentation and GitHub links only when a public GitHub repository is approved. Never expose private repo URL.

## 14.3 Screen specifications

### Landing `/`

Purpose: Explain the audit process and boundaries.  
Layout: Hero with product proposition; 3-step system explanation; six attacker domains; example verdicts; security/limitations note; CTA to demo and sign in.  
Interactions: Open sample; sign in; inspect docs.  
States: default, auth loading, docs unavailable.  
Responsive: single-column mobile; balanced two-column hero desktop.  
Accessibility: semantic headings, skip link, visible focus, reduced motion.  
Acceptance: visitor understands no live execution and the three verdicts before entering demo.

### Demo `/demo`

Purpose: Let judges experience the deterministic mechanism without credentials.  
Layout: scenario selector, clearly labelled simulated evidence, attacker results, verdict, certificate hash, verify action.  
Interactions: select one fixed scenario, run fixture evaluation, expand evidence.  
States: loading fixture, success, fixture error, verification mismatch.  
Acceptance: all data labelled SIMULATED at page and field level; demo cannot invoke live RYO/OpenAI.

### Sign-in `/auth`

Purpose: Authenticate analyst.  
Layout: minimal email OTP/magic-link form.  
Interactions: send code/link, verify, resend after cooldown.  
States: idle, submitting, sent, invalid, expired, rate-limited, provider unavailable.  
Acceptance: no account enumeration; keyboard and screen-reader accessible.

### Workspace `/app`

Purpose: Overview of user's analyses and run counts.  
Layout: status summary; recent runs; new analysis CTA; evidence coverage legend.  
Interactions: open run, start new.  
States: skeleton, first-use empty, populated, API error.  
Acceptance: counts are derived from user's records only; no fabricated sample stats.

### New Analysis `/app/new`

Purpose: Choose supported asset and start analysis.  
Layout: token search/select, asset identity/chain confirmation, optional hypothesis field, enabled attack-surface explanation, scope disclaimer.  
Interactions: search, select, submit once.  
States: loading supported tokens, no results, unsupported token, validation error, rate limit, RYO unavailable, queued.  
Acceptance: no unsupported token can submit; double-submit is idempotent.

### Run Detail `/app/runs/:runId`

Purpose: Show progress and complete analysis.  
Layout hierarchy: run header + status; evidence/data-integrity section; thesis; criteria commit state; attacker matrix; adjudication; certificate.  
Interactions: view raw evidence (safe formatted JSON), expand attacker reasoning/evidence, cancel before criteria seal, open certificate, retry display polling.  
States: every run state, blocked, incomplete, disconnected, not found, denied.  
Acceptance: criteria commit timestamp/hash is visible to owner after sealed; attacker view never reveals criteria; unavailable surfaces show reason.

### History `/app/history`

Purpose: Search/filter own past runs.  
Layout: searchable table/card list by asset, verdict, date, coverage.  
Interactions: filters, pagination, open run/certificate.  
States: loading, empty, no match, populated, error.  
Acceptance: owner-scoped only; stable pagination; verdict always labelled practice-only.

### Certificate `/app/certificates/:certificateId`

Purpose: Inspect and verify decision record.  
Layout: verdict banner; coverage limitations; thesis; snapshots/provenance; sealed criteria; attacker ledger; adjudication rule/version; invalidation conditions; hash + verify status.  
Interactions: verify, copy hash, download JSON.  
States: loading, verified, mismatch, unsupported version, not found, denied.  
Acceptance: certificate cannot be edited; download matches stored certificate payload; mismatch is never shown as verified.

## 14.4 UI components

- `AppShell`, `PrimaryNav`, `AccountMenu`, `ModeBadge`
- `TokenCombobox`, `AssetIdentityCard`
- `RunStatusStepper`, `ProgressTimeline`
- `DataIntegrityPanel`, `EvidenceSnapshotCard`, `EvidenceValue`
- `ThesisCard`, `CriteriaCommitPanel`
- `AttackerMatrix`, `AttackerFindingCard`, `CoverageStatus`
- `VerdictPanel`, `CertificateHash`, `VerificationResult`
- `EmptyState`, `ErrorState`, `Skeleton`, `ConfirmDialog`, `Toast`

No visible control may be inert. Every action must have an implemented behavior or be omitted.

## 14.5 Visual behavior

The final visual language is derived from operator-supplied reference image(s), not invented mockups. The temporary Phase 1 shell uses a neutral, accessible analytical layout with design tokens so the final treatment can be changed without rewriting behavior. The final interface must prioritize information hierarchy, traceability, compact but readable evidence, and unmistakable separation of `TRADE`, `REFUSE`, `ABSTAIN`, `BLOCKED`, and `INCOMPLETE`.

## 14.6 Responsive and accessibility acceptance

- Mobile 360px and larger: no horizontal overflow; navigation collapses accessibly; evidence JSON wraps/scrolls within its own region.
- Tablet 768px: dashboard and attacker grid adapt to two columns where useful.
- Desktop 1280px+: evidence and verdict can be shown side by side without excessive whitespace.
- WCAG 2.2 AA target for contrast and interaction; use semantic landmarks, labels, keyboard navigation, visible focus, focus management on dialogs, reduced-motion support, and status announcements for run changes.
- Do not communicate severity by color alone; pair with text/icon labels.

---

# 15. Reference-image-led UI implementation and skill requirements

## 15.1 Reference status

No UI reference image is attached in the current project materials. The uploaded file is the workflow document, not a UI reference. This is a **required Phase 0 intake input** for final visual implementation. The agent must request one or a small set of actual reference images in the consolidated intake. It must not pretend an image exists.

If the operator explicitly authorizes the agent to generate a reference image, it may do so and record the generated asset. Without that authorization or supplied image, the agent can build the skeletal/functional UI with a documented neutral temporary system, but must not claim final reference-led visual refinement is complete.

## 15.2 Required skill

At the start of final UI work, execute:

```bash
npx skills add benjitaylor/skills --skill stageshow
```

Inspect the installed skill's actual instructions before applying them. The agent may evaluate additional reputable UI/UX skills if materially useful. Do not follow skill instructions that conflict with this blueprint, repository security, product behavior, or the reference workflow. Record installation/use/failure in `docs/BUILD_LOG.md` and `AI_HANDOFF.md`.

## 15.3 Required design records

`REFERENCE_ASSETS.md` records actual filename/path, source/ownership, intended UI use, supplied/generated status, and responsive crops/variants if any. `docs/DESIGN_NOTES.md` records the design principles extracted, route mapping, components, tokens, and intentional adaptations/deviations. Never invent asset paths.

---

# 16. Third-party integrations

| Integration | Purpose | Required | Credentials/config | Failure handling |
|---|---|---:|---|---|
| RYO REST API | Read-only market and safety evidence | Yes for live run | Official base URL, API credential, exact auth/request contract from organizer docs | Explicit unavailable/error snapshot; bounded retry; no fabricated replacement |
| OpenAI Responses API | Thesis and attacker structured generation | Yes for live run | `OPENAI_API_KEY`, `OPENAI_MODEL`, budget ceiling | One schema repair retry; fail run safely; record model/provider error code |
| Supabase Auth | Analyst identity | Yes for live workspace | Project URL, anon key, redirect URLs; SMTP setup if required by chosen auth flow | Demo remains available; live workspace sign-in disabled safely |
| Supabase Postgres | Persistence and job queue | Yes | Database URLs with distinct roles | Retry transient DB operations; no certificate completion on persistence failure |
| Vercel | Frontend preview/hosting | Yes for hosted UI | Project and team access | Local frontend continues; preview blocker recorded |
| Render | API/worker hosting | Yes for hosted live flow | Service access and environment | Local API/fixture mode continues; preview marked unavailable |
| Google AI voice/TTS | Demo narration | Optional, preferred if a free eligible tier is available | Credential, quota, current terms verified during demo phase | Use genuinely free local TTS fallback (e.g. Piper/eSpeak NG after license/voice check); document substitution |
| Playwright | Browser capture | Yes for demo | Browser/runtime | Capture locally; no paid recording service |

No payment processor, wallet, exchange, webhook provider, notification service, object storage, search engine, or analytics SaaS is needed for the MVP.

## 16.1 RYO data integrity convention

The official hackathon description says RYO provides live market data through MCP and REST and that source failures/rate limits must be represented honestly; missing data stays missing. The implementation must preserve that convention. The actual developer docs and key are indispensable intake inputs for live RYO integration. The current public hackathon page does not establish the exact endpoint paths, request schema, response schemas, or authentication header, so these must not be guessed.

---

# 17. AI architecture

## 17.1 Agents and deterministic services

| Component | AI? | Responsibility |
|---|---:|---|
| Thesis Agent | Yes | Produce structured falsifiable thesis and candidate criteria from evidence |
| Liquidity & Exit attacker | Yes | Challenge exit feasibility based on permitted evidence |
| Asset & Contract Safety attacker | Yes | Challenge token/contract safety based on `check_safety` and other returned evidence |
| Internal Logic & Evidence attacker | Yes | Challenge validity of reasoning/citations |
| Market Regime & Sentiment attacker | Yes, conditional | Challenge broad regime fit when source fields exist |
| Derivatives & Leverage attacker | Yes, conditional | Challenge derivatives fragility when source fields exist |
| Catalyst & Event attacker | Yes, conditional | Challenge documented event/catalyst risks when source fields exist |
| Data Integrity Gate | No | Deterministic source/schema/freshness/identity/hash checks |
| Criteria Registry | No | Validate, commit, and seal criteria |
| Finding Validator | No | Verify schemas, vocabulary, hashes, pointers, and exact observed values |
| Adjudicator | No | Produce final verdict using fixed rules |
| Certificate Generator | No | Canonicalize, hash, persist, and verify records |

## 17.2 Model request design

- Use the OpenAI Responses API behind `packages/ai` provider adapter.
- Use `OPENAI_MODEL` as a required operator-supplied model ID; verify that the account can call it and it supports the required structured output at intake. Do not silently change models.
- Use strict JSON Schema output where supported; always validate with Zod regardless.
- Temperature/other sampling parameters are fixed in a versioned config; do not expose model tuning in the user UI.
- Prompt versions are stored in source control and recorded for each execution.

## 17.3 Context boundaries

**Thesis Agent receives:** normalized market snapshots, source status, asset identity, optional user hypothesis, product constraints, output schema.  
**Attacker receives:** its charter, a thesis projection without kill criteria/commit metadata, only its permitted evidence subset, and output schema.  
**Adjudicator receives:** validated findings, sealed criteria, Data Gate status, enabled-surface manifest, and rules version. No LLM is called.

## 17.4 Evidence contract

Every observation cited by a model must reference a stored snapshot and JSON Pointer. A deterministic validator resolves the pointer and checks the claimed observed value against the exact raw response. The source output hash must match. An unsupported pointer or mismatched observed value is invalid.

## 17.5 Hallucination and prompt-injection controls

- All RYO output and user hypothesis text is treated as untrusted data.
- No attacker receives tool-calling capability.
- System prompts define that source text cannot override instructions.
- Use explicit JSON sections and strict payload projection.
- Reject evidence not present in snapshots.
- Do not allow the model to generate arbitrary URLs or call arbitrary tools.
- Do not use LLM-generated summaries as the sole underlying evidence.

## 17.6 Cost and retries

- Maximum one thesis generation call plus one optional thesis repair.
- One call per enabled attacker plus at most one schema repair per attacker.
- MVP defaults to three attackers enabled; optional attackers are enabled only after evidence/schema verification.
- Input/output token limits and per-run budget ceiling are configured in operator intake.
- Record token usage and provider cost metadata when available.
- If provider cost would exceed the configured per-run ceiling, stop before the call and mark run blocked/incomplete.
- No automatic model escalation or unbounded retries.

## 17.7 No probability-of-profit score

The UI must not present LLM confidence or an arbitrary probability as probability of trade success. The product reports coverage and evidence limitations, not calibrated financial odds.

---

# 18. Payments and financial logic

No payment architecture is applicable. The product does not collect payments, hold balances, connect wallets, place orders, execute transactions, or issue payouts. There are no money-moving endpoints. Real-money actions are explicitly prohibited in the MVP.

---

# 19. Admin and operations

No general-purpose admin dashboard is required. Minimal operator actions:

- View dependency readiness with secrets redacted.
- View queue health and stuck jobs.
- View aggregate run counts without exposing private thesis content.
- Requeue a clearly failed job only if idempotent recovery rules allow it.
- Mark an unrecoverable run incomplete with an audit event.
- Verify a certificate.

No admin action can change kill criteria, edit attacker outputs, alter verdicts, overwrite certificates, or silently delete history. Registry/rules/prompt changes are source-controlled releases and versioned.

---

# 20. Error and edge-case matrix

| Area | Condition | Required response | Recovery |
|---|---|---|---|
| Auth | Expired/invalid JWT | 401; no data returned | Re-authenticate |
| Auth | User requests another user's UUID | 404 | None; log security event without revealing owner |
| Token | Unsupported asset | 422 `UNSUPPORTED_ASSET` | Choose supported token |
| RYO | Credential missing | Live run disabled; 503 config error | Supply key during intake |
| RYO | Rate limited | Explicit unavailable snapshot; retry within budget | Respect `Retry-After`; no fabricated result |
| RYO | Partial data | Mark individual sections unavailable; gate WARN/BLOCK | Continue only if required evidence passes |
| RYO | Identity mismatch | Gate BLOCK | Correct asset mapping; new run |
| RYO | Schema drift | Snapshot raw response, adapter validation fails | Update adapter only after inspecting actual docs/schema |
| Data | Stale required evidence | Gate BLOCK | Fetch fresh snapshot |
| Thesis | Insufficient evidence | No normal thesis | Run blocked or request a different asset |
| Thesis | Invalid JSON/output | One constrained repair; if still invalid, incomplete | Inspect provider response and prompt version |
| Criteria | Invalid/duplicate/unsupported term | Reject before sealing | Re-generate or correct via deterministic mapping; no attackers start |
| Criteria | Commit write fails | No attacker starts | Retry transaction safely |
| Isolation | Attacker payload contains criteria | Security test failure; stop run | Fix projection, invalidate run |
| Attacker | `NO_BREAK` with defeats | Invalid output | One repair; else run incomplete |
| Attacker | `BREAK` no evidence | Invalid output | One repair; else run incomplete |
| Attacker | Fabricated JSON pointer/value | Invalid output | One repair; else run incomplete |
| Attacker | Timeout/provider outage | Execution failure, not NO_BREAK | Bounded retry; if still failed then incomplete |
| Attacker | Unsupported data surface | `SKIPPED_UNSUPPORTED` with reason | No finding; coverage limitation |
| Adjudication | Fewer than 3 valid findings | No verdict; incomplete | Resolve failed execution and rerun if allowed |
| Adjudication | 2+ valid INCONCLUSIVE | ABSTAIN | Certificate records coverage gap |
| Adjudication | Expected + unexpected BREAK | REFUSE; preserve both | No remediation by rewriting past run |
| Certificate | Hash mismatch before write | Incomplete | Diagnose canonicalization or source mutation |
| Certificate | DB persistence fails | Incomplete; no success state | Retry safe transaction |
| Certificate | User tries to edit/overwrite | 403/409 | Create a superseding record only through controlled correction workflow |
| Worker | Process crashes | Lease expires | Another worker claims job idempotently |
| Worker | Duplicate job delivery | Unique constraints and terminal-state check | Return existing outcome |
| Browser | SSE disconnects | Show reconnecting; poll API | Resume from last event ID/current state |
| Demo | Fixture missing/corrupt | Demo unavailable; no live fallback | Repair fixture in release |
| Budget | Per-run cap reached | Stop before next model call | Operator updates budget in intake/config |
| Preview | Production credential detected | Fail closed; do not deploy | Replace with preview-scoped secrets |

---

# 21. Test strategy

## 21.1 Unit tests

- Criteria vocabulary and duplicate validation.
- Canonical JSON serialization and SHA-256 hashes.
- Evidence JSON Pointer resolution and exact value match.
- Data Integrity Gate PASS/WARN/BLOCK behavior.
- Attacker payload projection removes criteria and peer results.
- Each attacker may use only its permitted snapshot set.
- Adjudicator precedence and coverage logic.
- Certificate generation and verification.
- State transition guards.
- Idempotency-key conflict behavior.
- Job lease expiry and reclamation rules.

## 21.2 Deterministic adjudication scenarios

| # | Findings | Expected |
|---:|---|---|
| 1 | All enabled attackers return NO_BREAK | TRADE |
| 2 | Anticipated liquidity BREAK | REFUSE |
| 3 | Anticipated safety BREAK | REFUSE |
| 4 | Anticipated logic BREAK | REFUSE |
| 5 | Unanticipated liquidity BREAK | ABSTAIN |
| 6 | Unanticipated safety BREAK | ABSTAIN |
| 7 | Unanticipated logic BREAK | ABSTAIN |
| 8 | Two or more valid INCONCLUSIVE | ABSTAIN |
| 9 | One INCONCLUSIVE, others NO_BREAK | TRADE with LIMITED coverage |
| 10 | Anticipated + unanticipated BREAK | REFUSE and preserve both |

Also test: fewer than three valid results → INCOMPLETE; Data Gate BLOCK → BLOCKED; failed/timed-out attacker is not NO_BREAK; invalid evidence BREAK cannot adjudicate.

## 21.3 Integration tests

- Authenticated request → analysis/job transaction.
- Worker claim and lease recovery.
- RYO adapter against contract fixtures and organizer sandbox if available.
- Snapshot write/hash and immutable behavior.
- Criteria commit and attacker-start ordering.
- OpenAI structured output parse/validation with mocked provider responses.
- Full orchestrator with mock RYO and mock model.
- Certificate transaction and duplicate-worker race.
- Owner isolation and RLS/runtime DB role checks.

## 21.4 E2E tests (Playwright)

1. Visitor opens landing and runs deterministic `REFUSE` demo.
2. Visitor verifies sample certificate.
3. Analyst signs in.
4. Analyst searches/selects supported asset.
5. Analyst starts a live analysis against sandbox/mocked dependencies.
6. Run screen updates through fetching, gate, thesis, criteria seal, attackers, adjudication, certificate.
7. Analyst opens evidence and inspects attacker findings.
8. Analyst verifies certificate; result is VERIFIED.
9. Analyst opens history and sees own run.
10. Analyst A cannot access Analyst B's run.
11. Incomplete run never displays TRADE.
12. Mobile viewport has no horizontal page overflow and all controls are keyboard-operable.

## 21.5 Security tests

- IDOR across run/certificate endpoints.
- Role escalation via profile mutation.
- Mass assignment of verdict/status/criteria/user_id.
- Attacker criteria exfiltration through prompt payload.
- Prompt injection embedded in RYO/user text.
- Arbitrary RYO base URL/tool name injection.
- Rate-limit and idempotency replay.
- CSRF/CORS behavior.
- XSS through model-generated strings.
- Secret redaction in logs and errors.
- Worker duplicate/lease race.
- Certificate tampering and hash verification.
- SQL injection probes.

## 21.6 Release gates

Before final UI refinement:
- All unit and integration tests pass.
- All critical E2E flows pass on preview.
- No unresolved critical/high severity bug.
- API/worker readiness checks pass.
- Demo fixtures are clearly labelled and tested.

Before production:
- Full security checklist passes.
- Operator has explicitly authorized production release.
- Production keys and data are isolated from preview.
- Final regression, migration, backup/recovery plan, and smoke test are documented.

---

# 22. Repository structure

```text
dissent/
├── PROJECT_SPEC.md
├── ARCHITECTURE.md
├── IMPLEMENTATION_PLAN.md
├── AGENTS.md
├── AI_HANDOFF.md
├── OPERATOR_INTAKE.md
├── REFERENCE_ASSETS.md
├── DEMO_VIDEO_PLAN.md
├── README.md
├── .env.example
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── apps/
│   ├── web/
│   │   ├── index.html
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── routes/
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   └── styles/
│   │   └── tests/
│   └── api/
│       ├── src/
│       │   ├── server.ts
│       │   ├── routes/
│       │   ├── plugins/
│       │   ├── auth/
│       │   ├── db/
│       │   ├── jobs/
│       │   ├── ryo/
│       │   ├── ai/
│       │   ├── integrity/
│       │   ├── thesis/
│       │   ├── attackers/
│       │   ├── adjudication/
│       │   ├── certificates/
│       │   └── observability/
│       └── tests/
├── packages/
│   ├── contracts/
│   ├── core/
│   ├── attacker-registry/
│   ├── prompts/
│   └── test-fixtures/
├── db/
│   ├── migrations/
│   ├── seed/
│   └── rls/
├── tests/
│   ├── scenarios/
│   ├── integration/
│   ├── security/
│   └── e2e/
├── docs/
│   ├── SETUP.md
│   ├── CONFIGURATION.md
│   ├── TESTING.md
│   ├── DEPLOYMENT.md
│   ├── TROUBLESHOOTING.md
│   ├── DESIGN_NOTES.md
│   ├── OPERATOR_GUIDE.md
│   ├── API.md
│   ├── DATA_MODEL.md
│   └── BUILD_LOG.md
└── artifacts/
    ├── certificates/
    └── demo/
```

This is the target structure for a new repository. During Phase 0 the agent inspects the actual repository and preserves compatible existing work. Do not create duplicate apps or replace an existing working architecture without documenting a real incompatibility.

---

# 23. Environment variables

| Variable | Required | Location | Purpose / notes |
|---|---:|---|---|
| `VITE_API_BASE_URL` | Yes | Browser-safe | Public API base URL; no secret |
| `VITE_SUPABASE_URL` | Yes | Browser-safe | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Browser-safe | Public anon key only; RLS required |
| `APP_ENV` | Yes | Server | `development/preview/production` |
| `API_PORT` | Yes | Server | Fastify port |
| `APP_BASE_URL` | Yes | Server | Canonical app origin for redirects/links |
| `CORS_ORIGINS` | Yes | Server | Exact comma-separated allowed origins |
| `SUPABASE_URL` | Yes | Server | Auth/JWKS project origin |
| `SUPABASE_JWKS_URL` | Yes | Server | Verified JWKS URL derived from Supabase project docs; not a secret |
| `APP_DATABASE_URL` | Yes | Server | Restricted runtime DB role; no BYPASSRLS if available |
| `WORKER_DATABASE_URL` | Yes | Server | Separate restricted worker DB role |
| `MIGRATION_DATABASE_URL` | Yes | CI/local secret | Privileged migration credential; never exposed to deployed browser or ordinary API runtime |
| `RYO_API_BASE_URL` | Yes for live | Server | Exact official base URL supplied by organizer |
| `RYO_API_KEY` | Yes for live | Server | Organizer-issued credential |
| `RYO_AUTH_SCHEME` | Yes for live | Server | Exact documented auth scheme/header identifier; no invented default |
| `OPENAI_API_KEY` | Yes for live | Server | OpenAI server key |
| `OPENAI_MODEL` | Yes for live | Server | Verified model ID approved during intake |
| `OPENAI_MAX_RUN_COST` | Yes for live | Server | Hard per-run budget threshold |
| `OPENAI_MAX_OUTPUT_TOKENS` | Yes | Server | Output cap |
| `MAX_ACTIVE_ATTACKERS` | Yes | Server | Default 3; maximum 6 |
| `MAX_CONCURRENT_RUNS_PER_USER` | Yes | Server | Default 3 |
| `MAX_RUNS_PER_USER_PER_DAY` | Yes | Server | Default 10; configurable by operator |
| `WORKER_ID` | Yes | Server | Unique runtime instance ID |
| `WORKER_CONCURRENCY` | Yes | Server | Default 2 jobs; adjust to provider quotas |
| `JOB_LEASE_SECONDS` | Yes | Server | Default 120; worker heartbeats for long calls |
| `DEMO_MODE_ENABLED` | Yes | Server | Enables deterministic fixture demo |
| `LOG_LEVEL` | Yes | Server | Structured logging level |
| `SENTRY_DSN` | No | Server | Optional only after explicit approval; not required in MVP |
| `TTS_PROVIDER` | No | Local/demo | Demo-production setting; never a live-app dependency |

Do not copy server-only variables into `VITE_` names. `RYO_API_KEY`, `OPENAI_API_KEY`, DB URLs, worker identity, migration URL, and any service-role secrets must never be shipped to the browser.

---

# 24. Autonomous phased implementation plan

The required order is fixed:

**Complete operator intake → early skeletal frontend deployment → core functionality → end-to-end verification → reference-image-led UI implementation → frontend/docs/footer completeness → demo video → final regression and authorized release.**

## Phase 0 — Consolidated Operator Intake / Readiness Check

**Objective:** Resolve all true blockers in one pass before code changes.  
**Tasks:** Read repository and existing handoff files; inspect Git status/manifests/migrations/tests/deploy config without modifying code; collect product confirmation, reference image, repository access, RYO docs/key, OpenAI key/model/budget, Supabase/Vercel/Render access, environment boundaries, demo requirements, production authority.  
**Outputs:** `OPERATOR_INTAKE.md`, `REFERENCE_ASSETS.md`, updated `AI_HANDOFF.md`.  
**Acceptance:** All critical inputs are present and validated; optional preferences have documented defaults. If the UI image is missing, ask for it in the single intake. Do not start implementation while critical access/authority is missing.  
**Git:** No code changes; commit docs only if authorized and repository is ready.

## Phase 1 — Repository foundation + skeletal frontend + preview

**Objective:** Establish repo and deploy an early navigable shell.  
**Tasks:** Preserve existing repo; configure pnpm workspaces; create React/Vite shell, required routes, primary navigation, auth placeholder, demo page placeholder, responsive layout, accessible temporary tokens; configure Vercel preview and placeholder API base; create initial Fastify health route; use safe fixture data only.  
**Outputs:** App shell, route structure, CI basics, preview deployment, first build log entry.  
**Acceptance:** All routes load; no inert nav; clearly labelled placeholders; mobile and desktop shell usable; exact preview URL and commit recorded. No live secrets or production data.  
**Commit:** `feat: establish app shell and preview deployment`.

## Phase 2 — Backend, database, auth foundation

**Objective:** Implement persistence and secure identity.  
**Tasks:** Fastify app, Zod contracts, Drizzle schema/migrations, Supabase Auth JWT verification, owner authorization, RLS/least privilege, health checks, durable jobs table and worker lease logic, Pino redaction.  
**Acceptance:** Auth tests, owner-isolation tests, migration test, create-job transaction test, worker claim/recovery test pass.  
**Commit:** `feat: add database auth and durable job foundation`.

## Phase 3 — Core domain logic and integrations

**Objective:** Implement deterministic core before full agent orchestration.  
**Tasks:** RYO REST adapter from verified docs; snapshot store/hash; Data Integrity Gate; supported asset validation; attacker registry; thesis/criteria contracts; criteria sealing; finding validator; adjudicator; certificate canonicalization/hash/verification; fixture providers.  
**Acceptance:** Unit tests and all adjudication scenario tests pass; criteria-seal ordering test passes; no LLM used by adjudicator.  
**Commit:** `feat: implement evidence integrity and deterministic decision core`.

## Phase 4 — Thesis and attackers

**Objective:** Connect structured AI calls with controlled input/output.  
**Tasks:** OpenAI Responses adapter; thesis generation; payload projection; initial three attackers (internal logic, safety, liquidity); enable extra attackers only after evidence mapping; per-attacker versioned prompts; usage/budget checks; one repair retry.  
**Acceptance:** Each active attacker has fixture-backed schema/evidence tests; automated payload test confirms criteria/peer results absent; invalid outputs fail closed.  
**Commit:** `feat: add thesis and isolated specialist attackers`.

## Phase 5 — Orchestration and API

**Objective:** Complete asynchronous analysis lifecycle.  
**Tasks:** Analysis API, queue worker, state transitions, progress events, cancellation boundary, idempotency, retry/recovery, atomic finalization, history/certificate API.  
**Acceptance:** End-to-end orchestrator works with fixture RYO/model providers and with authorized live sandbox; incomplete runs never produce TRADE; duplicate workers cannot create duplicate certs.  
**Commit:** `feat: orchestrate auditable analysis runs`.

## Phase 6 — Functional frontend integration

**Objective:** Connect all user journeys using the temporary consistent visual system.  
**Tasks:** Auth, token search, new analysis, progress, thesis/evidence, attacker findings, verdict, history, certificate view/verification, demo.  
**Acceptance:** User-facing core journeys function; loading/empty/error/denied/incomplete states work; preview updated with safe data.  
**Commit:** `feat: connect analysis workflow to frontend`.

## Phase 7 — End-to-end functionality gate

**Objective:** Prove critical behavior before final visual work.  
**Tasks:** Run unit, integration, security smoke tests, Playwright journeys against preview; fix and rerun.  
**Acceptance:** All critical E2E flows pass; no unresolved critical/high severity issue; preview URL/commit/test evidence recorded.  
**Commit:** `test: verify critical analysis journeys`.

## Phase 8 — Reference-image-led final UI + UI skills

**Objective:** Implement the actual final interface directly from supplied reference image(s).  
**Tasks:** Attempt `npx skills add benjitaylor/skills --skill stageshow`; inspect instructions; evaluate optional relevant skill(s); inspect supplied reference image(s); adapt design tokens/components/layout; implement final responsive UI; record design notes.  
**Acceptance:** Real UI implemented from actual images; no mockup approval stop; no copying proprietary assets; interaction/accessibility remains intact. If no image was supplied and no generation authorization exists, this phase is blocked and the omission is reported.  
**Commit:** `feat: implement reference-led product interface`.

## Phase 9 — Frontend and documentation completeness

**Objective:** Finish product presentation and operator/developer documentation.  
**Tasks:** Verify navigation/footer, docs/GitHub links, metadata/icons, support/legal destinations where appropriate, responsive/accessibility, every state, no inert controls, README and docs.  
**Acceptance:** All links verified; private repo not exposed; docs accurately reflect deployment and APIs.  
**Commit:** `docs: complete product and operator documentation`.

## Phase 10 — Demo video production

**Objective:** Produce a <=180-second demonstration from real application behavior.  
**Tasks:** Script 90–150 seconds; seed deterministic demo data; clean browser profile; Playwright capture; check free Google AI TTS/voice availability, quota, terms, credentials; generate narration; if unavailable use permitted free local TTS; synchronize, caption where feasible, redact, render, review playback/duration; save script/video/notes.  
**Acceptance:** Rendered demo <=180s; speech aligns to visible actions; no secrets/private URLs; final file and production notes saved.  
**Commit:** `docs: add reviewed product demo` (video may be stored in agreed artifact location rather than Git if large).

## Phase 11 — Final regression, security, and authorized release

**Objective:** Verify final build and deploy only within intake authority.  
**Tasks:** Full tests, static analysis, dependency audit, RLS/IDOR checks, backup/migration review, secret scan, smoke test, preview final verification. Production deploy only if explicitly authorized.  
**Acceptance:** Security issues resolved or documented; final URL/commit/test report recorded. If production authority is absent, deliver staging/preview plus exact release steps.  
**Commit:** `chore: finalize verified release`.

At every phase: **implement → test → inspect → fix → commit → update `AI_HANDOFF.md` + `docs/BUILD_LOG.md` → continue automatically**. Phase boundaries are not approval gates.

---

# 25. Product specification file

This file (`PROJECT_SPEC.md`) is the canonical product and functional specification. If other docs conflict, this file governs product behavior; `ARCHITECTURE.md` governs technical implementation, and `IMPLEMENTATION_PLAN.md` governs build order. Any change requires a documented decision record and updated version; the coding agent must not change these decisions independently.

---

# 26. Architecture specification

See `ARCHITECTURE.md` for the canonical system diagram, component boundaries, RYO adapter contract requirements, data isolation, database roles, deployment topology, and security architecture.

---

# 27. Implementation plan

See `IMPLEMENTATION_PLAN.md` for the exact phase sequence, internal checkpoints, acceptance criteria, commits, and blocker rules. The required order in Section 24 is mandatory.

---

# 28. Persistent agent instructions

See `AGENTS.md`. These instructions are part of the implementation contract and must be read before any repository change.

---

# 29. Handoff and intake

See `AI_HANDOFF.md`, `OPERATOR_INTAKE.md`, `REFERENCE_ASSETS.md`, and `DEMO_VIDEO_PLAN.md`. At this blueprint stage, no implementation phase is complete and no preview URL, credentials, repository, or reference-image asset is assumed to exist.

---

# 30. Final pre-implementation audit

| Audit item | Status | Evidence / action |
|---|---|---|
| Product definition and boundaries explicit | PASS | Sections 1–2 |
| MVP scope controlled | PASS | Three validated attackers minimum; six registry domains; no execution/payments |
| User roles and ownership explicit | PASS | Section 3 and auth design |
| Complete primary and failure flows | PASS | Section 4 and error matrix |
| Functional requirements testable | PASS | Section 5 |
| Business rules/state machines explicit | PASS | Section 6 |
| Data model and constraints explicit | PASS | Section 7 and `docs/DATA_MODEL.md` |
| Architecture fixed | PASS | Section 8 and `ARCHITECTURE.md` |
| Technology stack selected | PASS | Section 9 |
| API contracts specified | PASS | Section 10 and `docs/API.md` |
| DB transactions/concurrency specified | PASS | Section 11 |
| Auth/authorization/security designed | PASS | Sections 12–13 |
| UX routes/components/states defined | PASS | Section 14 |
| Reference images inspected | BLOCKED — intake | No UI reference image attached; ask during Phase 0; do not fabricate |
| Required stageshow skill included | PASS | Section 15 and AGENTS.md |
| RYO tool catalog verified | PASS — catalog level | Official published seven-tool list; exact endpoint/auth/schemas remain mandatory intake verification |
| RYO credentials and developer docs available | BLOCKED — intake | Organizer base URL, key, auth contract, request/response schemas, quota are not attached |
| OpenAI credentials/model/budget available | BLOCKED — intake | Collect key, exact model ID, free/paid account state, per-run and total ceilings |
| Repository and Git access inspected | BLOCKED — intake | No application repository supplied in this conversation |
| Supabase/Vercel/Render access available | BLOCKED — intake | Collect exact project/team permissions and deployment scopes |
| Production release authority | BLOCKED — intake | Default is preview only; production release requires explicit permission |
| Demo voice/TTS provider verified | DEFERRED — demo phase | Check current free tier/terms in Phase 10; fallback documented |
| Demo video plan complete | PASS | `DEMO_VIDEO_PLAN.md` |
| No coding requested/performed | PASS | This package contains planning/documentation only |

## Unresolved items converted into intake inputs

1. Existing repository URL/path and permission to create branches/commits.
2. Actual RYO developer docs, base URL, key, auth mechanism, request/response schema, rate limits, and sandbox access.
3. OpenAI key, model ID, terms/privacy acceptance, and hard run/project cost limits.
4. Supabase project and roles; Vercel team/project; Render service/team; exact preview domains.
5. One or more actual UI reference images, or explicit authorization for generated reference imagery.
6. Approved public GitHub repository link (if any); otherwise omit GitHub footer link.
7. Demo audience, pronunciation, required journeys, redactions, and output path.
8. Explicit production deployment authority (default: not authorized).

## CODING AGENT START POINT

**Exact first task:** Read `PROJECT_SPEC.md`, `ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md`, this `AGENTS.md`, `AI_HANDOFF.md`, `OPERATOR_INTAKE.md`, `REFERENCE_ASSETS.md`, and the repository's existing instructions. Inspect the repository and current environment without modifying files. Then conduct one consolidated Operator Intake/Readiness Check covering every unresolved critical item, verify that actual UI reference images exist, verify RYO/OpenAI credentials and provider contracts, verify Supabase/Vercel/Render access, verify permissions and budget ceilings, and record production-release authority. Do not begin implementation while critical inputs are missing. Once intake is complete, execute Phase 1 onward sequentially and autonomously, using internal test/commit/handoff checkpoints and no routine approval stops.
