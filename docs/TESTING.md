# Testing Strategy

## Unit tests
- canonicalization/hash vectors (RFC 8785 + SHA-256);
- condition parser and threshold/unit comparison;
- audit state-transition matrix;
- schema validation and cross-field semantics;
- evidence freshness and claim-verification rules;
- Section B novelty outcomes;
- adjudication policy vectors T01–T16 and divergence boundaries;
- bounty rounding/caps/idempotency;
- authorization helpers and redaction.

## Integration tests
- Drizzle repositories and transaction rollback;
- pg-boss enqueue/outbox idempotency;
- each source adapter using recorded fixtures and approved live smoke tests;
- provider adapters with deterministic mock responses and budget guards;
- NEAR RPC commitment/funding/finalization receipt verification;
- contract methods in NEAR Sandbox;
- NEAR AI Cloud attestation/signature verification with captured valid/invalid fixture bundles;
- tenant authorization for all endpoints.

## E2E tests
1. Client creates audit → hashes previewed → client testnet wallet commits → receipt verifies → quote funded → eight runs launch.
2. Audit status remains sealed while attackers run; no attacker results visible early.
3. Results page shows condition coverage, outside findings, evidence, red-team review, dissent and final verdict.
4. Public certificate verification compares canonical hash with NEAR record and reveals only approved public fields.
5. Failure journeys: wrong signer, wrong hash, expired quote, payment mismatch, missing model/TEE, invalid response, evidence source down, duplicate retry, insufficient permissions.

## Security tests
IDOR, cross-workspace query, role escalation, XSS, CSRF, SSRF adapter bypass, arbitrary URL injection, prompt injection, secret leakage, schema smuggling, rate limits, replay, race conditions, duplicate payout, provider budget exhaustion, private certificate access.

## Test data policy
- Deterministic fixtures are labelled `DEMO_FIXTURE`.
- Do not represent fixtures as live model or live market output.
- Never use real client portfolio data in tests or recordings.
- Testnet only; tests must not submit mainnet transactions.

## Evidence of completion
At every checkpoint save command, commit SHA, test count, pass/fail, logs/artifact paths, and any skipped test with its reason to `AI_HANDOFF.md` and `BUILD_LOG.md`.
