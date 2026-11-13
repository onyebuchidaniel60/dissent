# AI_HANDOFF.md — Dissent

**Last updated:** 2026-11-13
**Current phase:** Phase 10 — proprietary execution **demonstrated on Tidepool testnet**. A real quote was audited, returned `TRADE`, executed through the capped vault (`spend_ft_as`) and settled `SUCCESS` on Tidepool. Demo regeneration is intentionally deferred pending operator approval.
**Repository:** `https://github.com/onyebuchidaniel60/dissent` (public, `main`, MIT)
**Preview URL:** `https://dissent-web.onrender.com`
**Deployed app commit:** `46bf788` (`feat: execute proprietary TRADE through NEP-141 Tidepool vault`).
**Production/mainnet authority:** **not granted**. No mainnet transaction, production release or external posting is authorized.

## Live testnet artifacts

- **Audit ID:** `394c2192-8d9f-4463-99f2-a15d45dc54a2` (`AUD-C963-E660`)
- **Commitment transaction:** `JkqwT3Zc9scWxKxkq2jyLwqCALhkfeVrbNbASxhExiJ`
- **Funding transaction:** `WmHPmBt742SRm4QfuZBJFa4zCtdVPWjWScTJ813uQhz`
- **Certificate ID:** `96426c09-87ec-4641-94ed-4edf0b7b34f1`
- **Certificate hash:** `149c529602c40894643444ee69c9af4e2984774ed77a08e7fc56237345538139`
- **Certificate anchor transaction:** `6G7Yd3uvZozLC9SbXtNW5jxFetV4TLqgTMFxN76MmYJF`
- **Verdict:** `TRADE`. All eight runs completed, both material conditions were evaluable, all five evidence refs re-fetched as `VERIFIED`, divergence was `0`, and all review/non-contradiction gates passed.
- **Phase 10 live certificate:** `0bf3728d-e457-4b2f-8fad-b53be9565498` (`AUD-EF5A-D289`), hash `d5f1b00d3702d9e5fcee194f601f9537f64c237ac176150a398a6a7d75b6584d`, anchor tx `3WQ6aQnJzsQRcRVTHsVGKUbrx2k1ueMFUwvWDY85XS9o`, `execution_readiness=EXECUTED`. Vault tx `DxvoRKhCnyYyKrmAopnVYPKZJB7g8ev5Er1wtW5JbSp`; Tidepool `SUCCESS` with `0.035245 USDC` out and swap txs `AYoAmq…`, `67jpWF…`, `7XAHSg…`.
- **Bounty accounting (client audit):** 7 accepted-finding allocations totaling `0.025 NEAR` recorded on testnet; no payout claim executed.
- **Bounty accounting (proprietary audit):** 8 accepted-finding allocations totaling `0.0325 NEAR` recorded; no payout claim executed.
- **Public verify (client):** `https://dissent-web.onrender.com/verify/96426c09-87ec-4641-94ed-4edf0b7b34f1` (live).
- **Public verify (proprietary):** `https://dissent-web.onrender.com/verify/0bf3728d-e457-4b2f-8fad-b53be9565498` (live; `VERIFIED`, `execution_readiness=EXECUTED`).

An earlier development audit (`08939501…`) ended `ABSTAIN` when execution-depth evidence was unavailable and a preimage-hash bug produced a false contradiction. The bug is fixed in `src/lib/evidence/service.ts`; the earlier anchored certificate is retained unchanged as an immutable test artifact.

## Phase 10 — proprietary trading arm

- Specs updated before code: `PROJECT_SPEC.md`, `ARCHITECTURE.md` §15, `AGENTS.md`, `docs/ECONOMICS_SPEC.md`, `docs/SMART_CONTRACT_SPEC.md`.
- Vault `vault.dissent-demo.testnet` upgraded in place to v2 at tx `6t3pMThsSsDmEVgoj4eS9MJoqm3T2gq7ynXYFkXcqQh2`; v1 deploy `8V4A7CypSu6SS3NWywnJFhCqqfUzDxo9xYr1azdzqMBN`.
- Caps: `0.5 NEAR` per transaction / `1 NEAR` daily. The vault holds native NEAR plus Tidepool test wNEAR (`wnear.tidepool-sandbox.testnet`, 24 decimals), fixed at initialization.
- Agent account `vault-agent.dissent-demo.testnet` now has a Function Call Key `ed25519:EXg79…` scoped to `vault.dissent-demo.testnet` methods `spend_as` and `spend_ft_as`, allowance 1 NEAR (tx `87kQ9…`). The older `spend_as`-only key remains but is unused. No full-access key is in the execution runtime.
- Vault wNEAR storage tx `84A2…`; funded with `0.02 wNEAR` from the Tidepool faucet via demo client (tx `HeXLM…`).
- Live proprietary run: audit `0bf3728d-e457-4b2f-8fad-b53be9565498`; quote `0.01 wNEAR → 0.035246 USDC`, deposit address `da05f315c22877093292f756960595b27477c96eeba2d1e63864b95d69e5103a`; certificate approved tx `GuLp…`; deposit address allowlisted tx `5jy5…`; wNEAR storage for the deposit address tx `B1AR…`; commitment `JDCw…`; funding `8xyF…`.
- The certificate has `execution_readiness=EXECUTED`, the vault tx and Tidepool swap hashes. The certificate ID is the audit UUID, pre-approved before the attackers ran. `PROPRIETARY_EXECUTION_AUDIT_ID` is the fail-closed gate; client audits never execute.
- `packages/execution` implements `TidepoolExecutionAdapter`; returns `REFUSED` on non-TRADE/disabled, `EXECUTED` on a mocked TRADE, `REVERTED` with the vault reason, and `NOT_CONFIGURED` when the venue/vault/token is missing. It calls `vault.spend_ft_as`.
- Certificate schema includes `execution_readiness` with `NOT_APPLICABLE`, `READY`, `NOT_CONFIGURED`, `EXECUTED` (+ optional tx); the full certificate has an `execution` object, and the public certificate exposes the vault tx and Tidepool swap hashes.
- `/operator/proprietary` shows venue precheck, NEP-141 vault state, execution flags, certificate/quote details and execution receipts. It is gated by the operator allowlist.
- Proprietary loop originates from a live Tidepool quote (not pool state), then runs the same eight-attacker pipeline. The pg-boss scheduler remains default false; the live run was executed by `scripts/proprietary-live.ts`.
- Tests: vault 8/8, execution adapter 11/11, full Vitest 11/11, build passes; Playwright 3/3 passes locally and on the deployed preview. Demo regeneration remains deferred pending operator approval.

## Intake status

- Product definition and scope: PASS.
- UI references: PASS — `design/dissent-reference1.webp` (2048×1536) and `design/dissent-reference2.webp` (2018×12858), inspected and mapped in `REFERENCE_ASSETS.md`.
- Repository/Git: PASS — GitHub ADMIN, `main`, `trurntt <onyebuchidaniel60@gmail.com>`.
- Budget/authority: PASS — **$0 new spend**; pre-purchased OpenRouter credit only; per-audit ceiling $0.50.
- Model providers: PASS — OpenRouter + Groq keys validated; **7 distinct families / 2 vendors / 1 open-weight**. A06 and A07 share Flint as a documented free-model availability substitution; the gate remains satisfied.
- NEAR testnet: PASS — deployer `dissent-demo.testnet`, registry `registry.dissent-demo.testnet`, payout `payout.dissent-demo.testnet`. `escrow.dissent-demo.testnet` was created but the escrow module is deployed inside the registry contract, so funding uses the registry account.
- Hosting/database: PASS — Render free + Neon free PostgreSQL.
- Data adapters: PASS — FastNEAR public RPC, NearBlocks public API, CoinGecko external market observation. Pikespeak/RedStone skipped by intake.
- Demo voice: **BLOCKED for the selected voice** — ElevenLabs returned `paid_plan_required` for the operator-supplied library voice on the free tier. No charge was made. The delivered demo uses a public-domain local Piper/LJSpeech fallback; see `demo/PRODUCTION_NOTES.md` for the exact evidence and minimum operator action.
- TEE: **WAIVED_BUDGET_CONSTRAINT** — documented deviation, no TEE badge, no confidential-inference claim.

## Implemented in Phases 2–5

### Phase 2 — data, identity and auth

- 27-table Drizzle schema and five explicit migrations (`drizzle/0000`–`0005`), applied to Neon.
- NEAR Wallet Selector + signed-nonce authentication:
  - `/api/v1/auth/nonce`, `/verify`, `/session`, `/logout`.
  - NEP-413 signature and access-key verification through `near-api-js/nep413`.
  - HttpOnly, SameSite=Lax, Secure session cookie; 8-hour expiry; single-use 5-minute nonce.
  - Server-side `ADMIN_WALLET_ADDRESSES` gate on `/operator` and operator APIs.
- Scoped API keys: HMAC-SHA256 at rest, one-time plaintext display, prefix lookup, scopes, revoke/rotate data model, `audit:create`, `audit:read:own`, `audit:commit`, `audit:fund`, `certificate:read:own`.
- Client provisioning: `pnpm provision:client`; demo key stored only in `.env.local`.
- Tenant-scoped audits; cross-tenant read returns 404. Request IDs and API error envelope implemented.
- In-process pg-boss runner with durable queues and `system.heartbeat`; `audit.dispatch` worker registered.

### Phase 3 — canonical domain, NEAR and adapters

- RFC 8785 canonicalization (`canonicalize`) and SHA-256 commitments.
- Typed thesis/condition validation with Zod; unit/operator/severity validation and duplicate-condition rejection.
- `POST /api/v1/audits/prepare` with idempotency, canonical hashes, policy hash and `commit_audit` args.
- Rust `DissentRegistry` contract deployed at `registry.dissent-demo.testnet`:
  - `commit_audit`, `get_commitment`
  - `issue_quote`, `fund_audit`, `get_quote`, `get_funding`
  - `finalize_certificate`, `get_certificate`
  - `record_bounty_allocations`, `get_allocation`, `claim_bounty`
  - NEP-297-style events; no arbitrary withdrawal.
- Commitment and funding receipt verification against RPC, signer, contract, method, hashes and stored contract state.
- Generic OpenAI-compatible provider adapter with configurable base URL, per-provider token buckets, bounded retries, fallback recording and cost attribution.
- Evidence adapters: CoinGecko market observation, NearBlocks stats, FastNEAR RPC, derived USDC depeg, committed-condition preimage.

### Phase 4 — eight isolated attackers

- All eight A01–A08 runs completed against live providers for the test audit.
- One method prompt per attacker, common output contract, Section A exact-condition coverage and required Section B.
- JSON Schema validation + semantic checks: condition set equality, evidence ownership, chronology, empty Section B justification, invalid-test analysis.
- Bounded schema-repair/fresh retries; raw output and validation reports stored. No synthesized missing results.
- Model-family/vendor/open-weight gate enforced; TEE waiver recorded with `tee_verifications.result=WAIVED`.
- Live cost: **$0.019186** for the eight-run audit (well below the $0.50 ceiling).

### Phase 5 — evidence, adjudication, certificate, bounty

- Evidence re-fetch through fixed adapters; review records append-only; source failures become `UNVERIFIABLE`.
- Sycophancy/novelty review; unsupported or restating findings rejected.
- Coverage and divergence index; critical direct conflict forces `ABSTAIN`; no majority voting.
- Verdict precedence (`REFUSE` > `ABSTAIN` > `TRADE`) implemented in `src/lib/finalize.ts`.
- Canonical certificate + SHA-256 hash; anchored on testnet registry; public verifier recomputes and compares the hash.
- Bounty allocations calculated from accepted findings with caps and funded pool; recorded on-chain for testnet. No payout claim executed.
- Reputation events use unique keys to prevent double-counting.
- API routes added: audit list/get/results/certificate/events, commitment verify, funding quote/verify, public certificate verify.

## Verification evidence

| Check | Result |
|---|---|
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS (0 errors/warnings) |
| `pnpm build` | PASS (Next.js 16.4.6) |
| Local `/healthz` | 200, no DB |
| Local `/readyz` | 200, Neon |
| In-process pg-boss | started |
| Wallet NEP-413 auth | PASS with real testnet key; admin route gate verified |
| API key prepare/list | PASS; idempotent replay; 401 without key |
| Cross-tenant audit read | 404 |
| Commitment verify | PASS against `EPyCZw…` |
| Funding quote | PASS on-chain `issue_quote` |
| Funding verify | PASS against `J4D85K…` |
| Eight attacker runs | 8/8 `COMPLETED` |
| Certificate anchor | PASS; hash `092e94…`, tx `BRajqZ…` |
| Public verify API | PASS (`VERIFIED` hash + registry match) |
| Bounty allocations | 8 recorded, `0.03625 NEAR` |
| Reference responsive sweep | PASS at 360/390/768/1024/1440 |
| Vault v2 unit tests | 8/8 PASS |
| Execution adapter tests | 11/11 PASS |
| Full Vitest | 11/11 PASS |
| Live proprietary audit | 8/8 attackers; both conditions `EVALUABLE`/`NOT_HIT`; 8 gates pass; divergence `0`; verdict `TRADE` |
| Live vault execution | `spend_ft_as` PASS; tx `DxvoRKhCnyYyKrmAopnVYPKZJB7g8ev5Er1wtW5JbSp`; `execution_readiness=EXECUTED` |
| Tidepool settlement | `SUCCESS`; `0.035245 USDC` out; 3 swap txs recorded |
| Local Playwright | 3/3 PASS, including the execution receipt at 390/1440 |
| Preview deploy | `46bf788` live; `/healthz`, `/readyz`, both verifier pages 200 |
| Preview Playwright | 3/3 PASS, including the execution receipt at 390/1440 |
| Public verifier | `VERIFIED`; `execution_readiness=EXECUTED`; vault tx and Tidepool swap hashes returned |

## Budget consumed

- New spend: **$0.00**.
- OpenRouter remaining at handoff: **$7.5465** (from $30 pre-purchased).
- Proprietary live run consumed approximately **$0.017** of pre-purchased credit.
- Live audit + diagnostics consumed approximately **$0.163** of pre-purchased credit.
- Per-audit ceiling: **$0.50**.
- No paid hosting, paid TTS, Render Postgres, card charge or auto-billing trial.

## Known issues / limitations

1. TEE attestation is waived, not verified. No TEE badge is displayed.
2. The clean follow-up live audit is `TRADE` with all evidence verified. The earlier `ABSTAIN` development audit remains anchored; it is not rewritten.
3. UI list/detail/operator live views are connected to session-scoped data and the form can create a real draft. Wallet-driven `commit_audit` and `fund_audit` signing from the browser is still not wired; API + CLI paths are verified.
4. The UI new-audit form submits a real draft through `/api/v1/ui/audits/prepare`; it does not yet sign the commitment or funding transactions with the wallet selector.
5. `cron-job.org` is not configured; GitHub Actions `keepalive.yml` pings `/healthz` every 10 minutes.
6. Render free cold start ~50 seconds; the demo was captured against a warm local build using the same Neon data and live certificate.
7. A06/A07 share the Flint family; documented availability substitution. Gate still passes 7 families/2 vendors.
8. `escrow.dissent-demo.testnet` is created but unused; funding/bounty logic lives in the registry contract. Documented in the deployment notes.
9. Phase 10 live execution is demonstrated. The preview remains fail-closed (`EXECUTION_ENABLED=false`, `PROPRIETARY_LOOP_ENABLED=false`); a future live run needs a fresh quote, vault approvals and `PROPRIETARY_EXECUTION_AUDIT_ID`.
10. The demo video predates the trading beat. Regeneration is intentionally deferred until the operator approves after reviewing the live `EXECUTED` certificate and Tidepool settlement.
11. `EXECUTION_ENABLED` and `PROPRIETARY_LOOP_ENABLED` remain `false` for the preview; the live run was an explicit operator action using `scripts/proprietary-live.ts`.

## Authority boundaries

- `main` commits/pushes: authorized.
- Preview deployment: authorized on Render free + Neon free.
- Production deployment: **not authorized**.
- Mainnet transaction: **not authorized**.
- X/demo posting: **assets only**; do not post.
- Paid services / new card charges: **not authorized**.

## Demo status

- Output: `demo/dissent-demo.mp4`
- Duration: **100.08s**, 1280×720, H.264/AAC, 4,200,670 bytes
- SHA-256: `0f86840bf291e53267bd502bf5db403d144f3434ab7fba5fe01d4a6597cff79a`
- Narration: `demo/NARRATION.md`; production notes: `demo/PRODUCTION_NOTES.md`; machine timing: `demo/timings.json`
- Voice: ElevenLabs library voice blocked by free-tier `paid_plan_required`; delivered with public-domain Piper/LJSpeech fallback. No paid TTS was used.
- Music: Kevin MacLeod — “Floating Cities”, CC BY 4.0, attributed in README and production notes.
- Captions: burned in, max two lines; sampled review at 5s/30s/55s/75s.
- E2E: 3 Playwright tests pass against both local and deployed preview.
- Preview deploy: `245bf9a` live at `https://dissent-web.onrender.com`; health/readiness and the three E2E checks pass.

## Next task

**Phase 10 unblock:** authorize a token-aware vault upgrade that can register storage and perform `ft_transfer` of wNEAR to a Tidepool per-quote deposit address (or approve a native-NEAR venue). Then set `PROPRIETARY_LOOP_ENABLED=true` and `EXECUTION_ENABLED=true` for the preview/demo, approve the quote deposit address and certificate on the vault, run one proprietary thesis, and verify `execution_readiness=EXECUTED` with a tx hash. Do not regenerate the demo until the operator reviews the flow.

1. Wire wallet `signAndSendTransaction` for `commit_audit` after the draft is created.
2. Wire quote issuance and wallet `fund_audit`, then verify receipts and show live progress.
3. Add UI tests for the wallet transaction path (wallet-extension mocking or the agent-supplied signed-tx path).
4. Deploy the final commit and re-run the Playwright suite on the preview.
5. If the operator supplies an ElevenLabs free-tier-compatible voice ID or upgrades the plan, regenerate `demo/dissent-demo.mp4` with the requested voice.
