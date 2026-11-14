# AI_HANDOFF.md — Dissent

**Last updated:** 2026-11-14
**Current phase:** Phase 18 — repository declutter and public README overhaul is **complete**. All internal planning, spec and handoff documents now live under `docs/`; the root contains only the public README and project configuration. The public README has no phase checkpoints, budget state, handoff links or commit hashes, and includes the live demo, verification, hackathon tracks, economic model, quickstart, usage and certificate-verification guidance. The deployed testnet preview is unchanged. No mainnet contract or real-fund transaction is claimed or authorized.
**Repository:** `https://github.com/onyebuchidaniel60/dissent` (public, `main`, MIT)
**Preview URL:** `https://dissent-web.onrender.com`
**Deployed app commit:** `79e5029` (`feat: final Phase 17 demo video and README submission polish`; code base `bc25b65` includes Phase 16 x402 compute procurement, the wallet RPC failover list, asynchronous dispatch and the direct-provider fallback). The final video was captured against `bc25b65` and the live testnet database.
**Production/mainnet authority:** **not granted**. No mainnet transaction, production release or external posting is authorized.

## Live testnet artifacts

- **Final demo video:** `demo/dissent-demo.mp4` — 1440×900, 144.20s, SHA-256 `25066d678beef048ae10f69267d38b04cd220fdce4104270cc2757ea8f5bd75e`. Client and proprietary verifier shots use `a8df6a5a…` (`VERIFIED / ABSTAIN`) and `0bf3728d…` (`VERIFIED / EXECUTED`).
- **Phase 16 x402 audit:** `88114e6f-0cc7-479d-af0a-49425b9f3ea5` (`AUD-2039-DDF2`), verdict `ABSTAIN`, certificate `a8df6a5a-8b3c-4f33-9953-4b64593256bf`, hash `504a9c30163dae2a3f28833c80372d0031fdb14ad1812f1123494a58f29bb3cb`, anchor tx `Dz8wm14QrcKhkdzQpVMSZ5RCbFgRDc8cSg62rPqpfhJK`, public verify `https://dissent-web.onrender.com/verify/a8df6a5a-8b3c-4f33-9953-4b64593256bf`. A01 OpenRouter and A02 Groq each paid `0.002` test USDC through the deployed x402 shim.
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

## Phase 12 — layout fix and production sweep

- **Hero phone bug:** the phone was hidden by the 1340px breakpoint on narrower/zoomed desktop viewports and had no explicit minimum dimensions. The hero grid is now explicit (`minmax(0, 1fr) 300px`), the phone has `min-width: 280px` / `min-height: 566px`, and the hide breakpoint is **1099px**. The right column can no longer collapse. Playwright asserts the phone is visible at 1440×900 (width > 240, x > 800), captures `test-results/hero-1440.png`, and asserts it is hidden at 390×844.
- **Production defaults:** `.env.example` is the mainnet production template (`NEAR_NETWORK=mainnet`, `EXECUTION_VENUE=ONECLICK`, `EXECUTION_ENABLED=false`, `PROPRIETARY_LOOP_ENABLED=false`). `src/lib/config.ts` reads `config/preview-network.json` as the explicit testnet fallback; `network.ts` selects testnet/Tidepool when mainnet accounts are absent. 1Click remains the primary mainnet adapter at `https://1click.chaindefuser.com`.
- **Frontend sweep:** no `testnet`, `demo-client` or `fixture` strings remain in `src/app` or `src/components`; the operator account display and wallet network defaults were made network-neutral. The UI is 100% network-neutral.
- **Tests:** Vitest 13/13; local Playwright 7/7 and preview Playwright 7/7, including the client execution quote and wallet-signing-step tests. Preview `e9273ad` is live with `network=testnet`, `venue=TIDEPOOL`. The operator test now verifies the admin gate when the deployer is not on the allowlist, so the suite is green in both modes.
- **Preview network fallback:** `config/preview-network.json` pins the live preview to testnet (`rpc.testnet.fastnear.com`, `registry.dissent-demo.testnet`, `vault.dissent-demo.testnet`) and `AUTH_RECIPIENT`/`APP_BASE_URL` to `https://dissent-web.onrender.com`. `network.ts` resolves testnet from the registry suffix and falls back to testnet when `NEAR_NETWORK=mainnet` is set without a mainnet registry. `EXECUTION_VENUE` falls back to `TIDEPOOL` whenever the resolved network is testnet, preserving the historical `EXECUTED` certificate.
- **Dynamic wallet RPC:** `auth.ts` selects `rpc.testnet.fastnear.com` for `.testnet` accounts and `rpc.mainnet.fastnear.com` for `.near` accounts; 64-hex implicit accounts route to testnet when the resolved network is testnet. A local server forced to a mainnet RPC still authenticated a `.testnet` account successfully. Successful access-key lookups are cached for 60 seconds after the public NEAR endpoints rate-limited reads. On the deployed preview, a 64-hex testnet implicit account and named testnet accounts authenticate with `permission=FullAccess`.
- **Wallet diagnostics:** every verification logs `[auth/verify] request` (account, public key, expected/supplied recipient, network) and the raw RPC `view_access_key` response with the exact RPC URL. If the key is missing on the primary RPC, the backend queries the other network and logs `wrong_network`; if the key is a FunctionCall key, it returns the exact message `Nightly is using a Function Call key. Please use a wallet with a Full Access key.` A local and deployed-preview Function Call key test returned that exact 401 message; a FullAccess key returned 200/admin. A fallback test with the mainnet top-level account `aurora` failed on `rpc.testnet.near.org`, found its key on `rpc.mainnet.near.org`, and returned the wrong-network 401 while logging both RPCs. Every rejected verification now also logs `[auth/verify] failure` with the error code, account, public key and supplied recipient (verified on the deployed preview with a 401 nonce failure).
- **Preview recipient:** `authRecipient()` is hardcoded to `https://dissent-web.onrender.com` for a production testnet preview and trims trailing slashes; the frontend passes the challenge recipient back for logging and comparison.
- **TEE banner removal:** `TeeWaiverNotice` deleted; every TEE/attestation/confidential tag, panel, footer line, status entry and public API field removed from `src/app`/`src/components`. Rendered-text scan of `/`, `/docs`, `/app`, `/app/attackers`, `/app/audits`, `/app/reputation`, `/app/settings/api-keys`, `/operator`, `/operator/providers`, `/operator/proprietary` and the verifier is clean for TEE/attestation/confidential and for testnet/demo-client/fixture. The workspace account tag is masked. The same scan is clean on the deployed preview at `e9273ad`.
- **Wallet auth fix:** `AUTH_RECIPIENT` now defaults to `APP_BASE_URL` and the preview uses `https://dissent-web.onrender.com`. The frontend normalizes the public-key prefix and signature encoding; the backend decodes base64/base64url/array/hex signatures, strips an `ed25519:` prefix, normalizes the public key and verifies against the stored recipient/callback. Local API test with an unprefixed public key and prefixed base64 signature returned 200 and a valid admin session; the same request on the preview also returned 200 with an admin session.
- **Global page gutter:** `.app-main` used the `padding` shorthand with zero horizontal padding, overriding `.page-width`'s `clamp(24px, 4.8vw, 88px)`. It now sets only `padding-top`/`padding-bottom`; `/docs` gained `src/app/docs/layout.tsx` with the same `page-width app-main` wrapper. At 1440×900 the page header starts at `x=69.12px` with a matching right gap and the existing `--page-max: 1520px` centers wider screens. Playwright screenshots: `test-results/gutter-reputation-1440.png`, `gutter-audits-1440.png`, `gutter-docs-1440.png`.
- **Demo:** deferred by operator instruction; no video or README finalisation was generated in this phase.

### Phase 18 — repository declutter and public README — 2026-11-14

- Moved the root planning/spec/handoff set into `docs/`: `PROJECT_SPEC.md`, `ARCHITECTURE.md`, `AGENTS.md`, `AI_HANDOFF.md`, `IMPLEMENTATION_PLAN.md`, `OPERATOR_INTAKE.md`, `DEMO_VIDEO_PLAN.md`, `DISSENT_ATTACKER_OUTPUT_SCHEMA.md`, `DISSENT_IMPLEMENTATION_BLUEPRINT.md`, `DISSENT_PRD.md`, `PROPER_VIBE_CODING_WORKFLOW.md` and `REFERENCE_ASSETS.md`. The root now contains only `README.md` as Markdown.
- Removed the generated root `SHA256SUMS.txt` and the duplicate `demo/DEMO_VIDEO_PLAN.md`.
- Rewrote the public README: removed the phase checkpoint, the Budget section, handoff/commit references and internal planning links; kept Live Demo & Verification, Hackathon Tracks (Agent Economy primary), Economic Model and Compute Procurement; added a hosted/local Quickstart, How to use Dissent, How to verify a certificate, public documentation links and the final demo hash.
- Updated in-app documentation links and moved-document cross-links; a local Markdown link check reports zero broken relative links. `pnpm typecheck`, `pnpm lint` and `pnpm build` pass.
- **Future agents:** the persistent instructions are now at `docs/AGENTS.md`; the handoff is `docs/AI_HANDOFF.md` and the build log is `docs/BUILD_LOG.md`.

### Phase 17 — final demo and submission polish — 2026-11-14

- **Final video:** `demo/dissent-demo.mp4`, 1440×900, 144.20s, H.264/AAC, 8,610,222 bytes, SHA-256 `25066d678beef048ae10f69267d38b04cd220fdce4104270cc2757ea8f5bd75e`. Captured from the current build and live testnet data with Playwright; voice is local Piper/LJSpeech; music is Kevin MacLeod's “Floating Cities” at approximately −20 dB. Act 1 covers the client audit, attacker runs, x402 log excerpt, `ABSTAIN`, certificate anchor and `VERIFIED` client verifier. Act 2 covers `/operator/proprietary`, the historical `EXECUTED` receipt, vault tx `DxvoRKhCnyYyKrmAopnVYPKZJB7g8ev5Er1wtW5JbSp`, Tidepool swap txs and the proprietary verifier returning `VERIFIED / EXECUTED`.
- **README:** added prominent **Live Demo & Verification**, **Hackathon Tracks** (Agent Economy primary), **Economic Model**, final x402 architecture, and **Future Roadmap** sections. The Economic Model contains the exact statement: “Dissent autonomously pays for its own inference compute using the x402 protocol. It holds USDC in a dedicated agent wallet and settles payments on-chain via a self-hosted facilitator shim.” The demo section records 1440×900, 144.2s and the final hash.
- **Narration and production notes:** `demo/NARRATION.md` and `demo/PRODUCTION_NOTES.md` are rewritten for the final 13-segment 144.2s cut, including measured timings, voice/music attribution, build commands and review evidence. `demo/timings.json`, `demo/phase17-captions.ass` and the capture script are checked in.
- **Verification evidence in the video:** client certificate `a8df6a5a-8b3c-4f33-9953-4b64593256bf` (`VERIFIED`, `ABSTAIN`) and proprietary certificate `0bf3728d-e457-4b2f-8fad-b53be9565498` (`VERIFIED / EXECUTED`). The x402 log card quotes the Render runtime lines for `AUD-2039-DDF2`.
- **Tests:** `pnpm typecheck`, `pnpm lint`, Vitest `16/16`, `pnpm build` and Playwright `7/7` pass on the final build. The Playwright draft-creation test left `AUD-7592-D199`; it was deleted after confirming zero commitments. The two pre-hotfix user drafts remain `AWAITING_COMMITMENT` and are not touched.
- **Deployment:** code commit `bc25b65` is live. Final README/docs commit follows this handoff update. No mainnet deployment, real-fund transfer, TEE claim or production release was made.

### Phase 16.1 — wallet RPC and dispatch hotfix — 2026-11-14

- **Actual root cause:** `Exceeded 1 providers to execute request` is thrown by `@near-js/providers` `FailoverRpcProvider`, not by the AI SDK. The wallet selector was created with a single RPC (`network` string, no `fallbackRpcUrls`), so one rate-limited wallet RPC failed the commitment/funding transaction call. The commitment verify route never ran inference.
- **Wallet fix:** `src/lib/near-wallet.ts` now passes `fallbackRpcUrls` to `setupWalletSelector` — testnet: FastNear, `near-testnet.drpc.org`, `rpc.testnet.near.org`; mainnet equivalents. Override with `NEXT_PUBLIC_NEAR_RPC_URLS` (comma-separated). This gives the wallet selector a real `FailoverRpcProvider` list instead of one provider.
- **Dispatch decoupling:** `funding/verify` no longer calls `startQueue()` or imports the AI pipeline. It verifies the transaction, writes `FUNDED`, enqueues `audit.dispatch` via the already-running producer, and returns 200. `instrumentation.ts` remains the only startup path for workers; `commitment/verify` never enqueued or ran inference.
- **x402 fallback:** `src/lib/providers/openai-compatible.ts` catches `X402PaymentError` and proxy/network failures (except aborts), logs exactly `[x402] Payment failed, falling back to direct API key`, and retries the same model with the existing OpenRouter/Groq key. A proxy `402`/`5xx` also falls back. A dead proxy test returned `fallback-ok` from OpenRouter after the warning, so a payment failure no longer kills the audit.
- **Agent wallet:** `x402-agent.testnet` was `9.972` USDC and healthy; `scripts/fund-x402-agent.ts` topped it back to `10.000000` (`73vrkBL7uhBhr6nHsBrVsZNpYqMpUvnjw9HziECsmMZD`). The deployed shim reports `relayerRpc: {ok:true}`. This was not an out-of-funds outage.
- **User wallet funding:** sent `1` testnet NEAR to the requested Nightly implicit account `b52f34aa6569312b691e649dec777467bac7ae92980a4572d1e878cf0fd0b4be`; tx `91NsknPEiKyUnpJcXTFEnfBu9HDF9o6ta2KQHFAkBSiy`, balance `0.05 → 1.05` NEAR.
- **Full API flow test:** `AUD-14D9-3985` (`1fd57b9b-1947-4064-a560-39d6b716d0fb`) was created, committed and funded through the same endpoints the UI uses. `commitment/verify` returned `200` in `1586 ms`; `funding/verify` returned `200` in `1225 ms`; the immediate audit read was `FUNDED`; the worker moved it to `ATTACKING` on the next poll (about 4s) and it completed `ABSTAIN` with certificate `a1d76f68-cf60-4018-81f7-e22725c443fb`, hash `be889f5be5940bda533276065aa9876d968c9b9455c5e674a31d4dcfb85e97d2`, anchor `5mrf6AF69FE3roTY1jAfmCSvChTf38CG8R2efYdpYVTd`. No synchronous AI error occurred.
- **Tests:** `pnpm typecheck`, `pnpm lint`, Vitest `16/16`, `pnpm build` and Playwright `7/7` pass after the hotfix. The E2E-created draft was removed; the two pre-hotfix user drafts `AUD-C29F-1879` and `AUD-5A61-6C61` remain `AWAITING_COMMITMENT` and can be ignored or retried.

### Phase 16 — x402 compute procurement — 2026-11-14

- **Agent wallet:** `x402-agent.testnet` was created with the testnet helper (public key `ed25519:4MC6CZXHoW4mo4TmDt2C6JhPhVYQJgm6BBPeAGkLsv39`), funded with `10` testnet NEAR, and registered on Tidepool test USDC. `scripts/fund-x402-agent.ts` registered NEP-145 storage (`CUHoR1cVG9Mkpj55pLR1vG25VMRSYrd4o8YonKwc9Nj8`), registered the payee storage (`APduyJw9kDLX6UN3fNDk2FBCahUB9bbdCQnE6dLbBDA5`), and transferred `10.000000` USDC from `demo-client.testnet` (`Ek9BdFgtH6ZUL8h4joxvPDzvyjX74BYoEQCj67fBjFTb`). The Circle faucet was not used; the agent holds `10` Tidepool test USDC (no value).
- **Why Tidepool USDC:** the public reference facilitator is API-key gated for `/verify` and `/settle`, `httpay.xyz` returns `DEPLOYMENT_DISABLED`, and `@neargate/cli` settles in native NEAR rather than USDC. The implementation therefore self-hosts the facilitator/resource server with `@fastnear/x402` and accepts the Tidepool test USDC token explicitly. This is a documented deviation from the Circle-canonical-asset path; no mainnet asset or real funds are involved.
- **Shim:** `src/lib/x402/server.ts` creates an in-process NEAR facilitator and resource server for `near:testnet`. `POST /api/x402/openrouter/chat/completions` and `POST /api/x402/groq/chat/completions` return the canonical `402` challenge, verify the signed delegate against on-chain state, settle with relayer `dissent-funder.testnet`, forward the request with the existing provider credential, and return the inference plus `PAYMENT-RESPONSE`. `GET /api/x402/supported` publishes the capability document. Model slugs are allowlisted from `config/model_assignments.json`; output tokens are capped; bodies are limited to 96 KB; settlement is serialised for the relayer nonce.
- **Payment client:** `packages/execution/x402-payment-client.ts` implements the generic `payAndRequest(url, init, { provider })`: probe for `402`, select the `exact` `near:testnet` requirement, sign exactly one `ft_transfer` delegate with `X402_AGENT_KEY`, retry with `PAYMENT-SIGNATURE`, decode `PAYMENT-RESPONSE`, and emit `[x402] Paid <amount> USDC to <payee> for <provider> inference.` Paid calls are serialised in-process because NEP-366 delegates consume the payer access-key nonce.
- **Adapter wiring:** `src/lib/providers/openai-compatible.ts` routes A01 (OpenRouter) and A02 (Groq) through `OPENROUTER_X402_PROXY_URL` / `GROQ_X402_PROXY_URL` when the agent credentials exist. `X402_ATTACKERS` defaults to `A01,A02`; all other attackers keep the direct-provider path so one slow paid call cannot stall the eight-attacker audit. Direct-provider mode remains the fallback for local/CI runs without x402 credentials.
- **Unit test:** `tests/unit/x402-payment-client.test.ts` simulates a `402` challenge, verifies the client sends a Borsh-decodable NEP-366 `SignedDelegate` with exactly one `ft_transfer` for the challenged amount/payee, and asserts the exact paid log line. Vitest `16/16`.
- **Local live proof:** `scripts/x402-live-check.ts` paid 0.002 USDC for each provider and received inference: OpenRouter tx `9cGnGNvFVXfpcFr8SmQbxa8Jb1W4GjqLsTkdSDBhuZtu`, Groq tx `3ytvSNjh5rxbzHSM7C44pfsaGtkeiLJnADDqLtjMMkJq`. The agent balance moved from `9.998` to `9.994` USDC (exactly `0.004` spent). The first probe exposed a 60-block delegate TTL that expired during OpenRouter inference; the route now advertises `maxTimeoutSeconds: 300`.
- **Render configuration:** added `X402_SHIM_ENABLED=true`, `X402_PAY_TO_ACCOUNT_ID=dissent-demo.testnet`, `X402_USDC_TOKEN_ID=usdc.tidepool-sandbox.testnet`, `X402_PRICE_ATOMIC=2000`, `X402_ATTACKERS=A01,A02`, `X402_RELAYER_ACCOUNT_ID=dissent-funder.testnet`, `X402_RELAYER_KEY`, `OPENROUTER_X402_PROXY_URL` and `GROQ_X402_PROXY_URL` to the web service. The relayer is isolated from `NEAR_DEPLOYER_*` so audit registry/anchoring transactions cannot race settlement nonces.
- **Security:** the agent and relayer keys are testnet-only full-access keys held server-side; no key or provider credential is logged. The shim is disabled unless `X402_SHIM_ENABLED=true`, is scoped to testnet preview use, and is not a mainnet payment path. `/readyz` now fails closed on missing x402 payee/asset/price/relayer/provider configuration and rejects a non-canonical mainnet asset.
- **Deployed full audit:** `AUD-2039-DDF2` (`88114e6f-0cc7-479d-af0a-49425b9f3ea5`) ran all eight attackers on the deployed preview. Render logged `[x402] Paid 0.002 USDC to dissent-demo.testnet for openrouter inference.` and `[x402] Paid 0.002 USDC to dissent-demo.testnet for groq inference.` The agent moved from `9.988` to `9.984` test USDC (payee `0.016` lifetime test USDC). The audit completed `ABSTAIN`; certificate `a8df6a5a-8b3c-4f33-9953-4b64593256bf`, hash `504a9c30163dae2a3f28833c80372d0031fdb14ad1812f1123494a58f29bb3cb`, anchor tx `Dz8wm14QrcKhkdzQpVMSZ5RCbFgRDc8cSg62rPqpfhJK`; public verify returns `VERIFIED` at `https://dissent-web.onrender.com/verify/a8df6a5a-8b3c-4f33-9953-4b64593256bf`. Coverage is 16/16 condition assessments across eight runs; 7 findings (1 CRITICAL, 5 HIGH, 1 MEDIUM) and 1 minority finding.
- **RPC isolation:** Render's shared egress received `HTTP_429` from both `https://rpc.testnet.fastnear.com` and `https://rpc.testnet.near.org` on the facilitator's `block` read. Added `X402_RPC_URL`; the preview sets `https://near-testnet.drpc.org`, and `/api/x402/supported.relayerRpc` now reports `{ok:true}`. The agent/client signer and the facilitator both honor `X402_RPC_URL`.
- **Audit recovery fixes:** the 5-minute proprietary loop enqueued `audit.dispatch` every tick while an audit was `ATTACKING`, and a resumed run re-inserted `condition_assessments`/`findings`/`tee_verifications` against run-scoped unique indexes, rolling back the completion and leaving runs `RUNNING`. `src/lib/proprietary/loop.ts` now returns BUSY while any attacker run started within the last 10 minutes; `src/lib/orchestrator.ts` deletes prior derived rows before inserting a resumed run's output. Commits `cd3edae` and `322ea7a`. The audit was resumed with one manual dispatch and completed normally.
- **Loop state:** `PROPRIETARY_LOOP_ENABLED` was `false` at the start of this session. It was enabled temporarily to originate the verification audit and set back to `false` afterwards to avoid unattended recurring spend. `EXECUTION_ENABLED` remains `true` as found.
- **Tests:** `pnpm typecheck`, `pnpm lint`, Vitest `16/16`, `pnpm build` and Playwright `7/7` pass locally on the final code. The Playwright draft-creation test left one `AWAITING_COMMITMENT` row (`AUD-53CA-0931`) in the shared database; it was deleted after confirming zero commitments. The database now has zero open drafts.
- **Loop shutdown:** a second loop-originated audit `AUD-F3D9-57A1` (`71563af5-05d3-4bc0-aaa2-94bffd55c094`) was created during the shutdown tick. Its first dispatch timed out and pg-boss retried it; the idempotent completion path let all eight runs finish. It completed `ABSTAIN`; certificate `b734b045-3f62-485a-b682-471ee1bc45e1`, hash `8fd8fea096646daee641531eaee4c99634b885abe9687fea4f59b50bcb0d4643`, anchor `8oCzZThL82UPKXTpHzDCLTAwqaEWZX7rnGgBovGrJEbY`. `src/lib/queue.ts` now unschedules `proprietary.loop` and deletes queued loop ticks when the flag is false, so disabling the loop cannot leave a backlog.

### Phase 14 — client execution UI — 2026-11-14

- **Wallet commit/fund:** `/app/audits/new` now shows a two-step signing panel after draft creation. It initializes the shared wallet selector, checks that the connected account matches the audit client, signs `commit_audit`, verifies it with the session-authorised endpoint, requests the fixed quote, then signs `fund_audit` with the exact quote-bound deposit. After verification it shows “Audit Queued” and polls `/api/v1/audits/{id}` every 5 seconds.
- **Session-authorised client APIs:** commitment verify, funding quote/verify and audit read now accept either the original API key or an authenticated wallet session. The session principal is restricted to the signed-in wallet's workspace. The new execution quote/status routes are session-only.
- **Workspace provisioning:** `ensureWorkspaceForAccount` creates a personal active workspace and OWNER membership for any newly authenticated wallet. It is called at login, on app pages and in the prepare route; a Postgres advisory lock makes concurrent first requests idempotent. Existing Demo Client membership was added for `demo-client.testnet` during verification.
- **Client execution:** a completed `TRADE` audit shows “Execute with your own wallet” and an `Execute Trade` button. The server requests a live venue quote with the client's account as recipient/refund, returns the NEP-141 token, amount, deposit address, memo and storage requirement; the client wallet signs `storage_deposit` + `ft_transfer` directly to the quote address. The UI shows the tx hash and polls venue status. 1Click is used when `EXECUTION_VENUE=ONECLICK` (Mainnet); the Testnet preview uses Tidepool staging because 1Click has no Testnet deployment. Dissent's vault is never used.
- **RPC reliability:** production and preview RPCs moved to FastNear (`https://rpc.testnet.fastnear.com`, `https://rpc.mainnet.fastnear.com`) after the public NEAR endpoints rate-limited access-key reads. Successful access-key lookups are cached for 60 seconds to keep repeated sessions below the free-tier limit.
- **Live proprietary loop:** after the operator re-enabled the flag, the worker created `AUD-6AE5-77D0` (`eb9f5b3e-5894-48f6-9668-f96df2713a27`), committed `G8qWjdKEYHXmLTCBii23JnQMQEN17AyyHHhZWP2qQnHe`, issued quote tx `72PyJ8dsrVyubjcwpBZRkkgnxwLciWcJc7wAfeaxujtn`, funded `8tciCrPJ2YAuWc5hdNkB7YPMMXyirsJidJHTHNaGdzNM` (0.1 testnet NEAR), prepared vault approval/recipient/storage (`91SH8Mpq…`, `9kfxQcnc…`, `7y1Gp4ee…`), and dispatched. A deploy interrupted the attack; the resume fix (`d885546`) re-enqueued the stale dispatch, completed the remaining runs, ran evidence review and adjudication, and anchored certificate `442fca83…` at `A8ynAFRETEoJqdGjqq87zMnJCw3diqnYfqZNz9v61Y7S`. The audit is `ABSTAIN`; public verify returns `VERIFIED`. This is direct evidence that the autonomous commit/fund and restart-recovery paths work in production.
- **Worker restart recovery:** `dispatchAudit` now resumes `ATTACKING` audits, retries stale `RUNNING` rows and queues any remaining work. The 5-minute proprietary worker re-enqueues stale `audit.dispatch`/`evidence.verify` jobs. This recovered the live audit after a deploy and is now part of the production path.
- **Verification:** local Playwright 7/7 and preview Playwright 7/7. A full client-signed test audit was created: `cde5d46e-b678-4874-90fa-5bdf4d904544` (`AUD-F2BA-4F96`), commitment tx `EwiWuBjyzeHUkpz8Zg97dwJA5vSMRbFVpji7RbCDhZoK`, funding tx `5Pj3zcSnNWwphN53yh4GKQVRMZBCtuRGBGYeqB17KPX5`; status advanced to `ATTACKING` and later adjudicated `ABSTAIN`; the certificate is now anchored at tx `7zRvoeM8u2ZfWHhHwKVQjt3WtyYE2fsGovejaiera4xc` and verifies publicly. The earlier proprietary test audit `e7072200…` was also anchored (`5Kvpsr9DbUPY8a7zJJZTHFWnTW75RrgpAN4fipC6JBhx`). The database now has 8 completed audits and 8 anchored certificates, with zero `AWAITING_COMMITMENT` rows.
- **Not automated:** Playwright cannot drive a real browser extension. The UI tests verify draft creation, the signing-step buttons, the shared-wallet copy, the `Execute Trade` button and a live venue quote. The full commit/fund transaction path was verified separately with the demo-client key through the same session-authorised APIs. Client execution tx hashes are shown in-page but are not persisted to a new table.

### Proprietary loop autonomy — 2026-11-14

- **Stuck-draft cleanup:** deleted all `11` `AWAITING_COMMITMENT` proprietary drafts from the production Neon database. The dashboard now contains only the `3` completed historical audits.
- **Lifecycle fix (`d482326`):** the 5-minute worker now originates a draft, signs `commit_audit` with the workspace client key, verifies the commitment, issues the fixed testnet fee quote, signs and verifies `fund_audit`, prepares the testnet vault approval / quote recipient / token storage, pins `PROPRIETARY_EXECUTION_AUDIT_ID` to the audit, and enqueues `audit.dispatch`. The existing orchestrator then runs all eight attackers, adjudicates, and the finalizer executes only on `TRADE`.
- **Resume and guard:** the worker resumes an existing `AWAITING_COMMITMENT`, `COMMITTED`, `FUNDED` or `QUEUED` proprietary audit and returns `BUSY` while an audit is `ATTACKING`, `EVIDENCE_REVIEW` or `CERTIFICATE_PENDING`. A missing deployer/client key returns `FAILED/PREFLIGHT` before any draft is created.
- **Signing key:** Render env has `PROPRIETARY_CLIENT_ACCOUNT_ID=demo-client.testnet` and `PROPRIETARY_CLIENT_KEY` with a testnet-only full-access key. The derived public key `ed25519:DXHEDCo7ThiRxsPxVJqXFakBdr4HoTtHSphx9Fd6xsrM` is `FullAccess` on `demo-client.testnet`. The operator re-enabled `PROPRIETARY_LOOP_ENABLED=true`; `EXECUTION_ENABLED=true` is also set. The first live loop audit is `AUD-6AE5-77D0` (`eb9f5b3e-5894-48f6-9668-f96df2713a27`), already committed and funded and running attackers.
- **Verification evidence:** `pnpm typecheck`, `pnpm lint` and Vitest `13/13` pass. The missing-key preflight returned `{"status":"FAILED","stage":"PREFLIGHT","reason":"NEAR_DEPLOYER_KEY_MISSING"}` without creating a draft. Render build `e9273ad` is live with `network=testnet`, `venue=TIDEPOOL`.
- **Not yet live-tested:** no new audit was originated during verification, to avoid unattended model spend and a dashboard draft. The first operator-enabled loop run will emit `[proprietary] committed`, `quote_issued`, `funded`, `execution_prepared` and `dispatched` with transaction hashes. The vault currently holds `0.01 wNEAR`, enough for the configured `0.01 wNEAR` execution position.

### Nightly login root cause — 2026-11-14

- **Exact rejected request:** `accountId=b52f34aa6569312b691e649dec777467bac7ae92980a4572d1e878cf0fd0b4be`, `publicKey=ed25519:DCGYTDp47rChgauHcdQYNYeWXMPY9jZWuJKwxqXSugi9`, expected and supplied recipient both `https://dissent-web.onrender.com`, resolved network `testnet`.
- **RPC result:** the primary `https://rpc.testnet.near.org` `view_access_key` returned “does not exist”; the fallback `https://rpc.mainnet.near.org` returned the same. The route correctly returned `ACCESS_KEY_NOT_FOUND`. Recipient matching and routing were correct.
- **Actual cause:** the 64-hex account ID is the hex encoding of Nightly's public key, but `view_account` returned `UNKNOWN_ACCOUNT` on both networks. Nightly's Testnet implicit account had never been created/funded, so it had no access key.
- **Remediation:** transferred `0.05` testnet NEAR to that implicit account from the testnet deployer. Funding tx `9H5hYkhr4UgDHcGpnZKdDJurnLdk7NDD3oX1cdE6iKWw`; the account now exists with `ed25519:DCGYTDp47rChgauHcdQYNYeWXMPY9jZWuJKwxqXSugi9` as a `FullAccess` key. `view_access_key_list` on Testnet returns that key. This was testnet-only; no real funds were moved.
- **Post-fix probe:** a verification request with a deliberately invalid signature reached `SIGNATURE_MISMATCH` after `view_access_key` returned `FullAccess`, proving the key lookup now passes. The operator must retry with Nightly's real signature.

### Nightly signature mismatch — 2026-11-14

- **Observed failure:** the 08:08:40 UTC attempt passed `view_access_key` (`FullAccess`) and recipient matching, then returned `SIGNATURE_MISMATCH`.
- **Root cause:** the `@near-wallet-selector/nightly` adapter forwards `message`, `nonce` and `recipient` to `wallet.signMessage`, but **drops `callbackUrl`**. Nightly therefore signed a NEP-413 payload with no callback URL while the backend verified with `challenge.callbackUrl`, changing the Borsh payload and invalidating the signature. This was confirmed in `node_modules/@near-wallet-selector/nightly/index.js` and reproduced with locally signed NEP-413 payloads.
- **Fix (`846846b`):** verification now tries the official `near-api-js` `verifyMessage` against the payload with `callbackUrl` first, then without it. The message, 32-byte nonce and exact recipient are unchanged. `[auth/verify] signature` logs the raw signature, prefix, decoded length, message, nonce, recipient and callback URL; `[auth/verify] signature_check` logs each variant, the verifier error and which variant succeeded.
- **Nonce safety:** a failed signature does not mark the nonce used; only a successful verification consumes it. The operator can retry with the same challenge until it expires.
- **Verification on the deployed preview:** a signature over the payload **without** `callbackUrl` returned 200 with `verifiedWith=no_callbackUrl`; a signature **with** `callbackUrl` returned 200 with `verifiedWith=callbackUrl`.

### Phase 11 UI correction (operator feedback)

- Restored **Orbitron** as the display face; Russo One removed. The previous Phase 10 typography is back.
- Hero heading increased ~18%: `clamp(2.8rem, 7.3vw, 7.3rem)`; mobile retains the existing safe clamp and the phone is hidden.
- Global gutter increased to `clamp(24px, 4.8vw, 88px)` — at least 24px mobile and 65–88px on desktop, rather than content touching the viewport edge.
- Added a pure-CSS/SVG-free hero phone mockup with a dark bezel, tap ripple, sequential A01–A08 lighting, and a final `TRADE · Certificate anchored` badge. It loops every 9s, is decorative (`aria-hidden`, no interactive controls), supports `prefers-reduced-motion`, and is hidden at widths ≤1099px so mobile stacks the hero copy without the phone.
- Verified visually at 1440×900, 1920×1080 and 390×844; no horizontal overflow. Vitest 13/13 and Playwright 3/3 at 390×844/1440×900 pass locally. Preview `a8b24c3` is live; preview Playwright 3/3 passes; the hero phone is `block` at 1440 and `none` at 390.

## Phase 11 — mainnet readiness and production polish

- Network defaults: `NEAR_NETWORK=mainnet`, `NEXT_PUBLIC_NEAR_NETWORK=mainnet`, `NEAR_RPC_URL=https://rpc.mainnet.near.org`, `NEAR_EXPLORER_URL=https://explorer.near.org`. Registry, vault, payout and deployer accounts have no testnet defaults; missing configuration fails closed.
- Execution: `EXECUTION_VENUE=ONECLICK` is the primary adapter. Base URL `https://1click.chaindefuser.com`; wNEAR `nep141:wrap.near`; USDC `nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1` from the live `/v0/tokens` catalogue. A read-only mainnet precheck on 2026-11-14 returned 231 tokens and a dry `0.01 wNEAR → 0.034224 USDC` quote with no deposit address and no transaction. No mainnet execution or account approval was performed. Tidepool remains available only when `EXECUTION_VENUE=TIDEPOOL` for staging.
- Contract audit fixes in the mainnet source: `#[init]` instead of `ignore_state`; certificate replay protection; quote-window recipient expiry (`set_recipient_until`); 24-decimal wNEAR assertion. Source wasm SHA-256 `f8475b3998114e9970e51a6473c6acccdb14517986267f4ef058df747f43f582`; 12/12 vault tests pass. The deployed `vault.dissent-demo.testnet` remains the staging v2 artifact and is not the mainnet template. See `docs/SMART_CONTRACT_SPEC.md`.
- UI cleanup: removed `NEAR TESTNET`, `DEMO FIXTURE`, demo-client/testnet account labels and fixture-only pages from customer-facing routes. The app overview, audit ledger, audit detail, operator, providers, reputation, attackers, settings, docs and verifier now use live data or honest empty states. The historical staging execution receipt remains in the operator page with a network-neutral label.
- Typography: Orbitron display face (Phase 10); hero `clamp(2.8rem, 7.3vw, 7.3rem)`, section `clamp(1.6rem, 3.1vw, 2.8rem)`, page `clamp(1.8rem, 3.4vw, 3.1rem)`. Global gutter `clamp(24px, 4.8vw, 88px)`. Verified at 1440×900, 1920×1080 and 390×844 with no horizontal overflow.
- Preview remains staging: Render env explicitly sets `NEAR_NETWORK=testnet`, `NEXT_PUBLIC_NEAR_NETWORK=testnet`, `EXECUTION_VENUE=TIDEPOOL`, testnet registry/vault accounts and `DEMO_MODE=false`. The UI does not display a testnet label. Production must use a fresh mainnet database and the mainnet `.env.example`; do not carry staging records into mainnet.
- No mainnet deployment, mainnet transaction or real-fund transfer was performed. No new spend. Demo regeneration remains deferred.

## Phase 10 — proprietary trading arm

- Specs updated before code: `PROJECT_SPEC.md`, `ARCHITECTURE.md` §15, `AGENTS.md`, `docs/ECONOMICS_SPEC.md`, `docs/SMART_CONTRACT_SPEC.md`.
- Vault `vault.dissent-demo.testnet` upgraded in place to v2 at tx `6t3pMThsSsDmEVgoj4eS9MJoqm3T2gq7ynXYFkXcqQh2`; v1 deploy `8V4A7CypSu6SS3NWywnJFhCqqfUzDxo9xYr1azdzqMBN`.
- Caps: `0.5 NEAR` per transaction / `1 NEAR` daily. The vault holds native NEAR plus Tidepool test wNEAR (`wnear.tidepool-sandbox.testnet`, 24 decimals), fixed at initialization.
- Agent account `vault-agent.dissent-demo.testnet` now has a Function Call Key `ed25519:EXg79…` scoped to `vault.dissent-demo.testnet` methods `spend_as` and `spend_ft_as`, allowance 1 NEAR (tx `87kQ9…`). The older `spend_as`-only key was deleted (tx `8zNjA3TdqUzPZAK2qLbGhqYtEqDPDV6txAZCgd4jTuZV`); the app runtime holds only the new scoped key. No full-access key is in the execution runtime.
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
| Vault v2 unit tests (staging) | 8/8 PASS |
| Mainnet-source vault tests | 12/12 PASS |
| Execution adapter tests | 13/13 PASS |
| Full Vitest | 13/13 PASS |
| Live proprietary audit | 8/8 attackers; both conditions `EVALUABLE`/`NOT_HIT`; 8 gates pass; divergence `0`; verdict `TRADE` |
| Live vault execution | `spend_ft_as` PASS; tx `DxvoRKhCnyYyKrmAopnVYPKZJB7g8ev5Er1wtW5JbSp`; `execution_readiness=EXECUTED` |
| Tidepool settlement | `SUCCESS`; `0.035245 USDC` out; 3 swap txs recorded |
| Local Playwright | 3/3 PASS at 390×844 and 1440×900, including the execution receipt |
| Preview deploy | `e9273ad` live; `/healthz`, `/readyz`, historical verifier and both verifier pages 200 |
| Preview Playwright | 7/7 PASS on `e9273ad`, including client execution quote and wallet signing-step UI |
| TEE/network UI scan | Clean: no TEE/attestation/confidential or testnet/demo-client/fixture text on 11 rendered routes locally and on the preview |
| Wallet login | Local and preview signed NEP-413 requests returned 200 with a valid admin session; `.testnet` and 64-hex implicit accounts both work; `.testnet` also works with a mainnet `NEAR_RPC_URL` |
| Client commit/fund | Test audit `cde5d46e…` committed and funded through session-authorised endpoints; tx `EwiWuBjy…` / `5Pj3zcSn…`; adjudicated ABSTAIN; certificate `b376b353…` anchored at `7zRvoeM8…` and `VERIFIED` |
| Client execution UI | Preview 1440×900 tests find `Execute Trade`, the 1Click/Tidepool copy and a live Tidepool quote for a TRADE audit |
| Live proprietary loop | `AUD-6AE5-77D0` committed `G8qWjdKE…`, quote `72PyJ8ds…`, funded `8tciCrPJ…`; all 8 runs completed after restart recovery; ABSTAIN certificate `442fca83…` anchored `A8ynAFRE…` and `VERIFIED` |
| Proprietary signing | Render client key derives `ed25519:DXHED…xsrM`, which is `FullAccess` on `demo-client.testnet`; missing-key preflight fails before draft creation |
| Stuck proprietary drafts | 11 `AWAITING_COMMITMENT` drafts deleted; only 3 completed audits remain |
| Nightly implicit account | Account `b52f…b4be` did not exist on either network; created on Testnet with `0.05` testnet NEAR, tx `9H5hYkhr4UgDHcGpnZKdDJurnLdk7NDD3oX1cdE6iKWw`; `FullAccess` key now present |
| NEP-413 callbackUrl variants | Preview accepted both signatures with `callbackUrl` and without it (`verifiedWith=callbackUrl` / `no_callbackUrl`); Nightly uses the no-callbackUrl variant |
| Preview network fallback | `e9273ad` reports `network=testnet`, `venue=TIDEPOOL`; historical certificate remains `VERIFIED`/`EXECUTED` |
| FunctionCall key | Preview returned 401 with `Nightly is using a Function Call key. Please use a wallet with a Full Access key.` |
| Wrong-network fallback | `aurora` (mainnet key) returned 401 wrong-network; logs show testnet miss then mainnet hit |
| Public verifier | `VERIFIED`; `execution_readiness=EXECUTED`; vault tx and venue swap hashes returned |
| `/readyz` config check | PASS in staging (`network=testnet`, `venue=TIDEPOOL`); fail-closed in production if registry/vault/quote accounts are missing |
| Typography | Orbitron display face; hero 2.8–7.3rem, section 1.6–2.8rem, page 1.8–3.1rem; animated hero phone; no overflow at 390×844/1440×900/1920×1080 |

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
3. UI list/detail/operator live views are connected to session-scoped data and the form can create a real draft. Wallet-driven `commit_audit` and `fund_audit` signing from the browser is still not wired; API + CLI paths are verified and the proprietary worker now has a server-side signing path. The worker's first live commit/fund run is pending the operator re-enabling the loop.
4. The UI new-audit form submits a real draft through `/api/v1/ui/audits/prepare`; it does not yet sign the commitment or funding transactions with the wallet selector.
5. `cron-job.org` is not configured; GitHub Actions `keepalive.yml` pings `/healthz` every 10 minutes.
6. Render free cold start ~50 seconds; the demo was captured against a warm local build using the same Neon data and live certificate.
7. A06/A07 share the Flint family; documented availability substitution. Gate still passes 7 families/2 vendors.
8. `escrow.dissent-demo.testnet` is created but unused; funding/bounty logic lives in the registry contract. Documented in the deployment notes.
9. Phase 10 live execution is demonstrated. The operator has set `EXECUTION_ENABLED=true` and `PROPRIETARY_LOOP_ENABLED=true` on the Render preview and is monitoring the proprietary loop. The first live loop audit `AUD-6AE5-77D0` (`eb9f5b3e…`) was interrupted by a deploy, recovered by the new resume path, completed `ABSTAIN`, and anchored as `442fca83…`. No mainnet deployment or real-fund transfer is authorized by this build.
10. The demo video predates the trading beat. Regeneration is intentionally deferred until the operator approves after reviewing the live `EXECUTED` certificate and Tidepool settlement.
11. `EXECUTION_ENABLED=true` and `PROPRIETARY_LOOP_ENABLED=true` are operator-set on the preview; the loop is live. The historical Phase 10 run was an explicit operator action using `scripts/proprietary-live.ts`.
12. The preview is an explicit testnet staging deployment with a network-neutral UI. Production mainnet requires a fresh database and operator-owned registry, vault and payout accounts; no mainnet deployment is claimed.
13. Mainnet execution would move real funds and is not authorized by this build. The mainnet vault source includes replay protection, quote-window recipient expiry and a multisig/timelock owner requirement, but has not been deployed.
14. The ElevenLabs library voice remains blocked by `paid_plan_required`; the delivered demo uses the documented Piper/LJSpeech fallback and was not regenerated in Phase 11.
15. 1Click has no Testnet deployment. The preview’s client execution uses Tidepool staging with the same self-custody wallet flow; the 1Click quote path is selected when the resolved venue is `ONECLICK` on Mainnet.
16. Client execution tx hashes are currently shown in the page state and venue status is polled, but no `client_executions` persistence table was added in Phase 14.
17. Render `ADMIN_WALLET_ADDRESSES` currently targets the Nightly implicit account `b52f…b4be`, so the deployer-signed `dissent-demo.testnet` session is authenticated but not admin. The app correctly renders the “Wallet not allowlisted” gate; the admin-only preview E2E assertions still assume deployer admin access and therefore fail. The CSS/UI gutter test is unaffected.

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
- Preview deploy: `e9273ad` live at `https://dissent-web.onrender.com`; readiness reports testnet/Tidepool, the historical certificate verifies, the 7/7 E2E suite passes, and `[auth/verify]` diagnostics are visible in Render logs.

## Next task

**Phase 12 — production deployment (blocked on operator authorization).** No mainnet contract deployment or real-fund execution is authorized. Required before enabling anything: operator-owned mainnet registry/vault/payout accounts, a multisig/timelock vault owner, a fresh mainnet database, a mainnet 1Click recipient/refund account, independent review of the registry fee/bounty path and the 1Click integration, and an explicit production authorization record.

1. Wire wallet `signAndSendTransaction` for `commit_audit` and `fund_audit` in the console; the current API/CLI path is verified.
2. Run a read-only mainnet smoke check against 1Click `/v0/tokens` and a dry wNEAR/USDC quote (already performed; repeat in CI with a monitored endpoint).
3. After authorization, deploy a fresh `#[init]` vault and registry to mainnet, keep `EXECUTION_ENABLED=false`, and validate readiness, caps, allowlists and certificate verification before enabling a capped execution.
4. Regenerate `demo/dissent-demo.mp4` only after operator approval and a decision on the ElevenLabs voice; the current demo uses the documented Piper/LJSpeech fallback.
