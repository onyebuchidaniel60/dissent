# DISSENT — COMPLETE IMPLEMENTATION-READY PROJECT BLUEPRINT

**Project:** Dissent — Adversarial Audit Protocol for AI Trading Agents  
**Hackathon:** NEAR Hackathon 2026  
**Deadline:** 14 November 2026, 23:59 UTC  
**Blueprint version:** 1.0 — 13 November 2026  
**Status:** Product and architecture specified; implementation has not started in this planning package.

## Purpose and source of truth

This blueprint consolidates the frozen Dissent handoff, the attacker output schema and product requirements already drafted, and the uploaded `PROPER_VIBE_CODING_WORKFLOW_AUTONOMOUS(1).md`. The workflow is the implementation methodology; Dissent's frozen architecture is the product source of truth. This package resolves technical ambiguities and identifies missing operator inputs rather than delegating product decisions to a coding agent.

The agent must complete one consolidated intake before repository modification, then execute phases continuously without routine approval stops. It must deploy a navigable skeletal frontend early, finish critical end-to-end functionality before reference-led visual refinement, and produce a reviewed demo video no longer than 180 seconds.

---

# 1. Product definition

**Name:** Dissent.  
**One-line description:** Evidence-backed adversarial audit protocol for AI trading agents.  
**Problem:** Autonomous trading agents can validate their own assumptions and execute consequential financial decisions without independent challenge. Multiple models may share correlated failure modes; unsupported claims and goalpost changes are hard to detect.  
**Current workarounds:** Self-critique, second-model review, unisolated multi-agent debate, human review, data dashboards, wallet limits. These solve only parts of the problem.  
**Target users:** AI agent developers, DeFi treasury/protocol operators, operators of agent-managed portfolios, and researchers/reviewers.  
**Roles:** client agent, client operator, Dissent admin/operator, eight internal attackers, Evidence Auditor, Sycophancy Auditor, deterministic Adjudicator, public certificate verifier.  
**Value proposition:** Before execution, a client receives a `TRADE`, `REFUSE`, or `ABSTAIN` result backed by committed failure conditions, eight isolated specialist attackers, independently retrievable evidence, explicit coverage, preserved dissent and a NEAR-anchored certificate.  
**Differentiator:** Dissent is a firm, not an external marketplace. Independence is epistemic: distinct model families, adversarial methods, source diets, run contexts and sibling blindness. The protocol preserves minority findings and does not use majority voting.  
**Primary use case:** Submit a NEAR DeFi trading thesis; commit its conditions on-chain; fund the audit on testnet; run the eight attackers; verify evidence; adjudicate; publish a certificate.

**Hackathon tracks:** Primary — AI Security & Defense and Investment Thesis. Secondary — Agent Economy and AI Swarms. One Dissent submission enters all four; proprietary trading P&L remains future scope.  
**Secondary use cases:** Audit staking/lending/swap decisions, portfolio exposure and investment theses; future Dissent-originated theses use the same pipeline.  
**Does not do:** It is not a broker, exchange, custodian, retail financial adviser, profit guarantee or open attacker marketplace. The hackathon MVP does not trade live funds.

Detailed product spec: [`PROJECT_SPEC.md`](PROJECT_SPEC.md) and [`DISSENT_PRD.md`](DISSENT_PRD.md). Screen-by-screen interaction and state requirements: [`docs/UI_UX_SPEC.md`](UI_UX_SPEC.md).

# 2. MVP scope

### MUST HAVE
- API-first audit creation and operator/client console.
- Structured thesis and machine-testable failure conditions.
- RFC 8785 canonical JSON + SHA-256 thesis/condition hashes.
- Client-signed NEAR testnet condition commitment, verified before attackers receive the preimage.
- Eight specialist attacker runs, all isolated, all using the common schema.
- Three model families across two vendors, including open-weight NEAR AI Cloud TEE model with verified deployment attestation and response signature.
- Required Section A and Section B; `INVALID_TEST`; evidence records; safe re-fetch.
- Evidence Auditor and Sycophancy Auditor.
- Reproducibility assessment with explicit limitations.
- Deterministic adjudicator; three verdicts; no majority vote.
- Certificate with coverage table and dissenting findings; on-chain certificate hash.
- Reputation ledger and bounty calculation; testnet escrow/payout if its tests and operator authority pass.
- Live audit capability plus clearly-labelled deterministic demo fixtures.
- Documentation, protected preview and <=180-second reviewed demo video.

### SHOULD HAVE
Testnet bounty escrow settlement; NearBlocks/Pikespeak adapters where credentials available; RedStone adapter; bounded retries; public certificate verifier; optional webhook.

### NICE TO HAVE
Reputation explorer; certificate share view; optional notifications.

### FUTURE
Proprietary scanner, tiered pre-screen/full audit, vault-based execution, mainnet bounty settlement, 1Click standard deposit flow, externalized attacker pool after quality pricing.

### OUT OF SCOPE
Open marketplace, live mainnet trading, NEP-413 signed-intent using Function Call Key, client asset custody, required Pyth NEAR integration, Chainlink NEAR integration, tokens/governance/social trading.

# 3. User roles

| Role | Permissions | Explicitly prohibited |
|---|---|---|
| Client agent | Create audit; commit through its signer; read only its own audit/certificate | Read another client's data; change committed inputs; access internal results during execution |
| Client operator | Manage own agent credentials; inspect own audits | View other workspace; edit finalized audit |
| Dissent OWNER | Configure admins, provider assignment and policy releases; authorize operations | Bypass contract/security invariants |
| Dissent OPERATOR | Inspect system, retry eligible failed jobs, view redacted operational details | Edit committed inputs/final verdict; force payout |
| Dissent READ_ONLY | Inspect permitted reports | Mutate configuration or retry jobs |
| Attacker runtime | Run assigned method, query allowed adapters, submit own result | Read sibling output, secrets, adjudicator state, wallet keys, arbitrary web/shell/SQL |
| Evidence Auditor | Re-fetch evidence, verify claims, classify results | Issue final verdict |
| Sycophancy Auditor | Assess agreement bias, novelty and Section B quality | Reject a valid finding merely for agreeing with thesis |
| Adjudicator | Apply pinned deterministic policy | Vote, invent findings, use hidden LLM discretion |
| Public verifier | Inspect redacted public certificate metadata and on-chain hash | Read private thesis, conditions, portfolio/evidence payload |

# 4. Complete user flows

The canonical flows are fully specified in [`PROJECT_SPEC.md`](PROJECT_SPEC.md). Summary:

1. **Submit/commit:** validate typed thesis and conditions → normalize → hash → create `AWAITING_COMMITMENT` → client wallet signs `commit_conditions` → backend verifies final receipt, signer and exact hashes → `COMMITTED` → dispatch.
2. **Fund:** after commitment finality, client receives a fixed testnet fee quote and funds the bounty vault; attacker dispatch remains blocked until exact amount/quote/network is confirmed.
3. **Attack:** orchestrator creates eight isolated run envelopes → each receives thesis + visible committed conditions + only its method/tools → parallel model execution → schema validation → evidence store → seal outputs.
4. **Review:** Evidence Auditor re-fetches approved sources and verifies claim support → Sycophancy Auditor checks repetition/novelty → reproducibility runner checks same snapshot/config where possible → retain limitations.
5. **Adjudicate/certify:** calculate coverage/divergence and apply deterministic rules → preserve findings → canonical certificate → on-chain hash registration → calculate bounty and reputation update.
6. **Inspect:** owner sees status, coverage, evidence, accepted/rejected findings, minority dissent and chain verification.
7. **Recover:** admin retries only eligible failed run under fixed cap, same snapshot and identity; original output remains immutable.

No attacker job can run before verified commitment. A committed audit cannot be edited or erased; any change creates a new audit ID linked to the old one. Failed attackers are `FAILED`, never `NOT_HIT`. Missing data is `UNVERIFIABLE`, never negative evidence.

# 5. Functional requirements

The normative list is FR-01 through FR-22 in [`PROJECT_SPEC.md`](PROJECT_SPEC.md). The highest-priority acceptance contracts are:
- no dispatch before client-signed commitment finality;
- one assessment per committed condition per successful attacker;
- each attacker investigates Section B;
- at least three model families/two vendors/verified open TEE model;
- no sibling access;
- evidence IDs resolve to server-created records;
- only validated findings enter the adjudicator;
- missing/failed coverage cannot produce `TRADE`;
- minority findings remain in certificate;
- certificate hash recomputes to the on-chain record;
- retries and settlement are idempotent.

# 6. Business logic and state machines

Audit lifecycle: `DRAFT → VALIDATING → AWAITING_COMMITMENT → COMMITTED → AWAITING_FUNDING → FUNDED → QUEUED → ATTACKING → EVIDENCE_REVIEW → SYCOPHANCY_REVIEW → REPRODUCIBILITY_CHECK → ADJUDICATING → CERTIFICATE_PENDING → COMPLETED`.

Exception states: `VALIDATION_FAILED`, `COMMITMENT_FAILED`, `ATTACKER_FAILED`, `REVIEW_FAILED`, `ADJUDICATION_FAILED`, `CERTIFICATE_FAILED`, and `CANCELLED_BEFORE_COMMIT`. After commitment, stop requests preserve the audit record and result in explicit incomplete/abstain status where applicable.

Finding flow: `SUBMITTED → EVIDENCE_REVIEW → SYCOPHANCY_REVIEW → ACCEPTED | NEEDS_REVIEW | REJECTED`.

Adjudication precedence:
1. `REFUSE` for one accepted verified disqualifying finding or a verified critical committed failure condition.
2. Else `ABSTAIN` for insufficient coverage, model diversity/TEE failure, material invalid/unverifiable condition, stale/absent critical evidence, unresolved critical contradiction, divergence threshold, or incomplete review.
3. `TRADE` only when all eight attackers, diversity, TEE, material evidence, reviews and conflict gates pass.
4. Otherwise `ABSTAIN`.

No majority vote. Exact severity/evidence/reproducibility factors, divergence formula, bounty formula and 16 test vectors are in [`docs/ADJUDICATION_SPEC.md`](ADJUDICATION_SPEC.md).

# 7. Data model

PostgreSQL tables: `users`, `workspaces`, `workspace_members`, `client_api_keys`, `audits`, `theses`, `failure_conditions`, `commitments`, `attacker_runs`, `data_snapshots`, `evidence_records`, `findings`, `condition_assessments`, `review_records`, `tee_verifications`, `certificates`, `reputation_events`, `bounty_pools`, `bounty_payments`, `audit_events`, `provider_configs`.

All records use UUIDs unless sequence IDs are specified; timestamps are UTC; amount values are integer smallest-unit strings/NUMERIC, never floating point. Workspace ID is derived from authenticated principal, not request data. Unique constraints cover idempotency keys, condition IDs, attacker/run generation, condition assessment, certificate hash, reputation event and settlement ID. See [`docs/DATA_MODEL.md`](DATA_MODEL.md) for fields, relationships, indexes and privacy classification.

# 8. System architecture

Modular monolith + dedicated worker; no microservice mesh. The Next.js app owns web and REST interfaces. A worker process runs durable pg-boss jobs. PostgreSQL is application source of truth. NEAR contracts store public commitment/certificate hashes and testnet bounty settlements. Eight attacker contexts are isolated; the worker orchestrator seals results before red-team/adjudicator access. Detailed diagram and boundaries: [`ARCHITECTURE.md`](ARCHITECTURE.md).

# 9. Technology stack

- Frontend/API: Next.js App Router, React, TypeScript.
- Styling/components: Tailwind CSS + accessible primitives; visual design follows supplied references.
- Package/build: pnpm workspace; Node.js 22 LTS or compatible current LTS pinned.
- Database/ORM: PostgreSQL 16+, Drizzle ORM.
- Durable jobs: pg-boss on Postgres.
- Validation: Zod + JSON Schema Draft 2020-12 validation.
- Models: official OpenAI SDK, Anthropic SDK, and `@nearai/inference-sdk`.
- NEAR integration: maintained NEAR JS SDK/wallet integration; Rust + `near-sdk` contracts.
- Tests: Vitest, Playwright, NEAR sandbox/near-workspaces.
- Logging: Pino; optional Sentry only after config/redaction review.
- Deployment: Docker; Railway web, worker and Postgres default.

Exact library versions are pinned in lockfiles during implementation. Do not install unpinned `latest` or silently change the architecture. Stack rationale and alternatives are in `ARCHITECTURE.md`.

# 10. API specification

Base `/api/v1`, JSON, scoped bearer API keys for client agents, secure HTTP-only sessions for dashboard users. Endpoints:
- `POST /audits`
- `POST /audits/{id}/commitment/prepare`
- `POST /audits/{id}/commitment/confirm`
- `POST /audits/{id}/fee/quote`
- `POST /audits/{id}/fee/confirm`
- `GET /audits`
- `GET /audits/{id}`
- `GET /audits/{id}/events`
- `GET /audits/{id}/certificate`
- `GET /certificates/{id}/verify` (redacted public view)
- `POST /audits/{id}/cancel` (only before commit)
- Admin: `GET /admin/audits`, `POST /admin/audits/{id}/retry`, `GET /admin/attackers`, `GET /admin/providers/health`, `GET /admin/reputation`, `GET /admin/system/health`.

All create/mutate operations use idempotency. Error envelope, request samples, validation, permissions and side effects: [`docs/API_SPEC.md`](API_SPEC.md).

# 11. Database operations

Use transactions for audit creation, commitment confirmation, run completion, adjudication, bounty reservation and reputation events. Never hold DB transactions open across third-party API/model calls. Use outbox pattern; queue handlers are idempotent. Lock audit/pool rows for adjudication and payout. Record an immutable event per state transition. See [`docs/DATABASE_OPERATIONS.md`](DATABASE_OPERATIONS.md).

# 12. Authentication and authorization

- Client agent API keys: high-entropy opaque secrets; display once; store hash only; scopes `audit:create`, `audit:read:own`, `certificate:read:own`; support expiry/revocation.
- Human operator dashboard: Better Auth sessions, secure cookies, no public signup; initial admin provisioned through one-time controlled command.
- Roles: `OWNER`, `OPERATOR`, `READ_ONLY`.
- Every data query must enforce workspace ownership server-side; no UI-only checks.
- Worker services receive least-privilege service principals; attackers cannot access generic DB or secret store.
- Public verifier returns only redacted public certificate fields.

# 13. Security architecture

Controls include strict schemas, rate/cost caps, parameterized DB access, CSRF/CSP/XSS defenses, adapter host allowlists, SSRF blocks, untrusted-data prompt-injection boundaries, sealed sibling contexts, server-owned model provenance, verified TEE receipts, bounded retries, idempotency, contract access control, restricted Function Call Keys, no live trade executor, and fail-closed verdict handling. Full threat matrix and release gates: [`docs/SECURITY_SPEC.md`](SECURITY_SPEC.md).

# 14. UI/UX architecture

Routes: landing; app dashboard; new audit; audit detail/progress; certificate; public verify; attacker roster; reputation; admin providers/system; docs. Desktop workbench with responsive tablet/mobile adaptation. Screens display actual audit states, coverage, evidence provenance, minority findings and verification. Every route defines loading, empty, validation, success, error, denied and not-found states. Use keyboard-accessible semantic components, clear focus, contrast and live progress regions.

The exact visual composition is deliberately deferred to real reference image inspection at Phase 7; this is not an unresolved product/architecture decision.

# 15. Reference-image-led UI implementation and skill requirements

No UI reference image was included in this conversation. This is a required Phase 0 intake item. The coding agent must record exact filenames/paths, source/ownership and intended use in `REFERENCE_ASSETS.md`, inspect the images, and implement the real UI directly. It must not pretend an image was supplied or create a separate mockup approval phase.

At the start of UI work it must run:
```bash
npx skills add benjitaylor/skills --skill stageshow
```
Then inspect/apply relevant instructions. Additional trustworthy UI skills are optional at the agent's discretion. Conflicting/irrelevant instructions are rejected. If install fails, log and proceed using robust design-system/accessibility practices. Record design interpretation in `docs/DESIGN_NOTES.md`.

# 16. Third-party integrations

Required: OpenAI, Anthropic, NEAR AI Cloud attested open-weight inference; NEAR RPC/testnet; Postgres; preview host. At least two usable evidence adapters are required for the demo. Preferred source layer: FastNear API/RPC plus one independent adapter such as Pikespeak or NearBlocks; RedStone is preferred for signed oracle data if required assets/feed are verified. Pyth is disabled by default for NEAR due current support status. `mcp-near-defi` is optional and must pass a callable smoke test before use. No webhook or email dependency in MVP.

### Verified integration changes
- **Pyth:** Pyth documentation says Pyth Core no longer supports NEAR as of 26 August 2026. Do not hardwire Pyth as an active NEAR source. A Pyth NEAR adapter is conditional on direct confirmation of a maintained deployment. citeturn709261search2
- **NEAR AI Cloud:** current service offers open-weight TEE-hosted inference; official verification material describes deployment/response signature verification. The app must verify both, not merely call the endpoint. citeturn583546search3turn702342search6turn702342search7
- **NEAR Intents 1Click:** no testnet; standard quote/deposit/status workflow exists. NEP-413 signing requires owner full-access key. Dissent MVP does not need 1Click and must not give a full-access key to an agent. citeturn583546search0turn583546search6turn709261search11
- **RedStone:** public NEAR connector repository exists; implementation must confirm exact asset/feed availability and smoke-test its JS/Rust adapters before relying on any feed. citeturn702342search0
- **FastNear:** current API documentation distinguishes indexed account API, canonical RPC, transaction history and data API. Use the correct surface per evidence type. citeturn709261search1turn709261search4

# 17. AI architecture

Each attacker has an immutable role prompt and typed adapter tools. Inputs: canonical thesis, visible condition preimage, snapshot summary, attacker-specific authorized source grant, method instructions. No prior verdicts, sibling outputs, arbitrary URLs, shell, filesystem, SQL or wallet signing.

Provider assignments are server-side. Baseline mapping:
- A01 OpenAI GPT family.
- A02 Anthropic Claude family.
- A03 OpenAI GPT family (distinct method/context).
- A04 Anthropic Claude family.
- A05 NEAR AI Cloud open-weight Qwen family.
- A06 NEAR AI Cloud open-weight GLM family.
- A07 OpenAI GPT family.
- A08 Anthropic Claude family.

Exact model IDs/versions and quotas are frozen during intake. A substitution is logged and cannot silently break three model families/two vendors/TEE. Native provider SDK adapters, structured outputs, Zod/JSON Schema validation, bounded correction/retry, token/cost ceilings. NEAR AI response attestation/signature are checked and stored. No chain-of-thought is persisted or exposed; save concise rationale, evidence and calculations only.

# 18. Payment/financial architecture

The MVP demonstrates client audit funding and accepted-finding bounties on NEAR testnet only. The client commits conditions, receives a fixed testnet fee quote, then funds the bounded bounty vault before attacker dispatch. This is testnet-only and is not real revenue. Provider invoices are billed to Dissent's configured vendor accounts; per-attacker compute budgets are internal sub-ledgers unless provider billing truly supports distinct per-agent payer accounts. No mainnet fee, bounty transfer or proprietary trade is authorized by this blueprint. See [`docs/ECONOMICS_SPEC.md`](ECONOMICS_SPEC.md).

Bounty rules: only accepted findings qualify; Section B multiplier 1.25 versus Section A 1.0 for equivalent severity/reproducibility; per-audit/per-attacker caps; duplicate cluster rewards are split; integer smallest-unit arithmetic; idempotent settlement. Rejected findings receive zero.

# 19. Admin/operations

Minimal admin console: provider/TEE status, source adapter health, queue state, audit/run inspection, bounded retry, policy version, model cost, chain registry status, bounty pool/settlement and reputation. No admin UI control edits committed inputs, forces verdicts, exports provider secrets or launches unapproved mainnet transactions. All admin mutations are audit logged.

# 20. Error and edge-case matrix

Full matrix: [`docs/ERROR_EDGE_CASE_MATRIX.md`](ERROR_EDGE_CASE_MATRIX.md). Principal fail-closed rules:
- malformed or uncommitted audit → no jobs;
- attacker/model/TEE failure → explicit failed coverage and ABSTAIN unless a verified disqualifying REFUSE applies;
- stale/missing evidence → unverifiable, not NOT_HIT;
- conflicting critical evidence → re-fetch/replay then ABSTAIN if unresolved;
- unknown payout state → reconcile before retry;
- preview outage → record blocker and continue local unaffected work;
- no production/mainnet authority → do not release.

# 21. Testing strategy

- Unit: canonicalization/hash, schema, state transitions, condition tests, finding acceptance, scoring, divergence, verdict precedence and money caps.
- Integration: DB, queue, auth scoping, provider adapters, NEAR receipt/contract, TEE verifier, evidence re-fetch, idempotency.
- E2E: full commit → run → result → public verify; tenant isolation; failure states; responsive/keyboard.
- Security: IDOR, API keys, CSRF/XSS, SQLi, SSRF, prompt injection, sibling access, fake evidence, duplicate jobs/payouts and secret scans.
- Contracts: local sandbox tests and testnet smoke.
- Gate: E2E on preview and no unresolved critical/high issues before final visual refinement.

See [`docs/TESTING.md`](TESTING.md).

# 22. Repository structure

```text
dissent/
├── PROJECT_SPEC.md
├── DISSENT_PRD.md
├── DISSENT_IMPLEMENTATION_BLUEPRINT.md
├── ARCHITECTURE.md
├── IMPLEMENTATION_PLAN.md
├── AGENTS.md
├── AI_HANDOFF.md
├── OPERATOR_INTAKE.md
├── REFERENCE_ASSETS.md
├── DEMO_VIDEO_PLAN.md
├── README.md
├── .env.example
├── package.json / pnpm-workspace.yaml / pnpm-lock.yaml
├── apps/
│   ├── web/                 # Next.js UI + REST API
│   └── worker/              # pg-boss processors
├── packages/
│   ├── domain/              # types, state machines, pure policy
│   ├── db/                  # Drizzle schema/migrations/repositories
│   ├── providers/           # OpenAI, Anthropic, NEAR AI Cloud
│   ├── data-adapters/       # FastNear, RPC, Pikespeak, NearBlocks, RedStone
│   ├── attacker-runtime/    # methods, prompts, isolation, schema validation
│   └── certificates/        # canonical certificate/hash code
├── contracts/
│   ├── dissent-registry/    # Rust NEAR registry
│   └── dissent-bounty-vault/# Rust NEAR bounty escrow
├── schemas/
│   └── attacker-output-v1.schema.json
├── tests/
│   ├── fixtures/
│   ├── integration/
│   └── e2e/
├── demo/
└── docs/
    ├── SETUP.md
    ├── UI_UX_SPEC.md
    ├── CONFIGURATION.md
    ├── TESTING.md
    ├── DEPLOYMENT.md
    ├── TROUBLESHOOTING.md
    ├── DESIGN_NOTES.md
    ├── BUILD_LOG.md
    ├── OPERATOR_GUIDE.md
    ├── API_SPEC.md
    ├── DATA_MODEL.md
    ├── DATABASE_OPERATIONS.md
    ├── ADJUDICATION_SPEC.md
    ├── SECURITY_SPEC.md
    ├── SMART_CONTRACT_SPEC.md
    └── ERROR_EDGE_CASE_MATRIX.md
```

# 23. Environment variables

Required server-only variables:
- `DATABASE_URL`, `AUTH_SECRET`, `API_KEY_PEPPER`, `APP_BASE_URL`.
- `OPENAI_API_KEY`, `OPENAI_AUDIT_MODEL`.
- `ANTHROPIC_API_KEY`, `ANTHROPIC_AUDIT_MODEL`.
- `NEARAI_API_KEY`, `NEARAI_BASE_URL`, `NEARAI_OPEN_MODEL_1`, optionally `NEARAI_OPEN_MODEL_2`, `NEARAI_SIGNING_ALGO`, `NEARAI_EXPECT_SIGNATURE_KIND`.
- `NEAR_NETWORK_ID`, `NEAR_RPC_URL`, `NEAR_REGISTRY_ACCOUNT_ID`, restricted registrar secret reference.
- `DEMO_AUDIT_FEE_YOCTO`, `DEMO_BOUNTY_POOL_YOCTO`, `DEMO_FEE_QUOTE_TTL_SECONDS`, `DEMO_TREASURY_ACCOUNT_ID` for testnet economic demonstration.
- `MAX_CONCURRENT_AUDITS`, `MAX_INFERENCE_COST_PER_AUDIT`, `MAX_INFERENCE_COST_GLOBAL`, `MAX_RETRIES`, `LOG_LEVEL`.

Optional: `FASTNEAR_API_KEY`, `PIKESPEAK_API_KEY`, `NEARBLOCKS_API_KEY`, `REDSTONE_CONFIG_REF`, `NEAR_BOUNTY_CONTRACT_ID`, restricted settlement signer reference, `SENTRY_DSN`, TTS API credentials if free tier is verified and authorized. Full descriptions and exposure classifications: [`docs/CONFIGURATION.md`](CONFIGURATION.md).

# 24. Phased implementation plan

The agent must preserve the exact workflow ordering:
1. Phase 0: one consolidated operator intake/readiness check; no code edits while critical input/reference image missing.
2. Phase 1: repository foundation, route-complete skeletal frontend, safe preview deployment.
3. Phase 2: backend, DB, auth and worker foundation.
4. Phase 3: canonical commitments, NEAR contract, data/model adapters and TEE verification.
5. Phase 4: eight attackers, output validation, isolation and orchestration.
6. Phase 5: evidence/red-team/reproducibility/adjudication/certificate/bounty.
7. Phase 6: functional frontend integration and end-to-end functionality gate.
8. Phase 7: reference-image-led actual UI implementation and stageshow skill.
9. Phase 8: frontend completeness, accessibility and documentation.
10. Phase 9: <=180-second demo video, final regression/security and only authorized release.

No routine approval stops between phases. Full objectives, work items, acceptance criteria, checkpoint template and recovery rules: [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md).

---

# 25. `PROJECT_SPEC.md`

Actual standalone contents are in [`PROJECT_SPEC.md`](PROJECT_SPEC.md). It is the authoritative product definition, MVP, roles, workflows, functional requirements, state machine and core business logic.

# 26. `ARCHITECTURE.md`

Actual standalone contents are in [`ARCHITECTURE.md`](ARCHITECTURE.md). It fixes the stack, modules, provider/data adapters, queue, deployment and security boundaries.

# 27. `IMPLEMENTATION_PLAN.md`

Actual standalone contents are in [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md). It defines the autonomous Phase 0–9 execution and acceptance checkpoints.

# 28. `AGENTS.md`

Actual persistent instructions are in [`AGENTS.md`](AGENTS.md). It governs source of truth, intake, autonomy, architecture preservation, safety, references, test gates and demo.

# 29. `AI_HANDOFF.md`

Actual resume state is in [`AI_HANDOFF.md`](AI_HANDOFF.md). It accurately records that implementation, repository inspection and preview deployment have not yet happened.

# 30. Final pre-implementation audit

| Audit item | Status |
|---|---|
| Product and boundaries explicit | PASS |
| MVP/future/out-of-scope split explicit | PASS |
| Roles, permissions and user flows explicit | PASS |
| Functional requirements and acceptance tests explicit | PASS |
| Business states and transitions explicit | PASS |
| Data model, relationships, privacy classification explicit | PASS |
| Architecture and stack fixed | PASS |
| API routes, auth, validation and errors documented | PASS |
| DB transactions, idempotency and race conditions documented | PASS |
| Authentication/authorization and tenant isolation documented | PASS |
| Security threat model and mitigations documented | PASS |
| UI route inventory and state requirements documented | PASS |
| Reference-image requirement honest and marked pending | PASS — operator must supply in intake |
| `stageshow` install/inspection requirement included | PASS |
| Third-party integrations and fallback limitations documented | PASS |
| AI/model/Tee/structured output architecture documented | PASS |
| Payment/bounty and live-money boundaries documented | PASS |
| Admin/operations scope defined | PASS |
| Error/edge-case matrix created | PASS |
| Unit/integration/E2E/security/contract test strategy defined | PASS |
| Repository structure documented | PASS |
| Environment variable inventory documented | PASS |
| Autonomous phases preserve required order | PASS |
| README and `docs/` plan included | PASS |
| `AGENTS.md` actual persistent instructions included | PASS |
| `AI_HANDOFF.md` actual current state included | PASS |
| Demo video <=180 seconds with TTS verification/review included | PASS |
| Production/mainnet/paid-action authority boundaries explicit | PASS |
| Exact provider IDs, credentials, quotas and budget ceiling supplied | **PENDING OPERATOR INTAKE** |
| UI reference image(s) supplied and inspected | **PENDING OPERATOR INTAKE** |
| Repository/deployment credentials and preview URL verified | **PENDING OPERATOR INTAKE** |
| NEAR testnet deployer/client signer/payout accounts verified | **PENDING OPERATOR INTAKE** |
| At least two live evidence adapters smoke-tested | **PENDING IMPLEMENTATION READINESS** |

### Resolved issues versus unresolved operator inputs

**Resolved in this blueprint:**
- Pyth is not a required NEAR data source.
- NEAR AI TEE means verified attestation and response signature, not merely a provider URL.
- 1Click signed-intent cannot be treated as a vault Function Call Key operation.
- Internal attackers' model-provider bills are charged to Dissent's provider accounts unless true per-agent billing exists; per-attacker compute budgets are accounting sub-ledgers.
- Client conditions are signed by the client (wallet/agent signer); Dissent verifies the chain record and does not silently replace the client with its own registrar.
- No live proprietary trading in the MVP.

**Still requires operator intake:** exact repo access, actual reference images, available model IDs and credentials, budget limits, NEAR testnet signer/deployer/payout account access, provider/API account scopes, demo output location, and any production/mainnet authority.

---

# CODING AGENT START POINT

**The exact first task is:**

> Read `AGENTS.md` and every source-of-truth document in the handoff package. Inspect the existing repository and environment without modifying code. Complete the consolidated `OPERATOR_INTAKE.md` / readiness check in one interaction. Verify the exact UI reference image files and their ownership, Git repository/branch access, provider credentials and model-family assignments, actual NEAR AI TEE attestation/response verification, NEAR testnet client signer/deployer/registry/payout access, data adapter availability, preview deployment access, cost ceilings, production/mainnet authority, permitted actions and demo requirements. Ask once for all genuinely missing critical inputs; do not re-ask for information already available. Do not begin implementation until critical inputs and reference images are present. After intake passes, execute Phase 1 onward sequentially and autonomously, with tests, inspection, fixes, meaningful commits, `AI_HANDOFF.md` and build-log updates at every internal checkpoint. Do not stop for routine approvals.

**Do not start coding before this intake. Do not change Dissent's frozen architecture.**
