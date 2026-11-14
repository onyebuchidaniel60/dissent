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
- Allowlisted recipient was `ref-finance-101.testnet`; Tidepool is the intended venue and requires per-quote deposit-address approval.
- `packages/execution` implements the adapter and `executionReadiness`.
- Certificate body/public certificate include `execution_readiness` for new certificates. Existing anchored certificates untouched.
- `/operator/proprietary` UI added; 390/1440 overflow checks and operator gate pass.
- Queue registers the 5-minute proprietary loop only when `PROPRIETARY_LOOP_ENABLED=true`; default false.
- Earlier checkpoint tests: vault 5/5, execution 6/6, full Vitest 10/10; `pnpm build` passes.
- Ref Finance testnet confirmed permanently unavailable; no further probes.
- Tidepool docs (`llms.txt`, `AGENTS.md`, `openapi.json`) read from `www.usetidepool.tech`; health/tokens/dry quote return 200.
- Real wNEAR/USDC quote: 0.01 wNEAR → 0.034845 USDC, deposit address `76e9fdee35e85f863076d379d2117297449b4d5965c5a461d3c11c3a8af57f73`.
- Vault allowlist updated for that Tidepool deposit address (tx `DRu6sA1Jzxciudc3ofNPobjgJkAnVFTJhhcq1zG78Nai`); Ref Finance recipient revoked (tx `CsvM84SVVPEdHEVTgESSVHgxfGqqPZNv24FtHFDMzTg`).
- **Resolved:** the vault was upgraded in place to v2 with a fixed NEP-141 token, `spend_ft_as`, and a 1 NEAR Function Call Key scoped to `spend_as` + `spend_ft_as`.
- Vault v2 upgrade tx `6t3pMThsSsDmEVgoj4eS9MJoqm3T2gq7ynXYFkXcqQh2`; fixed token `wnear.tidepool-sandbox.testnet`.
- wNEAR storage for the vault tx `84A2LxRgaFjzCsZmbLbLi3LraT3uHgAj5eoU39Cmwfoj`; `0.02 wNEAR` funded from the Tidepool faucet via demo client (tx `HeXLMzbWsRpz9YdoQvvYnHME9Wex8ay3zSN74kSxJcyQ`).
- New agent key `ed25519:EXg79…`, scope `spend_as` + `spend_ft_as`, tx `87kQ9F4qoqPrVWL5AnQsVJ2KUCJRVuWvPTA4ELjniMCF`. The older `spend_as`-only key was deleted (tx `8zNjA3TdqUzPZAK2qLbGhqYtEqDPDV6txAZCgd4jTuZV`).
- **Live proprietary run:** audit `0bf3728d-e457-4b2f-8fad-b53be9565498` (`AUD-EF5A-D289`); Tidepool quote `0.01 wNEAR → 0.035246 USDC`; deposit address `da05f315c22877093292f756960595b27477c96eeba2d1e63864b95d69e5103a`.
- Certificate/quote approvals: cert tx `GuLp4J2otGy1qFGasaGE8fjK2GaPNjBQjnyFkDxCnqKt`; allowlist tx `5jy5pU6o3DupmpZg5rvdWVJvNX6E2oLSMLbAQSa8wh3c`; deposit-address wNEAR storage tx `B1ARAptQ9eFLjougo9tGa5AUhxQBGWHSBop8jYcSPXe9`.
- Commitment tx `JDCw46stcex49zroJ94y2EPNzcx86PqZGk8eyeHKsfAh`; funding tx `8xyFbb2hWiH1k7f137W3zvvZ3tB4ocqirHeTTvAvsa2T`; fee quote tx `HXQwwWrh1KJBqVc5cixzMecqKTtNjKbCFjDzbihdqJeu`.
- Eight attacker runs completed; both conditions `EVALUABLE`/`NOT_HIT`; all eight gates passed; divergence `0`; 8 accepted findings, 0 minority.
- Vault `spend_ft_as` tx `DxvoRKhCnyYyKrmAopnVYPKZJB7g8ev5Er1wtW5JbSp`; wNEAR `ft_transfer` event names the deposit address and includes the certificate ID.
- Certificate `0bf3728d-e457-4b2f-8fad-b53be9565498` with `execution_readiness=EXECUTED`, hash `d5f1b00d3702d9e5fcee194f601f9537f64c237ac176150a398a6a7d75b6584d`, anchor tx `3WQ6aQnJzsQRcRVTHsVGKUbrx2k1ueMFUwvWDY85XS9o`.
- Tidepool status `SUCCESS`; `0.035245 USDC` received by `demo-client.testnet`; swap txs `AYoAmqUxGmZRqcbkBZ75xG5J1KN1Y4r479oZ9Vdu7BLq`, `67jpWFr6arcpwUfgTUk8BkJpQD9Gezmw1VFcGoEs8pjK`, `7XAHSgATu8F2ednWuCxfmswetXnvNjyh1iPSmogXQGbv`.
- Vault after execution: `0.01 wNEAR`; `spent_today=0.01`; within caps.
- Tests: vault 8/8, execution adapter 11/11, full Vitest 11/11; build passes.
- Demo intentionally not regenerated; operator review required before adding the trading beat.
- Preview deployed at `245bf9a`; `/healthz`, `/readyz` and Playwright 3/3 pass. The new execution UI and env are deployed after the live run; see the next checkpoint.

## Phase 10 checkpoint — live Tidepool execution and preview verification

- Vault v2 in-place upgrade: tx `6t3pMThsSsDmEVgoj4eS9MJoqm3T2gq7ynXYFkXcqQh2`; fixed token `wnear.tidepool-sandbox.testnet`; caps unchanged at 0.5/1 NEAR.
- Agent key `ed25519:EXg79…` scoped to `spend_as` + `spend_ft_as`; tx `87kQ9F4qoqPrVWL5AnQsVJ2KUCJRVuWvPTA4ELjniMCF`.
- wNEAR storage tx `84A2LxRgaFjzCsZmbLbLi3LraT3uHgAj5eoU39Cmwfoj`; vault funded with 0.02 wNEAR from the Tidepool faucet via demo client (tx `HeXLMzbWsRpz9YdoQvvYnHME9Wex8ay3zSN74kSxJcyQ`).
- Live audit `0bf3728d-e457-4b2f-8fad-b53be9565498` (`AUD-EF5A-D289`) originated from quote `0.01 wNEAR → 0.035246 USDC`; deposit address `da05f315c22877093292f756960595b27477c96eeba2d1e63864b95d69e5103a`.
- Cert/quote approvals: `GuLp4J2otGy1qFGasaGE8fjK2GaPNjBQjnyFkDxCnqKt`, `5jy5pU6o3DupmpZg5rvdWVJvNX6E2oLSMLbAQSa8wh3c`; deposit-address storage `B1ARAptQ9eFLjougo9tGa5AUhxQBGWHSBop8jYcSPXe9`.
- Commitment `JDCw46stcex49zroJ94y2EPNzcx86PqZGk8eyeHKsfAh`; funding `8xyFbb2hWiH1k7f137W3zvvZ3tB4ocqirHeTTvAvsa2T`; fee quote `HXQwwWrh1KJBqVc5cixzMecqKTtNjKbCFjDzbihdqJeu`.
- 8/8 attackers; both conditions `EVALUABLE`/`NOT_HIT`; all gates pass; divergence 0; 8 accepted findings / 0 minority; verdict `TRADE`.
- Vault `spend_ft_as` tx `DxvoRKhCnyYyKrmAopnVYPKZJB7g8ev5Er1wtW5JbSp`; wNEAR `ft_transfer` to the quote deposit address with the certificate ID in the memo.
- Certificate hash `d5f1b00d3702d9e5fcee194f601f9537f64c237ac176150a398a6a7d75b6584d`; anchor `3WQ6aQnJzsQRcRVTHsVGKUbrx2k1ueMFUwvWDY85XS9o`; `execution_readiness=EXECUTED`.
- Tidepool `SUCCESS`; 0.035245 USDC received; swap txs `AYoAmqUxGmZRqcbkBZ75xG5J1KN1Y4r479oZ9Vdu7BLq`, `67jpWFr6arcpwUfgTUk8BkJpQD9Gezmw1VFcGoEs8pjK`, `7XAHSgATu8F2ednWuCxfmswetXnvNjyh1iPSmogXQGbv`.
- Vault after: 0.01 wNEAR; `spent_today=0.01`; recipient USDC balance 100.035245.
- Tests: vault 8/8, execution adapter 11/11, Vitest 11/11, build PASS; local Playwright 3/3.
- Preview deployed at `46bf788`; `/healthz`, `/readyz`, `/operator/proprietary`, and both verifier pages 200; preview Playwright 3/3 includes the `EXECUTED` receipt and `vault tx:` panel.
- Public verifier for the proprietary certificate: `https://dissent-web.onrender.com/verify/0bf3728d-e457-4b2f-8fad-b53be9565498` returns `VERIFIED` with `execution_readiness=EXECUTED` and the Tidepool swap hashes.
- Demo intentionally not regenerated; operator approval is the next gate.

## Phase 11 — mainnet readiness and production polish

- Network config defaults: `NEAR_NETWORK=mainnet`, `NEXT_PUBLIC_NEAR_NETWORK=mainnet`, mainnet RPC/explorer; no testnet fallback for registry, vault, payout or deployer accounts. Missing accounts fail closed.
- Execution adapter: 1Click mainnet is primary (`EXECUTION_VENUE=ONECLICK`, `https://1click.chaindefuser.com`). wNEAR `nep141:wrap.near`; USDC asset ID read from the live `/v0/tokens` catalogue (`nep141:17208628…`). Read-only mainnet precheck: 231 tokens and a dry `0.01 wNEAR → 0.034224 USDC` quote; no deposit address, transaction or real funds. Tidepool retained only for `EXECUTION_VENUE=TIDEPOOL` staging.
- Vault contract audit: `#[init]` replaces `ignore_state`; certificate replay protection added; `set_recipient_until` quote-window allowlist added; 24-decimal wNEAR assertion added. `cargo test` 12/12; mainnet-ready wasm SHA-256 `f8475b3998114e9970e51a6473c6acccdb14517986267f4ef058df747f43f582`. The deployed staging v2 vault is unchanged and is not the mainnet template.
- UI cleanup: customer-facing `NEAR TESTNET`, `DEMO FIXTURE`, demo-client account labels and fixture-only routes removed. App overview, audit ledger, audit detail, operator, providers, reputation, attackers, settings, docs and verifier use live data or empty states. The historical staging receipt remains on the operator page with a network-neutral label.
- Typography: Russo One display face added; Orbitron retained as fallback. Hero clamp `2.4rem–6.2rem`; section `1.6rem–2.8rem`; page title `1.8rem–3.1rem`. Verified at 1440×900 and 390×844 with no horizontal overflow.
- Tests: `pnpm typecheck` PASS; `pnpm lint` PASS; Vitest 13/13 PASS; `pnpm build` PASS; local Playwright 3/3 PASS at 390×844 and 1440×900. Preview deployed at `e400b47`; `/healthz`, `/readyz`, both verifier pages 200; preview Playwright 3/3 PASS. `/readyz` reports `network=testnet`, `venue=TIDEPOOL` for staging.
- Preview is explicit testnet staging (`NEAR_NETWORK=testnet`, `EXECUTION_VENUE=TIDEPOOL`, testnet accounts, no testnet UI label). Production requires a fresh mainnet database and the mainnet config.
- No mainnet deployment, mainnet transaction, real-fund transfer or new spend. Demo regeneration remains deferred.
