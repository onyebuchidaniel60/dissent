# Operator Guide — Dissent MVP

## Before enabling live audit runs
- Confirm model assignment file meets 3-family/2-vendor rule.
- Validate each API credential and configured cost ceiling.
- Confirm the TEE waiver is recorded as `WAIVED_BUDGET_CONSTRAINT`; do not display a TEE badge or claim confidential inference. The family/vendor/open-weight gates remain enforced.
- Confirm two or more evidence adapters return the chosen demo asset's data with timestamps/provenance.
- Confirm testnet registry and escrow account IDs and source commit.
- Confirm the wallet-address allowlist and the client agent-supplied signing process.
- Confirm the client agent-supplied transaction path and server-side receipt verification.
- Set a fixed testnet audit fee, expiry, bounty split and payout allowlist.
- Confirm queue concurrency and retry caps.

## Routine operation
- Monitor queue depth, provider errors, inference-cost ceiling and evidence adapter health.
- Do not edit a committed thesis or condition set. Create a new audit to change them.
- Retry only failed/invalid runs within the configured cap; preserve original run record.
- Never override a verdict by editing its database row. A policy correction requires a new version and a linked corrected audit/certificate record.
- Pause provider or source adapters when integrity is uncertain; affected audits become incomplete/ABSTAIN unless an independent verified disqualifier supports REFUSE.

## Financial boundary
All MVP funding and reward demonstration is on testnet. No mainnet funds, trading or client custody are enabled. Do not transfer funds or deploy to mainnet without a separately signed-off authorization record.
