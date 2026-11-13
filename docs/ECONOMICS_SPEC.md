# Dissent — Economics and Settlement Specification

## 1. MVP economic boundary

The hackathon demonstrates the **mechanics** of an audit fee and accepted-finding rewards using NEAR testnet tokens only. Testnet units have no real economic value. Dissent is not yet demonstrating sustainable real-world revenue or profitability.

No mainnet payment, live trading, client asset custody or real bounty obligation exists in MVP.

## 2. Audit fee quote

- Dissent operator configures a fixed testnet fee per audit and bounty pool allocation before the audit is opened for funding.
- The quote has an ID, audit ID, exact amount in yoctoNEAR, expiry timestamp, network, contract ID, split and SHA-256 quote hash.
- Quote is generated only after the client commitment is verified.
- Quote is not model-generated or mutable after issuance.
- `fund_audit` must attach the exact quoted amount; underpayment/overpayment/expired/reused quotes are rejected.
- Backend waits for confirmed contract state before dispatching attacker jobs.

### Preview configuration (2026-11-13)

- Fixed audit fee: `0.1 NEAR` (`100000000000000000000000` yoctoNEAR).
- Split: 80% bounty pool (`0.08 NEAR`), 20% protocol reserve (`0.02 NEAR`).
- Quote expiry: `900` seconds.
- Base bounty unit: `0.001 NEAR`.
- Per-finding cap: `0.01 NEAR`.
- Per-attacker cap: `0.02 NEAR`.
- Per-audit pool cap: the funded 80% pool. The remaining pool cap is enforced last, so the sum of allocations can never exceed the funded amount even when individual caps are higher.
- Settlement recipient: one allowlisted testnet account, `payout.dissent-demo.testnet`, with internal per-attacker accounting. If callback recovery cannot be safely tested, use accounting-only allocations and do not transfer funds.

All amounts are integer yoctoNEAR. No mainnet value is involved.

## 3. Compute cost accounting

- Provider usage is charged to Dissent's API/provider accounts unless a vendor explicitly supports separate sub-account billing.
- Each run records provider request ID, input/output token counts when available, configured rate-card version and estimated cost.
- Cost figures are estimates unless reconciled against provider invoice data.
- Per-attacker budget is an internal ledger allocation, not a claim that each agent owns or pays from its own wallet.
- Enforce per-audit and daily/monthly ceilings before submitting calls; circuit-break when a ceiling is reached.

## 4. Bounty allocation

The normative formula is in `ADJUDICATION_SPEC.md`:

`bounty_points = severity_weight × reproducibility_factor × section_multiplier`.

Section A multiplier = 1.00; Section B multiplier = 1.25; accepted `INVALID_TEST` multiplier = 1.25. Only accepted findings are eligible. `NOT_HIT`, rejected and pending-review findings receive zero. Per-finding, per-attacker, per-audit and funded-pool caps apply. Duplicate fingerprint cluster rewards share one bounded allocation.

## 5. Funds and settlement

- Escrow receives only exact testnet audit-fee deposits.
- Bounty allocations are recorded only after a certificate is finalized.
- Settlement must be idempotent and recipient account must be on the configured testnet allowlist.
- Prefer pull-claim payouts with callback recovery. If reliable callback recovery cannot be tested, demo allocation accounting and do not transfer funds.
- Refunds are allowed only for audits not yet dispatched and according to explicit contract policy; after attacker dispatch, the quote is treated as consumed. Failed audits produce `ABSTAIN` but do not automatically refund compute costs. This behavior must be shown before funding in the UI.
- Never make any mainnet payment without a new explicit operator authorization.

## 6. Future commercial model (not MVP promises)

Potential long-term revenue streams are audit fees paid by agent operators and P&L from a proprietary strategy that Dissent audits using the same pipeline. Any market pricing, guaranteed bounty yield, profit claim, or commercial margin requires separate validation and is not part of the hackathon acceptance criteria.
