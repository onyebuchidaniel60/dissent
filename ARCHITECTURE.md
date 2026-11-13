# Dissent — System Architecture and Technical Design

**Version:** 1.0 | **Architecture status:** Fixed implementation baseline

## 1. Architecture decisions

### 1.1 Shape
A modular monolith plus a dedicated background worker. One TypeScript codebase, one PostgreSQL database, a Postgres-backed durable job queue, and a small Rust NEAR contract workspace. Do not split into microservices for the hackathon.

### 1.2 Concrete stack

| Layer | Decision | Responsibility |
|---|---|---|
| Web | Next.js App Router + React + TypeScript | Dashboard, certificate pages, server-rendered UI |
| UI | Tailwind CSS + accessible component primitives + Lucide | Consistent implementation; final visual language follows supplied references |
| API | Next.js Route Handlers with typed service layer | Client REST API and dashboard actions |
| Runtime | Node.js 22 LTS or later compatible LTS, pinned in `.nvmrc`/toolchain | Web and worker runtime |
| Package manager | pnpm workspace | Reproducible monorepo installs |
| Validation | Zod + JSON Schema Draft 2020-12 validator | Request/output validation and cross-field checks |
| Database | PostgreSQL 16+ | Primary durable store, JSONB output snapshots, audit/event records |
| ORM/migrations | Drizzle ORM + drizzle-kit | Typed queries and explicit migrations |
| Queue | pg-boss (Postgres-backed) | Durable attacker/evidence/adjudication jobs; bounded retries |
| AI providers | Official OpenAI SDK, official Anthropic SDK, `@nearai/inference-sdk` | Provider adapters and attested NEAR AI calls |
| NEAR app integration | `near-api-js`/wallet selector or current official NEAR JS SDK selected at intake | Wallet transaction construction, RPC verification, contract calls |
| Smart contracts | Rust + `near-sdk` | Commitment/certificate registry and testnet bounty escrow |
| Contract tests | `near-workspaces` / sandbox plus Rust unit tests | Local contract testing and testnet integration |
| Unit/integration tests | Vitest | Domain logic, adapters, API and database tests |
| E2E | Playwright | Browser journeys and demo recording |
| Logging | Pino structured logs | Audit operations and worker diagnostics |
| Error monitoring | Sentry optional; disabled until credentials/consent | Operational error reporting |
| Deployment | Docker; Railway web + worker + managed PostgreSQL as the default target | One project, separate web/worker processes, preview/staging |

Versions are pinned in lockfiles at implementation time. The agent must not install `latest` in production or silently upgrade dependencies. If the current maintained NEAR SDK conflicts with the workspace, record the incompatibility and choose the closest supported SDK release without changing the architecture.

### 1.3 Why this stack
- A modular monolith keeps business rules in one versioned TypeScript package and reduces integration overhead.
- PostgreSQL is already required for durable audits and provides a simple queue backend; Redis is unnecessary.
- A dedicated worker prevents long-running model and evidence jobs from tying up HTTP requests.
- Direct vendor SDKs preserve access to provider-specific structured output, rate-limit and attestation features.
- The Rust contract is intentionally small; AI reasoning stays off-chain.
- Railway is the default deployment target because it can host the web process, worker process, and Postgres under one operational project. If the operator lacks a Railway account/credits, do not silently substitute a paid host; deploy locally or use an operator-approved equivalent during intake.

## 2. Logical architecture

```text
Client Agent / Human Operator
          |
          | HTTPS + scoped API key / session
          v
Next.js Web + REST API
  |        |         |
  |        |         +--> Auth / RBAC
  |        +------------> Domain services
  |                         |
  |                         +--> PostgreSQL / audit log
  |                         +--> pg-boss durable jobs
  |                         +--> NEAR RPC / registry
  |                         +--> approved data adapters
  |
  v
Browser Console

Worker Process
  |
  +--> Audit Orchestrator
  |       +--> A01 isolated runtime
  |       +--> A02 isolated runtime
  |       +--> ...
  |       +--> A08 isolated runtime
  |
  +--> Evidence Store / Re-fetch adapters
  +--> Evidence Auditor
  +--> Sycophancy Auditor
  +--> Reproducibility runner
  +--> Deterministic Adjudicator
  +--> Certificate Generator
  +--> Bounty / Reputation services

NEAR Contracts (testnet MVP)
  +--> Audit commitment + certificate registry
  +--> Bounty escrow / settlement (separate module or contract)
```

Attackers can share the same physical worker process only if each run has a separate data-access context, fresh prompt/context, no shared mutable state and no read permission for sibling output tables. Stronger isolation is achieved through a worker-level sandbox/process boundary. All model inputs and tools are constructed server-side.

## 3. Domain modules

- `identity`: operator accounts, client workspaces, API key issuance/revocation, RBAC.
- `audit-intake`: thesis/condition parsing, normalization, canonicalization, validation.
- `commitments`: hash calculation, wallet transaction construction, NEAR receipt verification.
- `orchestration`: state machine, run assignment, retries, event emission.
- `attackers`: eight method definitions, prompts, model assignment, typed tools, output validation.
- `models`: OpenAI, Anthropic and NEAR AI provider adapters, quotas, token/cost telemetry.
- `data-sources`: FastNear, NEAR RPC, Pikespeak, NearBlocks, RedStone, price-market adapters.
- `evidence`: pointer validation, payload hashing, freshness, re-fetch and provenance.
- `red-team`: Evidence Auditor and Sycophancy Auditor.
- `adjudication`: policy v1.0, verdict gates, divergence index and decision trace.
- `certificates`: canonical serialization, hash, rendering, on-chain registration.
- `economics`: client fee ledger, attacker compute budget ledger, bounty allocation and testnet settlement.
- `reputation`: append-only performance events and derived metrics.
- `admin`: provider/config health, run inspection, bounded retry and system events.

## 4. Data architecture

PostgreSQL is source of truth for application state. NEAR is source of truth for public commitment/certificate hashes and testnet settlement records. The database stores the condition preimage, thesis, outputs, evidence metadata, and certificate artifact. Raw evidence size is capped at 256 KB per captured payload for MVP; large source responses are normalized and only necessary excerpts plus source locator/hash are stored. A private S3-compatible storage adapter may be introduced later without changing domain interfaces.

No portfolio secrets, API keys, private keys, full prompts or raw sensitive data go on-chain. Public certificate fields are explicitly redacted and content-hashed.

## 5. Queue and concurrency

Use `pg-boss` with queues:
- `audit.dispatch` — create eight attacker jobs only after commitment and testnet fee funding are both verified.
- `attacker.run` — one job per attacker/run.
- `evidence.verify` — re-fetch and classify each evidence record.
- `redteam.review` — Evidence/Sycophancy tasks.
- `audit.reproduce` — controlled rerun/replay.
- `audit.adjudicate` — deterministic policy evaluation.
- `certificate.anchor` — NEAR contract finalization.
- `bounty.settle` — separately authorized settlement.

Unique keys: `(audit_id, attacker_id, run_generation)` for attacker run; `(audit_id, evidence_id, verification_generation)` for evidence; `(audit_id, policy_version)` for adjudication; `finding_id + payout_generation` for settlement. Queue handlers must be idempotent. Exponential backoff is bounded; no infinite retries. Max attacker retries: 2 schema-repair retries + 1 complete rerun, all configurable and recorded.

Concurrency defaults: maximum 8 parallel attackers per audit, maximum 2 concurrent audits in demo; provider-specific rate limits apply. These are configuration defaults, not promises of provider capacity.

## 6. Model architecture

Provider family requirements: at least three distinct families across at least two vendors, with at least one open-weight model served in NEAR AI Cloud TEE. Baseline assignment:

| Attacker | Primary provider family | Rationale |
|---|---|---|
| A01 Liquidity / Execution | OpenAI GPT family | Execution and arithmetic/tool analysis |
| A02 Asset Safety | Anthropic Claude family | Contract and permission threat review |
| A03 Logic / Coherence | OpenAI GPT family, distinct role prompt | Logical consistency |
| A04 Correlation / Portfolio | Anthropic Claude family | Exposure interaction |
| A05 Thesis Inversion | NEAR AI Cloud open-weight Qwen family | Independent inversion; attested TEE |
| A06 Data Provenance | NEAR AI Cloud open-weight GLM family | Source comparison, distinct open-weight family |
| A07 Timing / MEV | OpenAI GPT family | Execution window and transaction path |
| A08 Base Rate | Anthropic Claude family | Historical prior analysis |

Exact model IDs and versions are resolved during operator intake from available credentials/catalogue and frozen in `model_assignments.json`. A provider fallback is allowed only if it preserves minimum family/vendor diversity and is explicitly recorded; otherwise audit cannot return `TRADE`.

Use official vendor SDKs. Structured output is validated with Zod and JSON Schema. Model self-reported `provider`, `model_id`, time, confidence and evidence hash are not trusted; the orchestrator overwrites provenance fields from the actual invocation record. Temperature changes do not count as model diversity.

NEAR AI Cloud is integrated with the official inference SDK where possible. Verify deployment attestation before model use and response signature after each inference. Store attestation report hash, signer identity, model identifier, verification result and signed receipt reference. A plain response from an OpenAI-compatible base URL is not sufficient proof of TEE execution.

## 7. Evidence/data architecture

### Source adapters
- **NEAR canonical RPC / FastNear RPC:** canonical account state, contract views, block and receipt inspection.
- **FastNear API / Transactions API:** indexed balances, staking, token holdings and execution history.
- **Pikespeak:** optional account/transfer/history/DeFi-position adapter; API credentials and quotas required.
- **NearBlocks:** optional independent transaction/explorer adapter; verify current API endpoint and credentials during intake.
- **RedStone NEAR connector:** candidate oracle adapter for signed data packages; verify token/feed coverage and production readiness before relying on it.
- **Pyth:** disabled by default for NEAR. Pyth documentation states Pyth Core no longer supports NEAR from 26 Aug 2026; enable only after a separately verified working deployment and explicit adapter test.
- **Market-data fallback:** independent external market data endpoint may provide a comparison observation but must be identified as market data, not described as a NEAR oracle.
- **mcp-near-defi:** optional research tool only; do not make the core audit depend on it until its package/API behavior is smoke-tested. Implement adapter interfaces directly where possible.

Source diversity is per attacker and per claim. Each run logs sources actually queried. A different source name does not prove independence if the sources ultimately derive from the same upstream provider.

### Freshness defaults (policy config)
- Spot price: 60 seconds.
- Pool depth/route quote: 30 seconds for execution-risk claims.
- Account holdings: latest finalized block or 5 minutes, whichever is stricter for the claim.
- Protocol/APY state: 5 minutes for current-rate claims.
- Historical/base-rate datasets: exact interval and source timestamp recorded; freshness not measured like spot price.
- Governance/contract permissions: latest finalized block and contract code hash.

If data exceeds freshness limit, mark it stale and do not use it for a verified live-state claim.

### Evidence record
Each record has source adapter, provider, resource type/id, safe locator, query parameters (allowlisted), observed/retrieved times, block height/hash if applicable, normalized value, raw payload hash (server-calculated), payload reference, evidence type, freshness result, and known limitations.

## 8. API architecture

Base path `/api/v1`. All JSON responses include `request_id`; errors use `{ error: { code, message, details? }, request_id }`. Client requests authenticate with `Authorization: Bearer ds_live_...` (key prefix distinguishes test/live but key itself is high entropy and stored hashed). Human dashboard uses secure HTTP-only SameSite cookies.

Principal routes:
- `POST /audits` — validate and create draft audit; idempotency required.
- `POST /audits/{id}/commitment/prepare` and `/commitment/confirm` — build signing payload and verify the client-signed commit; no attacker execution until confirmed.
- `POST /audits/{id}/fee/quote` and `/fee/confirm` — issue fixed testnet fee quote and verify `fund_audit`; dispatch only after both commitment and fee funding pass.
- `GET /audits/{id}` — own audit status/progress.
- `GET /audits/{id}/certificate` — own certificate artifact.
- `GET /certificates/{id}/verify` — public, redacted verification summary.
- `GET /audits/{id}/events` — paginated state/event history; own audit only.
- `POST /audits/{id}/cancel` — before commitment only; after commitment request bounded stop without deleting audit.
- `POST /admin/audits/{id}/retry` — admin, bounded, reason required.
- `GET /admin/system/health` — admin only.
- `GET /admin/attackers` and `/admin/reputation` — operator dashboard.

Webhooks are deferred. Polling endpoint is sufficient and avoids outbound-URL/SSRF exposure in MVP.

## 9. Authentication and authorization

- Client machine auth: opaque API keys generated with cryptographically secure randomness; display secret once; store SHA-256/HMAC hash only, prefix, scopes, client/workspace, created/last-used/revoked timestamps. Support rotation and revocation.
- Client scopes: `audit:create`, `audit:read:own`, `certificate:read:own`. Keys cannot list all clients or access another client's audit.
- Human operator auth: Better Auth (email/password or magic link depending on provider configured) with secure HTTP-only sessions; no open public signup. First admin provisioned by one-time CLI command or verified invitation.
- RBAC: `OWNER`, `OPERATOR`, `READ_ONLY`; separate service principals for workers.
- Every record query is scoped by client/workspace at the service/database layer; UI hiding is not authorization.
- Public verify endpoint returns only explicitly public certificate data and no thesis preimage, client identifiers, portfolio or raw evidence.

## 10. UI structure

Reference image(s) are not attached in the current handoff; mark them **required at operator intake**. Phase 1 skeleton uses a neutral, accessible temporary style and real route structure; final visual implementation happens only after core E2E gate and direct inspection of supplied references.

Routes:
- `/` — product landing/overview, clear security model and demo entry.
- `/app` — dashboard summary (recent audits, status counts, provider/chain health).
- `/app/audits/new` — thesis + structured failure conditions wizard.
- `/app/audits/[auditId]` — audit timeline and live progress.
- `/app/audits/[auditId]/certificate` — certificate view: verdict, coverage, findings, dissent, verification.
- `/verify/[certificateId]` — public redacted certificate integrity page.
- `/app/attackers` — eight attacker roster, role and model provenance.
- `/app/reputation` — historical quality metrics.
- `/admin/providers` — connection/model/adapter health; secrets never displayed.
- `/admin/audits` — audit search and safe recovery actions.
- `/docs` — docs landing or verified external docs destination.

Navigation: Overview, Audits, Attackers, Reputation; admin-only System/Providers. Footer: verified Documentation and public GitHub links only, plus appropriate contact/privacy/terms destinations. No placeholder `href="#"`, inert controls or fake metrics. Responsive: desktop workbench first, tablet stacked panels, mobile read-only result and simplified creation. Accessibility: semantic headings, labels, keyboard navigation, visible focus, contrast, live-region progress announcements, reduced-motion support.

## 11. Security architecture

Threat model: external client, compromised API key, malicious thesis or condition text, hostile RPC/indexer payload, prompt injection, model/provider compromise, attacker cross-context leakage, queue replay/race, database compromise, compromised deploy key, rogue admin, and unauthorized on-chain settlement.

Controls:
- Parameterized DB queries; strict request schema and length limits.
- API rate limits by key/client/IP, audit concurrency quotas, token budgets and hard request size limit.
- API key hash at rest; rotate/revoke; secrets only server-side.
- Secure session cookies, CSRF protection for cookie-authenticated mutations, strict CORS, CSP, HSTS in production.
- Output escaped on UI; sanitize Markdown; never render arbitrary HTML from model output.
- No arbitrary URL fetch tool. All evidence retrieval via allowlisted adapter + typed resource identifiers; block private IPs, redirects to private networks, non-HTTPS, credential forwarding and unsupported schemes.
- Prompt injection defense: retrieved content is quoted as untrusted data; no instructions from evidence can alter system rules/tools.
- Tool capability allowlists per attacker; no shell, filesystem, arbitrary SQL, wallet signing, secrets access or model-to-model communication.
- Per-run context isolation; DB row-level scoping in services; separate run namespaces; sealed output until all jobs close.
- TEE deployment and response signature verification; failed verification blocks `TRADE`.
- Job idempotency, unique constraints, immutable audit events, bounded retry.
- On-chain contract role checks, one-time IDs, amount caps, escrow accounting, no admin arbitrary withdraw in normal path; multisig/timelock required for mainnet production.
- No live trading executor in MVP; any non-TRADE or failed audit blocks any future executor.
- Redact API keys, wallet secrets, client portfolio, prompts and private evidence from logs/video.

## 12. Deployment

Docker images: `web` (Next.js) and `worker` (pg-boss processor) from one repository; Postgres managed service. Default target Railway. Separate development, protected preview/staging, and production environments with distinct database/provider keys. Preview uses synthetic data and testnet only. Do not reuse production data/credentials. Preview must be stable, access-protected if it exposes non-public audit data, and updated at verified checkpoints. Record deployed URL and immutable Git commit SHA in `AI_HANDOFF.md`.

No production deployment or mainnet contract transaction without explicit operator authorization recorded in `OPERATOR_INTAKE.md`.

## 13. Observability

Pino JSON logs with `request_id`, `audit_id`, `run_id`, job ID, provider, model, phase, duration, token usage and failure code. Do not log secrets, full private prompts, or raw portfolio contents. Store immutable `audit_events` for state transitions. Dashboards show queue lag, provider error/rate-limit, run completion, evidence fetch results, cost per audit, TEE verification, chain tx state. Sentry is optional and requires explicit configuration and data-redaction review.

## 14. Explicitly deferred architecture

- Proprietary market scanner is not on the critical path.
- Trading executor is not part of MVP.
- NEAR Intents signed-intent (NEP-413) path is incompatible with a Function Call Key because the signing standard requires the owner's full-access key. Do not give such a key to the execution agent. A later vault design must use a standard quote/deposit path the vault can authorize, with destination/amount/expiry checks, or a different venue.
- 1Click is mainnet-only; it has no testnet. Do not use it as a hackathon integration test dependency.
- Pyth Core NEAR feed is disabled unless a currently maintained contract/feed is verified.
