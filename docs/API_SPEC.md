# Dissent — API Specification

**Base path:** `/api/v1`  
**Format:** JSON over HTTPS  
**Versioning:** URL path + schema version  
**Auth:** scoped bearer API key for client agents; secure session for browser console

## 1. Shared response/error contract

Success responses return JSON with a stable resource shape and `request_id`. Errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid.",
    "request_id": "uuid",
    "details": [{"path": "conditions[0].threshold", "code": "REQUIRED"}]
  }
}
```

Never include stack traces, database details, secret values, provider raw errors, or other tenant information. Use the same response for a resource that does not exist and one the caller is not authorized to see where enumeration is a concern.

## 2. Endpoints

### `POST /audits/prepare`
Purpose: validate and normalize a thesis and conditions, calculate canonical hashes, and create a draft that awaits client commitment.

Auth: `audit:create`.

Headers: `Idempotency-Key` required (16–128 printable chars).

Request:
```json
{
  "thesis": {
    "asset": {"chain": "near", "asset_id": "nep141:...", "symbol": "NEAR"},
    "action": "BUY",
    "direction": "LONG",
    "rationale": "...",
    "position": {"amount": "100", "unit": "NEAR", "notional_usd": "250"},
    "time_horizon": {"value": 7, "unit": "DAY"},
    "execution_venue": "REF_FINANCE"
  },
  "conditions": [
    {
      "condition_id": "FC-001",
      "description": "NEAR price below USD 2.50 at the evaluation snapshot",
      "metric": "PRICE_USD",
      "operator": "LT",
      "threshold": "2.50",
      "unit": "USD",
      "evaluation_window": {"value": 7, "unit": "DAY"},
      "severity": "CRITICAL"
    }
  ]
}
```

Validation: supported action/asset; unique condition IDs; numeric thresholds use decimal strings and explicit unit/operator; time window valid; non-empty rationale; payload size limits; no arbitrary data URL. The example is illustrative and not an investment recommendation.

Success: `201` with `audit_id`, normalized thesis/condition echo, `thesis_hash`, `conditions_hash`, `canonicalization_version`, `policy_version`, status `AWAITING_COMMITMENT`, and exact transaction arguments. Hashes are lowercase SHA-256 hex after RFC 8785 canonicalization.

Side effects: insert audit + thesis + conditions + event in one DB transaction. No attacker job is enqueued.

### `POST /audits/{audit_id}/commitment/verify`
Purpose: accept a submitted NEAR testnet transaction hash and verify the client's commitment.

Auth: `audit:commit` and owner workspace match.

Request: `{ "transaction_hash": "..." }`.

Validation: strict transaction hash format; chain must be testnet; expected contract, method, predecessor, audit ID and hashes must match prepared record; finality status must meet configured commitment finality policy.

Success: `200` status `COMMITTED` or `202` `COMMITMENT_PENDING` if finality not yet established. The handler is idempotent.

Side effects: store chain tx and commitment receipt. Never create attacker work before verified commitment.

### `POST /audits/{audit_id}/funding/quote`
Purpose: issue fixed, quote-bound testnet audit fee/bounty quote.

Auth: owner + `audit:fund`.

Request: `{}`.

Success: quote ID, quote hash, exact amount in yoctoNEAR string, network, contract ID, expiry, fee/bounty split and policy version. Quote amount is configured by Dissent operator, not model output.

### `POST /audits/{audit_id}/funding/verify`
Purpose: verify the client's exact testnet deposit transaction.

Auth: owner + `audit:fund`.

Request: `{ "transaction_hash": "..." }`.

Success: `FUNDED` only after contract state confirms exact amount, caller, quote and audit.

Side effects: one-time funding state update and `audit.dispatch` enqueue. Unique dispatch key prevents duplicates.

### `GET /audits`
Purpose: list caller-owned audits.

Auth: `audit:read`.

Query: `cursor`, `limit` (1–50), `status`, `created_after`, `created_before`.

Success: cursor page of redacted audit summaries. No cross-workspace search.

### `GET /audits/{audit_id}`
Purpose: retrieve owner-scoped audit state.

Auth: `audit:read`.

Success: status timeline, commitment/funding references, eight run statuses, review stages, verdict if finalized, certificate reference.

### `GET /audits/{audit_id}/results`
Purpose: retrieve result details after the audit is sealed and client visibility is released.

Auth: `audit:read` and owner.

Success: coverage matrix, condition assessments, accepted/rejected findings, evidence excerpts, minority findings, divergence and review summaries. Do not return prompts, chain-of-thought, provider credentials, or private internal logs.

### `GET /audits/{audit_id}/certificate`
Purpose: retrieve the complete redacted certificate JSON.

Auth: owner; optionally public fields are available from certificate verify route.

### `GET /certificates/{certificate_id}/verify`
Purpose: public hash verification.

Auth: none; rate-limited.

Success: public certificate metadata, on-chain transaction/reference, locally recomputed hash, on-chain stored hash and `VERIFIED`/`MISMATCH`/`NOT_FOUND`. Never expose unredacted thesis or private evidence.

### `POST /operator/audits/{audit_id}/retry`
Purpose: retry one eligible failed attacker/review stage.

Auth: Dissent OWNER or OPERATOR with `audit:retry`; step-up auth for production-like credentials.

Request: `{ "attacker_id": "A06", "reason": "provider timeout" }`.

Rules: bounded retries; same input snapshot and method; model substitution only if diversity remains valid and is recorded. Original run is immutable; create new `run_generation`.

### `GET /operator/health`
Purpose: provider, database, queue, NEAR RPC and contract readiness summary.

Auth: operator role; return no secrets or raw endpoints with embedded keys.

### `GET /health/live` and `GET /health/ready`
Purpose: liveness/readiness probes. Readiness checks DB and queue; optional providers may be reported degraded without crashing liveness.

## 3. Error codes

- `VALIDATION_ERROR` 400
- `UNAUTHENTICATED` 401
- `FORBIDDEN` 403
- `NOT_FOUND` 404
- `CONFLICT` 409 (immutable audit, duplicate idempotency conflict, invalid state transition)
- `COMMITMENT_NOT_FINAL` 409/202 depending endpoint contract
- `FUNDING_REQUIRED` 409
- `RATE_LIMITED` 429
- `PROVIDER_UNAVAILABLE` 503
- `INTERNAL_ERROR` 500

## 4. Security/rate limits

- Prepare and commit endpoints: per API key + IP; strict request size caps.
- Status reads: per key and IP.
- Public certificate verification: IP rate limits and cache for public chain reads.
- Operator actions: strict RBAC, audit events and re-auth for settlement/config mutation.
- Require Idempotency-Key for prepare and any financial or enqueueing operation.
- No arbitrary webhook registration in MVP; outbound callbacks are disabled.

## 5. API invariants

- Authenticated tenant comes from principal, never payload.
- Every query filters by workspace/client ID.
- Audit state changes use conditional updates/transaction locks.
- Commitment and funding verification are idempotent.
- Job creation is atomic with the status transition using an outbox or queue transaction pattern supported by pg-boss.
- No request route performs long-running model calls inline; all inference is worker-backed.

## 6. Implemented addenda (Phase 5)

The following routes are implemented in addition to the baseline contract:

- `POST /api/v1/auth/nonce` — create a single-use NEP-413 challenge for a NEAR account.
- `POST /api/v1/auth/verify` — verify the signed NEP-413 payload and access key, then set the HttpOnly session cookie.
- `GET /api/v1/auth/session` — return the current wallet session and admin flag.
- `POST /api/v1/auth/logout` — revoke the server session and clear the cookie.
- `POST /api/v1/ui/audits/prepare` — session-authenticated console draft creation; delegates to the same prepare service as the API-key route.
- `GET /api/v1/audits/{audit_id}/results` — owner-scoped coverage, findings, evidence and adjudication.
- `GET /api/v1/audits/{audit_id}/certificate` — owner-scoped finalized certificate.
- `GET /api/v1/audits/{audit_id}/events` — owner-scoped event history.
- `GET /api/v1/certificates/{certificate_id}/verify` — public hash recomputation plus registry comparison.

Auth notes:

- Client agents use `Authorization: Bearer ds_test_...`.
- Human console requests use the HttpOnly `dissent_session` cookie; mutations check the request origin when present.
- Admin/operator access requires the verified wallet account to be in `ADMIN_WALLET_ADDRESSES`.
- Every JSON response carries `request_id`; errors use the shared envelope.

The commitment route is `POST /api/v1/audits/{audit_id}/commitment/verify`. All attacker dispatch is worker-backed; no route performs inference inline.
