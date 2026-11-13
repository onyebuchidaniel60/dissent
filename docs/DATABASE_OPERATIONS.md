# Dissent — Database Operations and Transaction Specification

This document defines atomicity, concurrency, replay and ownership rules for important domain actions. The relational model is in `DATA_MODEL.md`; API contracts are in `API_SPEC.md`.

## 1. General rules

- All mutations use a service-layer transaction. Do not write directly from route handlers or model tools.
- Every tenant-owned lookup derives `workspace_id` from the authenticated principal and filters by it.
- Use conditional state transitions (`UPDATE ... WHERE status = expected_status`) or row locks. A stale request must not overwrite a newer state.
- Every mutation records an `audit_events` row in the same transaction.
- External network calls must not be held open inside a long-running database transaction. Persist intent/outbox state, call the external service, then verify and commit the result.
- Use exact decimal/integer arithmetic for all NEAR amounts.
- Job enqueueing must be transactionally coupled to the state transition. Use pg-boss transaction integration or a transactional outbox; never commit `FUNDED` then risk losing dispatch without a recoverable outbox record.

## 2. Create audit preparation

```text
BEGIN
  authenticate principal and resolve workspace_id
  verify Idempotency-Key
  canonicalize normalized thesis + conditions (RFC 8785)
  calculate thesis_hash, conditions_hash, request_hash
  SELECT existing audit WHERE workspace_id + idempotency_key FOR UPDATE
  if existing and request_hash matches: return existing audit
  if existing and request_hash differs: return 409 CONFLICT
  INSERT audits(status=AWAITING_COMMITMENT, hashes, policy_version, idempotency_key)
  INSERT theses
  INSERT failure_conditions (all condition IDs unique)
  INSERT audit_events(PREPARED)
COMMIT
```

Never submit model calls or chain transactions in this DB transaction.

## 3. Record commitment

1. API receives client transaction hash.
2. Verify transaction on trusted NEAR testnet RPC outside DB transaction.
3. Verify chain/network, contract account, method, predecessor/client account, audit ID, hashes, canonicalization/policy versions, execution outcome and finality.
4. Begin DB transaction; lock audit row.
5. Ensure audit state is `AWAITING_COMMITMENT`; if already committed with same tx/hashes, return prior success; if mismatch, reject.
6. Insert unique commitment row; update audit state to `AWAITING_FUNDING`; append event.
7. Commit.

A transaction hash alone is not proof until receipt and expected state are confirmed. Never accept a caller-supplied hash without verifying the chain record.

## 4. Quote and funding verification

### Issue quote
- Lock audit row; require `AWAITING_FUNDING`.
- Calculate fixed amount/split from operator configuration and policy version.
- Persist immutable quote with expiry and unique quote hash.
- Quote amount must be integer yoctoNEAR.

### Verify fund transaction
- Verify NEAR transaction/receipt and contract state outside DB transaction.
- Begin transaction; lock audit and quote.
- Require matching audit, client, network, contract, amount, quote ID/hash, expiry and unused state.
- Insert unique payment row; set quote used; transition audit `AWAITING_FUNDING → FUNDED`.
- Insert an outbox/job record or pg-boss job in same transaction.
- Commit.

Duplicate same transaction/hash is idempotent. A second distinct funding transaction for an already funded audit is not silently accepted as a second fee; route to explicit refund/manual handling.

## 5. Dispatch eight attackers atomically

```text
BEGIN
  SELECT audit FOR UPDATE
  require status = FUNDED
  require commitment FINAL and fee payment VERIFIED
  INSERT one attacker_run per A01..A08 at run_generation=1
    ON CONFLICT DO NOTHING only when exact same generation is already present
  INSERT audit_events(ATTACKS_QUEUED)
  enqueue 8 pg-boss jobs with unique key (audit_id, attacker_id, generation)
  transition audit FUNDED -> QUEUED
COMMIT
```

A job worker claims its own run with an atomic `QUEUED → RUNNING` conditional update. It can only persist its own result. No job payload contains another attacker's run/result ID.

## 6. Seal attacker outputs

- Each worker validates its response against JSON Schema and semantic checks before storing as a completed output.
- Store immutable raw output reference, parsed output, trusted provenance, evidence IDs and validation report.
- Retry creates a new `run_generation`; never overwrite original raw output.
- After all eight initial runs are terminal, coordinator writes `ATTACKER_SET_SEALED` event. Only after that event may the review/adjudication service query all outputs.

## 7. Evidence/review updates

- Evidence creation is scoped to `audit_id` and `attacker_run_id`; IDs are server-generated.
- Evidence refetch inserts a new verification record/generation rather than mutating source observation.
- Evidence Auditor and Sycophancy Auditor records are append-only. A correction adds a new review version with reason.
- Finding disposition updates use conditional transition; accepted/rejected records are immutable after certificate finalization.

## 8. Adjudication and certificate

```text
BEGIN
  lock audit row
  require status = REPRODUCIBILITY_CHECK or approved exceptional path
  verify eight outputs sealed or accepted REFUSE-disqualifier path
  load one pinned policy version and immutable reviewer records
  run deterministic policy function (pure function)
  persist adjudication + gate-by-gate trace
  build canonical redacted certificate document
  calculate certificate_hash over canonical bytes
  insert certificate(status=PENDING)
  transition audit -> CERTIFICATE_PENDING
  append event
COMMIT
```

Chain anchoring occurs outside the DB transaction. When confirmed, update certificate `anchor_status=ANCHORED`, store chain tx/block and transition to `COMPLETED`. If anchoring fails, keep `CERTIFICATE_PENDING` or `CERTIFICATE_FAILED`; do not show completed/verified.

A pure policy function should be deterministic and testable without database/LLM access. Persist inputs by reference and output gate trace.

## 9. Bounty and reputation settlement

- Generate reward rows only from final `ACCEPTED` findings and pinned bounty policy.
- Use one transaction to insert allocation rows with unique IDs and compute caps against the locked audit pool and attacker cap.
- Settlement transaction ID is unique. A retry with same ID returns prior state; different amount/recipient for same ID is rejected.
- Never allow attacker runtime to call settlement or set acceptance state.
- Reputation increments use unique event keys and occur only once after the final certificate.

## 10. Cancellation and expiry

- Before commitment: client may cancel; transition to `CANCELLED_BEFORE_COMMIT` and preserve prepared record/event.
- After commitment but before funding: allow expiry/stop request; preserve immutable commitment; create explicit cancelled/incomplete audit record. It cannot be reused as a new audit.
- After attacker dispatch: no destructive cancel. A stop request halts unstarted jobs where safe; running outputs are preserved, and adjudication produces `ABSTAIN` unless a verified disqualifier produces `REFUSE`.
- Quote expiration invalidates only that quote; issue a new quote with new ID/hash. Never change an issued quote in place.

## 11. Concurrency and race conditions

| Race | Guard |
|---|---|
| Two prepare requests same idempotency key | Unique `(workspace_id,idempotency_key)` plus request hash comparison |
| Two commitment confirmations | Lock audit, unique tx hash and commitment per audit |
| Two funding transactions | Unique payment/audit + quote used state + contract quote state |
| Duplicate queue delivery | Unique run generation/job key and conditional state transition |
| Worker timeout after provider response | Idempotent persist by provider request ID + run generation; duplicate output does not create second finding set |
| Two reviewers update one finding | Append-only review versions, no last-write-wins |
| Two adjudicators | Unique adjudication `(audit_id,policy_version)` and row lock |
| Two certificate anchor attempts | Unique certificate hash/transaction state and idempotent contract method |
| Concurrent bounty cap calculation | Lock audit pool and attacker allocation rows; atomic integer updates |
| Duplicate payout | Unique settlement ID in DB and contract |

## 12. Outbox and recovery

For any DB state that requires an external job/chain call, persist an outbox record with immutable payload hash and unique key. A dispatcher retries until acknowledged or a bounded terminal failure is recorded. A recovery task scans stale `RUNNING` / `PENDING` states and creates a new generation only after confirming the previous worker/provider request cannot still commit. Do not use a generic retry that overwrites evidence.
