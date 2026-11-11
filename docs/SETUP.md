# Setup

This document describes the intended local setup after the implementation repository and credentials are available. It is a blueprint, not evidence that an application currently exists.

## Prerequisites

- Node.js current supported LTS, pinned in `.nvmrc` or equivalent after repo inspection.
- pnpm version pinned through `packageManager` in root `package.json`.
- Git.
- Supabase CLI only if local Supabase development is selected during intake.
- Browser supported by Playwright for E2E tests.

## Local setup sequence

1. Clone the approved repository.
2. Read root `README.md` and `AGENTS.md`.
3. Install locked dependencies using `pnpm install --frozen-lockfile`.
4. Copy `.env.example` to local `.env` files for the web/API apps; never commit them.
5. Configure database credentials and run documented migrations.
6. Configure Supabase Auth redirect URLs for the local origin.
7. Start the API and worker process.
8. Start the Vite frontend.
9. Verify `/health/live` and `/health/ready`.
10. Run deterministic fixture demo before attempting live provider calls.

## Development modes

### Fixture-only mode

Works without RYO or OpenAI credentials. Uses fixed synthetic responses and deterministic attacker findings labelled `SIMULATED`. This is the default for safe preview/demo development.

### Live analysis mode

Requires verified RYO credentials/contract, OpenAI API key and model ID, budget limits, database access, and operator approval for the environment. It must never be enabled accidentally by missing/empty environment variables.

## Setup acceptance

- No secret appears in Git status or frontend build output.
- API readiness is healthy.
- Database migrations are current.
- Fixture demo runs without provider credentials.
- Live mode refuses to start if required credentials or budget values are missing.
