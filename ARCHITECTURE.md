# Dissent — Architecture Specification

**Status:** Fixed architecture baseline  
**Source of truth:** `PROJECT_SPEC.md`  
**Last updated:** 11 November 2026

## 1. Architecture decisions

| Decision | Selected approach | Constraint |
|---|---|---|
| Application shape | TypeScript monorepo; React/Vite web app + Fastify API/worker | No microservices |
| API style | Versioned REST JSON under `/api/v1`; SSE for progress | Polling fallback required |
| Database | Supabase-managed PostgreSQL | Postgres is system of record and durable queue |
| Queue | `analysis_jobs` table + `FOR UPDATE SKIP LOCKED` leases | No Redis/Kafka/hosted queue in MVP |
| Authentication | Supabase Auth email OTP/magic link | API verifies access JWT; no custom auth |
| ORM/migrations | Drizzle | One ORM only |
| Runtime validation | Zod + JSON Schema | All LLM/provider payloads validated at runtime |
| RYO transport | Official REST interface | Do not invent endpoint/auth/request/response contracts; obtain official docs and credentials at intake |
| LLM | OpenAI Responses API | One configured model ID; structured output; no LLM adjudicator |
| Hosting | Vercel frontend, Render API/worker, Supabase DB/Auth | Preview isolated from production |
| Observability | Pino structured logs + platform logs | Redact secrets and private criteria |
| Tests | Vitest + Fastify.inject + Playwright | Deterministic fixtures for core adjudication |

## 2. Logical component diagram

```text
┌──────────────────────────────┐
│ React + Vite browser client  │
│ React Router / TanStack      │
│ Query / Supabase Auth        │
└──────────────┬───────────────┘
               │ HTTPS JSON / SSE
               ▼
┌──────────────────────────────┐
│ Fastify API (Render)         │
│ JWT auth / ownership checks  │
│ Zod contracts / rate limits  │
│ API routes / request IDs     │
└──────────────┬───────────────┘
               │
       ┌───────▼──────────┐
       │ Supabase Postgres│
       │ runs / snapshots │
       │ jobs / criteria  │
       │ findings / certs │
       └───────▲──────────┘
               │ durable job claim + lease
               │
┌──────────────┴───────────────┐
│ Worker loop (same service)   │
│                              │
│ 1. RYO REST adapter          ├──────► RYO read-only API
│ 2. Data Integrity Gate       │
│ 3. Thesis Agent              ├──────► OpenAI Responses API
│ 4. Criteria seal             │
│ 5. Isolated attackers (N)    ├──────► OpenAI Responses API
│ 6. Finding Validator         │
│ 7. Deterministic Adjudicator │
│ 8. Certificate + SHA-256     │
└──────────────────────────────┘
```

## 3. Monorepo boundaries

### `apps/web`

Owns presentation, route handling, session acquisition, server-state fetching, and user interactions. It must not contain RYO or OpenAI secrets, adjudication rules, privileged database access, or criteria-sealing authority.

### `apps/api`

Owns authentication verification, authorization, rate limiting, HTTP contracts, persistence, queue processing, external service adapters, orchestration, and observability. API routes are thin; business logic lives in domain modules.

### `packages/contracts`

Owns shared request/response Zod schemas and API error contracts. It must not import runtime credentials or app-specific database clients.

### `packages/core`

Owns deterministic pure logic: state transitions, canonical JSON, hashing, criteria matching, Data Integrity Gate, evidence pointer validation, adjudicator, and certificate verification. This package must not import the OpenAI SDK, Fastify, React, or RYO clients.

### `packages/attacker-registry`

Owns the six surface IDs, charters, enabled defeat vocabularies, permitted RYO tools, and evidence support requirements. Registry changes require a version increment and tests.

### `packages/prompts`

Owns versioned Thesis Agent and attacker prompt templates. Prompt changes require version increments and regression fixtures.

### `packages/test-fixtures`

Owns synthetic RYO responses, invalid provider responses, model outputs, and deterministic demo scenarios. Every synthetic item must be labelled `SIMULATED` in user-visible experiences.

## 4. RYO adapter contract

The adapter exposes a narrow internal interface for only the currently published tool names:

- `market_overview`
- `scan_market`
- `analyze_token`
- `deep_analysis`
- `compare_tokens`
- `check_safety`
- `supported_tokens`

The public hackathon description says these are accessible over MCP and REST. This project selects REST. Actual base URL, authentication mechanism, routes, parameters, response schemas, timeout/quotas, and any pagination must be loaded from organizer documentation during Phase 0. Never guess them.

### Adapter invariants

1. Tool names are a compile-time allowlist, not client input.
2. Request parameters are validated against the documented schema.
3. Provider responses are retained as immutable snapshots before model use.
4. Provider-reported unavailable/error states remain explicit.
5. Missing numeric values are never replaced with zero or an estimated value.
6. A fallback source, if any is reported by RYO, is preserved in provenance.
7. The adapter does not call unknown tools, user-supplied URLs, or execution methods.
8. No dedicated `monitor_market_sentiment_shift` endpoint is assumed; it is not in the currently published seven-tool list.

## 5. Evidence pipeline

```text
RYO response
   ↓
Raw snapshot stored + canonical hash
   ↓
Provider schema validation
   ↓
Data Integrity Gate
   ├─ BLOCK → run BLOCKED; no normal thesis/verdict
   ├─ WARN  → continue with explicit limitation
   └─ PASS  → continue
   ↓
Thesis Agent
   ↓
Thesis/evidence reference validation
   ↓
Criteria validation + atomic seal
   ↓
Build separate payload for each attacker
   ↓
Stateless attacker calls in parallel
   ↓
Finding schema + source pointer/value validation
   ↓
Deterministic adjudication
   ↓
Certificate canonicalization + hash + immutable persistence
```

No LLM sees the complete raw database object. Payloads are projections from explicit allowlisted fields.

## 6. Attacker isolation contract

For every attacker call, the worker creates a new request with:

- One attacker charter and surface ID.
- The thesis projection with `kill_criteria` removed recursively.
- Only source snapshots allowed by that attacker's registry entry.
- The shared output schema and prompt version.

The request must not include:

- Kill criteria or criterion descriptions.
- Criteria IDs, criteria hash, or committed-at metadata.
- Another attacker's prompt, output, or findings.
- Adjudication rule, outcome, or verdict.
- Any tool-calling permission.

Automated tests serialize the exact outbound payload and assert all forbidden keys and values are absent. Distinct provider calls must not share chat history or conversation IDs.

## 7. Data Integrity Gate

Implemented in `packages/core`; deterministic only. It validates:

- Asset identity mapping.
- Required fields for the selected analysis/attacker surfaces.
- Snapshot hash integrity.
- Provider schema validity.
- Source-status and explicit missing data.
- Timestamp/freshness thresholds.
- Timeframe consistency.
- Contradictory observations when the comparison is deterministic.

`PASS`, `WARN`, and `BLOCK` are persisted with rule version and exact reasons. The gate does not grade the thesis.

## 8. Durable job queue

Use PostgreSQL `analysis_jobs`; no external queue service.

- `POST /analyses` creates `analysis_runs`, `idempotency_records`, `analysis_jobs`, and `audit_events` in one transaction.
- Worker claims eligible jobs using `FOR UPDATE SKIP LOCKED`.
- Worker sets a lease and heartbeats it during long provider calls.
- Expired lease can be reclaimed after a process crash.
- Every processing step checks for an already-persisted artifact before repeating an external call.
- External calls occur outside the row-lock transaction.
- Finalization locks the run, validates all preconditions, creates certificate, and marks run completed atomically.

## 9. Database access model

Use separate credentials where provider support permits:

- `APP_DATABASE_URL`: restricted user-scoped runtime role; no `BYPASSRLS`.
- `WORKER_DATABASE_URL`: restricted worker role with required processing privileges; server-only.
- `MIGRATION_DATABASE_URL`: privileged migration role; local/CI only and never included in web runtime.

Enable RLS and owner policies on user-owned tables. API queries must still scope every resource to verified `user_id`; RLS is defense in depth, not a substitute for authorization. Do not claim RLS protects a service-role connection that bypasses RLS.

## 10. Authentication and request security

- Supabase Auth issues access tokens.
- Fastify verifies JWT signature against configured Supabase JWKS; validates issuer, audience, expiry, and subject.
- `user_id` is derived from token, never request body.
- CORS is exact-origin allowlisted.
- All schemas reject unexpected mutable fields such as `verdict`, `run_status`, `criteria_hash`, `user_id`, and certificate payload.
- Owner-scoped endpoints respond 404 for not-found and not-owned resources.

## 11. AI integration

OpenAI Responses API is called only from the backend. Use `OPENAI_MODEL` set during operator intake and verify the model supports required structured output. Persist model ID, prompt version, request hash, output, usage data, and timestamps. All model outputs pass deterministic Zod and evidence validation.

Thesis agent: one model call plus at most one constrained repair.  
Attacker: one independent call per enabled surface plus at most one schema repair.  
Adjudicator: no model call.

The app does not present a language-model confidence value as a probability of profit.

## 12. Certificate model

Certificate is a canonical JSON record that includes:

- schema/rules/registry/prompt versions;
- run ID and timestamp;
- source tool names, parameter fingerprints, snapshot IDs/hashes/timestamps/status;
- Data Integrity Gate report;
- thesis and evidence pointers;
- criteria and commitment hash/time;
- enabled, skipped, and unavailable attackers;
- all validated findings and validation reports;
- aggregation rule applied and verdict;
- coverage status and limitations;
- invalidation condition and what would change the thesis;
- certificate hash and optional supersedes link.

Hash the canonical payload without its own `certificate_hash` field. The certificate's hash proves recorded-content integrity, not the truth of the source observation.

## 13. API and frontend transport

Use REST JSON for commands/queries and SSE for live progress. SSE is a convenience; persisted run status remains authoritative. Frontend must recover after disconnect by fetching the current run record. No WebSocket service is needed.

## 14. Deployment topology

- Vercel hosts the React/Vite frontend and preview deployments.
- Render runs one Fastify service that exposes the API and starts the queue worker loop.
- Supabase hosts Postgres and Auth.
- Preview uses non-production Supabase and fixture-only or explicitly sandbox-authorized RYO credentials.
- Production deployment is not authorized by default.

If the existing repository already has a compatible deploy target or stack, preserve working infrastructure where it satisfies these architectural constraints. Do not migrate solely for stylistic preference. Any material incompatibility is documented during Phase 0 and treated as a genuine blocker requiring operator resolution.

## 15. Explicitly excluded infrastructure

No Redis, Kafka, Kubernetes, vector DB, search cluster, payment service, wallet service, exchange SDK, external news provider, or analytics SaaS in the MVP.

## 16. Architecture invariants

1. No LLM is the final judge.
2. Criteria are committed before attacker execution.
3. Attackers do not see criteria or peers.
4. Missing data stays missing.
5. Unsupported attack surfaces are explicitly recorded.
6. Failed agents are not NO_BREAK.
7. Fewer than three valid findings means no verdict.
8. An incomplete or blocked run cannot be labelled TRADE.
9. Certificates are immutable and verifiable.
10. Preview is isolated from production data and secrets.
