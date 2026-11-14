# Dissent — Consolidated Operator Intake / Readiness Check

**Purpose:** One intake before repository changes. The coding agent must inspect the repository/environment first, prefill known answers, and ask only for genuinely missing required inputs in one consolidated message. Do not expose secret values in this file; record secret-manager references and validation status instead.

| Area | Required input | Status at blueprint handoff | Required/optional | Safe default / authorization boundary |
|---|---|---|---|---|
| Product | Approve Dissent product definition, eight roles, Section A/B, visible conditions, no-majority verdicts | Frozen by handoff | Required | Do not redesign; raise documented contradiction only |
| Scope | Preserve MVP: audit pipeline + testnet commitment/certificate + verified TEE attestation; no live trades | Frozen by handoff | Not an intake question | No mainnet trade or real payout; report only a genuine repository/security conflict |
| Operator | Initial admin email/identity and access policy | Missing | Required | No public self-signup |
| Client access | Client API-key issuance owner and demo client identity | Missing | Required | Create scoped test key; reveal once, hash at rest |
| UI reference images | Exact image files/paths, source/ownership, intended screens, responsive expectations | **Missing; no reference image attached** | Required before implementation | Ask operator during this intake; agent-generated reference requires explicit permission |
| Product assets | Logo, wordmark, icons, screenshots, brand colors/fonts if owned | Missing | Optional | Use neutral text brand until supplied; do not invent third-party assets |
| Repository | Git URL, branch, write permission, public/private setting, existing agent instructions | Missing | Required | Preserve existing work; do not force-push or make repo public without approval |
| Git identity | Commit name/email or authorized credential | Missing | Required for commits | Do not invent identity |
| Deployment | Railway workspace/project access, preview domain, environment secret access | Missing | Required for hosted preview | Default Railway; if unavailable, continue local and record preview blocker, do not choose paid alternative without approval |
| Database | PostgreSQL URL/service and separate preview DB | Missing | Required | No production DB in preview |
| AI provider A | OpenAI API key, allowed model ID, quota/rate limit, spending ceiling | Missing | Required | Provider family A; server-only secret |
| AI provider B | Anthropic API key, allowed model ID, quota/rate limit, spending ceiling | Missing | Required | Provider family B; server-only secret |
| NEAR AI Cloud | API key, available open-weight model IDs, quotas, attestation verification access | Missing | Required | Must verify deployment + response signatures; no unverified TEE claim |
| Model policy | Operator-approved per-audit and total inference cost ceilings | Missing | Required | No paid inference until ceiling recorded |
| NEAR testnet | Client wallet/signing method, deployer account, signing credential reference, RPC endpoint | Missing | Required | Use testnet only; secret stored in environment/secret manager |
| Contract accounts | Registry account ID; optional escrow account ID | Missing | Required for on-chain demo | Never deploy to mainnet without separate explicit approval |
| Client commit | How client signs `commit_conditions` (wallet UI, agent-supplied tx, or signed payload) | Missing | Required | Dissent verifies client-originating commit; it does not silently substitute its own signer |
| Testnet economics | Fixed demo audit fee, bounty pool amount, reserve split and quote expiry | Missing | Required for testnet funding demo | Testnet-only; amounts are configured and have no real value |
| Attacker payout | Eight testnet recipient account IDs or approved test payout mapping | Missing | Required only if testnet payout included | No real mainnet payments |
| Data APIs | FastNear API key/RPC; Pikespeak key; NearBlocks API key; RedStone feed/connector config | Partly optional | Required: at least two working evidence adapters; others optional | Do not depend on unverified MCP package; no Pyth assumption |
| Data policy | Supported assets, chains/contracts, freshness, source allowlists | Partly specified | Required | NEAR mainnet market data for audit example, but contract deployment testnet unless authorized |
| Storage | Object storage credentials if private payload storage is selected | Missing | Optional for MVP | Store capped normalized evidence in Postgres initially |
| Email/notifications | Email provider/account | Missing | Optional | Polling only; no email integration by default |
| Webhooks | Whether client callback is required and exact trusted destinations | Missing | Optional | Disabled in MVP to avoid SSRF/outbound URL risk |
| Paid services | Total budget and specific services permitted | Missing | Required | Default ceiling = 0 until explicitly authorized |
| Production | Whether production deployment is authorized, exact domain and release scope | Not granted | Required only for production release | Preview deployment is not production authority |
| Mainnet | Whether registry deployment, real transfers or wallet actions are authorized | Not granted | Required for any mainnet action | Default: no mainnet transaction involving funds |
| Data/privacy | Client-data classification, retention period, permitted demo data, redaction rules | Missing | Required | Use synthetic demo thesis and test portfolios; no sensitive data in demo |
| Demo | Audience, key journey, pronunciation (Dissent), output path, voice preference | Partly specified | Required | 90–150 seconds, hard max 180 seconds |
| TTS | Check free Google AI TTS availability; use only within free quota/terms, otherwise use a genuinely free permitted fallback | Pending verification | Required task; Google credential optional | No paid usage without explicit budget/authorization |
| Publicity | Permission to publish repository and post demo on X; account identity | Missing | Required for external publication | Never post or change repo visibility without approval |

## Completed intake record — 2026-11-13

**Status:** PASS. No unresolved critical input. The operator answered the consolidated intake in one round. Secret values are not recorded here; only references and validation status.

### Constraints and authority

| Area | Recorded decision |
|---|---|
| New spend | `$0.00`. No card charges, paid hosting, paid TTS or auto-billing trials. |
| Inference budget | Pre-purchased OpenRouter credit only. Remaining at intake: `$7.747`. Per-audit ceiling: `$0.50`. |
| Hosting | Render free Web Service + Neon free PostgreSQL. No Render Postgres. No Railway. |
| Production | **Not authorized.** Preview only. |
| Mainnet | **Not authorized.** No mainnet transaction. |
| Repository | Public, `main`, MIT. Write access verified (GitHub ADMIN). |
| Git identity | `trurntt <onyebuchidaniel60@gmail.com>`. |
| Publicity | Repo is public. Prepare demo assets only; do not post to X. |
| TEE | `WAIVED_BUDGET_CONSTRAINT` (C4). No TEE badge; disclosure required. |
| Model vendors | OpenRouter primary + Groq secondary. One OpenAI-compatible adapter. No OpenAI/Anthropic SDKs. |
| Human auth | NEAR Wallet Selector + signed-nonce session only. No email/password or Better Auth. |
| Admin gate | Server-side allowlist `ADMIN_WALLET_ADDRESSES`; current value is the operator testnet account. |
| Demo client | `demo-client.testnet`; agent-supplied signed transaction for deterministic E2E. |
| Testnet deployer | `dissent-demo.testnet`; registry `registry.dissent-demo.testnet`; escrow `escrow.dissent-demo.testnet`; payout `payout.dissent-demo.testnet`. |
| RPC | `https://rpc.testnet.near.org` primary; `https://free.rpc.fastnear.com` fallback. |
| Testnet economics | Fee `0.1 NEAR`; 80/20 bounty/reserve; quote expiry `900s`; caps in `docs/ECONOMICS_SPEC.md`. |
| Data adapters | FastNEAR public RPC + NearBlocks public API. Pikespeak and RedStone skipped. Demo asset NEAR/USDC on Ref Finance. Read-only mainnet market data allowed. |
| Data/privacy | Synthetic demo data only. 30-day retention for private payloads/evidence. |
| Demo | Audience: NEAR Hackathon judges, AI-agent developers, DeFi operators. Pronunciation: “dih-SENT”. Output `demo/`. ElevenLabs voice ID supplied via `ELEVENLABS_VOICE_ID`. |
| UI references | `design/dissent-reference1.webp` (2048×1536) and `design/dissent-reference2.webp` (2018×12858); operator-owned, inspected, mapped in `REFERENCE_ASSETS.md`. |

### Credential validation (values never printed)

| Credential | Validation |
|---|---|
| OpenRouter | PASS — `/key` and `/credits`; 436 models; selected slugs exercised. |
| Groq | PASS — `/models`; `openai/gpt-oss-120b` present; completion exercised with an explicit User-Agent. |
| Render | PASS — owner/service list; free web service created. |
| Neon | PASS — pooled and direct `select 1`. |
| ElevenLabs | PASS — voice metadata and free-tier subscription (10,000 characters). |
| NEAR testnet RPC | PASS — `status` 200. |
| FastNEAR public RPC | PASS — `status` 200. |
| NearBlocks API | PASS — public `stats` 200. |

### Document conflicts resolved

1. `commit_audit` is authoritative; UI may say “Commit conditions”.
2. `docs/API_SPEC.md` governs REST routes.
3. `docs/UI_UX_SPEC.md` governs UI routes.
4. Escrow/funding is required; accounting-only fallback is allowed if the transfer path cannot be safely tested.
5. `DISSENT_IMPLEMENTATION_BLUEPRINT.md` is non-authoritative and left untouched.
6. Attacker schema revision 1.1 / payload 1.0 needs no ruling.
7. Missing `.env.example` variables were added in Phase 1.

### Resulting deviations (documented, not hidden)

- TEE attestation waived under C4; recorded in `AGENTS.md`, `ARCHITECTURE.md`, `README.md` and the certificate UI.
- Render free + Neon free replaces Railway; pg-boss runs in-process with reduced concurrency.
- OpenRouter + Groq replace direct OpenAI/Anthropic; one generic adapter is used.
- Better Auth is removed; wallet-selector + signed-nonce sessions are the only human auth.
- Some preferred model slugs were absent from the live catalogue; substitutions preserve distinct families and are recorded in `config/model_assignments.json`.

## Intake completion rules
1. Read all existing repository/environment data first and do not ask for known items.
2. Ask one consolidated set of unresolved critical questions; clearly separate optional choices.
3. A credential is considered available only after a non-destructive authentication/health check. Do not print it.
4. Verify actual model IDs and provider quotas. Confirm three distinct model families, two vendors, and a verifiable NEAR AI TEE response.
5. Confirm at least two independent evidence adapters are usable for the chosen demo asset. Do not label Pyth as an active NEAR source without proof.
6. Verify testnet transaction signing and registry access. Confirm the client commitment signer matches the declared client identity.
7. Record exact cost ceilings and whether preview, mainnet and production actions are authorized separately.
8. Do not start code modifications while reference images or other critical requirements are missing.
