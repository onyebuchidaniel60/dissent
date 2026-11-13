# Deployment Guide

## Environments

1. Local: synthetic data, NEAR Sandbox/local contract tests, mocked provider clients by default.
2. Preview/staging: protected URL, separate preview DB, testnet only, synthetic/approved demo data, no production secrets or live financial execution.
3. Production: explicitly out of MVP. Requires separate operator authorization captured in intake, privacy/legal readiness, security pass, secrets and rollback plan.

## Default target
Railway web + worker + PostgreSQL as the initial deployment target. Verify account access, plan, spend controls and deployment region during intake. If inaccessible, do not silently choose another paid provider. Continue local work and document the blocker; only change target with operator instruction.

## Release checklist
- DB migrations and backup/restore plan verified.
- Web and worker health endpoints pass.
- Provider keys stored in secret manager.
- Cost ceilings enforced.
- Preview protected and deployed with safe data.
- NEAR network explicitly equals `testnet`.
- Contract account ID and code hash/commit recorded.
- No mainnet signer or live trading adapter enabled.
- Security test suite passes.
- Rollback procedure tested/documented.
- Operator has authorized exact release target and domain before production deployment.
