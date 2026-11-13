# Build Log — Dissent

## Planning handoff prepared
- Date: 2026-11-13 (Africa/Lagos)
- Status: No application implementation started.
- Completed: product scope, architecture baseline, attacker contract, adjudication policy, security plan, contract interfaces, API/data/UI specs, operator intake, reference-assets register, implementation phases and demo plan.
- Tests: documentation/schema consistency checks remain to be executed after package generation; application tests not applicable because no app exists.
- Preview: none.
- Production/mainnet authority: not granted.
- Known blocker: UI reference image missing; repository/provider credentials, model IDs, costs, NEAR testnet signer/deployer, adapter credentials and preview access require the single consolidated intake.

## Implementation entries
Append a dated entry at each agent checkpoint with commit SHA, phase, deployed preview URL/commit, tests and evidence, cost consumed/ceiling, known issues and next action.


## Phase 0 — consolidated intake / readiness

- **Date:** 2026-11-13
- **Commit context:** `1c87bd3` read-only inspection; no files modified during intake.
- **Read:** `AGENTS.md`, `AI_HANDOFF.md`, `OPERATOR_INTAKE.md`, `PROJECT_SPEC.md`, `ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md`, attacker schema, all `docs/` specs, `REFERENCE_ASSETS.md`, `DEMO_VIDEO_PLAN.md`, `README.md`, `PROPER_VIBE_CODING_WORKFLOW.md`, schema/fixture.
- **Repository:** public `onyebuchidaniel60/dissent`, `main`, GitHub ADMIN, no branch protection. No application code existed; docs + schema + one fixture only.
- **Toolchain:** Node 22.23.4, pnpm 10.34.5, Docker 29.1.3, PostgreSQL 16.15, ffmpeg 6.1.1, Python 3.12.3, Playwright 1.65.0. Rust/near-cli deferred to Phase 3.
- **References:** `design/dissent-reference1.webp` (2048×1536, 117,256 bytes, SHA-256 `8d47b994…`) and `design/dissent-reference2.webp` (2018×12858, 544,894 bytes, SHA-256 `8630cc18…`). Both opened and inspected; operator-owned. Recorded in `REFERENCE_ASSETS.md`.
- **Credentials:** all present in `.env.local`, which is ignored/untracked. Verified without printing values:
  - OpenRouter `/key` + `/credits`: PASS; 436 models; $7.747 remaining at intake.
  - Groq `/models`: PASS; `openai/gpt-oss-120b` present; completion with explicit User-Agent PASS.
  - Render `/owners` + `/services`: PASS.
  - Neon pooled + direct `select 1`: PASS.
  - ElevenLabs voice + subscription: PASS; free tier, 10,000 characters.
  - NEAR testnet, FastNEAR public RPC, NearBlocks public API: PASS.
- **Model substitutions:** preferred `qwen/qwen3.8-27b:free`, `deepseek/deepseek-r1:free` and listed fallbacks were absent. Selected available free models in distinct families; A05 moved to paid Qwen to avoid duplicating A01's GLM family. All recorded in `config/model_assignments.json`.
- **Result:** no unresolved critical blocker. TEE waived per C4.

## Phase 1 — repository foundation and preview

- **Commit:** `1c63526` (`feat: establish route-complete app shell and in-process queue`)
- **Preview:** `https://dissent-web.onrender.com`
- **Render service:** `srv-dbrgdr3bc2fs73d0oi5g` (free, Oregon)
- **Deployed commit:** `366b967` (first live build `1c63526`; docs/keep-alive commit redeployed)
- **Queue:** `[queue] in-process pg-boss started`; uses `DATABASE_URL_DIRECT`.
- **Commands and results:**
  - `pnpm install` — PASS (lockfile committed).
  - `pnpm typecheck` — PASS.
  - `pnpm lint` — PASS after removing unused imports.
  - `pnpm test` — PASS (1 file, 3 tests).
  - `pnpm build` — PASS (Next.js 16.4.6; 10 static pages; dynamic routes).
  - `curl /healthz` — 200 without DB.
  - `curl /readyz` — 200; Neon latency 803ms local, 378ms deployed.
  - Deployed route sweep — 17/17 returned 200.
  - Overflow sweep at 360/390/768/1024/1440 — PASS after changing the audit-filter grid breakpoint from `md` to `lg`.
- **UI:** dark crimson visual system adapted from the two references; no ShibaNex branding/copy/mascot copied. Orbitron/Manrope/JetBrains Mono. Coverage table scrolls; data tables transform to labelled mobile rows.
- **Stageshow:** `npx skills add benjitaylor/skills --skill stageshow` succeeded; `.agents/skills/stageshow/SKILL.md` inspected; craft principles applied selectively. The kit is for faux marketing UI and was not copied into the real app.
- **Environment:** 22 Render env vars set via API; `APP_BASE_URL` set after first live deploy and redeployed. No values printed or committed.
- **Keep-alive:** `.github/workflows/keepalive.yml` pings `/healthz` every 10 minutes. `cron-job.org` was not configured because no account/API credential was supplied; documented as a non-critical fallback.
- **Cost:** $0 new spend; OpenRouter remaining $7.74699; test calls ~$0.00006.
- **Known issues:** TEE waived; later-phase functionality explicitly labelled; Render cold start; pg SSL-mode deprecation warning.

## Phase 2 — data, identity and auth

- Added 27-table Drizzle schema and migrations `0000`–`0005`; applied to Neon.
- Added wallet sessions, auth nonces, workspace members, scoped API keys, audit/thesis/condition/commitment/funding/run/evidence/finding/review/certificate/bounty tables.
- Implemented NEAR Wallet Selector + NEP-413 signed-nonce auth:
  - nonce creation, signature/access-key verification, HttpOnly session cookie, logout.
  - Real testnet signature verification with `demo-client`/deployer key: PASS.
  - Operator allowlist gate: unauthenticated gate, allowlisted operator surface verified.
- API keys: HMAC-SHA256 at rest, scoped key auth, tenant-scoped audit reads.
  - `pnpm provision:client` provisioned `Demo Client` and a demo key (plaintext only in `.env.local`).
  - Prepare/list: PASS. Idempotent replay: PASS. Missing key: 401. Cross-tenant read: 404.
- In-process pg-boss runner starts on Node boot; heartbeat and audit.dispatch worker registered.

## Phase 3 — canonical domain, NEAR contract and adapters

- RFC 8785 canonicalization + SHA-256; Zod thesis/condition validation.
- `POST /api/v1/audits/prepare` created audit `08939501-b745-407e-8899-7b886ce4e213` with hashes and `commit_audit` args.
- Rust `DissentRegistry` deployed at `registry.dissent-demo.testnet`:
  - deployment tx `DwTsqTQ9Lh28zpcqYhNYrzARH7NaQgQkc3sEgtaXaaNv`
  - commitment tx `EPyCZw3yCiEyVfrpjBvdFVHsRHdnzpsHaLwKLEEPW6YK`
  - quote issued, funding tx `J4D85KnMNB3RsyDR5ZtotUqxqD8nw5LMqGTwGms6yySY`
  - commitment/funding verified via API and contract state.
- Provider adapter: OpenRouter + Groq, token buckets, bounded retry, cost attribution.
- Evidence adapters: CoinGecko, NearBlocks, FastNEAR RPC, derived depeg, condition preimage.

## Phase 4 — eight live attacker runs

- All 8 attackers `COMPLETED` against live providers.
- Output schema/semantic validation, Section A exact coverage, Section B, invalid-test analysis, raw output/validation report storage.
- Model availability diagnostics: preferred free slugs were missing/rate-limited; substitutions recorded in `config/model_assignments.json`.
- A06/A07 share Flint family as a documented free-model availability substitution; 7 families / 2 vendors / 1 open-weight remains above gate.
- TEE waiver rows written as `WAIVED`; no TEE badge.
- Live cost: $0.019186.

## Phase 5 — evidence, adjudication, certificate and bounty

- Evidence re-fetch completed; source outcomes recorded.
- Sycophancy/novelty and finding review completed; 8 findings accepted, 3 rejected/contradicted in the development audit.
- Deterministic adjudication returned `ABSTAIN` (material execution-depth condition unverifiable; a condition-preimage hash bug also produced a false contradiction).
- The first development audit ended `ABSTAIN` with certificate `f7783fa3…`/`092e94…` anchored at `BRajqZs…`. A clean follow-up audit `394c2192…` (`AUD-C963-E660`) completed all eight runs, re-fetched all five evidence records as `VERIFIED`, produced `TRADE` with divergence `0`, and anchored certificate `96426c09…`/`149c5296…` at tx `6G7Yd3uv…`; 7 bounty allocations totaling `0.025 NEAR` were recorded.
- Public verify API recomputes hash and reads registry: `VERIFIED` for the clean `TRADE` audit.
- 8 bounty allocations totaling `0.03625 NEAR` recorded on testnet; no claim executed.
- Fixed condition-preimage hash bug for subsequent audits; anchored certificate retained unchanged.
- Added results/certificate/events APIs and client-scoped access.

## Package validation
- JSON Schema: `schemas/attacker-output-v1.schema.json` parses as Draft 2020-12 JSON Schema.
- Valid attacker fixture: passes schema validation.
- `assessment_status=UNVERIFIABLE` with null condition status: passes schema validation.
- Invalid combination `UNVERIFIABLE` + `NOT_HIT`: correctly rejected.
- Markdown local links: zero broken relative links across the package.
- Application implementation: Phase 1 route shell and live preview exist. Contract deployment, live inference, certificate anchoring and production release are **not** claimed.
- Phase 0 blockers: resolved by the completed intake in `OPERATOR_INTAKE.md`. The only non-critical open item is the optional cron-job.org account; GitHub Actions provides the free keep-alive fallback.
- Phase 1 preview: `https://dissent-web.onrender.com`, deployed commit `366b967`.

## Phase 6 — functional UI integration and E2E

- `/app/audits` now shows session-scoped live audits alongside clearly labelled fixtures.
- New-audit form validates locally and creates a real draft through `/api/v1/ui/audits/prepare`.
- `/app/audits/[id]` renders live thesis, committed conditions, eight runs, findings, commitment/funding and certificate for an authenticated workspace member.
- `/operator` and `/operator/audits/[id]` render live testnet runs, gate trace, certificate and bounty accounting for the allowlisted wallet.
- `tests/e2e/primary.spec.ts` verifies:
  - public route status and no horizontal overflow at 360/1440;
  - unauthenticated operator gate;
  - NEP-413 signed session, live audit list, draft creation, operator surface.
- E2E result: 3/3 passed locally and against `https://dissent-web.onrender.com`.
- Remaining gap: browser wallet `commit_audit`/`fund_audit` signing is not wired; API + CLI path is verified end-to-end.

## Phase 7 — reference-led UI

- Two operator-owned references inspected and mapped in `REFERENCE_ASSETS.md`.
- Dark crimson system, 1520px grid, Orbitron/Manrope/JetBrains Mono, thin panels, oversized display type, asymmetric dashboard and inspector rail.
- Final live views use the same language; fixture results and live records are visually distinct.
- `npx skills add benjitaylor/skills --skill stageshow` succeeded and was inspected; craft rules were applied selectively. No third-party branding, copy or mascot copied.
- Intentional deviations and the TEE-waiver treatment recorded in `docs/DESIGN_NOTES.md`.

## Phase 8 — frontend and documentation completeness

- Responsive route inventory complete; data tables become labelled mobile rows; coverage matrix scrolls with a sticky first column.
- Live certificate verifier, public API verification, operator gate, API-key settings, reputation and docs pages complete.
- Updated README, API addenda, deployment, configuration, setup, operator, troubleshooting and contract deployment records.
- No dead `href="#"`, inert buttons or placeholder external URLs in the app.
- E2E overflow checks at 360/1440; earlier full sweep at 360/390/768/1024/1440 passed after the audit-ledger header fix.

## Phase 9 — demo video and release checks

- Demo video: `demo/dissent-demo.mp4`, 100.08s, 1280×720, H.264/AAC, 4,200,670 bytes.
- SHA-256: `0f86840bf291e53267bd502bf5db403d144f3434ab7fba5fe01d4a6597cff79a`.
- Narration: `demo/NARRATION.md`; production notes: `demo/PRODUCTION_NOTES.md`; timing: `demo/timings.json`.
- ElevenLabs library voice was blocked by `paid_plan_required` on the free tier; no charge. Delivered with public-domain Piper/LJSpeech fallback. Operator action documented.
- Music: Kevin MacLeod — “Floating Cities”, CC BY 4.0; attributed in README and production notes.
- Captions burned in; audio/video decode and volume checked; no secrets or private URLs visible.
- Final release: preview only. No production or mainnet authorization.

## Phase 10 — proprietary trading arm

- Specs updated before code: MUST-HAVE proprietary arm/vault execution, execution architecture, proprietary cost ledger, frozen AGENTS decision, vault interface section.
- Vault `vault.dissent-demo.testnet` deployed at `8V4A7CypSu6SS3NWywnJFhCqqfUzDxo9xYr1azdzqMBN`; caps 0.5 NEAR/tx, 1 NEAR/day.
- Agent `vault-agent.dissent-demo.testnet` has only a Function Call Key scoped to `vault.dissent-demo.testnet::spend_as`; verified via RPC.
- Allowlisted recipient `ref-finance-101.testnet`; current clean certificate `96426c09…` approved.
- `packages/execution` implements the adapter and `executionReadiness`.
- Certificate body/public certificate include `execution_readiness` for new certificates. Existing anchored certificates untouched.
- `/operator/proprietary` UI added; 390/1440 overflow checks and operator gate pass.
- Queue registers the 5-minute proprietary loop only when `PROPRIETARY_LOOP_ENABLED=true`; default false.
- Tests: vault 5/5, execution 6/6, full Vitest 9/9; `pnpm build` passes.
- **Hard blocker:** `api.testnet.ref-finance.com` DNS resolution fails. Both required precheck endpoints fail before HTTP. No live swap or execution receipt was fabricated. `NOT_CONFIGURED` is used for the new readiness state.
- Demo intentionally not regenerated; operator review required.
- Preview deployed at `f2ee8db`; `/healthz`, `/readyz` and Playwright 3/3 pass. `/operator/proprietary` renders the blocked venue state at 390/1440.
