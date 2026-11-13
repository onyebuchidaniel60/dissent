# AI_HANDOFF.md — Dissent

**Last updated:** 2026-11-13
**Current phase:** Phase 10 — proprietary trading arm implemented (vault, execution adapter, readiness schema, gated loop, operator UI). Live swap is **hard-blocked** because Tidepool requires a NEP-141 wNEAR deposit and the current vault only transfers native NEAR. Demo was intentionally not regenerated.
**Repository:** `https://github.com/onyebuchidaniel60/dissent` (public, `main`, MIT)
**Preview URL:** `https://dissent-web.onrender.com`
**Deployed app commit:** `f2ee8db` (`feat: add capped vault and gated proprietary execution arm`).
**Production/mainnet authority:** **not granted**. No mainnet transaction, production release or external posting is authorized.

## Live testnet artifacts

- **Audit ID:** `394c2192-8d9f-4463-99f2-a15d45dc54a2` (`AUD-C963-E660`)
- **Commitment transaction:** `JkqwT3Zc9scWxKxkq2jyLwqCALhkfeVrbNbASxhExiJ`
- **Funding transaction:** `WmHPmBt742SRm4QfuZBJFa4zCtdVPWjWScTJ813uQhz`
- **Certificate ID:** `96426c09-87ec-4641-94ed-4edf0b7b34f1`
- **Certificate hash:** `149c529602c40894643444ee69c9af4e2984774ed77a08e7fc56237345538139`
- **Certificate anchor transaction:** `6G7Yd3uvZozLC9SbXtNW5jxFetV4TLqgTMFxN76MmYJF`
- **Verdict:** `TRADE`. All eight runs completed, both material conditions were evaluable, all five evidence refs re-fetched as `VERIFIED`, divergence was `0`, and all review/non-contradiction gates passed.
- **Bounty accounting:** 7 accepted-finding allocations totaling `0.025 NEAR` recorded on testnet; no payout claim executed.
- **Public verify:** `https://dissent-web.onrender.com/verify/96426c09-87ec-4641-94ed-4edf0b7b34f1` (live).

An earlier development audit (`08939501…`) ended `ABSTAIN` when execution-depth evidence was unavailable and a preimage-hash bug produced a false contradiction. The bug is fixed in `src/lib/evidence/service.ts`; the earlier anchored certificate is retained unchanged as an immutable test artifact.

## Phase 10 — proprietary trading arm

- Specs updated before code: `PROJECT_SPEC.md`, `ARCHITECTURE.md` §15, `AGENTS.md`, `docs/ECONOMICS_SPEC.md`, `docs/SMART_CONTRACT_SPEC.md`.
- Vault deployed: `vault.dissent-demo.testnet`; deploy tx `8V4A7CypSu6SS3NWywnJFhCqqfUzDxo9xYr1azdzqMBN`.
- Caps: `0.5 NEAR` per transaction / `1 NEAR` daily. Tidepool is the intended venue; its deposit addresses are per-quote.
- Agent account `vault-agent.dissent-demo.testnet` has only a Function Call Key scoped to `vault.dissent-demo.testnet::spend_as`; RPC permission check passed.
- Current clean certificate `96426c09-87ec-4641-94ed-4edf0b7b34f1` approved on the vault.
- `packages/execution` implements `TidepoolExecutionAdapter`; returns `REFUSED` on non-TRADE, `EXECUTED` on a mocked TRADE when the vault supports NEP-141, `REVERTED` with the vault reason, and `NOT_CONFIGURED` (`VAULT_NATIVE_NEAR_ONLY`) for the current vault. `EXECUTION_ENABLED=false`.
- Certificate schema now includes `execution_readiness` with `NOT_APPLICABLE`, `READY`, `NOT_CONFIGURED`, `EXECUTED` (+ optional tx). Existing anchored certificates are unchanged.
- `/operator/proprietary` shows venue precheck, execution flags, vault/agent, and execution receipts. It is gated by the operator allowlist and passes 390/1440 Playwright checks.
- Proprietary loop is pg-boss-scheduled only when `PROPRIETARY_LOOP_ENABLED=true` (default false). It returns `BLOCKED_VENUE` rather than fabricating a market observation.
- **Hard blocker:** Tidepool is reachable (`/v0/health`, `/v0/tokens`, dry quote 200), but its wNEAR `ORIGIN_CHAIN` deposit requires a NEP-141 `ft_transfer` with storage registration. The current vault only transfers native NEAR. No live swap was attempted; a new TRADE certificate would be `NOT_CONFIGURED` with `VAULT_NATIVE_NEAR_ONLY`.
- Tests: vault unit tests 5/5 pass; execution adapter suite 7/7 pass; full Vitest 10/10 pass; build passes; Playwright 3/3 passes locally and on the deployed preview, including `/operator/proprietary` at 390/1440.

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

## Budget consumed

- New spend: **$0.00**.
- OpenRouter remaining at handoff: **$7.584022** (from $30 pre-purchased).
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
9. Phase 10 live execution is blocked by a vault/venue incompatibility: Tidepool requires NEP-141 wNEAR deposits; the vault only transfers native NEAR. The vault, Function Call Key, Tidepool adapter, readiness schema and operator UI are implemented; no live execution receipt exists.
10. `EXECUTION_ENABLED` and `PROPRIETARY_LOOP_ENABLED` remain `false`; flipping them is documented as a preview/demo action in `AI_HANDOFF.md` and `docker`/Render configuration.

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
- Preview deploy: `f2ee8db` live at `https://dissent-web.onrender.com`; health/readiness and the three E2E checks pass.

## Next task

**Phase 10 unblock:** authorize a token-aware vault upgrade that can register storage and perform `ft_transfer` of wNEAR to a Tidepool per-quote deposit address (or approve a native-NEAR venue). Then set `PROPRIETARY_LOOP_ENABLED=true` and `EXECUTION_ENABLED=true` for the preview/demo, approve the quote deposit address and certificate on the vault, run one proprietary thesis, and verify `execution_readiness=EXECUTED` with a tx hash. Do not regenerate the demo until the operator reviews the flow.

1. Wire wallet `signAndSendTransaction` for `commit_audit` after the draft is created.
2. Wire quote issuance and wallet `fund_audit`, then verify receipts and show live progress.
3. Add UI tests for the wallet transaction path (wallet-extension mocking or the agent-supplied signed-tx path).
4. Deploy the final commit and re-run the Playwright suite on the preview.
5. If the operator supplies an ElevenLabs free-tier-compatible voice ID or upgrades the plan, regenerate `demo/dissent-demo.mp4` with the requested voice.
