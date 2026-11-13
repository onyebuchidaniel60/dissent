# AI_HANDOFF.md — Dissent

**Last updated:** 2026-11-13
**Current phase:** Phase 5 complete — live testnet audit path, evidence review, deterministic adjudication, certificate anchoring and bounty accounting are implemented. Phase 6 UI integration/E2E is next.
**Repository:** `https://github.com/onyebuchidaniel60/dissent` (public, `main`, MIT)
**Preview URL:** `https://dissent-web.onrender.com`
**Deployed app commit:** `366b967` (app shell + overflow fix); the Phase 2–5 backend and live-verifier commits are pending this deployment.
**Production/mainnet authority:** **not granted**. No mainnet transaction, production release or external posting is authorized.

## Live testnet artifacts

- **Audit ID:** `08939501-b745-407e-8899-7b886ce4e213` (`AUD-F6DB-A20A`)
- **Commitment transaction:** `EPyCZw3yCiEyVfrpjBvdFVHsRHdnzpsHaLwKLEEPW6YK`
- **Funding transaction:** `J4D85KnMNB3RsyDR5ZtotUqxqD8nw5LMqGTwGms6yySY`
- **Certificate ID:** `f7783fa3-a71e-49ae-ab06-4ca5ac1b7670`
- **Certificate hash:** `092e94db24d81e4d9cdb62c16269add73d9b82a18d166d70b6e6054b41e4e4d6`
- **Certificate anchor transaction:** `BRajqZsAKZPt96BrbFy7y1BRKeLyaE9vymnq2mQFqkkN`
- **Verdict:** `ABSTAIN`. Material condition FC-002 (executable pool depth) was `UNVERIFIABLE` in the available evidence; the audit did not substitute `NOT_HIT`.
- **Bounty accounting:** 8 accepted-finding allocations totaling `0.03625 NEAR` recorded on testnet; no payout claim executed.
- **Public verify:** `https://dissent-web.onrender.com/verify/f7783fa3-a71e-49ae-ab06-4ca5ac1b7670` (available after the next deployment).

**Known development-audit issue:** the first live audit's condition-preimage evidence hash was computed with an extra field, producing a false `CONTRADICTED` review and contributing to `ABSTAIN`. The hash computation is fixed in `src/lib/evidence/service.ts` for subsequent audits. The anchored certificate is immutable and is retained as a development/test artifact; it is not rewritten.

## Intake status

- Product definition and scope: PASS.
- UI references: PASS — `design/dissent-reference1.webp` (2048×1536) and `design/dissent-reference2.webp` (2018×12858), inspected and mapped in `REFERENCE_ASSETS.md`.
- Repository/Git: PASS — GitHub ADMIN, `main`, `trurntt <onyebuchidaniel60@gmail.com>`.
- Budget/authority: PASS — **$0 new spend**; pre-purchased OpenRouter credit only; per-audit ceiling $0.50.
- Model providers: PASS — OpenRouter + Groq keys validated; **7 distinct families / 2 vendors / 1 open-weight**. A06 and A07 share Flint as a documented free-model availability substitution; the gate remains satisfied.
- NEAR testnet: PASS — deployer `dissent-demo.testnet`, registry `registry.dissent-demo.testnet`, payout `payout.dissent-demo.testnet`. `escrow.dissent-demo.testnet` was created but the escrow module is deployed inside the registry contract, so funding uses the registry account.
- Hosting/database: PASS — Render free + Neon free PostgreSQL.
- Data adapters: PASS — FastNEAR public RPC, NearBlocks public API, CoinGecko external market observation. Pikespeak/RedStone skipped by intake.
- Demo voice: PASS — ElevenLabs credential and operator voice ID validated; free tier 10,000 characters.
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
2. The first live audit is `ABSTAIN` because execution-depth evidence was unavailable and a preimage-hash bug produced a false contradiction. The bug is fixed; a clean follow-up audit should be run before final demo if time permits.
3. UI still renders deterministic fixture audits for most client screens. API and live certificate pages are functional; Phase 6 must connect the form/list/detail/results screens to the real API and session.
4. The UI new-audit form currently validates locally and previews hashes; it does not yet submit or sign through the wallet selector.
5. `cron-job.org` is not configured; GitHub Actions `keepalive.yml` pings `/healthz` every 10 minutes.
6. Render free cold start ~50 seconds; warm before demo.
7. A06/A07 share the Flint family; documented availability substitution. Gate still passes 7 families/2 vendors.
8. `escrow.dissent-demo.testnet` is created but unused; funding/bounty logic lives in the registry contract. Documented in the deployment notes.

## Authority boundaries

- `main` commits/pushes: authorized.
- Preview deployment: authorized on Render free + Neon free.
- Production deployment: **not authorized**.
- Mainnet transaction: **not authorized**.
- X/demo posting: **assets only**; do not post.
- Paid services / new card charges: **not authorized**.

## Next task

**Phase 6 — functional frontend integration and E2E gate.**

1. Connect `/app/audits` and `/app/audits/[id]` to session-scoped API/DB data; retain fixtures only where clearly labelled.
2. Make the new-audit form call the prepare route/session service, then sign `commit_audit` with the wallet selector.
3. Add quote/fund steps and verify receipts; show live progress and results.
4. Add Playwright primary journey and failure tests; record preview URL/commit.
5. Run a clean follow-up live audit after the preimage fix and update the public certificate link.
