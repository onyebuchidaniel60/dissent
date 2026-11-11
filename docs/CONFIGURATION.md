# Configuration

The canonical environment variable inventory is in `PROJECT_SPEC.md` Section 23. This document defines configuration policy.

## Environments

- `development`: local development, fixture data by default.
- `preview`: isolated hosted environment; fixture mode by default; no production data or credentials.
- `production`: live provider credentials and user data only after explicit operator release authorization.

## Secret separation

Browser-safe variables are limited to:
- `VITE_API_BASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

All RYO/OpenAI keys, database URLs, worker credentials, migration credentials, and privileged service credentials are server-only.

## Live mode guard

Live analysis is enabled only when all required credentials, exact provider contract configuration, model ID, cost ceiling, and environment approval are validated. Otherwise live run creation returns a stable `LIVE_ANALYSIS_NOT_CONFIGURED`/`503` error. It must not silently fall back to fabricated or simulated evidence.

## Configuration changes

- Prompt versions, rules versions, attacker registry versions and RYO adapter schema versions are source-controlled.
- Runtime admin UI does not allow changing adjudication policy.
- Cost limits and per-user quotas require operator-controlled environment changes.
- Production environment changes require authorized operator access and audit record.
