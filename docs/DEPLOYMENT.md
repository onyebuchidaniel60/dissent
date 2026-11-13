# Deployment Guide

## Environments

1. **Local:** synthetic data, local PostgreSQL or a dedicated Neon branch, NEAR Sandbox/local contract tests, provider calls only when a budget is recorded.
2. **Preview/staging:** Render free Web Service + Neon free PostgreSQL. Publicly reachable for judges, synthetic data only, testnet only, no production secrets or live financial execution. No preview password.
3. **Production:** explicitly out of MVP. Requires separate operator authorization captured in intake, privacy/legal readiness, security pass, secrets and rollback plan.

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
| `NEAR_NETWORK` | Yes | Must be `testnet` |
| `NEAR_RPC_URL` | Yes | `https://rpc.testnet.near.org` |
| `NEAR_DEPLOYER_ACCOUNT_ID` | Yes | `dissent-demo.testnet` |
| `NEAR_REGISTRY_ACCOUNT_ID` | Phase 3 | `registry.dissent-demo.testnet` |
| `NEAR_ESCROW_ACCOUNT_ID` | Phase 3 | `registry.dissent-demo.testnet`; escrow logic is a module in the registry contract. `escrow.dissent-demo.testnet` is reserved but unused. |
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
- [ ] Preview uses synthetic/testnet data only.
- [ ] `NEAR_NETWORK=testnet`; no mainnet signer is present.
- [ ] Contract account ID and code hash/commit recorded (Phase 3).
- [ ] Security tests pass; no unresolved critical/high issue.
- [ ] Rollback instructions tested/documented.
- [ ] Production deployment is not performed without a new explicit authorization.

## Current preview record

- URL: `https://dissent-web.onrender.com`
- Render service: `srv-dbrgdr3bc2fs73d0oi5g`
- Registry contract: `registry.dissent-demo.testnet`
- Clean live audit certificate: `https://dissent-web.onrender.com/verify/96426c09-87ec-4641-94ed-4edf0b7b34f1`
- Keep-alive: `.github/workflows/keepalive.yml` (10-minute `/healthz` ping). `cron-job.org` remains an optional external fallback because no account credential was supplied.
