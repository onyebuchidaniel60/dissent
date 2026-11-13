# Setup Guide

This repository is in Phase 1: route-complete skeleton and preview deployment. Application services beyond the shell are labelled and will be wired in later phases. Do not treat fixture data as live output.

## Prerequisites

- Node.js 22 LTS, pinned in `.nvmrc`.
- pnpm `10.34.5`, pinned in `packageManager`.
- PostgreSQL 16+ locally, or a dedicated Neon branch.
- Docker for local services and contract sandbox tests.
- Playwright browser dependencies.
- Rust toolchain and `near-cli-rs` for Phase 3 contract work.
- Provider credentials only after the intake budget and scopes are recorded.

## First setup

```bash
pnpm install
cp .env.example .env.local
# fill DATABASE_URL, DATABASE_URL_DIRECT, AUTH_SECRET, provider keys locally
pnpm dev
```

Never commit `.env.local`. The repository `.gitignore` excludes it. Verify:

```bash
git status --short | grep env.local   # must return nothing
```

## Database

The preview uses Neon PostgreSQL. For local development, create a PostgreSQL database and set both `DATABASE_URL` and `DATABASE_URL_DIRECT`. The in-process pg-boss runner creates its own `pgboss` schema on first boot. Phase 2 adds Drizzle migrations; do not assume the application tables exist yet.

## Health checks

```bash
curl -i http://localhost:3000/healthz
curl -i http://localhost:3000/readyz
```

`/healthz` must pass without a database. `/readyz` returns 503 when the database is unavailable.

## Tests

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Playwright E2E is added with the functional journeys in Phase 6.

## Deployment

See [`DEPLOYMENT.md`](DEPLOYMENT.md). The preview target is Render free + Neon free. No production or mainnet action is authorized.
