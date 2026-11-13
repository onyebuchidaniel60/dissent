# Dissent — NEAR Smart Contract Specification

**Contract workspace:** `contracts/dissent-registry`  
**Language:** Rust + maintained `near-sdk`  
**Target for hackathon:** NEAR testnet only  
**Live trading:** Out of scope

## 1. Scope and contracts

MVP deploys a small **DissentRegistry** contract. It stores client-originated audit commitments, finalized certificate hashes and protocol-policy versions. A separately scoped escrow module/contract may hold testnet audit fees and bounty funds if the fee/payout demonstration is included. Avoid splitting into multiple contracts unless contract storage/account isolation requires it.

The contract does not run AI, fetch data, verify external evidence, adjudicate, or execute trades. Those remain off-chain services. The chain anchors signed claims and payment events so an external verifier can independently check hashes and caller identities.

## 2. Account model

- `owner_id`: contract administrator/deployer; configures approved controller/relayer identities.
- `client_id`: NEAR account that calls commitment method; becomes immutable client owner for the audit record.
- `adjudicator_id`: backend-controlled account authorized to finalize certificates and record bounty allocations (testnet only).
- `treasury_id`: receives permitted protocol reserve, if fee split is enabled.
- `payout_id`: preconfigured beneficiary account for internal attacker reward claims.

The contract must not accept a client identity field as proof of identity. Use `env::predecessor_account_id()`.

## 3. Registry data

`AuditCommitment`:
- `audit_id: String`
- `client_id: AccountId`
- `thesis_hash: [u8;32]` or fixed hex representation
- `conditions_hash: [u8;32]`
- `canonicalization_version: String`
- `conditions_version: String`
- `policy_hash: [u8;32]`
- `committed_at_block_height: u64`
- `committed_at_timestamp_ns: u64`

`CertificateRecord`:
- `audit_id`
- `certificate_hash`
- `verdict` enum `TRADE | REFUSE | ABSTAIN`
- `policy_hash`
- `client_id`
- `finalized_at_block_height`
- `finalized_at_timestamp_ns`

Store hashes and non-sensitive metadata only. No thesis/condition preimage, evidence payload, portfolio position, model prompt or provider secret is written on-chain.

## 4. Required methods

### `commit_audit`
Caller: client account. Payable: no.

Request:
```json
{
  "audit_id": "uuid",
  "thesis_hash": "64 lowercase hex",
  "conditions_hash": "64 lowercase hex",
  "canonicalization_version": "RFC8785-v1",
  "conditions_version": "1",
  "policy_hash": "64 lowercase hex"
}
```

Rules:
- audit ID must not exist;
- hashes must parse to 32 bytes;
- caller becomes `client_id`;
- one immutable commitment per audit ID;
- emit `dissent_audit_committed` event with non-sensitive metadata;
- return stored record.

### `get_commitment`
Caller: public view.

Returns the record by audit ID.

### `finalize_certificate`
Caller: configured `adjudicator_id` only. Payable: no.

Request contains audit ID, certificate hash, verdict, policy hash. Checks:
- commitment exists;
- no prior finalized certificate exists;
- policy hash matches the expected audit policy hash stored at commitment or an authorized policy version explicitly allowed for that audit;
- verdict is one of the three enums;
- certificate hash is 32 bytes.

Certificate is immutable. Corrections use `supersede_certificate` or a new linked correction record only if the contract includes this explicitly; do not overwrite original.

### `get_certificate`
Public view.

Returns certificate metadata; the actual redacted certificate JSON remains off-chain/content-addressed.

### Optional `fund_audit` (testnet escrow only)
Caller: client account. Payable: yes.

Request: audit ID, quote ID, quote hash, expiry timestamp, exact amount.

Rules:
- quote is issued by backend with fixed amount and short expiry;
- the transaction's attached deposit must equal quote amount exactly;
- audit commitment must exist and belong to caller;
- quote must be unused and unexpired;
- one funding transaction per quote/audit;
- emit event and store escrow accounting;
- no attacker dispatch until backend verifies the transaction and contract state.

### Optional `record_bounty_allocations` (testnet)
Caller: configured adjudicator/settlement account only.

Input: audit ID, certificate hash, policy hash and a list of `(settlement_id, finding_id, recipient_id, amount)`.

Checks:
- certificate is finalized;
- certificate hash/policy match;
- each settlement ID unique;
- recipient belongs to configured payout allowlist or approved roster;
- total does not exceed audit's remaining bounty allocation;
- all amounts integer yoctoNEAR and above zero.

### Optional `claim_bounty`
Caller: payout recipient only; pull-payment pattern.

- Verify a recorded unclaimed allocation belongs to caller.
- Mark claim pending/claimed before transfer.
- Use a private callback to restore claimability if transfer fails.
- Prevent duplicate claim/reentrancy through state and unique settlement ID.

If the team cannot confidently implement/test callback recovery in time, use accounting-only bounty records for MVP rather than an unsafe transfer implementation.

## 5. Events

Emit NEP-297-style events for:
- `dissent_audit_committed`
- `dissent_certificate_finalized`
- `dissent_audit_funded` (if escrow enabled)
- `dissent_bounty_allocated` / `dissent_bounty_claimed` (if settlement enabled)

Events must not contain secret preimages, full certificate bodies or sensitive client portfolio values.

## 6. Contract invariants

1. An audit commitment cannot be updated or deleted.
2. A client cannot commit on behalf of another account by passing a `client_id` argument.
3. Only the configured adjudicator can finalize a certificate.
4. A certificate can be finalized once per audit ID.
5. Finalized certificate hash is immutable.
6. A payout/settlement ID can be recorded/claimed once.
7. Funding amount must equal the unexpired quote exactly.
8. Escrow accounted balance must never exceed actual contract balance.
9. Only allowlisted payout recipients may claim.
10. No contract method authorizes live trade execution or arbitrary transfer destinations.

## 7. Contract tests

- initialize once; reject re-init;
- reject duplicate audit ID;
- reject malformed hashes;
- verify predecessor caller binds client ID;
- reject wrong client funding another audit;
- reject expired/wrong/used quote;
- reject underpayment/overpayment;
- reject unauthorized certificate finalization;
- reject duplicate certificate finalization;
- reject certificate policy mismatch;
- reject unauthorized settlement;
- reject duplicate settlement ID;
- reject payout above remaining pool;
- test failed transfer callback restores claim state;
- prove no method exposes a route to arbitrary treasury withdrawal.

## 8. Deployment boundary

Use NEAR Sandbox/near-workspaces for local development and automated tests. Deploy to testnet only after the exact operator authorization, deployer account and signer are verified. Do not use mainnet, NEAR Intents 1Click or live user assets for MVP. Contract account, source commit and deployment transaction must be recorded in `AI_HANDOFF.md`.

## 9. Testnet deployment record

- Contract account: `registry.dissent-demo.testnet`
- Deploy transaction: `DwTsqTQ9Lh28zpcqYhNYrzARH7NaQgQkc3sEgtaXaaNv`
- Initializer: owner/adjudicator/treasury `dissent-demo.testnet`, payout `payout.dissent-demo.testnet`.
- First commitment transaction: `EPyCZw3yCiEyVfrpjBvdFVHsRHdnzpsHaLwKLEEPW6YK`.
- First certificate anchor: `BRajqZsAKZPt96BrbFy7y1BRKeLyaE9vymnq2mQFqkkN` (ABSTAIN development audit).
- Clean follow-up certificate anchor: `6G7Yd3uvZozLC9SbXtNW5jxFetV4TLqgTMFxN76MmYJF` (TRADE).
- Escrow/bounty accounting is implemented inside the registry contract. `escrow.dissent-demo.testnet` was created but is reserved and unused.
- No mainnet deployment is authorized.
