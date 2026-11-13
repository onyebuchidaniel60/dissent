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

## Intake completion rules
1. Read all existing repository/environment data first and do not ask for known items.
2. Ask one consolidated set of unresolved critical questions; clearly separate optional choices.
3. A credential is considered available only after a non-destructive authentication/health check. Do not print it.
4. Verify actual model IDs and provider quotas. Confirm three distinct model families, two vendors, and a verifiable NEAR AI TEE response.
5. Confirm at least two independent evidence adapters are usable for the chosen demo asset. Do not label Pyth as an active NEAR source without proof.
6. Verify testnet transaction signing and registry access. Confirm the client commitment signer matches the declared client identity.
7. Record exact cost ceilings and whether preview, mainnet and production actions are authorized separately.
8. Do not start code modifications while reference images or other critical requirements are missing.
