# Dissent — Data Model Specification

**Database:** PostgreSQL 16+  
**ORM/migrations:** Drizzle ORM  
**IDs:** UUIDv7 where supported; otherwise UUIDv4; public IDs are never sequential  
**Time:** `timestamptz` UTC  
**Money:** integer smallest-unit strings / `numeric(78,0)`; never IEEE float

## 1. Relationship overview

```text
WalletSession ──< WorkspaceMember >── Workspace ──< ClientApiKey
                                |
                                └──< Audit ──1 Thesis
                                      |  ├──< FailureCondition
                                      |  ├──0..1 Commitment
                                      |  ├──< AttackerRun ──< Finding ──< EvidenceLink >── EvidenceRecord
                                      |  ├──< ReviewRecord
                                      |  ├──0..1 Adjudication
                                      |  ├──0..1 Certificate
                                      |  ├──< AuditEvent
                                      |  ├──0..1 FeeQuote / FeePayment
                                      |  └──< BountyAllocation / BountySettlement

AttackerProfile ──< AttackerRun
ModelAssignment ──< AttackerRun
SourceAdapterVersion ──< EvidenceRecord
PolicyVersion ──< Adjudication / Certificate
```

## 2. Tables

### `wallet_sessions`
- `id` UUID PK; `session_id` text UNIQUE NOT NULL
- `account_id` text NOT NULL (NEAR account ID)
- `session_hash` bytea NOT NULL UNIQUE (hash of the opaque cookie value)
- `nonce_hash` bytea NOT NULL (single-use challenge hash)
- `created_at`, `expires_at` timestamptz NOT NULL; `revoked_at` nullable
- `last_seen_at` nullable
- No emails, passwords, password resets or magic-link tokens are stored.
- Operator authorization is derived from `ADMIN_WALLET_ADDRESSES` on the server, not from a database role alone.

### `workspaces`
- `id` UUID PK; `name` text NOT NULL
- `status` enum `ACTIVE | SUSPENDED`
- `created_at`, `updated_at`

### `workspace_members`
- `workspace_id` FK → workspaces; `account_id` text NOT NULL
- `role` enum `OWNER | OPERATOR | READ_ONLY`
- composite PK `(workspace_id,account_id)`

### `client_api_keys`
- `id` UUID PK; `workspace_id` FK
- `key_prefix` text NOT NULL; `key_hash` bytea NOT NULL UNIQUE
- `scopes` text[] NOT NULL; `status` `ACTIVE | REVOKED | EXPIRED`
- `expires_at` nullable; `last_used_at` nullable
- `created_at`, `revoked_at` nullable
- `created_by_account_id` text nullable (wallet account, no user FK)
- Do not store or log plaintext API key. Show once at creation.

### `audits`
- `id` UUID PK; `public_audit_id` text UNIQUE NOT NULL
- `workspace_id` FK; `client_account_id` text NOT NULL
- `status` enum covering full lifecycle; `verdict` nullable enum `TRADE | REFUSE | ABSTAIN`
- `idempotency_key` text NOT NULL; `request_hash` bytea NOT NULL
- `thesis_hash` bytea NOT NULL; `conditions_hash` bytea NOT NULL
- `canonicalization_version` text NOT NULL; `conditions_version` text NOT NULL; `policy_version` text NOT NULL
- `market_snapshot_at` timestamptz nullable; `committed_at` timestamptz nullable; `funded_at` nullable; `completed_at` nullable
- `supersedes_audit_id` nullable FK audits
- `created_at`, `updated_at`
- UNIQUE `(workspace_id,idempotency_key)`; index `(workspace_id,created_at desc)`, `(status,created_at)`

### `theses`
- `id` UUID PK; `audit_id` FK UNIQUE
- `chain` text; `asset_id` text; `symbol` text nullable
- `action` enum (`BUY`, `SELL`, `SUPPLY`, `BORROW`, `STAKE`, `ADD_LIQUIDITY`, `REMOVE_LIQUIDITY`, `OTHER`)
- `direction` enum nullable (`LONG`,`SHORT`,`NEUTRAL`)
- `rationale` text; `position_amount` numeric text; `position_unit` text; `notional_usd` numeric text nullable
- `time_horizon_value` integer; `time_horizon_unit` enum `MINUTE|HOUR|DAY|WEEK|MONTH`
- `execution_venue` text nullable; `canonical_payload` jsonb private

### `failure_conditions`
- `id` UUID PK; `audit_id` FK; `condition_id` text
- `description` text; `metric` text; `operator` enum (`LT`,`LTE`,`EQ`,`GTE`,`GT`,`BOOLEAN`,`CUSTOM`)
- `threshold` numeric text or JSONB depending metric; `unit` text; `evaluation_window_value` integer; `evaluation_window_unit` text
- `severity` enum `CRITICAL|HIGH|NORMAL`; `canonical_payload` jsonb private
- UNIQUE `(audit_id,condition_id)`; index `(audit_id,severity)`

### `commitments`
- `id` UUID PK; `audit_id` FK UNIQUE
- `network_id` text; `contract_account_id` text; `client_account_id` text
- `transaction_hash` text UNIQUE; `block_height` bigint; `block_hash` text nullable
- `thesis_hash` bytea; `conditions_hash` bytea; `policy_hash` bytea
- `status` enum `PENDING|FINAL|FAILED`; `committed_at` timestamptz
- index `(network_id,transaction_hash)`

### `attacker_profiles`
- `attacker_id` text PK (`A01`…`A08`); `name` text; `method` text UNIQUE
- `prompt_version` text; `enabled` boolean; `tool_profile_id` text
- `created_at`, `updated_at`

### `model_assignments`
- `id` UUID PK; `attacker_id` FK; `provider` text; `model_id` text; `model_family` text; `vendor` text
- `is_open_weight` boolean; `requires_tee` boolean; `assignment_version` text; `active_from` timestamptz; `active_to` nullable

### `attacker_runs`
- `id` UUID PK; `audit_id` FK; `attacker_id` FK; `run_generation` integer
- `model_assignment_id` FK; `status` enum `QUEUED|RUNNING|COMPLETED|PARTIAL|FAILED|TEE_UNVERIFIED|INVALID_OUTPUT`
- `input_snapshot_id` UUID; `prompt_hash` bytea; `schema_version` text
- `provider_request_id` text nullable; `started_at`, `completed_at` nullable
- `input_tokens`, `output_tokens` integers nullable; `estimated_cost_microunits` bigint nullable
- `tee_verification_id` nullable FK; `raw_output_ref` text private; `parsed_output` jsonb nullable private
- UNIQUE `(audit_id,attacker_id,run_generation)`; index `(audit_id,status)`

### `data_snapshots`
- `id` UUID PK; `audit_id` FK; `source_adapter` text; `adapter_version` text
- `snapshot_at` timestamptz; `block_height` bigint nullable; `block_hash` text nullable
- `normalized_payload` jsonb private; `payload_hash` bytea; `created_at`

### `evidence_records`
- `id` UUID PK; `audit_id` FK; `attacker_run_id` FK nullable; `source_adapter` text; `adapter_version` text
- `resource_type` text; `resource_id` text; `typed_locator` jsonb; `observation_at` timestamptz nullable; `retrieved_at` timestamptz
- `block_height` bigint nullable; `block_hash` text nullable; `normalized_value` jsonb nullable
- `evidence_type` enum `DIRECT_OBSERVATION|DERIVED_CALCULATION|HISTORICAL_RECORD|CROSS_SOURCE_COMPARISON|MODEL_INFERENCE|EXTERNAL_ATTESTATION`
- `payload_hash` bytea NOT NULL; `payload_ref` text private; `freshness_status` text; `limitations` jsonb
- index `(audit_id,source_adapter,retrieved_at)`; index `(payload_hash)`

### `findings`
- `id` UUID PK; `audit_id` FK; `attacker_run_id` FK
- `finding_key` text NOT NULL; `section` enum `A|B`; `condition_id` nullable FK-like logical relation
- `category` text; `severity` enum `CRITICAL|HIGH|MEDIUM|LOW|INFO`
- `claim` text; `rationale` text; `novelty_explanation` text nullable; `fingerprint` text
- `review_status` enum `SUBMITTED|ACCEPTED|NEEDS_REVIEW|REJECTED`; `evidence_status` enum; `reproducibility_status` enum
- `policy_disqualifier_rule_id` text nullable; `created_at`
- UNIQUE `(attacker_run_id,finding_key)`; index `(audit_id,review_status,severity)`; index `(audit_id,fingerprint)`

### `finding_evidence_links`
- `finding_id` FK; `evidence_id` FK; `claim_fragment` text nullable
- composite PK `(finding_id,evidence_id)`

### `condition_assessments`
- `id` UUID PK; `attacker_run_id` FK; `condition_id` text
- `assessment_status` enum `EVALUABLE|UNVERIFIABLE`
- `status` enum `HIT|PARTIAL|NOT_HIT|INVALID_TEST` nullable
- `rationale` text; `confidence` numeric(4,3) diagnostic only
- `invalid_test_analysis` jsonb nullable; `limitations` jsonb
- `review_status` text; UNIQUE `(attacker_run_id,condition_id)`

### `review_records`
- `id` UUID PK; `audit_id` FK; `subject_type` text; `subject_id` UUID
- `reviewer_type` enum `EVIDENCE_AUDITOR|SYCOPHANCY_AUDITOR|REPRODUCIBILITY`
- `result` text; `reason_code` text; `details` jsonb private; `reviewer_version` text; `created_at`
- index `(audit_id,reviewer_type,created_at)`

### `tee_verifications`
- `id` UUID PK; `attacker_run_id` FK UNIQUE
- `model_id` text; `signature_kind` text; `signer_identity` text; `attestation_hash` bytea
- `verifier_version` text; `trust_root_version` text; `result` enum `VERIFIED|FAILED|MISSING`; `verified_at` timestamptz

### `adjudications`
- `id` UUID PK; `audit_id` FK UNIQUE; `policy_version` text; `policy_hash` bytea
- `verdict` enum `TRADE|REFUSE|ABSTAIN`; `divergence_index` numeric(8,6) nullable
- `gate_results` jsonb; `decision_trace` jsonb; `created_at`

### `certificates`
- `id` UUID PK; `audit_id` FK UNIQUE; `certificate_hash` bytea UNIQUE; `canonicalization_version` text
- `certificate_json` jsonb private/redacted; `public_certificate_json` jsonb; `chain_tx_hash` text nullable
- `anchor_status` enum `PENDING|ANCHORED|FAILED`; `created_at`

### `fee_quotes` / `fee_payments`
- quote: `id`, `audit_id`, `amount_yocto` numeric(78,0), `quote_hash`, `expires_at`, `status`, `created_at`
- payment: `id`, `audit_id`, `quote_id`, `tx_hash` UNIQUE, `amount_yocto`, `status`, `verified_at`

### `bounty_allocations` / `bounty_settlements`
- allocation: `id`, `audit_id`, `finding_id`, `attacker_id`, `recipient_account_id`, `amount_yocto`, `policy_version`, `status`
- settlement: `id`, `allocation_id`, `settlement_id` UNIQUE, `tx_hash` UNIQUE nullable, `status`, `created_at`

### `reputation_events`
- `id` UUID PK; `attacker_id` FK; `audit_id` FK; `finding_id` FK nullable
- `event_type` text; `event_value` numeric text; `policy_version` text; `created_at`
- UNIQUE `(attacker_id,audit_id,event_type,finding_id)` where applicable

### `audit_events`
- `id` UUID PK; `audit_id` FK; `actor_type`, `actor_id`, `event_type`, `from_status`, `to_status`
- `metadata_redacted` jsonb; `created_at`; append-only to application roles
- index `(audit_id,created_at)`

## 3. Privacy/access classification

- Public: registry commitment/certificate hashes, verdict, public certificate summary explicitly approved for publication.
- Workspace-private: thesis, conditions preimage, client positions, complete findings/evidence, detailed model outputs.
- Operator-restricted: provider/model config, redacted run logs, cost telemetry, policy operations.
- Secret: provider API keys, signing key material, auth secret; never persisted as plaintext in these tables.

## 4. Database invariants

- All tenant-owned rows resolve through `workspace_id` via audit; service queries must filter using the authenticated workspace.
- `audits` inputs become immutable after `COMMITTED`; use DB trigger or repository-level immutable update guard and test it.
- All financial amount math is integer yoctoNEAR or `numeric(78,0)`.
- Use unique constraints for idempotency and settlement.
- Use row locks/conditional state updates for transitions.
- Every status transition and privileged operation writes an append-only audit event in the same transaction.
- Job enqueue plus transition must be atomic (transactional outbox or supported pg-boss integration).
- Never expose raw `parsed_output` or private evidence to public certificate routes.

## 5. Retention and deletion

The MVP retention period is an operator intake decision. Preserve enough evidence and audit metadata for certificate reproduction. A client deletion request must not silently erase public commitments or finalized on-chain certificates; private payload deletion may be applied only according to the approved retention/legal policy while keeping tombstone/hash references. Document actual retention in the privacy notice before production release.
