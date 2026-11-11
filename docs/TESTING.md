# Testing Strategy

The detailed test contract is in `PROJECT_SPEC.md` Section 21.

## Test layers

1. **Unit:** Pure deterministic logic in `packages/core`.
2. **Integration:** Fastify routes, DB transactions, worker leases, RYO adapter fixtures, OpenAI provider mocks, certificate persistence.
3. **E2E:** Playwright user journeys against preview.
4. **Security:** IDOR, role escalation, criteria leakage, evidence fabrication, prompt injection, secret redaction, idempotency and race tests.
5. **Scenario:** Deterministic adjudication cases 1–10 in the project spec.

## Rules

- The adjudicator tests use no LLM and no live RYO calls.
- External provider calls in automated test suites are mocked unless a dedicated sandbox test is explicitly authorized.
- Every simulated evidence field is labelled `SIMULATED` in user-visible views.
- A failed test is not waived by changing expected output without updating the spec and decision record.
- E2E evidence must identify the tested commit and environment.

## Critical assertions

- Attacker payload never contains criteria or peer findings.
- Missing evidence never becomes zero or NO_BREAK.
- Invalid evidence references cannot produce a valid BREAK.
- Fewer than three valid findings means no verdict.
- Data Gate BLOCK means no normal verdict.
- Completed certificate replays to the same deterministic verdict.
- Owner isolation blocks cross-user access.
