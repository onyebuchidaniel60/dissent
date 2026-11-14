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

## 10. Testnet vault contract (Phase 10)

**Account:** `vault.dissent-demo.testnet`
**Purpose:** bounded testnet transfers for the proprietary execution arm. The venue is Tidepool. Ref Finance testnet is permanently unavailable and is not a supported venue. The vault does not custody client assets and does not execute mainnet transfers.

### State

- `owner_id`, `agent_id`, `treasury_id`
- `per_tx_cap_yocto`, `daily_cap_yocto`
- `spent_today_yocto`, `day_bucket`
- `paused`
- `recipients: LookupMap<AccountId, bool>`
- `certificates: LookupMap<String, bool>`
- `ft_token_id: AccountId` — fixed at initialization to `wnear.tidepool-sandbox.testnet`

### Methods

- `new(owner_id, agent_id, treasury_id, per_tx_cap_yocto, daily_cap_yocto, ft_token_id)` — `#[init(ignore_state)]`; used for the in-place v2 upgrade.
- `deposit()` — payable; adds testnet NEAR to the vault.
- `spend_as(certificate_id, recipient_id, amount_yocto, memo)` — callable only by `agent_id`; requires the certificate ID to be approved, the recipient to be allowlisted, the memo to contain the certificate ID, the amount to be within the per-transaction cap and the UTC-day remaining cap, and sufficient native balance. Emits an event and transfers native NEAR to `recipient_id`.
- `spend_ft_as(certificate_id, recipient_id, amount_yocto, memo)` — same checks; calls `ft_transfer` on the fixed `ft_token_id` with the certificate ID in the memo. Used for Tidepool wNEAR.
- `wrap(amount_yocto)` — owner-only helper for a token that exposes `near_deposit`; **not usable with Tidepool test wNEAR**, which is minted by the Tidepool faucet. The vault is funded by faucet + `ft_transfer`.
- `approve_certificate(certificate_id)` / `revoke_certificate(certificate_id)` — owner only.
- `set_recipient(recipient_id, allowed)` — owner only.
- `set_caps(per_tx_cap_yocto, daily_cap_yocto)` — owner only, bounded by the funded balance policy.
- `set_paused(paused)` — owner only.
- `withdraw(amount_yocto)` — owner only, to `treasury_id`.
- Views: `get_config`, `get_ft_token_id`, `get_balance`, `get_spent_today`, `is_recipient`, `is_certificate_approved`.

### Invariants

1. Only the configured agent account can call `spend_as` or `spend_ft_as`.
2. The execution agent receives only a Function Call Key scoped to `vault.spend_as` and `vault.spend_ft_as`; the full-access deployer key is never in the execution runtime.
3. Caps are enforced on-chain, not in the adapter. Caps are tracked in yoctoNEAR-equivalent units; wNEAR is 1:1 with NEAR.
4. Recipient must be allowlisted; arbitrary destinations are rejected.
5. Memo must contain the approved certificate ID; unapproved certificates are rejected.
6. The NEP-141 token contract is fixed at initialization; the agent cannot redirect the vault to an arbitrary token.
7. The adapter never executes for a client audit: `PROPRIETARY_EXECUTION_AUDIT_ID` must match the audit and the certificate ID is the audit UUID.
8. Reverts include readable reasons.
9. No method authorizes mainnet execution or arbitrary treasury withdrawal.

### Vault deployment record (Phase 10)

- Vault account: `vault.dissent-demo.testnet`
- v1 deploy transaction: `8V4A7CypSu6SS3NWywnJFhCqqfUzDxo9xYr1azdzqMBN`
- v2 in-place code upgrade + `new` transaction: `6t3pMThsSsDmEVgoj4eS9MJoqm3T2gq7ynXYFkXcqQh2`
- Agent account: `vault-agent.dissent-demo.testnet`
- Agent permission: Function Call Key `ed25519:EXg79VLkxUoVqa4PHw6aQ4TjYyz9ktzJAjPqeRX8B2h9`, scoped to `vault.dissent-demo.testnet` methods `spend_as` and `spend_ft_as`, allowance 1 NEAR (tx `87kQ9F4qoqPrVWL5AnQsVJ2KUCJRVuWvPTA4ELjniMCF`). The older `spend_as`-only key was deleted (tx `8zNjA3TdqUzPZAK2qLbGhqYtEqDPDV6txAZCgd4jTuZV`), leaving only the new scoped key and the agent full-access key, which is not in the app runtime.
- Per-transaction cap: `0.5 NEAR`; daily cap: `1 NEAR`; `paused=false`.
- Fixed NEP-141 token: `wnear.tidepool-sandbox.testnet` (24 decimals).
- wNEAR storage registered for the vault (tx `84A2LxRgaFjzCsZmbLbLi3LraT3uHgAj5eoU39Cmwfoj`).
- Vault funded with `0.02 wNEAR` from the Tidepool faucet via the demo client (tx `HeXLMzbWsRpz9YdoQvvYnHME9Wex8ay3zSN74kSxJcyQ`).
- Native balance after upgrade: approximately `2.9967571058856245 NEAR`.

### Live proprietary execution evidence

- Audit: `0bf3728d-e457-4b2f-8fad-b53be9565498` (`AUD-EF5A-D289`); thesis originated from Tidepool quote `0.01 wNEAR → 0.035246 USDC`.
- Quote deposit address: `da05f315c22877093292f756960595b27477c96eeba2d1e63864b95d69e5103a`.
- Certificate (audit UUID) approved on vault: tx `GuLp4J2otGy1qFGasaGE8fjK2GaPNjBQjnyFkDxCnqKt`.
- Quote deposit address allowlisted: tx `5jy5pU6o3DupmpZg5rvdWVJvNX6E2oLSMLbAQSa8wh3c`.
- wNEAR storage for the deposit address: tx `B1ARAptQ9eFLjougo9tGa5AUhxQBGWHSBop8jYcSPXe9`.
- Audit commitment: tx `JDCw46stcex49zroJ94y2EPNzcx86PqZGk8eyeHKsfAh`.
- Audit funding: tx `8xyFbb2hWiH1k7f137W3zvvZ3tB4ocqirHeTTvAvsa2T`; fee quote issuance: `HXQwwWrh1KJBqVc5cixzMecqKTtNjKbCFjDzbihdqJeu`.
- Verdict: `TRADE`; all eight attacker runs completed, both conditions were `EVALUABLE`/`NOT_HIT`, all gates passed, and divergence was `0`. Eight accepted findings; zero minority findings.
- Vault execution (`spend_ft_as`): tx `DxvoRKhCnyYyKrmAopnVYPKZJB7g8ev5Er1wtW5JbSp`; the wNEAR `ft_transfer` event names the deposit address and carries the certificate ID in its memo.
- Certificate: `0bf3728d-e457-4b2f-8fad-b53be9565498`; hash `d5f1b00d3702d9e5fcee194f601f9537f64c237ac176150a398a6a7d75b6584d`; `execution_readiness=EXECUTED`; anchor tx `3WQ6aQnJzsQRcRVTHsVGKUbrx2k1ueMFUwvWDY85XS9o`.
- Tidepool settlement: `SUCCESS`; `0.01 wNEAR` deposited, `0.035245 USDC` received by `demo-client.testnet`; swap txs `AYoAmqUxGmZRqcbkBZ75xG5J1KN1Y4r479oZ9Vdu7BLq`, `67jpWFr6arcpwUfgTUk8BkJpQD9Gezmw1VFcGoEs8pjK`, `7XAHSgATu8F2ednWuCxfmswetXnvNjyh1iPSmogXQGbv`.
- Vault state after execution: `0.01 wNEAR` remaining; `spent_today_yocto=10000000000000000000000` (0.01 NEAR-equivalent), within the 0.5/1 NEAR caps.
- The live run is executed by `scripts/proprietary-live.ts`; the run log and exact commands are recorded in `AI_HANDOFF.md` and `docs/BUILD_LOG.md`.
- `EXECUTION_ENABLED` and `PROPRIETARY_LOOP_ENABLED` default to `false`; the live run was an explicit operator action with `PROPRIETARY_EXECUTION_AUDIT_ID` set to the audit above. The preview remains disabled.
- Old Ref Finance recipient `ref-finance-101.testnet` was revoked in the v1 vault (tx `CsvM84SVVPEdHEVTgESSVHgxfGqqPZNv24FtHFDMzTg`); the v2 vault starts with an empty allowlist. Ref Finance is not supported.
- No mainnet deployment or mainnet execution is authorized.

### Mainnet readiness audit (source v3)

The mainnet-ready source is a **fresh deployment contract**, not an in-place upgrade of the staging vault. Source wasm: `contracts/dissent-vault/target/wasm32-unknown-unknown/release/dissent_vault.wasm`; SHA-256 `f8475b3998114e9970e51a6473c6acccdb14517986267f4ef058df747f43f582`.

**Findings and fixes:**

1. **Reinitialization risk.** The staging v2 contract used `#[init(ignore_state)]` for a one-off testnet upgrade. A mainnet deployment must not expose that path: a later caller could reset owner and state. The mainnet source uses `#[init]` only. Upgrades require a new audited contract or a separately reviewed migration.
2. **Certificate replay.** The staging vault allowed the same approved certificate to be spent repeatedly until the daily cap. The mainnet source records `used_certificates` and rejects a second spend with `certificate already used`.
3. **Permanent quote allowlist.** A per-quote deposit address previously stayed allowlisted forever. The mainnet source adds `set_recipient_until(recipient_id, expires_at_ns)`; `spend_*` rejects an expired recipient with `recipient allowlist has expired`. The owner must use the quote's `timeWhenInactive` (or an earlier bound) for mainnet execution.
4. **Cap unit.** Caps are yoctoNEAR-equivalent. The mainnet source requires `ft_token_decimals == 24` at initialization, matching wNEAR. A 6-decimal USDC vault is rejected rather than silently applying a misleading cap.
5. **Owner authority.** `set_caps`, `withdraw`, certificate approval and recipient allowlisting remain owner-only. A mainnet owner must be a multisig/timelock; a single hot key is not acceptable for real funds.

**Mainnet deployment boundary:** no mainnet vault, registry or payout contract is deployed by this repository. The staging vault `vault.dissent-demo.testnet` and its historical execution certificate remain testnet artifacts. A mainnet deployment requires operator-owned accounts, a funded multisig/timelock owner, a fresh `#[init]` deployment, a new Function Call Key scoped to `spend_as`/`spend_ft_as`, independent review of the registry fee/bounty path, and explicit release authorization.

**1Click adapter:** base URL `https://1click.chaindefuser.com`; origin asset `nep141:wrap.near`; destination asset `nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1` (USDC from the live `/v0/tokens` catalogue, not `usdc.near`). The adapter asks for a live `ORIGIN_CHAIN` quote, the owner allowlists the returned implicit deposit address for the quote window, and the vault performs `spend_ft_as`. The adapter is disabled unless `EXECUTION_ENABLED=true` and the audit is named by `PROPRIETARY_EXECUTION_AUDIT_ID`.

**Staging exception:** the preview environment explicitly sets `NEAR_NETWORK=testnet`, `EXECUTION_VENUE=TIDEPOOL`, and the testnet vault/registry accounts so the historical testnet certificate and Playwright wallet session remain verifiable. The customer-facing UI does not display a testnet label. Production must use a fresh mainnet database and the mainnet configuration in `.env.example`.
