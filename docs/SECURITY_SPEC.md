# Dissent — Security Specification and Threat Model

**Version:** 1.0
**Scope:** Production-readiness release (mainnet-ready application and contracts; execution disabled by default; no mainnet funds move without separate authorization)
**Security posture:** Fail closed for any financial or verdict-critical uncertainty

## 1. Assets and trust boundaries

### Protected assets
- Client API credentials and operator sessions.
- Client thesis, conditions preimage, portfolio/exposure data and private evidence.
- Model provider credentials and quota/budget settings.
- Attacker prompts, tool grants, model outputs and run provenance.
- Evidence raw payloads and retrieval locators.
- Adjudication policy, certificate preimages and audit event log.
- NEAR deployer/owner signing credentials and escrow balances. The preview remains a testnet staging environment; mainnet custody requires a multisig/timelock owner and separate authorization.

### Trust boundaries
1. Browser/client to API.
2. Workspace/tenant boundary.
3. API to PostgreSQL and job queue.
4. Orchestrator to each attacker runtime.
5. Attacker runtime to model provider and data adapters.
6. Evidence Auditor to external sources.
7. Backend relayer to NEAR RPC/contracts.
8. Operator/admin console to privileged control plane.
9. Preview/staging environment to production accounts.

Treat browser input, model output, chain metadata, external API payloads and all retrieved text as untrusted.

## 2. Threats and controls

| Threat | Required controls | Verification |
|---|---|---|
| Broken authentication/session theft | Secure HttpOnly SameSite cookies; short-lived sessions; CSRF protection for cookie mutations; session rotation; MFA where supported | Session lifecycle tests; cookie inspection |
| API key disclosure | High-entropy one-time display; store only salted hash/HMAC; prefix for lookup; scoped permissions; revoke/rotate; redact logs | Secret scanning and API key lifecycle tests |
| IDOR/cross-tenant read | Derive workspace from principal; all repositories require workspace scope; never trust body workspace ID | Cross-tenant integration tests for every object route |
| Privilege escalation | Server-side RBAC; OWNER-only config; OPERATOR cannot edit policy or trigger payment; audit privileged actions | Negative role matrix tests |
| Prompt injection from external data | Retrieved content treated as data; isolate untrusted fields; no direct tool control from data; no tool description hidden in source text | Injection fixtures for website/token metadata |
| Model exfiltration | No secrets or wallet keys in prompts; per-run data minimization; provider DPA/settings reviewed; retention controls | Prompt snapshot assertions and secret canary tests |
| Cross-attacker leakage | Separate context, run IDs, tool grants and repository views; attackers cannot query findings/run tables; outputs sealed until all runs closed | Adversarial integration test attempts sibling read |
| Arbitrary tool/network access | No shell, arbitrary fetch, filesystem, raw SQL or unrestricted RPC tools; all external reads through typed allowlisted adapters | Tool grant allowlist test |
| SSRF | No model-generated URL fetch; fixed adapter hosts; DNS/IP validation; reject redirects/private/link-local/metadata IPs; bounded response size/time | SSRF corpus against evidence adapters |
| SQL/NoSQL injection | Parameterized Drizzle queries; validation; no raw SQL from models; least-privilege DB accounts | Static analysis and integration tests |
| XSS | React escaping; sanitize markdown/links; strict Content Security Policy; avoid unsafe HTML | Playwright payload tests |
| CSRF | SameSite cookies + CSRF token/origin checks for cookie-authenticated mutations; API-key clients use Authorization header | Cross-origin form test |
| Brute force/enumeration | Rate limit auth, API keys and audit lookup; unguessable IDs; uniform not-found/denied responses | Rate-limit tests |
| Replay/double submit | Idempotency keys; committed audit immutability; on-chain transaction/nonce verification; unique settlement IDs | Duplicate transaction/job tests |
| Race condition/duplicate bounty | DB unique constraints + serializable/row-lock transaction; contract idempotency; pull-based claims | Concurrent settlement tests |
| Malicious/false evidence | Typed source adapters; source identity/time; payload hash; re-fetch; explicit contradictions and limitations | Source fixture and tamper tests |
| Model schema manipulation | JSON Schema + semantic validation; additionalProperties=false; strict enums; trusted metadata overwrite | Fuzz/invalid-output tests |
| Cost exhaustion | Per-audit token/cost ceilings; provider rate limits; bounded retries; audit quota; circuit breaker | Budget guard tests |
| Admin abuse | Least privilege, re-auth for sensitive actions, append-only admin audit trail, no arbitrary verdict override | Privilege boundary test |
| Key compromise | Testnet-only keys in secret manager, restricted deployer scope, no key in app/LLM, rotation and revoke procedure | Secret scan; documented rotation drill |
| Unsafe production action | Exact scope authorization in intake; separate preview/prod credentials; release confirmation not inferred | Deployment policy test |

## 3. Attacker sandbox and tool policy

An attacker may receive only:
- its immutable thesis/condition input snapshot;
- its specialist method and permitted source list;
- typed read-only functions for retrieving approved on-chain/market data;
- evidence creation function that returns a server-generated evidence ID;
- its own response schema and run metadata.

It must not receive:
- API/provider secrets;
- private keys, wallet signing tools or transfer tools;
- direct database access;
- sibling output or prior adjudication state;
- unrestricted HTTP, browser, shell, filesystem or arbitrary RPC methods;
- client authentication tokens.

At minimum, separate context and tool grant by attacker run. Prefer isolated worker process/container per run if available and affordable; otherwise use independent context objects with hard repository-level read scopes and test them. Do not overstate process separation as a hardware sandbox.

## 4. Evidence-source adapter controls

- Each adapter has a fixed provider base URL and typed parameter schema.
- No source URL from model output is ever dereferenced.
- Verify TLS and hostname; disallow redirects unless target is an explicitly allowlisted host.
- Reject private, loopback, link-local, IPv6 local and cloud metadata address ranges after DNS resolution; re-check redirect targets and resolved IPs.
- Enforce response timeouts, byte caps, content-type checks and JSON depth limits.
- Redact account identifiers where not necessary; do not log raw payloads.
- Record adapter version, retrieval time, source timestamp, block height/hash where possible, canonical payload hash, normalized fields and limitations.
- If an adapter cannot retrieve the historical observation, classify it `UNVERIFIABLE` or `NOT_REPLAYABLE_SOURCE_LIMITATION`; do not call it `VERIFIED` just because the same endpoint currently returns a value.

## 5. NEAR wallet and contract security

- The application is mainnet-ready. The preview/staging environment remains on testnet. Mainnet contract deployment and real-fund execution require a separate explicit authorization record.
- Client conditions commitment is signed by the client identity/wallet, and backend verifies signer, contract account, method, audit ID, hashes and finality.
- Dissent does not request a client's Full Access key.
- No signing key is sent to models or worker prompts.
- Contract owner/deployer key is not the client identity and is never silently used as a substitute client signer.
- `DissentRegistry` owner can configure trusted relayer/controller accounts and policy hash but cannot mutate a finalized commitment/certificate.
- Escrow only accepts exact quote-bound deposits; refunds follow explicit state rules.
- Settlement records are one-time and idempotent; use pull-based payout claim if implemented.
- Contract code is locally unit-tested and sandbox-tested before staging deployment. A mainnet deployment uses the `#[init]` source, a fresh account and an independently reviewed owner/multisig.
- No mainnet deployment or transfer without separate explicit authorization.

## 6. NEAR AI Cloud TEE verification

For the designated open-weight attacker:
1. Fetch and validate the relevant model attestation against the vendor's verification chain/trust anchors.
2. Confirm the requested model ID and signing address match the approved model assignment.
3. Preserve the exact request/response bytes required by the SDK verifier; do not parse/re-serialize before checking signatures.
4. Verify the per-completion signature.
5. Require model/provider TEE signature for the TEE-qualified run. A gateway-only signature is a separate gateway integrity signal and does not alone prove which model generated the result.
6. Store signature kind, attestation hash, signing identity, verifier version, verification outcome and timestamp.
7. On verification error, mark that run `TEE_UNVERIFIED`; it cannot satisfy the `TRADE` gate.

## 7. Data classification

| Class | Examples | Storage/access |
|---|---|---|
| Public | On-chain hashes, public contract address, public certificate fields | May be exposed by verifier |
| Client-confidential | Thesis preimage, failure conditions, positions, private client metadata | Workspace-scoped; not public by default |
| Sensitive | API key hashes, provider tokens, wallet public-key metadata linked to clients | Restricted backend; never logged raw |
| Secret | Provider API keys, NEAR signer keys, session secrets | Secret manager/environment only; server-side only; never database plaintext or prompt |
| Operational | Job metrics, run cost, redacted logs | Operator access; bounded retention |

## 8. Incident and recovery rules

- Revoke compromised API key/session and provider credentials.
- Pause only affected integration/queue; do not falsify successful status.
- Preserve raw run output and evidence hashes with restricted access.
- Mark impacted audits incomplete and force `ABSTAIN` unless an independent disqualifier supports `REFUSE`.
- Never rewrite finalized certificates; issue a linked superseding correction record if required.
- Record timeline, scope, impact, remediation and affected audit IDs.

## 9. Release security gate

No unresolved critical/high finding in application security review; no exposed secrets; all tenant authorization and replay/duplicate tests pass; contract tests pass; preview and production credentials are separated; mainnet execution disabled by default and no mainnet deployment without authorization; admin/worker permissions minimized; dependency and container scan completed; backup/restore and rollback instructions documented.
