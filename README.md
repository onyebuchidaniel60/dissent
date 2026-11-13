# Dissent

**Adversarial audit protocol for AI trading agents.**

Dissent challenges an AI trading agent's thesis before the agent acts. A client commits a thesis and machine-testable failure conditions on NEAR testnet, funds a fixed testnet audit fee, and receives eight isolated adversarial analyses. Evidence is re-fetched, attackers are reviewed for sycophancy, and a deterministic policy issues `TRADE`, `REFUSE` or `ABSTAIN`. The certificate preserves coverage, minority findings and disagreement instead of turning them into a majority vote.

> **Current checkpoint:** Phase 1 — route-complete skeleton and preview deployment. The UI is real and navigable; wallet sessions, live inference, contract verification and certificate anchoring are labelled as later-phase work. Fixture data is marked `DEMO FIXTURE`.

## Product boundaries

Dissent is an audit and verification layer — not an exchange, broker, custodian, wallet, investment adviser or profit guarantee. The hackathon MVP does not execute live trades or move mainnet funds. Failure, missing coverage and unresolved critical evidence produce `ABSTAIN`, not an assumed pass.

## Stack

- **Web/API:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Lucide.
- **Data:** PostgreSQL 16+ (Neon in preview), Drizzle ORM, explicit migrations.
- **Queue:** pg-boss running **in-process** inside the web service. Render free has no separate background worker. Concurrency is capped at one audit and three parallel attackers for the 512 MB instance.
- **Models:** one generic OpenAI-compatible provider adapter.
  - OpenRouter is primary (`OPENROUTER_API_KEY`).
  - Groq is secondary for A02 only (`GROQ_API_KEY`).
  - No OpenAI or Anthropic SDKs are installed.
- **Trusted execution:** the TEE sub-clause is formally **waived** under the zero-new-spend constraint. No TEE badge is displayed and no confidential-inference claim is made. Model-family, vendor and open-weight diversity gates remain enforced.
- **Chain:** Rust + `near-sdk` registry/escrow on **NEAR testnet only**.
- **Tests:** Vitest, Playwright, `near-workspaces`/sandbox for contracts.
- **Deployment:** Render free web service + Neon free PostgreSQL.

## Quickstart

```bash
pnpm install
cp .env.example .env.local     # fill locally; never commit it
pnpm dev                       # http://localhost:3000
pnpm typecheck
pnpm test
pnpm build
pnpm start
```

Health endpoints:

```bash
curl -i http://localhost:3000/healthz   # 200 without touching the database
curl -i http://localhost:3000/readyz    # 200/503 after a database check
```

If port 3000 is already occupied on the host, use `PORT=3100 pnpm start`.

## Environment

See [`docs/CONFIGURATION.md`](docs/CONFIGURATION.md) and [`.env.example`](.env.example). Never commit `.env.local`, provider keys, wallet keys or Railway/Render tokens. The preview uses synthetic data only.

Key variables:

- `DATABASE_URL`, `DATABASE_URL_DIRECT`
- `AUTH_SECRET`, `ADMIN_WALLET_ADDRESSES`
- `NEAR_NETWORK=testnet`, `NEAR_RPC_URL`
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

The pinned roster is recorded in [`config/model_assignments.json`](config/model_assignments.json). All eight attackers use distinct model families across OpenRouter and Groq, with one open-weight model (`openai/gpt-oss-120b` on Groq). The OpenRouter catalogue changes; substitutions are recorded with a reason and may never silently collapse the family/vendor gate.

**Groq free-tier note:** A02's 200K TPD limit is the binding constraint — roughly two audits per day. The adapter uses a per-provider token bucket so one audit cannot exhaust the daily quota.

## Budget

- New spend ceiling: **$0.00**. No card, paid hosting, paid TTS or auto-billing trial.
- Pre-purchased OpenRouter credit is the only inference budget.
- Per-audit inference ceiling: **$0.50**.
- Remaining OpenRouter credit at intake: **$7.747** (recorded; not a promise of future balance).
- No paid fallback may replace a `:free` slug.

## TEE waiver

The frozen decision requires at least one open-weight model in a NEAR AI Cloud TEE with verified attestation and response signatures. The direct NEAR AI API is not authorized under the zero-new-spend constraint. OpenRouter's `near-ai` route is not an attested gateway, so the TEE sub-clause is recorded as `WAIVED_BUDGET_CONSTRAINT`. No TEE badge is rendered. The model-family, vendor and open-weight gates are still enforced. This deviation is recorded in [`ARCHITECTURE.md`](ARCHITECTURE.md), [`AI_HANDOFF.md`](AI_HANDOFF.md) and [`docs/BUILD_LOG.md`](docs/BUILD_LOG.md).

## Deployment

Render free web service + Neon free PostgreSQL. The service URL and deployed commit are recorded in [`AI_HANDOFF.md`](AI_HANDOFF.md). See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

Render free services spin down after idle. The first request can take ~50 seconds. `/healthz` is kept warm by an external cron ping. Do not record the demo before the service is warm.

## Demo

Output directory: [`demo/`](demo/).

Expected outputs:

- `demo/dissent-demo.mp4` — H.264 + AAC, 1280×720, ≤180 seconds.
- `demo/NARRATION.md` — final script with per-segment timing.
- `demo/PRODUCTION_NOTES.md` — voice ID, music source/license, ffmpeg commands, sync and review results.

Voiceover uses the operator-supplied ElevenLabs voice ID. Background music is royalty-free (CC0 or CC BY), mixed approximately −20 dB under the voice, with a 1.5s fade-in and 2s fade-out.

### Music attribution

No track has been selected yet. The final track title, artist, source URL and license will be recorded here and in `demo/PRODUCTION_NOTES.md` before release.

## Security

- Wallet connect is the only human authentication path. No email/password, magic links or public signup.
- Sessions use a single-use signed nonce and an HttpOnly, SameSite=Lax, Secure cookie.
- Admin/operator access is a server-side wallet allowlist (`ADMIN_WALLET_ADDRESSES`).
- Client agents use scoped API keys stored only as hashes.
- Attackers receive no wallet, shell, arbitrary HTTP, SQL, filesystem or sibling output.
- Evidence retrieval is limited to typed adapters and fixed hosts.
- No mainnet transaction is authorized.

See [`docs/SECURITY_SPEC.md`](docs/SECURITY_SPEC.md) and the in-app [`/docs`](https://dissent-web.onrender.com/docs) page.

## Documentation

- [`PROJECT_SPEC.md`](PROJECT_SPEC.md) — canonical product definition.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — fixed stack and boundaries.
- [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) — Phase 0–9 sequence.
- [`DISSENT_ATTACKER_OUTPUT_SCHEMA.md`](DISSENT_ATTACKER_OUTPUT_SCHEMA.md) — attacker contract.
- [`docs/ADJUDICATION_SPEC.md`](docs/ADJUDICATION_SPEC.md) — verdict and bounty policy.
- [`docs/SECURITY_SPEC.md`](docs/SECURITY_SPEC.md) — threat model.
- [`docs/SMART_CONTRACT_SPEC.md`](docs/SMART_CONTRACT_SPEC.md) — contract interfaces.
- [`docs/API_SPEC.md`](docs/API_SPEC.md) — REST API.
- [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) — schema and classifications.
- [`OPERATOR_INTAKE.md`](OPERATOR_INTAKE.md) — completed intake and authorization boundary.

## License

MIT. See [`LICENSE`](LICENSE).
