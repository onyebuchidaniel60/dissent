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
- **Deployed commit:** `1c63526`
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

## Package validation
- JSON Schema: `schemas/attacker-output-v1.schema.json` parses as Draft 2020-12 JSON Schema.
- Valid attacker fixture: passes schema validation.
- `assessment_status=UNVERIFIABLE` with null condition status: passes schema validation.
- Invalid combination `UNVERIFIABLE` + `NOT_HIT`: correctly rejected.
- Markdown local links: zero broken relative links across the package.
- Application implementation: not started; no preview, contract deployment, live API run, or production release is claimed.
- Remaining Phase 0 blockers are recorded in `OPERATOR_INTAKE.md` and `AI_HANDOFF.md`, including the required missing UI reference image, repository/provider credentials, explicit budget, and testnet signer/deployer access.
