# Dissent — Autonomous Implementation Plan

**Version:** 1.0 | **Mode:** Continuous autonomous execution after one complete intake

## Operating sequence (fixed)

`complete operator intake → early skeletal frontend deployment → backend/data/auth → core audit functionality → functional UI integration → end-to-end verification → reference-image-led final UI → frontend/docs completeness → demo video → final regression and authorized release`.

Phases are internal checkpoints, not user approval gates. At each checkpoint: run tests, inspect the result, fix failures, commit, update `AI_HANDOFF.md` and `docs/BUILD_LOG.md`, then continue. Stop only for the explicit blockers in `AGENTS.md`.

## Phase 0 — Consolidated operator intake and readiness

**Objective:** Collect all genuinely required inputs before modifying the repository.

Tasks:
1. Read all handoff documents and inspect repository state without changing files.
2. Complete `OPERATOR_INTAKE.md` in one consolidated round.
3. Verify reference images exist and can be opened; if absent, ask for them now. An agent-generated reference image may be used only with explicit operator authorization.
4. Verify repository write access, Git remote, branch policy and public/private status.
5. Verify provider credentials, model IDs, current quotas, API rate limits and cost ceiling without printing secret values.
6. Verify NEAR testnet account, deploy key, registry contract account, client signing approach, RPC access, and payout account IDs if testnet bounty transfer is included.
7. Verify Railway access/credits or mark preview as blocked; verify Postgres and environment secret injection.
8. Record permitted actions and prohibited actions, especially mainnet, live funds, production deployment, destructive operations and paid services.
9. Confirm the three-family/two-vendor/open-weight TEE path can be exercised. Check actual per-response attestation verification, not only a successful API response.
10. Resolve any missing critical item in one consolidated response. Use documented safe defaults for non-critical preferences.

**Expected artifacts:** completed `OPERATOR_INTAKE.md`, verified `REFERENCE_ASSETS.md`, `model_assignments.json`, `adapter_capabilities.json`, intake section in `AI_HANDOFF.md`.

**Acceptance:** no unresolved critical inputs; reference assets identified; testnet/preview authority explicit; budget ceiling recorded; provider model diversity and TEE path verified or a precise blocker recorded. No application code changes before this gate.

## Phase 1 — Repository foundation and skeletal frontend deployment

**Objective:** Establish a runnable repo and early navigable UI.

Tasks:
- Inspect Git status, existing code, lockfiles, env templates, tests, CI and deployment configuration; preserve useful work.
- Establish pnpm workspace, TypeScript config, lint/format/test scripts and Dockerfiles.
- Create Next.js app shell and all agreed routes with clearly labelled unfinished states.
- Add responsive navigation and neutral temporary visual system; do not invent a supplied reference.
- Create health endpoint and deployment-ready config.
- Deploy protected preview with synthetic seed data and testnet-only integrations where available.
- Record exact preview URL and deployed commit SHA.

**Acceptance:** app boots; all routes navigate; responsive skeleton; no production secrets/data; preview URL is real and recorded (or exact deployment blocker is recorded and local work continues).

## Phase 2 — Backend, data, identity and auth foundation

**Objective:** Build durable data and access-control foundations.

Tasks:
- Add PostgreSQL schema and migrations for clients, users, API keys, audits, theses, conditions, commitments, attacker runs, findings, evidence, events, certificates, policies, reputation and bounty records.
- Add Drizzle typed repositories and transaction helpers.
- Add Better Auth operator sessions; provision first admin through safe one-time command.
- Add scoped API-key auth for client agents; store hashes only.
- Add client/workspace authorization checks and tests for IDOR.
- Add Pino redacted logging, health/readiness endpoints and request IDs.
- Add pg-boss worker process and queue bootstrap.

**Acceptance:** migrations run on an empty DB; session and API key auth work; cross-client reads/writes are denied; worker starts and claims a test job; secrets do not appear in logs.

## Phase 3 — Core domain, commitment and service adapters

**Objective:** Implement deterministic audit intake and verifiable commitment before inference.

Tasks:
- Implement typed thesis/condition validation and normalization.
- Implement RFC 8785 canonical serialization and SHA-256 hash fixtures.
- Implement commitment transaction payload generation and receipt verification; implement fixed testnet fee quote, `fund_audit` receipt verification, and gate dispatch on both commitment and fee funding.
- Implement NEAR registry contract and local sandbox tests; deploy testnet only under granted authority.
- Implement source adapter interfaces and at least two working data routes for demo evidence.
- Implement model-provider adapter interface and actual capability check for OpenAI, Anthropic and NEAR AI Cloud.
- Implement NEAR AI deployment attestation and response signature verification.

**Acceptance:** known canonical hash test vectors pass; no attacker job before confirmed commitment and fee funding; wrong signer/hash/contract/method/fee rejected; TEE unverified model request cannot count toward a `TRADE`-eligible audit; source adapters record raw payload hash and retrieval metadata.

## Phase 4 — Attacker runtime and orchestration

**Objective:** Run eight specialist attackers in isolated contexts with the frozen schema.

Tasks:
- Implement all eight immutable method configurations and prompt templates.
- Implement the common schema, cross-field validation and server-owned provenance metadata.
- Implement typed tools for source reads; no arbitrary HTTP/shell/SQL or wallet access.
- Implement parallel queue fan-out, per-provider concurrency, timeouts and bounded retries.
- Ensure each attacker sees thesis + committed visible conditions + own role instructions only.
- Seal outputs until all eight runs close.
- Record model family, vendor, version, TEE evidence, prompt/config hash, input snapshot and usage/cost.

**Acceptance:** eight isolated runs produce schema-valid output for fixture and live sample; each assesses every condition once; each performs Section B; one run cannot read another run's artifacts; min model diversity enforced; partial/failure states remain explicit.

## Phase 5 — Evidence/red-team/adjudication/certificate/bounty functionality

**Objective:** Complete the full audit result before visual refinement.

Tasks:
- Implement Evidence Auditor with safe re-fetch and claim-to-evidence classifications.
- Implement Sycophancy Auditor and Section B novelty review.
- Implement snapshot-aware reproducibility checks and limitations.
- Implement deterministic policy v1.0 exactly as in `docs/ADJUDICATION_SPEC.md`.
- Implement condition coverage aggregation and divergence index.
- Implement certificate canonicalization, hash and NEAR registration.
- Implement reputation updates and idempotent bounty calculation.
- Implement testnet escrow settlement only if contract tests, payout accounts, funding, and operator authority are available.

**Acceptance:** policy test vectors pass; verified disqualifying finding leads to REFUSE; missing required coverage leads to ABSTAIN, not TRADE; unresolved critical disagreement leads to ABSTAIN; all decision inputs trace to records; certificate hash independently recomputes and matches NEAR; duplicate processing cannot pay/update reputation twice.

## Phase 6 — Functional frontend integration and E2E gate

**Objective:** Connect every critical UI route to real API/domain behavior.

Tasks:
- Build create-audit form for thesis and structured conditions.
- Implement client wallet transaction signing/commit flow.
- Implement audit timeline and run status.
- Implement certificate, coverage matrix, findings and dissent display.
- Implement public redacted verify page.
- Implement operator provider health, audit search and bounded retry.
- Add empty/loading/success/error/denied/not-found states.
- Add Playwright tests for primary journey and failures.

**Functionality gate:** unit + integration tests pass; critical E2E journey passes against deployed preview; no unresolved critical/high functional/security issues; preview commit and known limitations recorded. Final UI refinement cannot begin until this gate passes.

## Phase 7 — Reference-image-led final UI implementation

**Objective:** Implement the actual interface from supplied reference image(s).

Tasks:
1. Execute `npx skills add benjitaylor/skills --skill stageshow` from the project root.
2. Inspect installed skill instructions; record install/inspection result. If installation fails, log exact failure and proceed with strong design-system, usability and accessibility practice.
3. At discretion, discover additional reputable relevant UI skills; inspect and reject irrelevant/conflicting instructions.
4. Inspect exact reference assets listed in `REFERENCE_ASSETS.md`.
5. Extract composition, hierarchy, density, spacing, typography, color, component treatment, navigation and responsive behavior.
6. Implement the actual routes/components directly. No mockup/prototype phase and no approval stop.
7. Record interpretation and intentional deviations in `docs/DESIGN_NOTES.md`.

**Acceptance:** UI reflects actual supplied references without copying protected branding/assets; primary journeys remain functional; responsive/accessibility/E2E checks remain green.

## Phase 8 — Frontend and documentation completeness

**Objective:** Finish the product rather than only its central screen.

Tasks:
- Complete responsive desktop/tablet/mobile states.
- Finish nav/footer, real documentation/GitHub links, support/contact/legal destinations only where verified and approved.
- Add metadata, title templates, favicon/app icon and share metadata.
- Audit all buttons/links for real behavior; no `href="#"` or inert controls.
- Complete accessibility review and keyboard operation.
- Complete README and docs for setup, configuration, testing, deployment, troubleshooting, API, data, security and operator usage.

**Acceptance:** route inventory complete; no dead links/controls; mobile/keyboard states verified; docs match actual behavior and configuration.

## Phase 9 — Demo video, final regression and authorized release

**Objective:** Produce the final <=180-second demo and deliver a verified release candidate.

Tasks:
- Use Playwright to record deterministic demo data in a clean browser profile.
- Narrate commitment → eight attackers → divergence/invalid test/Section B → evidence verification → verdict/coverage/dissent → NEAR certificate → bounty record.
- Check availability, free tier, credentials, terms and quotas for Google AI voice/TTS. Do not assume free unlimited use or spend without authority.
- Use a genuinely free permitted fallback TTS if Google option unavailable; document substitution.
- Synchronize narration with visible actions, add captions where feasible, redact secrets/private URLs/personal data.
- Render and review full video; verify audio and video playback and duration <=180 seconds.
- Run full unit/integration/E2E/security suite and contract tests; scan secrets/dependencies.
- Deploy production only if explicit authority and all release gates are recorded. Otherwise deliver tested preview and exact release instructions.

**Expected outputs:** `demo/dissent-demo.mp4`, narration script, production notes, public repo, public X demo post assets/links when operator authorizes posting.

## Checkpoint template

```text
Phase:
Commit:
Preview URL:
Completed:
Tests/evidence:
Known issues:
Reference asset and stageshow status:
Documentation status:
Demo status:
Production/mainnet authority:
Budget consumed / ceiling:
Next task:
Blocked by:
```
