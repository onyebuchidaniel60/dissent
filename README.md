# Dissent

**Adversarial audit protocol for AI trading agents.**

Dissent challenges an AI trading agent's thesis before the agent acts. A client commits a thesis and machine-testable failure conditions on NEAR, funds a fixed audit quote, and receives eight isolated adversarial analyses. Evidence is re-fetched, attackers are reviewed for sycophancy, and a deterministic policy issues `TRADE`, `REFUSE` or `ABSTAIN`. The certificate preserves coverage, minority findings and disagreement instead of turning them into a majority vote.

## Live Demo & Verification

- **Live application:** <https://dissent-web.onrender.com>
- **Final demo video:** [`demo/dissent-demo.mp4`](demo/dissent-demo.mp4) — 1440×900, 144.2 seconds, H.264/AAC, burned-in captions.
- **Client audit certificate — `VERIFIED`, `ABSTAIN`:** <https://dissent-web.onrender.com/verify/a8df6a5a-8b3c-4f33-9953-4b64593256bf>
- **Proprietary execution certificate — `VERIFIED`, `EXECUTED`:** <https://dissent-web.onrender.com/verify/0bf3728d-e457-4b2f-8fad-b53be9565498>
- **Verification API:** `GET /api/v1/certificates/{certificateId}/verify` recomputes the certificate hash and compares it with the NEAR registry.
- **Source:** <https://github.com/onyebuchidaniel60/dissent>

The verifier never exposes the thesis preimage, positions, evidence payloads, attacker prompts or private keys. Only the certificate hash, verdict, policy version, registry account and transaction reference are public.

## Product boundaries

Dissent is an audit and verification layer — not an exchange, broker, custodian, wallet, investment adviser or profit guarantee. The production build does not execute mainnet trades or move mainnet funds unless execution is explicitly enabled, the audit matches the operator gate, and the vault, certificate and venue quote address are approved. The historical staging run used testnet only. Failure, missing coverage and unresolved critical evidence produce `ABSTAIN`, not an assumed pass.

## Hackathon Tracks

### Agent Economy — primary track

Dissent is an autonomous economic actor, not only an audit API:

- It holds test USDC in a dedicated agent wallet and **pays for its own inference** through x402.
- It originates its own thesis, runs the same eight-attacker audit, and can execute a `TRADE` certificate through a capped NEP-141 vault.
- Client fees, bounty allocations and the proprietary execution path are recorded on the NEAR testnet registry.
- The final demo shows both sides: a client audit and the proprietary, self-paying agent.

**Evidence:** `AUD-2039-DDF2` paid A01/A02 through x402 and produced a `VERIFIED` certificate; the historical proprietary certificate `0bf3728d-e457-4b2f-8fad-b53be9565498` verifies `VERIFIED / EXECUTED` with a real vault transaction and Tidepool settlement.

### Autonomous Agents / AI × Crypto

Eight specialist attackers, committed failure conditions, evidence re-fetch, sycophancy review and a deterministic policy. The attackers are isolated from each other and from the verdict; disagreement is preserved instead of averaged away.

### Verifiable AI / Infrastructure

The public verifier recomputes the certificate hash from canonical bytes and checks the NEAR registry. The x402 shim settles real test-USDC transfers through a NEP-366 signed delegate; no provider key is exposed to the model.

## Stack

- **Web/API:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Lucide.
- **Data:** PostgreSQL 16+ (Neon in preview), Drizzle ORM, explicit migrations.
- **Queue:** pg-boss running **in-process** inside the web service. Render free has no separate background worker. Concurrency is capped at one audit and three parallel attackers for the 512 MB instance.
- **Models:** one generic OpenAI-compatible provider adapter.
  - OpenRouter is primary (`OPENROUTER_API_KEY`).
  - Groq is secondary for A02 only (`GROQ_API_KEY`).
  - No OpenAI or Anthropic SDKs are installed.
- **Compute procurement:** x402 v2 `exact` payments on NEAR testnet through `@fastnear/x402`. A self-hosted shim settles test USDC for A01/A02 inference; it is disabled by default and has no mainnet path.
- **Trusted execution:** the TEE sub-clause is formally **waived** under the zero-new-spend constraint. No TEE badge is displayed and no confidential-inference claim is made. Model-family, vendor and open-weight diversity gates remain enforced.
- **Chain:** Rust + `near-sdk` registry/escrow on **NEAR**; mainnet deployment requires operator-owned accounts and explicit authorization.
- **Tests:** Vitest, Playwright, `near-workspaces`/sandbox for contracts.
- **Deployment:** Render free web service + Neon free PostgreSQL.

## Quickstart

### Try the hosted app

Open <https://dissent-web.onrender.com>, connect a NEAR **Testnet** wallet (Nightly is the tested path), and follow [How to use Dissent](#how-to-use-dissent). The preview is testnet staging: no real funds are moved.

### Run locally

Prerequisites:

- Node.js 22+ and pnpm 10+
- PostgreSQL 16+ (Neon or local)
- A NEAR testnet registry/deployer account and a testnet wallet for signing
- OpenRouter and Groq API keys; see [`docs/CONFIGURATION.md`](docs/CONFIGURATION.md) for the full list

```bash
git clone https://github.com/onyebuchidaniel60/dissent.git
cd dissent
pnpm install
cp .env.example .env.local     # fill locally; never commit it
pnpm db:migrate                # apply Drizzle migrations
pnpm dev                       # http://localhost:3000
```

Useful checks:

```bash
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm start
```

Health endpoints:

```bash
curl -i http://localhost:3000/healthz   # 200 without touching the database
curl -i http://localhost:3000/readyz    # 200/503 after a database check
```

If port 3000 is occupied, use `PORT=3100 pnpm start`.

## How to use Dissent

1. **Connect Wallet:** open <https://dissent-web.onrender.com>, click **Connect Wallet**, and select **Nightly**. Make sure Nightly is set to **Testnet**.
2. **Submit a Thesis:** go to `/app/audits/new` and fill out the form. Define the asset, action, rationale, position, time horizon and at least one measurable failure condition.
3. **Commit & Fund:** click **Create Draft in Console**, then sign the two wallet popups — one commits the thesis and failure conditions to NEAR, and the second funds the **0.1 NEAR** testnet audit fee.
4. **Watch the Attackers:** the audit is queued and the eight AI agents run asynchronously. The dashboard updates as each attacker completes; no need to keep the form open.
5. **Review the Verdict:** when the audit completes, open the certificate. The deterministic verdict is **TRADE**, **REFUSE** or **ABSTAIN**. Coverage, minority findings and the gate trace are preserved.
6. **Execute (Optional):** if the verdict is **TRADE**, the client execution panel lets you sign your own swap via 1Click on mainnet or Tidepool on testnet. The preview uses Tidepool; mainnet execution is disabled by default.

The preview is a testnet staging environment. The audit fee, x402 compute payments and any execution are testnet-only and have no monetary value.

## How to verify a certificate

Every completed audit produces a certificate ID. To verify one:

1. Copy the certificate ID from the results page or the certificate URL.
2. Open `https://dissent-web.onrender.com/verify/<certificate-id>`.
3. The verifier recomputes the SHA-256 hash from the canonical certificate bytes, compares it with the stored certificate and the NEAR registry record, and shows **VERIFIED** or **MISMATCH**.
4. The same result is available from `GET /api/v1/certificates/<certificate-id>/verify`.

The public verifier exposes only the certificate hash, verdict, policy version, registry account and transaction reference. It never reveals the thesis preimage, positions, evidence payloads or attacker prompts.

Examples:

- Client audit: <https://dissent-web.onrender.com/verify/a8df6a5a-8b3c-4f33-9953-4b64593256bf>
- Proprietary execution: <https://dissent-web.onrender.com/verify/0bf3728d-e457-4b2f-8fad-b53be9565498>

## Environment

See [`docs/CONFIGURATION.md`](docs/CONFIGURATION.md) and [`.env.example`](.env.example). Never commit `.env.local`, provider keys, wallet keys or deployment tokens. The preview is testnet staging with testnet data.

Key variables:

- `DATABASE_URL`, `DATABASE_URL_DIRECT`
- `AUTH_SECRET`, `ADMIN_WALLET_ADDRESSES`
- `NEAR_NETWORK=mainnet`, `NEAR_RPC_URL`
- `NEAR_DEPLOYER_ACCOUNT_ID`, `NEAR_DEPLOYER_KEY`
- `NEAR_REGISTRY_ACCOUNT_ID`, `NEAR_ESCROW_ACCOUNT_ID`
- `OPENROUTER_API_KEY`, `GROQ_API_KEY`
- `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`
- `MAX_COST_PER_AUDIT_USD=0.5`

## Routes

| Route | Purpose |
|---|---|
| `/` | Product landing and demo entry |
| `/app` | Audit-desk overview |
| `/app/audits` | Filterable audit ledger |
| `/app/audits/new` | Thesis and condition draft form |
| `/app/audits/[auditId]` | Lifecycle and eight attacker runs |
| `/app/audits/[auditId]/results` | Coverage matrix, findings, dissent and gate trace |
| `/app/certificates/[certificateId]` | Certificate detail |
| `/verify/[certificateId]` | Public redacted verification |
| `/app/attackers` | Eight-method roster and pinned assignments |
| `/app/reputation` | Attacker quality ledger |
| `/app/settings/api-keys` | Scoped API-key and wallet-session boundary |
| `/operator`, `/operator/providers`, `/operator/audits/[auditId]` | Operator control plane |
| `/docs` | Implementation and trust-boundary documentation |
| `/healthz`, `/readyz` | Liveness and readiness |

## Model diversity

The pinned roster is recorded in [`config/model_assignments.json`](config/model_assignments.json). The roster currently spans seven distinct model families across OpenRouter and Groq, with one open-weight model (`openai/gpt-oss-120b` on Groq). A06 and A07 share the Flint family as a documented free-model availability substitution; the family/vendor gate still passes. The OpenRouter catalogue changes; substitutions are recorded with a reason and may never silently collapse the family/vendor gate.

**Groq free-tier note:** A02's 200K TPD limit is the binding constraint — roughly two audits per day. The adapter uses a per-provider token bucket so one audit cannot exhaust the daily quota.

## Economic Model

Dissent autonomously pays for its own inference compute using the x402 protocol. It holds USDC in a dedicated agent wallet and settles payments on-chain via a self-hosted facilitator shim.

- **Client audits:** the client commits a thesis and failure conditions, then funds a fixed on-chain audit quote. Accepted findings are allocated on the registry; no token is issued and no payout is automatic.
- **Compute procurement:** A01 (OpenRouter) and A02 (Groq) pay `0.002` test USDC per inference through the x402 shim. The agent wallet is `x402-agent.testnet`; the settlement asset is Tidepool test USDC, which has no value.
- **Proprietary arm:** Dissent can originate its own thesis and, only on a `TRADE` certificate, execute through a capped vault. The historical staging run is preserved as `VERIFIED / EXECUTED`; production mainnet execution remains disabled by default.
- **Boundaries:** no mainnet deployment, no real-fund transfer, no profit guarantee, and no token sale. The preview is a testnet staging environment.

## Compute Procurement (x402)

Dissent's audit workers can pay for their own inference. The procurement agent is a dedicated testnet account, `x402-agent.testnet`; A01 (OpenRouter) and A02 (Groq) call the self-hosted x402 shim instead of using provider keys directly. Each paid request follows the x402 v2 `exact` scheme on NEAR:

1. The model adapter sends the chat-completion request without credentials. The shim answers `402 Payment Required` with a base64 `PAYMENT-REQUIRED` challenge naming the asset, amount, payee and `near:testnet`.
2. The agent signs exactly one NEP-141 `ft_transfer` in a NEP-366 `SignedDelegateAction` using its full-access key. The delegate is attached as `PAYMENT-SIGNATURE`; no provider key or wallet key reaches the model.
3. The shim verifies the delegate against on-chain state, sponsors gas through the relayer, settles the transfer, forwards the request to OpenRouter/Groq with the existing provider credential, and returns the inference with a `PAYMENT-RESPONSE` header.
4. The adapter logs the settled payment exactly as `[x402] Paid <amount> USDC to <payee> for <provider> inference.`

Routes: `POST /api/x402/openrouter/chat/completions`, `POST /api/x402/groq/chat/completions`; capabilities are published at `GET /api/x402/supported`. The shim accepts only known model slugs, caps output tokens, limits body size and has no arbitrary URL fetch. Settlement is serialised so concurrent paid calls cannot race the relayer or payer nonces.

```text
A01/A02 audit worker
  └─ model adapter
      └─ POST /api/x402/{provider}/chat/completions   (no provider key)
          ├─ 402 challenge: asset, amount, payee, near:testnet
          ├─ agent signs one NEP-366 ft_transfer delegate
          ├─ shim verifies + settles through the in-process facilitator
          ├─ shim forwards to OpenRouter/Groq with the server-side key
          └─ inference + PAYMENT-RESPONSE
      └─ on x402/proxy failure: warn and fall back to the direct provider key
```

The facilitator and resource server run in the same trusted process as the web app for the preview. The relayer is isolated from the deployer account, and the x402 RPC is isolated from the app's FastNear authentication path.

**Deployments and deviations.** The public reference facilitator (`https://test.x402.mikedotexe.com`) is live for `near:testnet` but its `/verify` and `/settle` routes require an allowlisted resource-server key. `httpay.xyz` currently returns `DEPLOYMENT_DISABLED`, and `@waterfall-finance/sdk`/`@ai42/sdk` are not NEAR adapters. The implementation therefore self-hosts the facilitator and resource server with `@fastnear/x402` and uses the Tidepool test USDC token (`usdc.tidepool-sandbox.testnet`, six decimals, no value) as the settlement asset. `@neargate/cli` was rejected for this flow because it settles in native NEAR, not USDC. The agent was funded by an on-chain transfer from `demo-client.testnet`; the Circle faucet was not used.

**Configuration:** `X402_SHIM_ENABLED`, `X402_AGENT_ACCOUNT_ID`, `X402_AGENT_KEY`, `X402_PAY_TO_ACCOUNT_ID`, `X402_USDC_TOKEN_ID`, `X402_PRICE_ATOMIC` (default `2000` = 0.002 USDC), `X402_ATTACKERS` (default `A01,A02`), `X402_RELAYER_ACCOUNT_ID`, `X402_RELAYER_KEY`, `X402_RPC_URL`, `OPENROUTER_X402_PROXY_URL`, `GROQ_X402_PROXY_URL`. The shim is disabled by default and uses a testnet full-access key only; it is not a mainnet payment path.

**Operator checks:**

```bash
pnpm exec tsx scripts/fund-x402-agent.ts   # register storage and top up the agent
pnpm exec tsx scripts/x402-live-check.ts   # one paid call per provider + balance delta
```

The first local live check settled OpenRouter tx `9cGnGNvFVXfpcFr8SmQbxa8Jb1W4GjqLsTkdSDBhuZtu` and Groq tx `3ytvSNjh5rxbzHSM7C44pfsaGtkeiLJnADDqLtjMMkJq`; `x402-agent.testnet` spent exactly `0.004` test USDC and both inference responses were returned. The deployed preview has since settled additional paid calls, including OpenRouter tx `Hx9UmqqCWNLjQyt8pTVx7BJ37AzQyuL3MkA5LnXa3cfZ` and Groq tx `8NEkPnFnjoPz2pdHMt543WT7ThVeE52ihU7bhF8Hwd2H`.

**Full-audit evidence:** `AUD-2039-DDF2` (`88114e6f-0cc7-479d-af0a-49425b9f3ea5`) ran all eight attackers on the deployed preview. A01 and A02 paid through the deployed shim; Render logged `[x402] Paid 0.002 USDC to dissent-demo.testnet for openrouter inference.` and `[x402] Paid 0.002 USDC to dissent-demo.testnet for groq inference.` The agent moved from `9.988` to `9.984` test USDC. The audit completed `ABSTAIN`; certificate `a8df6a5a-8b3c-4f33-9953-4b64593256bf` has hash `504a9c30163dae2a3f28833c80372d0031fdb14ad1812f1123494a58f29bb3cb`, is anchored at `Dz8wm14QrcKhkdzQpVMSZ5RCbFgRDc8cSg62rPqpfhJK`, and verifies at [`/verify/a8df6a5a-8b3c-4f33-9953-4b64593256bf`](https://dissent-web.onrender.com/verify/a8df6a5a-8b3c-4f33-9953-4b64593256bf).

Render's shared egress IP is rate-limited on the public FastNear and `rpc.testnet.near.org` endpoints, so the x402 relayer uses `X402_RPC_URL=https://near-testnet.drpc.org`. This isolates facilitator reads/settlement from the app's cached FastNear authentication path.

## TEE waiver

The frozen decision requires at least one open-weight model in a NEAR AI Cloud TEE with verified attestation and response signatures. The direct NEAR AI API is not authorized under the zero-new-spend constraint. OpenRouter's `near-ai` route is not an attested gateway, so the TEE sub-clause is recorded as `WAIVED_BUDGET_CONSTRAINT`. No TEE badge is rendered. The model-family, vendor and open-weight gates are still enforced. This deviation is documented in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and the certificate policy.

## Verified testnet record

A real testnet audit has been committed, funded, attacked by all eight specialists, reviewed and anchored:

- Public verifier: `https://dissent-web.onrender.com/verify/96426c09-87ec-4641-94ed-4edf0b7b34f1`
- Audit: `AUD-C963-E660` (`394c2192-8d9f-4463-99f2-a15d45dc54a2`)
- Verdict: `TRADE` — all eight runs completed, material conditions were evaluable, evidence re-fetch passed, divergence was `0`, and all reviews closed.
- Certificate hash: `149c529602c40894643444ee69c9af4e2984774ed77a08e7fc56237345538139`
- Registry transaction: `6G7Yd3uvZozLC9SbXtNW5jxFetV4TLqgTMFxN76MmYJF`
- Bounty accounting: 7 accepted-finding allocations totaling `0.025 NEAR` on testnet; no payout claim executed.

An earlier testnet audit ended `ABSTAIN` when execution-depth evidence was unavailable. It remains anchored as an immutable test artifact.

These records are testnet-only and have no monetary value.

## Deployment

Render free web service + Neon free PostgreSQL. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for environment setup, migrations, health checks and rollback guidance.

Render free services spin down after idle. The first request can take ~50 seconds; `/healthz` is kept warm by an external cron ping.

## Demo

Output directory: [`demo/`](demo/).

Final output:

- `demo/dissent-demo.mp4` — H.264 + AAC, **1440×900**, **144.2 seconds**, 8.6 MB, SHA-256 `25066d678beef048ae10f69267d38b04cd220fdce4104270cc2757ea8f5bd75e`.
- `demo/NARRATION.md` — final script with per-segment timing.
- `demo/PRODUCTION_NOTES.md` — voice, music source/license, ffmpeg commands, sync and review results.
- `demo/timings.json` — measured narration timings used by the capture script.

The delivered demo uses a public-domain local Piper/LJSpeech fallback because the operator-supplied ElevenLabs library voice returned `paid_plan_required` on the free tier (no charge was made). Background music is Kevin MacLeod's “Floating Cities” (CC BY 4.0), mixed approximately −20 dB under the voice, with a 1.5s fade-in and 2s fade-out. See `demo/PRODUCTION_NOTES.md`.

### Music attribution

- **Track:** Floating Cities
- **Artist:** Kevin MacLeod
- **Source:** https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1600018
- **License:** Creative Commons Attribution 4.0 (CC BY 4.0)

The track is used as an ambient bed at approximately −20 dB under the narration, with a 1.5s fade-in and 2s fade-out. Full production details, including the ElevenLabs free-tier blocker and the public-domain Piper fallback voice, are in `demo/PRODUCTION_NOTES.md`.

## Security

- Wallet connect is the only human authentication path. No email/password, magic links or public signup.
- Sessions use a single-use signed nonce and an HttpOnly, SameSite=Lax, Secure cookie.
- Admin/operator access is a server-side wallet allowlist (`ADMIN_WALLET_ADDRESSES`).
- Client agents use scoped API keys stored only as hashes.
- Attackers receive no wallet, shell, arbitrary HTTP, SQL, filesystem or sibling output.
- Evidence retrieval is limited to typed adapters and fixed hosts.
- No mainnet deployment or real-fund transaction is authorized without a separate operator record.

See [`docs/SECURITY_SPEC.md`](docs/SECURITY_SPEC.md) and the in-app [`/docs`](https://dissent-web.onrender.com/docs) page.

## Documentation

- [`docs/PROJECT_SPEC.md`](docs/PROJECT_SPEC.md) — product definition and boundaries.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — stack, modules and trust boundaries.
- [`docs/DISSENT_ATTACKER_OUTPUT_SCHEMA.md`](docs/DISSENT_ATTACKER_OUTPUT_SCHEMA.md) — attacker contract.
- [`docs/ADJUDICATION_SPEC.md`](docs/ADJUDICATION_SPEC.md) — verdict and bounty policy.
- [`docs/SECURITY_SPEC.md`](docs/SECURITY_SPEC.md) — threat model.
- [`docs/SMART_CONTRACT_SPEC.md`](docs/SMART_CONTRACT_SPEC.md) — contract interfaces.
- [`docs/MAINNET_READINESS.md`](docs/MAINNET_READINESS.md) — mainnet audit and deployment gates.
- [`docs/API_SPEC.md`](docs/API_SPEC.md) — REST API.
- [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) — schema and classifications.
- [`docs/CONFIGURATION.md`](docs/CONFIGURATION.md) — environment reference.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — deployment and operations.
- [`docs/OPERATOR_GUIDE.md`](docs/OPERATOR_GUIDE.md) — operator runbook.

## Future Roadmap

- **Mainnet readiness:** fresh `#[init]` registry and vault on operator-owned mainnet accounts, a multisig/timelock owner, 1Click as the primary execution venue, and a separate operator authorization record before any real-fund execution.
- **x402 expansion:** extend paid inference beyond A01/A02, add independent facilitator/relayer operators, and add cost-aware provider routing while preserving the model-family, vendor and open-weight gates.
- **Evidence and models:** more typed adapters, broader model-family coverage, and a TEE re-evaluation if an attested provider becomes available. The current TEE waiver remains explicit.
- **Developer surface:** a client SDK, webhook/event delivery, and verifier integrations for third-party audit consumers.
- **Operations:** stronger queue observability, automated certificate monitoring, and a public status page.

Roadmap items are planned work, not claims about the current deployment.

## License

MIT. See [`LICENSE`](LICENSE).

## Proprietary execution arm (mainnet-ready)

The proprietary arm originates Dissent-owned theses, runs them through the same eight-attacker audit, and can execute a **capped NEP-141 transfer** through a vault after a `TRADE` certificate. The primary venue is 1Click on mainnet; the staging preview uses Tidepool. Execution is disabled by default.

- Vault: operator-owned mainnet account for production; the historical staging vault is `vault.dissent-demo.testnet` (0.5 NEAR per transaction / 1 NEAR daily).
- Execution agent: a dedicated account with a Function Call Key scoped to `vault.spend_as` and `vault.spend_ft_as`; the owner key is a multisig/timelock.
- Adapter: `packages/execution` — 1Click mainnet primary, Tidepool staging fallback; refuses non-TRADE, returns `REVERTED` with the vault reason, gated by `EXECUTION_ENABLED` (default `false`).
- Loop: pg-boss scheduled task, gated by `PROPRIETARY_LOOP_ENABLED` (default `false`).
- Operator view: `/operator/proprietary`.
- **Live evidence:** a proprietary `0.01 wNEAR → USDC` quote was audited, returned `TRADE`, and executed through `vault.spend_ft_as` at tx `DxvoRKhCnyYyKrmAopnVYPKZJB7g8ev5Er1wtW5JbSp`. Certificate `0bf3728d-e457-4b2f-8fad-b53be9565498` records `execution_readiness=EXECUTED`, hash `d5f1b00d3702d9e5fcee194f601f9537f64c237ac176150a398a6a7d75b6584d`, anchored at `3WQ6aQnJzsQRcRVTHsVGKUbrx2k1ueMFUwvWDY85XS9o`. Tidepool settled `0.035245 USDC` with swap txs `AYoAmq…`, `67jpWF…`, `7XAHSg…`. Public verifier: [`/verify/0bf3728d-e457-4b2f-8fad-b53be9565498`](https://dissent-web.onrender.com/verify/0bf3728d-e457-4b2f-8fad-b53be9565498).
- No mainnet execution is claimed. The historical run was testnet-only and is preserved as a verified certificate. Mainnet execution remains disabled by default.

### Mainnet deployment checklist

1. Deploy a fresh `#[init]` registry and vault to operator-owned mainnet accounts. Use a multisig/timelock as the vault owner; never a single hot key.
2. Register wNEAR storage on `wrap.near`, fund the vault, and set conservative per-transaction/day caps.
3. Add a Function Call Key for the execution agent scoped only to `spend_as` and `spend_ft_as`.
4. Configure `NEAR_NETWORK=mainnet`, `EXECUTION_VENUE=ONECLICK`, `ONECLICK_BASE_URL=https://1click.chaindefuser.com`, `ONECLICK_ORIGIN_ASSET=nep141:wrap.near` and the live USDC asset ID from `/v0/tokens`.
5. Use `set_recipient_until` for each quote deposit address and approve the audit UUID as a certificate. The vault rejects expired recipients and reused certificates.
6. Keep `EXECUTION_ENABLED=false` until an independent review and a fresh operator authorization record exist. Use a fresh mainnet database; do not carry staging/testnet records into production.
