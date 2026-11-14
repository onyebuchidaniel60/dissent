# Deployment Guide

## Environments

1. **Local:** synthetic data, local PostgreSQL or a dedicated Neon branch, NEAR Sandbox/local contract tests, provider calls only when a budget is recorded.
2. **Preview/staging:** Render free Web Service + Neon free PostgreSQL. Publicly reachable for judges, testnet staging only, no production secrets or live financial execution. The UI is network-neutral and does not display a testnet label.
3. **Production:** mainnet-ready code, not deployed by this repository. Requires separate operator authorization captured in intake, operator-owned mainnet accounts, a fresh database, privacy/legal readiness, security pass, secrets and rollback plan.

## Default target

**Render free Web Service + Neon free PostgreSQL.** Railway is not authorized. Do not create Render Postgres: its free database expires after 30 days. Do not create a separate Render worker service: the free plan does not provide one, and pg-boss runs in-process.

### Service configuration

- Type: Web Service, Free plan.
- Runtime: Node.
- Build command: `pnpm install && pnpm build`.
- Start command: `pnpm start`.
- Health check path: `/healthz`.
- Region: default (`oregon` at intake).
- Auto-deploy on push to `main`: enabled.
- Instance count: 1.

### Environment variables

Set these on the Render service. Values come from the shell/secret store and must never be committed or printed:

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | Neon pooled connection string |
| `DATABASE_URL_DIRECT` | Yes | Neon direct connection; used by pg-boss |
| `AUTH_SECRET` | Yes | Session signing secret |
| `ADMIN_WALLET_ADDRESSES` | Yes | Comma-separated operator allowlist |
| `NEAR_NETWORK` | Yes | `mainnet` in production; explicit `testnet` only for the staging preview |
| `NEXT_PUBLIC_NEAR_NETWORK` | Yes | Must match `NEAR_NETWORK` for the wallet selector |
| `NEAR_RPC_URL` | Yes | `https://rpc.mainnet.fastnear.com` in production |
| `NEAR_EXPLORER_URL` | Optional | `https://explorer.near.org` in production |
| `AUTH_RECIPIENT` | Optional | NEP-413 session recipient; defaults to the deployer account |
| `NEAR_DEPLOYER_ACCOUNT_ID` | Yes | Operator-owned mainnet identity |
| `NEAR_REGISTRY_ACCOUNT_ID` | Yes | Operator-owned mainnet registry; no testnet fallback |
| `NEAR_ESCROW_ACCOUNT_ID` | Optional | Registry account; escrow logic is a module in the registry contract |
| `NEAR_VAULT_ACCOUNT_ID` | For execution | Capped mainnet vault |
| `NEAR_VAULT_AGENT_ACCOUNT_ID` | For execution | Execution agent identity |
| `NEAR_VAULT_AGENT_KEY` | For execution | Function Call Key scoped to `spend_as` and `spend_ft_as` |
| `EXECUTION_VENUE` | Yes | `ONECLICK` in production; `TIDEPOOL` only for staging |
| `EXECUTION_ENABLED` | Yes | `false` by default; explicit operator action required |
| `PROPRIETARY_LOOP_ENABLED` | Yes | `false` by default |
| `PROPRIETARY_CLIENT_ACCOUNT_ID` | For loop | Workspace client that signs `commit_audit`/`fund_audit`; falls back to `DEMO_CLIENT_ACCOUNT_ID` |
| `PROPRIETARY_CLIENT_KEY` | For loop | Testnet-only full-access key for the client account; falls back to `DEMO_CLIENT_KEY` |
| `OPENROUTER_API_KEY` | Yes | Primary inference provider |
| `GROQ_API_KEY` | Yes | A02 only |
| `ELEVENLABS_API_KEY` | Demo | Voiceover only; not used by the app runtime |
| `ELEVENLABS_VOICE_ID` | Demo | Operator-supplied voice ID |
| `APP_BASE_URL` | After first deploy | Set to the assigned `https://<service>.onrender.com` URL, then redeploy |
| `TEE_VERIFICATION_ENABLED` | Yes | `false` |
| `TEE_STATUS` | Yes | `WAIVED_BUDGET_CONSTRAINT` |
| `MAX_COST_PER_AUDIT_USD` | Yes | `0.50` |
| `MAX_DAILY_INFERENCE_USD` | Yes | `0.50` |
| `MAX_CONCURRENT_AUDITS` | Yes | `1` |
| `MAX_PARALLEL_ATTACKERS` | Yes | `3` |

`RENDER_API_KEY` is a deploy-time shell credential only. Never set it as a runtime application variable, log it or write it to a repository file.

### In-process queue

`src/instrumentation.ts` starts pg-boss when the Node server boots and a database URL is present. The queue uses `DATABASE_URL_DIRECT` by default so it can acquire advisory locks through Neon's pooler. If direct access is unavailable, append `uselibpqcompat=true&sslmode=require` to the pooled URL and record the change here. Queue startup failure is logged by name only and does not crash `/healthz`; `/readyz` remains the database readiness check.

Concurrency is capped at one audit and three parallel attackers for the 512 MB free instance. Do not increase these without measuring memory and provider rate limits.

### Health and keep-alive

- `GET /healthz` — always 200, no database call. This is the Render health check and keep-alive target.
- `GET /readyz` — database connectivity, 200 or 503.

Render free spins down after ~15 minutes idle. Create a cron-job.org job pinging `https://<service>.onrender.com/healthz` every 10 minutes. Record the cron URL and service URL in `AI_HANDOFF.md`. Warm the service for ~2 minutes before recording the demo; the first request after idle can take ~50 seconds.

## Release checklist

- [ ] Migrations run on an empty database.
- [ ] `/healthz` and `/readyz` pass on the deployed preview.
- [ ] Provider keys are Render secret env vars, never in the repo.
- [ ] Cost ceilings are enforced and visible in operator health.
- [ ] Preview uses testnet staging data only and displays no testnet label.
- [ ] Preview sets `NEAR_NETWORK=testnet`, `NEXT_PUBLIC_NEAR_NETWORK=testnet`, `EXECUTION_VENUE=TIDEPOOL`; no mainnet signer is present.
- [ ] Production uses `NEAR_NETWORK=mainnet`, a fresh database, operator-owned registry/vault accounts and a multisig/timelock vault owner.
- [ ] Mainnet vault is a fresh `#[init]` deployment with replay protection and quote-window recipient expiry.
- [ ] Contract account ID and code hash/commit recorded; source wasm hash matches the release.
- [ ] Security tests pass; no unresolved critical/high issue.
- [ ] Rollback instructions tested/documented.
- [ ] Production deployment and real-fund execution are not performed without a new explicit authorization.

## Current preview record

- URL: `https://dissent-web.onrender.com`
- Render service: `srv-dbrgdr3bc2fs73d0oi5g`
- Network: testnet staging (`NEAR_NETWORK=testnet`), with a network-neutral UI.
- Registry contract: `registry.dissent-demo.testnet` (staging only).
- Historical live audit certificate: `https://dissent-web.onrender.com/verify/96426c09-87ec-4641-94ed-4edf0b7b34f1`
- Historical proprietary certificate: `https://dissent-web.onrender.com/verify/0bf3728d-e457-4b2f-8fad-b53be9565498`
- Production mainnet accounts are not deployed by this repository.
- Keep-alive: `.github/workflows/keepalive.yml` (10-minute `/healthz` ping). `cron-job.org` remains an optional external fallback because no account credential was supplied.
