# AI_HANDOFF.md — Dissent

**Last updated:** 2026-11-13
**Current phase:** Phase 1 complete — route-complete skeletal frontend, in-process queue and live preview deployed.
**Repository:** `https://github.com/onyebuchidaniel60/dissent` (public, `main`, MIT)
**Preview URL:** `https://dissent-web.onrender.com`
**Deployed app commit:** `366b967` (`docs: record Phase 1 preview evidence and keep-alive fallback`)
**Render service:** `srv-dbrgdr3bc2fs73d0oi5g` (`dissent-web`, free web service, Oregon)
**Production/mainnet authority:** **not granted**. No mainnet transaction, production release or external posting is authorized.

## Intake status

- Product definition, scope and frozen architecture: PASS.
- UI reference images: PASS — `design/dissent-reference1.webp` (2048×1536) and `design/dissent-reference2.webp` (2018×12858), inspected and recorded in `REFERENCE_ASSETS.md`.
- Repository/Git identity and write permission: PASS — GitHub ADMIN, `main`, `trurntt <onyebuchidaniel60@gmail.com>`.
- Budget/authority: PASS — **$0 new spend**; pre-purchased OpenRouter credit only; per-audit ceiling $0.50.
- Model providers: PASS — OpenRouter and Groq keys validated; 8 distinct families across 2 inference vendors; one open-weight attacker.
- NEAR testnet: deferred to Phase 3 — deployer `dissent-demo.testnet`, registry/escrow accounts reserved; no key material committed.
- Hosting/database: PASS — Render free + Neon free PostgreSQL; pooled and direct URLs validated.
- Data adapters: PASS — FastNEAR public RPC and NearBlocks public API reachable; Pikespeak/RedStone skipped.
- Demo voice: PASS — ElevenLabs credential and operator voice ID validated; free tier 10,000 characters.
- TEE: **WAIVED_BUDGET_CONSTRAINT** — documented deviation, no TEE badge, no confidential-inference claim.

## Architecture revisions recorded

1. **C2 hosting:** Render free Web Service + Neon free PostgreSQL replaces Railway. No Render Postgres. No separate worker. `pg-boss` runs **in-process** inside Next.js; `MAX_CONCURRENT_AUDITS=1`, `MAX_PARALLEL_ATTACKERS=3`.
2. **C3 providers:** One generic OpenAI-compatible adapter. OpenRouter is primary; Groq is A02 only. No OpenAI/Anthropic SDKs.
3. **C4 TEE:** formally waived under the zero-new-spend constraint. Family/vendor/open-weight gates remain enforced. Recorded in `AGENTS.md`, `ARCHITECTURE.md`, `README.md`, `docs/BUILD_LOG.md` and the UI.
4. **R1 auth:** NEAR Wallet Selector + signed-nonce session cookie only. Better Auth, email/password, magic links and public signup are removed.
5. **Attacker assignments:** several operator-preferred slugs were absent from the live OpenRouter catalogue. Substitutions preserve distinct families and are recorded in `config/model_assignments.json`.

## Phase 1 completed

- `.gitignore` was committed alone first (commit `8241fc6`), before `.env.local` existed. Verified `.env.local` is ignored and untracked.
- MIT `LICENSE` added.
- pnpm workspace, pinned Next.js 16.4.6 / React 19.3.1 / TypeScript 5.9.3 / Tailwind 4.3.5, lockfile.
- Next.js App Router shell with responsive navigation and footer.
- Route-complete screens: landing, dashboard, audits ledger, new-audit local draft, audit detail, results/coverage, certificate, public verify, attacker roster, reputation, API-key settings, operator overview, operator providers, operator audit inspection, docs.
- `/healthz` returns 200 without DB access; `/readyz` checks Neon and returns 200/503.
- In-process pg-boss runner starts from `src/instrumentation.ts`; `system.heartbeat` queue created. Uses `DATABASE_URL_DIRECT` to avoid pooled advisory-lock issues.
- Render free web service created, 22 environment variables set, service live.
- `APP_BASE_URL=https://dissent-web.onrender.com` set and redeployed.
- GitHub Actions keep-alive workflow added at `.github/workflows/keepalive.yml` (10-minute `/healthz` ping). Manual validation run: `https://github.com/onyebuchidaniel60/dissent/actions/runs/43434582918` (success). **cron-job.org is not configured** because no account/API credential was supplied; the free repository-based ping is the documented fallback.
- `npx skills add benjitaylor/skills --skill stageshow` succeeded; inspected and applied selectively. Exact status recorded in `docs/DESIGN_NOTES.md`.
- Prior-stage docs updated: `README.md`, `ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md`, `.env.example`, `docs/DEPLOYMENT.md`, `docs/CONFIGURATION.md`, `docs/SETUP.md`, `docs/ECONOMICS_SPEC.md`, `DEMO_VIDEO_PLAN.md`, `demo/DEMO_VIDEO_PLAN.md`.

## Verification evidence

| Check | Result |
|---|---|
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS (0 errors, 0 warnings after cleanup) |
| `pnpm test` | PASS — 3 tests: pinned roster, diversity gate, TEE waiver |
| `pnpm build` | PASS — 10 static pages generated, dynamic routes compiled |
| Local `/healthz` | 200, no DB call |
| Local `/readyz` | 200, Neon latency ~803ms |
| In-process queue | `[queue] in-process pg-boss started` |
| Deployed `/healthz` | 200 |
| Deployed `/readyz` | 200 |
| Deployed route sweep | 17/17 routes returned 200 |
| Responsive overflow sweep | PASS at 360/390/768/1024/1440 after fixing the 768px audit-filter grid |
| Reference inspection | Both images opened; dimensions and mapping recorded |
| stageshow | Installed; inspected; applied selectively |

## Budget consumed

- New spend: **$0.00**.
- OpenRouter remaining at handoff: **$7.74699** (from $30 pre-purchased; total usage $22.25300973). Test calls consumed approximately $0.00006.
- Per-audit ceiling: **$0.50**.
- No paid hosting, paid TTS, Render Postgres, card charge or auto-billing trial.

## Known issues / limitations

1. TEE attestation is waived, not verified. No TEE badge is displayed. This is a disclosed deviation from the original frozen gate.
2. The preview is a Phase 1 fixture shell: wallet sessions, live API submission, attacker dispatch, evidence review, contract calls and certificate anchoring are not implemented yet.
3. `cron-job.org` keep-alive is not created; GitHub Actions is the fallback. If the operator supplies a cron-job.org API key, replace or supplement the workflow and record the cron URL here.
4. Neon/pg emits an SSL-mode deprecation warning (`sslmode=require` will become weaker in pg v9). Non-fatal; use `sslmode=verify-full` or `uselibpqcompat=true&sslmode=require` before upgrading pg.
5. The audit form computes a browser-only stable JSON hash preview. It is not RFC 8785 and does not submit to the API; that arrives in Phase 3.
6. Render free cold start is ~50 seconds. Warm the service before any demo capture.
7. The reference images use ShibaNex branding; no branding, copy, mascot or trade dress is copied. Final visual comparison is a Phase 7 gate.

## Authority boundaries

- `main` commits/pushes: authorized.
- Preview deployment: authorized on Render free + Neon free.
- Production deployment: **not authorized**.
- Mainnet transaction: **not authorized**.
- X/demo posting: **assets only**; do not post.
- Paid services / new card charges: **not authorized**.
- TEE direct API/account creation: **not authorized**.

## Next task

**Phase 2 — backend, data, identity and auth foundation.**

1. Add Drizzle schema/migrations for clients, wallet sessions, API keys, audits, theses, conditions, commitments, attacker runs, evidence, findings, reviews, certificates, policies, reputation and bounty records.
2. Implement NEAR Wallet Selector + signed-nonce session verification and the `ADMIN_WALLET_ADDRESSES` server gate.
3. Implement scoped API keys (hash at rest, one-time display, revoke/rotate) and tenant-scoped repositories with IDOR tests.
4. Add Pino redacted logging, request IDs, `/healthz` and `/readyz` integration, and pg-boss job claiming test.
5. Add the Phase 1 preview commit/URL record to `docs/BUILD_LOG.md` and `SHA256SUMS.txt`.
