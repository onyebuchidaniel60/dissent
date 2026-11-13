# Dissent — Error and Edge-Case Matrix

This matrix is normative for MVP test planning. For every failure, preserve the original input and event history; do not silently map failure to `NOT_HIT` or `TRADE`.

| Area | Case | System response | State/result | Recovery/test |
|---|---|---|---|---|
| Intake | Missing thesis or no conditions | Reject before hash/chain action | `VALIDATION_FAILED` | API validation unit test |
| Intake | Duplicate condition ID | Reject; identify duplicate path | `VALIDATION_FAILED` | Schema test |
| Intake | Incompatible units/operator | Reject unless explicit supported conversion | `VALIDATION_FAILED` | Unit normalization test |
| Intake | Same idempotency key, same payload | Return original audit | Existing state | Replay integration test |
| Intake | Same idempotency key, different payload | Conflict | `409 CONFLICT` | API test |
| Commitment | Wallet cancel/signature rejected | No commitment, no dispatch | `AWAITING_COMMITMENT` | Wallet mock E2E |
| Commitment | Wrong signer | Reject verification | `COMMITMENT_FAILED` or remain awaiting | Contract/RPC test |
| Commitment | Wrong thesis/conditions hash | Reject, never rewrite | `COMMITMENT_FAILED` | Hash mismatch test |
| Commitment | Wrong network/contract/method | Reject | `COMMITMENT_FAILED` | RPC receipt test |
| Commitment | Transaction not final | Wait/poll boundedly | `COMMITMENT_PENDING` | Finality fixture |
| Funding | Quote expired | Reject and issue new quote only if requested/allowed | `AWAITING_FUNDING` | Expiry test |
| Funding | Under/overpayment | Reject as funding | `AWAITING_FUNDING` | Contract tests |
| Funding | Duplicate funding transaction | Idempotent same tx; reject second tx | `FUNDED` | Replay test |
| Queue | Job duplicated | Run unique key prevents duplicate execution | One run generation | Concurrency test |
| Queue | Worker crashes before provider call | Reclaim within lease policy | `QUEUED`/retry | Worker recovery test |
| Queue | Worker crashes after provider response but before persist | Look up provider request ID; preserve or rerun new generation | `PARTIAL` until resolved | Fault injection |
| Attacker | Provider timeout/rate limit | Bounded backoff; record failure | `FAILED` if exhausted | Mock 429/timeout |
| Attacker | Provider substitution breaks diversity | Do not count as valid diversity | `TEE_UNVERIFIED` or `FAILED` | Diversity unit test |
| Attacker | Malformed JSON/schema mismatch | One repair, one fresh retry; then fail | `INVALID_OUTPUT`/`FAILED` | Schema fixtures |
| Attacker | Duplicate/unknown condition IDs | Reject entire response | `INVALID_OUTPUT` | Semantic validator |
| Attacker | Missing Section B justification | Flag and one bounded follow-up | Incomplete if still rejected | Auditor test |
| Attacker | Attempts to reference sibling output | Reject and security alert | `FAILED`/audit security event | Isolation penetration test |
| Attacker | Model says source was verified but no evidence ID | Ignore claim | Finding not accepted | Evidence ownership test |
| Evidence | Adapter unavailable | Record unavailable limitation | Evidence `UNVERIFIABLE` | Adapter outage fixture |
| Evidence | Current data differs from past snapshot | Compare timestamps/block hash; do not call stale data contradictory | `PARTIALLY_VERIFIED` or `UNVERIFIABLE` | Snapshot replay test |
| Evidence | Payload hash mismatch | Re-canonicalize/inspect source record; preserve both versions | Needs review | Tamper fixture |
| Evidence | Malicious URL/SSRF attempt | Reject; model URLs are never fetched | No evidence created | SSRF suite |
| Evidence | Source gives malformed/oversized payload | Reject, cap bytes/depth | `UNVERIFIABLE` | Payload fuzz test |
| Evidence | Conflicting independent feeds | Keep both observations and divergence | Adjudication may `ABSTAIN` | Conflict fixture |
| Red team | Evidence auditor unavailable | Do not skip | `REVIEW_FAILED` then ABSTAIN | Job failure test |
| Red team | Sycophancy auditor disagrees with deterministic novelty rule | Preserve both; policy decides conservative state | `NEEDS_REVIEW`/ABSTAIN | Conflict test |
| Red team | Attacker agrees with thesis but cites strong evidence | Do not reject solely due agreement | May be `ACCEPTED` | Positive-control test |
| Reproduction | Historical source snapshot cannot be replayed | Record limitation, no false assertion | `NOT_REPLAYABLE_SOURCE_LIMITATION` | Replay fixture |
| Reproduction | Re-run finding contradicts original with same snapshot | Mark conflict | `CONTRADICTED_ON_REPLAY` | Replay conflict test |
| Adjudication | Critical verified HIT | Disqualifying rule | `REFUSE` | Policy test T02 |
| Adjudication | Required attacker missing | Cannot TRADE | `ABSTAIN` unless independent disqualifier | T03 |
| Adjudication | Critical condition UNVERIFIABLE | Cannot TRADE | `ABSTAIN` | T06 |
| Adjudication | Critical condition INVALID_TEST accepted | Cannot TRADE | `ABSTAIN` | T07 |
| Adjudication | Unresolved critical divergence | Do not vote/average | `ABSTAIN` | T09 |
| Certificate | Canonicalization/hash mismatch | Do not mark verified | Pending/failed | Hash fixture |
| Certificate | NEAR RPC unavailable | Keep pending; retry boundedly | `CERTIFICATE_PENDING` | RPC fault test |
| Certificate | Certificate already finalized | Return existing record only if hash matches | Completed/idempotent | Contract replay test |
| Bounty | Accepted finding with no funded reserve | Record unpaid allocation or no allocation per policy; never overspend | `UNFUNDED` | Pool cap test |
| Bounty | Rejected finding | Zero reward | `REJECTED` | Bounty unit test |
| Bounty | Duplicate settlement call | Return same settlement result; no second transfer | Existing state | Replay test |
| Bounty | Recipient not allowlisted | Reject settlement | `SETTLEMENT_REJECTED` | Contract test |
| Auth | Client requests another workspace audit | Uniform denied/not-found response | No data disclosed | IDOR test |
| Auth | Revoked API key reused | Reject | 401 | Key revocation test |
| UI | JS/API network fails | Show recoverable error; preserve entered content safely | No fake success | Playwright offline test |
| UI | User opens page during audit | Render server state, not a guessed progress value | Current lifecycle | E2E refresh test |
| UI | Public verifier RPC down | Show unavailable and last check time | Not marked verified | Public route test |
| Deploy | Preview credentials missing | Continue local tasks; log blocker | No false preview URL | Deployment check |
| Deploy | Cost limit reached | Stop new paid model calls; preserve job status | Incomplete/ABSTAIN | Budget guard test |
| Release | Production not authorized | Do not deploy production | Staging remains | Release policy test |

## Universal rules
- A failure is not a negative finding.
- An unavailable provider does not count as a successful attacker run.
- An incomplete audit cannot yield `TRADE`.
- A retry creates a new immutable run/review generation.
- No model output directly triggers an on-chain transfer or a final verdict.
- UI displays only backend-confirmed state transitions.
