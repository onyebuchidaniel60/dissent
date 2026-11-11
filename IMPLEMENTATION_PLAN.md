# Dissent — Autonomous Implementation Plan

**Status:** Pre-implementation plan  
**Mandatory sequence:** intake → skeletal preview → core functionality → E2E verification → reference-led UI → frontend/docs completeness → demo → final regression/authorized release.

## Operating rule

The agent executes all phases sequentially. Each phase ends with an internal engineering checkpoint, not an operator approval gate:

```text
IMPLEMENT → TEST → INSPECT → FIX → COMMIT
          → UPDATE AI_HANDOFF.md + docs/BUILD_LOG.md
          → CONTINUE AUTOMATICALLY
```

The only permitted stop conditions are genuine blockers defined in `AGENTS.md`. A failure in an optional integration must not prevent unaffected work from continuing.

## Phase 0 — One consolidated Operator Intake / Readiness Check

**Objective:** Verify the repository, inputs, reference images, access, costs, and authorization before modifying files.

**Read first:** `PROJECT_SPEC.md`, `ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md`, `AGENTS.md`, `AI_HANDOFF.md`, `OPERATOR_INTAKE.md`, `REFERENCE_ASSETS.md`, `DEMO_VIDEO_PLAN.md`, plus repository instructions.

**Inspect without modifying:**
- Git status, branch, remotes, permissions, existing commits.
- Repository structure, package manager, lockfile, Node version, source entrypoints.
- Existing apps/components, tests, migrations, database schema, env examples.
- CI, Vercel/Render/Supabase configuration and deployment history.
- Existing environment variable names only; never print secret values.
- Existing `AGENTS.md`, `README.md`, docs and handoff records.

**Collect once:**
1. Repository path/URL and permission to create branches/commits.
2. Actual RYO organizer documentation, API base URL, API key, auth contract, request/response schemas, quotas, rate limits, sandbox status, and allowed use.
3. OpenAI key, verified model ID, structured-output support, provider data-retention terms, and per-run/project cost ceilings.
4. Supabase project/team access, Auth settings, DB roles and migration permissions.
5. Vercel team/project, preview domain, environment management.
6. Render team/service, preview environment, allowed spend and service limits.
7. One or more actual UI reference images and asset ownership/source; or explicit authorization for agent-generated reference imagery.
8. Demo audience, core story, pronunciation, narration style, redactions, and output directory.
9. Exact production-release authority (default is preview only), data-handling constraints, prohibited actions, and cost ceiling.
10. Public/private GitHub repository decision; public footer link requires explicit approval.

**Output files:** `OPERATOR_INTAKE.md`, `REFERENCE_ASSETS.md`, initial `AI_HANDOFF.md`.

**Acceptance:** All critical access, credentials, references and authority are verified or the blocked operation is deferred. Optional fields have safe documented defaults. No repeated questions for information already found.

**Stop condition:** A missing required image before final UI work is caught here. It does not block Phase 1–7 if a temporary UI is allowed, but Phase 8 cannot be claimed complete without the reference or explicit image-generation authorization. Missing RYO/OpenAI credentials block live integration, not deterministic fixture development.

## Phase 1 — Repository foundation + skeletal frontend + early preview

**Objective:** Get a real, navigable product shell deployed quickly.

**Tasks:**
- Preserve compatible repository work.
- Configure pnpm workspaces and strict TypeScript if absent.
- Add Vite/React app shell and all planned routes.
- Add primary navigation, page structure, footer placeholder, accessible temporary design tokens.
- Show clearly labelled placeholders for unfinished product functions.
- Add Fastify API liveness/readiness endpoint.
- Configure Vercel preview and Render API preview with safe fixture-only settings.
- Record exact preview URL, deployed commit SHA, and access restrictions.

**Files:** root workspace manifests; `apps/web`; `apps/api`; CI config; `.env.example`; `AI_HANDOFF.md`; `docs/BUILD_LOG.md`.

**Acceptance:** All routes load; shell is navigable on mobile/desktop; no inert navigation; no production credentials/data; exact URL and commit recorded. If deploy access is missing, record exact failure and continue local shell work.

**Commit:** `feat: establish app shell and preview deployment`.

## Phase 2 — Backend, database, auth foundation

**Objective:** Establish secure identity, persistent data, and durable job processing.

**Tasks:**
- Implement Fastify server and API error contract.
- Add Zod contracts shared from `packages/contracts`.
- Create Drizzle schema and migrations for profiles, runs, jobs, snapshots, data-gate reports, thesis, criteria, commitments, executions, findings, certificates, audits, idempotency, verification.
- Configure Supabase Auth and JWT verification.
- Enforce ownership and RLS/least-privilege DB roles.
- Implement durable `analysis_jobs` queue with `SKIP LOCKED`, leases, heartbeats, recovery.
- Add Pino structured logging with redaction and request/run correlation.
- Add health endpoints and database readiness.

**Acceptance:** Migrations run cleanly; auth tests pass; user A cannot read user B's data; run+job creation is atomic/idempotent; worker lease expiry/reclaim tests pass; no secrets in logs.

**Commit:** `feat: add database auth and durable job foundation`.

## Phase 3 — Core deterministic domain logic and RYO adapter

**Objective:** Build the evidence, criteria, validation, adjudication and certificate core independently from LLM behaviour.

**Tasks:**
- Verify actual RYO REST contract against organizer documentation.
- Implement only allowlisted RYO client functions.
- Validate provider schemas and preserve immutable snapshots.
- Implement canonical JSON and hash helpers.
- Implement Data Integrity Gate.
- Implement six-domain attacker registry and actual evidence-activation rules.
- Implement thesis/criteria schemas and criteria sealing.
- Implement attacker finding schema and evidence pointer resolver.
- Implement pure adjudicator and certificate generator/verifier.
- Seed deterministic scenario fixtures.

**Acceptance:** Ten required adjudication cases and all negative cases pass; no unsupported field assumptions; Data Gate BLOCK prevents normal verdict; criteria seal transaction commits before attackers; certificate replay is deterministic.

**Commit:** `feat: implement evidence integrity and deterministic decision core`.

## Phase 4 — Thesis Agent and specialist attackers

**Objective:** Connect AI generation with bounded, testable contracts.

**Tasks:**
- Implement OpenAI Responses API adapter with configured `OPENAI_MODEL`.
- Add thesis prompt/schema and output validation.
- Implement attack payload projection that strips criteria/commit metadata/peer findings.
- Implement three MVP attackers: Internal Logic, Asset & Contract Safety, Liquidity & Exit.
- Enable Regime, Derivatives and Catalyst attackers only when their required evidence is mapped from actual RYO output schemas.
- Store prompt/model version and usage per execution.
- Enforce per-run budgets, maximum token counts, one repair retry.

**Acceptance:** Each enabled attacker can produce BREAK/NO_BREAK/INCONCLUSIVE fixtures; evidence pointers resolve; invalid evidence cannot adjudicate; exact outbound payload test proves forbidden data is absent.

**Commit:** `feat: add thesis and isolated specialist attackers`.

## Phase 5 — Orchestration and API

**Objective:** Connect the deterministic stages into recoverable run execution.

**Tasks:**
- Implement `/analyses` create/list/detail/cancel endpoints.
- Implement token lookup, registry, history and certificate routes.
- Implement worker stage transitions and durable job processing.
- Add RYO fetch, Data Gate, thesis, criteria seal, attacker fan-out, finding validation, adjudication, certificate persistence.
- Implement bounded retries, timeout handling, worker recovery, idempotency, SSE/polling.
- Implement deterministic fixture demo route.

**Acceptance:** Full fixture run succeeds; at least one REFUSE and ABSTAIN certificate; repeated request does not duplicate work; incomplete runs cannot show verdict; worker crash/restart recovers safely.

**Commit:** `feat: orchestrate auditable analysis runs`.

## Phase 6 — Functional frontend integration

**Objective:** Connect all key routes to real backend behaviour using the temporary design system.

**Tasks:**
- Authentication states and protected routes.
- Supported-token search and asset confirmation.
- New analysis submit/idempotency.
- Run progress and error recovery.
- Thesis/evidence/criteria display.
- Attacker status/findings and coverage.
- Verdict/certificate display and verification.
- History filtering/pagination.
- Deterministic demo flow.

**Acceptance:** Critical journey is usable end to end; all loading/empty/error/denied/incomplete states work; no inert controls; preview updated.

**Commit:** `feat: connect analysis workflow to frontend`.

## Phase 7 — End-to-end functionality gate

**Objective:** Prove the product works before final visual refinement.

**Tests:** All unit, integration, scenario, API authorization, idempotency, worker recovery, negative validation, core Playwright journeys, responsive smoke tests.

**Acceptance:** All critical flows pass on preview; no unresolved critical/high security or functional issue; unsafe production actions disabled; deployed commit/test evidence recorded.

**Failure loop:** Diagnose → fix → rerun. Do not ask for routine approval.

**Commit:** `test: verify critical analysis journeys`.

## Phase 8 — Reference-image-led final UI and UI skills

**Objective:** Implement final UI directly from the supplied references, with no mockup/prototype stage.

**Tasks:**
- Execute `npx skills add benjitaylor/skills --skill stageshow`.
- Inspect and apply relevant skill instructions.
- Optionally evaluate additional reputable UI/UX skills.
- Inspect exact reference images recorded in `REFERENCE_ASSETS.md`.
- Extract layout, composition, typography, color, spacing, information density, interaction and responsive principles.
- Implement the final interface directly in product routes.
- Record intentional deviations in `docs/DESIGN_NOTES.md`.

**Acceptance:** Final interface is based on actual supplied/generated-authorized references; app behaviour and accessibility gates still pass. No mockup review/approval stop.

**Blocker:** If reference images remain absent and agent generation was not authorized, do not pretend the final UI has been completed. Record the exact missing input and continue unaffected work.

**Commit:** `feat: implement reference-led product interface`.

## Phase 9 — Frontend and documentation completeness

**Tasks:**
- Verify desktop/tablet/mobile layouts.
- Verify semantic structure, labels, keyboard/focus, contrast, reduced motion.
- Verify all loading/empty/success/error/denied/not-found/incomplete states.
- Verify metadata, favicon/app icon, sharing metadata.
- Verify footer navigation and real Documentation/GitHub links when approved.
- Never expose private repo URL; omit GitHub link if not approved/public.
- Complete README and docs.

**Acceptance:** No `href="#"`, fake links, dead controls or unlabelled placeholders; all external links verified; docs match actual implementation.

**Commit:** `docs: complete product and operator documentation`.

## Phase 10 — Demo video

**Objective:** Create a reviewed product video no longer than 180 seconds; target 90–150 seconds.

**Tasks:** Use deterministic demo runs and a clean browser profile. Script the most compelling journeys: register criteria → independent attack → REFUSE; unanticipated BREAK → ABSTAIN; certificate verification. Capture with Playwright. Check current free Google AI voice/TTS availability, quota, terms, and credentials. Do not incur paid usage without exact authority. If unavailable, use a genuinely free licensed local TTS fallback (e.g. Piper or eSpeak NG after verifying voice license and distribution terms). Synchronize narration with visible steps; add captions where feasible; redact all private data/secrets/URLs; render and review audio/video; verify duration and playback.

**Outputs:** `DEMO_VIDEO_PLAN.md`, script, production notes, final video in the operator-approved path.

**Acceptance:** Duration <=180 seconds; narration describes only visible behaviour; no clipping/long gaps/rushed delivery; playback verified.

**Commit:** `docs: add reviewed product demo` (large video may be stored outside Git in agreed output path).

## Phase 11 — Final regression/security/authorized release

**Tasks:** Full unit/integration/E2E/security regression, dependency and secret scan, migration review, backup/recovery plan, final preview smoke test. Deploy production only when exact authority was granted in Phase 0. Otherwise deliver verified staging with release instructions.

**Acceptance:** No critical/high unresolved issue; test evidence and final commit/URL recorded; release scope matches intake authority.

**Commit:** `chore: finalize verified release`.

## Phase checkpoint record

At each phase completion, update `AI_HANDOFF.md` and `docs/BUILD_LOG.md` with:

```text
Current phase:
Completed:
Tests and evidence:
Preview URL:
Deployed commit:
Reference image status:
UI skill status:
Documentation status:
Demo video status:
Known issues:
Authorization boundaries:
Next task:
Blocked by:
```

## Blocker protocol

If an operation is blocked, record exact error/evidence, completed work, unaffected work completed, and the minimum operator action needed. Continue any phase tasks not dependent on the blocker. Never bypass permissions, access controls, budget ceilings, security, or production authorization.
