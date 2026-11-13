# Dissent — System Architecture and Technical Design

**Version:** 1.0 | **Architecture status:** Fixed implementation baseline

## 1. Architecture decisions

### 1.1 Shape
A modular monolith with an **in-process pg-boss runner**. One TypeScript codebase, one PostgreSQL database, a Postgres-backed durable job queue, and a small Rust NEAR contract workspace. Do not split into microservices for the hackathon.

**Phase 1 operator revision (C2):** the preview runs on a Render free Web Service, which does not provide a background worker. pg-boss starts inside the Next.js process. This is a deployment adaptation, not a change to the domain state machine or queue contracts.

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
| Queue | pg-boss (Postgres-backed, in-process) | Durable attacker/evidence/adjudication jobs; bounded retries |
| AI providers | One generic OpenAI-compatible adapter; OpenRouter primary, Groq secondary | Provider calls, token buckets, retries and cost attribution. No OpenAI/Anthropic SDKs. |
| NEAR app integration | Official NEAR wallet-selector packages plus the current supported NEAR JS SDK | Wallet transaction construction, signed-nonce sessions, RPC verification, contract calls |
| Smart contracts | Rust + `near-sdk` | Commitment/certificate registry and testnet bounty escrow |
| Contract tests | `near-workspaces` / sandbox plus Rust unit tests | Local contract testing and testnet integration |
| Unit/integration tests | Vitest | Domain logic, adapters, API and database tests |
| E2E | Playwright | Browser journeys and demo recording |
| Logging | Pino structured logs | Audit operations and worker diagnostics |
| Error monitoring | Sentry optional; disabled until credentials/consent | Operational error reporting |
| Deployment | Docker; Render free Web Service + Neon free PostgreSQL as the preview target | One web process with an in-process runner; no separate worker on the free plan |

Versions are pinned in lockfiles at implementation time. The agent must not install `latest` in production or silently upgrade dependencies. If the current maintained NEAR SDK conflicts with the workspace, record the incompatibility and choose the closest supported SDK release without changing the architecture.

### 1.3 Why this stack
- A modular monolith keeps business rules in one versioned TypeScript package and reduces integration overhead.
- PostgreSQL is already required for durable audits and provides a simple queue backend; Redis is unnecessary.
- The in-process runner is a free-tier accommodation: it avoids a second Render service while preserving pg-boss job uniqueness, retries and durable state. Long jobs are bounded and concurrency is capped so the web event loop remains responsive.
- A single OpenAI-compatible adapter avoids two vendor SDKs while preserving per-provider base URLs, token buckets and structured output validation. Provider-specific features are handled through explicit request options, not a second abstraction.
- The Rust contract is intentionally small; AI reasoning stays off-chain.
- Render free + Neon free is the only authorized preview target. There is no paid hosting, paid TTS or card-backed service. If the free service is unavailable, continue locally and record the preview blocker; do not silently substitute a paid host.

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

Concurrency defaults for the free Render instance: **maximum 3 parallel attackers per audit**, **maximum 1 concurrent audit**, and a pg-boss pool of 2 connections. Provider-specific token buckets still apply. These are hard config defaults for the 512 MB process, not promises of provider capacity.

**In-process runner:** `src/instrumentation.ts` starts pg-boss on server boot when `DATABASE_URL_DIRECT` or `DATABASE_URL` is present. If the pooled Neon URL cannot acquire advisory locks, the queue uses the direct URL; this is recorded in `docs/DEPLOYMENT.md`. A queue failure does not make `/healthz` fail. `/readyz` checks the database independently.

## 6. Model architecture

Provider requirements: at least three distinct model families across at least two inference vendors, with at least one open-weight attacker. The TEE sub-clause is **formally waived** under the operator's zero-new-spend constraint (C4). The waiver is recorded in the certificate and must never be rendered as a TEE badge.

**Pinned roster (2026-11-13.1, `config/model_assignments.json`):**

| Attacker | Provider | Model | Family | Rationale |
|---|---|---|---|---|
| A01 Liquidity / Execution | OpenRouter | `z-ai/glm-5.3-flash` | GLM | Execution and arithmetic/tool analysis; routed through `near-ai`, no attestation claim |
| A02 Asset Safety | Groq | `openai/gpt-oss-120b` | GPT-OSS | Contract and permission threat review; free tier, open weight |
| A03 Logic / Coherence | OpenRouter | `google/gemini-2.5-flash` | Gemini | Logical consistency |
| A04 Correlation / Portfolio | OpenRouter | `nvidia/nemotron-3-ultra-550b-a55b:free` | Nemotron | Exposure interaction; free slug |
| A05 Thesis Inversion | OpenRouter | `qwen/qwen3.8-27b` | Qwen | Independent inversion; paid but within the $0.50 ledger |
| A06 Data Provenance | OpenRouter | `baidu/ernie-5.5-flash-preview:free` | ERNIE | Source comparison; free slug |
| A07 Timing / MEV | OpenRouter | `cohere/north-mini-code:free` | North | Execution window and transaction path; free slug |
| A08 Base Rate | OpenRouter | `particle-ai/particle-1:free` | Particle | Historical prior analysis; free slug |

The roster spans seven distinct model families across two inference vendors (OpenRouter + Groq), and A02 is open-weight. A06 and A07 share the Flint family as a documented free-model availability substitution. Several operator-preferred slugs were absent from the live catalogue; substitutions are recorded with a reason in the assignment file. A provider fallback is allowed only if it preserves the family/vendor gate and is explicitly recorded; otherwise the audit cannot return `TRADE`.

Use one generic OpenAI-compatible adapter with configurable base URL. Structured output is validated with Zod and JSON Schema. Model self-reported `provider`, `model_id`, time, confidence and evidence hash are not trusted; the orchestrator overwrites provenance fields from the actual invocation record. Temperature changes do not count as model diversity.

**TEE waiver:** the direct NEAR AI API is not authorized and the OpenRouter `near-ai` route is not an attested gateway. Set `TEE_VERIFICATION_ENABLED=false`, `TEE_STATUS=WAIVED_BUDGET_CONSTRAINT`, write `tee_verifications` rows with `result=WAIVED` and `reason=TEE_VERIFICATION_DISABLED` when the schema is implemented, and disclose the waiver in the demo narration, README and certificate. Do not display a TEE badge.

## 7. Evidence/data architecture

### Source adapters
- **NEAR canonical RPC / FastNear RPC:** canonical account state, contract views, block and receipt inspection.
- **FastNear API / Transactions API:** indexed balances, staking, token holdings and execution history.
- **NearBlocks:** independent transaction/explorer adapter. The public API is used with documented rate limits; an API key is optional and not present in the preview.
- **Pikespeak:** skipped at intake; no credential is available.
- **RedStone NEAR connector:** skipped at intake; no feed/key was confirmed.
- **Pyth:** disabled. Pyth documentation states Pyth Core no longer supports NEAR from 26 Aug 2026. Do not enable it without a separately verified maintained deployment and explicit adapter test.
- **Market-data fallback:** on-chain Ref Finance pool state is the second price observation for the NEAR/USDC demo asset. It must be identified as on-chain venue state, not an independent oracle.
- **mcp-near-defi:** optional research tool only; do not make the core audit depend on it until its package/API behavior is smoke-tested. Implement adapter interfaces directly where possible.

**Phase 1 intake decision:** at least two adapters must be live for the demo. FastNEAR public RPC and NearBlocks public API are the baseline; the Ref Finance pool read is a derived venue observation. Read-only NEAR mainnet market data is allowed while all contract transactions remain testnet-only.

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
- Human operator auth: **NEAR Wallet Selector + signed-nonce session**. The user connects a wallet, signs a server-issued single-use nonce (≤5 minutes), the server verifies the signature against the account access key through NEAR RPC, and sets an HttpOnly, SameSite=Lax, Secure session cookie (8-hour expiry). No email/password, magic link, password reset or public signup. Logout clears the cookie and invalidates the server-side session.
- Admin/operator role: server-side allowlist of wallet account IDs (`ADMIN_WALLET_ADDRESSES`). A connected address outside the allowlist receives 403 on operator routes. A wallet address in a request body is never trusted.
- Client-agent auth remains opaque API keys with the scopes above. The `users` table is replaced by a wallet-session table keyed by account ID + session ID; no emails or passwords are stored.
- Every record query is scoped by client/workspace at the service/database layer; UI hiding is not authorization.
- Public verify endpoint returns only explicitly public certificate data and no thesis preimage, client identifiers, portfolio or raw evidence.

## 10. UI structure

**Reference assets received:** `design/dissent-reference1.webp` (2048×1536) and `design/dissent-reference2.webp` (2018×12858), recorded in `REFERENCE_ASSETS.md`. They establish a near-black canvas, deep crimson glow, oversized wide display type, red primary accent, thin bordered panels, a 12-column/1520px grid and a dense dashboard split. No ShibaNex branding, copy, mascot or trade dress may be copied; the visual language is adapted to Dissent content.

Routes (UI_UX_SPEC governs):
- `/` — product landing/overview, clear security model and demo entry.
- `/app` — dashboard summary (recent audits, status counts, provider/chain health).
- `/app/audits` — filterable audit ledger.
- `/app/audits/new` — thesis + structured failure conditions draft.
- `/app/audits/[id]` — audit timeline and live progress.
- `/app/audits/[id]/results` — verdict, coverage, findings, dissent and gate trace.
- `/app/certificates/[id]` — certificate detail.
- `/verify/[certificateId]` — public redacted certificate integrity page.
- `/app/attackers` — eight attacker roster, role and model provenance.
- `/app/reputation` — historical quality metrics.
- `/app/settings/api-keys` — scoped key issuance/revocation (Phase 2).
- `/operator`, `/operator/providers`, `/operator/audits/[id]` — operator control plane.
- `/docs` — implementation and trust-boundary documentation.

Navigation: Overview, Audits, Attackers, Reputation; admin-only Operator/Providers. Footer: verified Documentation and public GitHub links only. No placeholder `href="#"`, inert controls or fake metrics. Responsive: desktop workbench first, tablet stacked panels, mobile read-only result and simplified creation. The coverage table scrolls horizontally; the data table transforms into labelled mobile rows. Accessibility: semantic headings, labels, keyboard navigation, visible focus, contrast, live-region progress announcements, reduced-motion support.

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
- TEE deployment and response signature verification are **waived** under C4. No TEE badge is rendered; the certificate records `WAIVED_BUDGET_CONSTRAINT`. The model-family, vendor and open-weight gates remain enforced.
- Job idempotency, unique constraints, immutable audit events, bounded retry.
- On-chain contract role checks, one-time IDs, amount caps, escrow accounting, no admin arbitrary withdraw in normal path; multisig/timelock required for mainnet production.
- No live trading executor in MVP; any non-TRADE or failed audit blocks any future executor.
- Redact API keys, wallet secrets, client portfolio, prompts and private evidence from logs/video.

## 12. Deployment

**Preview:** one Render free Web Service running Next.js with an in-process pg-boss runner, plus a Neon free PostgreSQL database. No Render Postgres (30-day expiry) and no separate worker service. Build `pnpm install && pnpm build`; start `pnpm start`; health `/healthz`; readiness `/readyz`. `DATABASE_URL` is pooled; pg-boss uses `DATABASE_URL_DIRECT` to avoid PgBouncer advisory-lock issues. If direct is unavailable, append `uselibpqcompat=true&sslmode=require` to the pooled URL and document the result.

The free instance has 512 MB RAM and spins down after ~15 minutes idle; first request can take ~50 seconds. Concurrency is capped at one audit and three parallel attackers. An external `cron-job.org` ping hits `/healthz` every 10 minutes. The preview is publicly reachable by design for judges and contains synthetic data only; do not set a preview password.

Separate development, preview/staging and production environments use distinct database/provider keys. Preview uses synthetic data and testnet only. Do not reuse production data/credentials. Record the deployed URL, deployed commit SHA and cron URL in `AI_HANDOFF.md`.

No production deployment or mainnet contract transaction without explicit operator authorization recorded in `OPERATOR_INTAKE.md`.

## 13. Observability

Pino JSON logs with `request_id`, `audit_id`, `run_id`, job ID, provider, model, phase, duration, token usage and failure code. Do not log secrets, full private prompts, or raw portfolio contents. Store immutable `audit_events` for state transitions. Dashboards show queue lag, provider error/rate-limit, run completion, evidence fetch results, cost per audit, TEE verification, chain tx state. Sentry is optional and requires explicit configuration and data-redaction review.

## 14. Explicitly deferred architecture

- NEAR Intents signed-intent (NEP-413) path is incompatible with a Function Call Key because the signing standard requires the owner's full-access key. Do not give such a key to the execution agent. The testnet execution arm uses the capped vault and Tidepool adapter instead. Ref Finance testnet is permanently unavailable and is not a supported venue.
- 1Click is mainnet-only; it has no testnet. Do not use it as a hackathon integration test dependency.
- Pyth Core NEAR feed is disabled unless a currently maintained contract/feed is verified.
- TEE attestation is deferred and **waived** for the zero-new-spend build (`WAIVED_BUDGET_CONSTRAINT`). Re-enable only with a direct, authorized NEAR AI Cloud account, current verification tooling and a fresh operator decision. Do not display a TEE badge until then.

## 15. Execution architecture (testnet proprietary arm)

**Vault contract:** `vault.dissent-demo.testnet` (Rust + `near-sdk`) holds testnet NEAR and exposes:

- `spend_as(certificate_id, recipient_id, amount_yocto, memo)` — the only method callable by the execution agent's Function Call Key.
- On-chain checks: predecessor is the configured agent ID; `amount_yocto` is within the per-transaction cap; the UTC-day spend remains within the daily cap; `recipient_id` is on the approved allowlist; `memo` contains the approved `certificate_id`; the certificate ID is approved by the owner after finalization; the contract has sufficient balance.
- Reverts carry readable reasons (cap breach, allowlist miss, unknown certificate, bad memo, insufficient balance).
- Owner-only `approve_certificate`, `set_recipient`, `set_caps`, `withdraw`; funding is payable.

**Agent key:** a dedicated testnet account receives only a **Function Call Key scoped to `vault.spend_as`**. The full-access key belongs to the deployer and is never loaded into the execution runtime, an attacker prompt, or a model tool. `NEAR_VAULT_AGENT_KEY` stores the function-call key.

**Execution adapter:** `packages/execution` exposes `execute(certificate_id, verdict)`:

- Refuses any verdict other than `TRADE`.
- Gated by `EXECUTION_ENABLED=true` (default `false`).
- Uses a Tidepool `/v0/quote` deposit address for the selected pair and calls `vault.spend_as` with the thesis position amount.
- The current vault only transfers native NEAR; Tidepool wNEAR deposits require a NEP-141 `ft_transfer` with storage registration. Until the vault is upgraded to token-aware wNEAR spending, execution remains `NOT_CONFIGURED`.
- Returns `EXECUTED` with a tx hash or `REVERTED` with the contract reason. It never retries a failed transfer.
- The vault enforces caps and allowlists on-chain; the adapter is not the security boundary.

**Venue precheck:** check Tidepool health, token catalogue and a dry wNEAR/USDC quote at `https://www.usetidepool.tech`. If the venue is unreachable, or the vault cannot fund its NEP-141 deposit, do not fake a trade. The certificate records `NOT_CONFIGURED` and execution remains disabled.

**Proprietary loop:** a pg-boss scheduled task (every 5 minutes, `PROPRIETARY_LOOP_ENABLED=true`, default `false`) reads Ref testnet NEAR/USDC pool state, originates a thesis, submits it through the same audit pipeline, and invokes the execution adapter only after a `TRADE` certificate. A `REFUSE`/`ABSTAIN` is logged without execution. Proprietary inference spend is tracked in a separate cost ledger from client audits.

**Boundary:** testnet only. No mainnet trade execution, no arbitrary recipient, no full-access key in any runtime, no model wallet access.
