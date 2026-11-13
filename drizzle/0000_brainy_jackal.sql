CREATE TYPE "public"."anchor_status" AS ENUM('PENDING', 'ANCHORED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."assessment_status" AS ENUM('EVALUABLE', 'UNVERIFIABLE');--> statement-breakpoint
CREATE TYPE "public"."audit_status" AS ENUM('DRAFT', 'VALIDATING', 'AWAITING_COMMITMENT', 'COMMITTED', 'AWAITING_FUNDING', 'FUNDED', 'QUEUED', 'ATTACKING', 'EVIDENCE_REVIEW', 'SYCOPHANCY_REVIEW', 'REPRODUCIBILITY_CHECK', 'ADJUDICATING', 'CERTIFICATE_PENDING', 'COMPLETED', 'VALIDATION_FAILED', 'COMMITMENT_FAILED', 'ATTACKER_FAILED', 'REVIEW_FAILED', 'ADJUDICATION_FAILED', 'CERTIFICATE_FAILED', 'CANCELLED_BEFORE_COMMIT', 'CANCEL_REQUESTED');--> statement-breakpoint
CREATE TYPE "public"."condition_status" AS ENUM('HIT', 'PARTIAL', 'NOT_HIT', 'INVALID_TEST');--> statement-breakpoint
CREATE TYPE "public"."evidence_status" AS ENUM('VERIFIED', 'PARTIALLY_VERIFIED', 'UNVERIFIABLE', 'CONTRADICTED');--> statement-breakpoint
CREATE TYPE "public"."reproducibility_status" AS ENUM('REPRODUCED', 'PARTIALLY_REPRODUCED', 'NOT_REPRODUCED', 'NOT_REPLAYABLE_SOURCE_LIMITATION', 'CONTRADICTED_ON_REPLAY', 'NOT_ATTEMPTED');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('SUBMITTED', 'ACCEPTED', 'NEEDS_REVIEW', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."run_status" AS ENUM('QUEUED', 'RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED', 'TEE_UNVERIFIED', 'INVALID_OUTPUT');--> statement-breakpoint
CREATE TYPE "public"."finding_section" AS ENUM('A', 'B');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('ACTIVE', 'REVOKED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."verdict" AS ENUM('TRADE', 'REFUSE', 'ABSTAIN');--> statement-breakpoint
CREATE TABLE "adjudications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_id" uuid NOT NULL,
	"policy_version" text NOT NULL,
	"policy_hash" text NOT NULL,
	"verdict" "verdict" NOT NULL,
	"divergence_index" numeric(8, 6),
	"gate_results" jsonb NOT NULL,
	"decision_trace" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attacker_profiles" (
	"attacker_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"method" text NOT NULL,
	"prompt_version" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"tool_profile_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attacker_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_id" uuid NOT NULL,
	"attacker_id" text NOT NULL,
	"run_generation" integer DEFAULT 1 NOT NULL,
	"model_assignment_id" uuid,
	"status" "run_status" DEFAULT 'QUEUED' NOT NULL,
	"input_snapshot_id" uuid,
	"prompt_hash" text,
	"schema_version" text DEFAULT '1.0' NOT NULL,
	"provider_request_id" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"input_tokens" integer,
	"output_tokens" integer,
	"estimated_cost_microunits" bigint,
	"raw_output_ref" text,
	"parsed_output" jsonb,
	"validation_report" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_id" uuid NOT NULL,
	"actor_type" text NOT NULL,
	"actor_id" text,
	"event_type" text NOT NULL,
	"from_status" text,
	"to_status" text,
	"metadata_redacted" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_audit_id" text NOT NULL,
	"workspace_id" uuid NOT NULL,
	"client_account_id" text NOT NULL,
	"status" "audit_status" DEFAULT 'AWAITING_COMMITMENT' NOT NULL,
	"verdict" "verdict",
	"idempotency_key" text NOT NULL,
	"request_hash" text NOT NULL,
	"thesis_hash" text NOT NULL,
	"conditions_hash" text NOT NULL,
	"canonicalization_version" text NOT NULL,
	"conditions_version" text NOT NULL,
	"policy_version" text NOT NULL,
	"market_snapshot_at" timestamp with time zone,
	"committed_at" timestamp with time zone,
	"funded_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"supersedes_audit_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_nonces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"nonce_hash" text NOT NULL,
	"message" text NOT NULL,
	"recipient" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bounty_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_id" uuid NOT NULL,
	"finding_id" uuid NOT NULL,
	"attacker_id" text NOT NULL,
	"recipient_account_id" text NOT NULL,
	"amount_yocto" numeric(78, 0) NOT NULL,
	"policy_version" text NOT NULL,
	"status" text DEFAULT 'RECORDED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bounty_settlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"allocation_id" uuid NOT NULL,
	"settlement_id" text NOT NULL,
	"tx_hash" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_id" uuid NOT NULL,
	"certificate_hash" text NOT NULL,
	"canonicalization_version" text NOT NULL,
	"certificate_json" jsonb NOT NULL,
	"public_certificate_json" jsonb NOT NULL,
	"chain_tx_hash" text,
	"anchor_status" "anchor_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"key_prefix" text NOT NULL,
	"key_hash" text NOT NULL,
	"scopes" text[] NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_by_account_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commitments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_id" uuid NOT NULL,
	"network_id" text NOT NULL,
	"contract_account_id" text NOT NULL,
	"client_account_id" text NOT NULL,
	"transaction_hash" text NOT NULL,
	"block_height" bigint,
	"block_hash" text,
	"thesis_hash" text NOT NULL,
	"conditions_hash" text NOT NULL,
	"policy_hash" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"committed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "condition_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attacker_run_id" uuid NOT NULL,
	"condition_id" text NOT NULL,
	"assessment_status" "assessment_status" NOT NULL,
	"status" "condition_status",
	"rationale" text NOT NULL,
	"confidence" numeric(4, 3),
	"invalid_test_analysis" jsonb,
	"limitations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"review_status" text DEFAULT 'SUBMITTED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_id" uuid NOT NULL,
	"source_adapter" text NOT NULL,
	"adapter_version" text NOT NULL,
	"snapshot_at" timestamp with time zone NOT NULL,
	"block_height" bigint,
	"block_hash" text,
	"normalized_payload" jsonb NOT NULL,
	"payload_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_id" uuid NOT NULL,
	"attacker_run_id" uuid,
	"source_adapter" text NOT NULL,
	"adapter_version" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text NOT NULL,
	"typed_locator" jsonb NOT NULL,
	"observation_at" timestamp with time zone,
	"retrieved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"block_height" bigint,
	"block_hash" text,
	"normalized_value" jsonb,
	"evidence_type" text NOT NULL,
	"payload_hash" text NOT NULL,
	"payload_ref" text,
	"freshness_status" text,
	"limitations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "failure_conditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_id" uuid NOT NULL,
	"condition_id" text NOT NULL,
	"description" text NOT NULL,
	"metric" text NOT NULL,
	"operator" text NOT NULL,
	"threshold" text NOT NULL,
	"unit" text NOT NULL,
	"evaluation_window_value" integer,
	"evaluation_window_unit" text,
	"severity" text NOT NULL,
	"canonical_payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fee_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_id" uuid NOT NULL,
	"quote_id" uuid NOT NULL,
	"tx_hash" text NOT NULL,
	"amount_yocto" numeric(78, 0) NOT NULL,
	"status" text DEFAULT 'VERIFIED' NOT NULL,
	"verified_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fee_quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_id" uuid NOT NULL,
	"amount_yocto" numeric(78, 0) NOT NULL,
	"quote_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finding_evidence_links" (
	"finding_id" uuid NOT NULL,
	"evidence_id" uuid NOT NULL,
	"claim_fragment" text,
	CONSTRAINT "finding_evidence_links_finding_id_evidence_id_pk" PRIMARY KEY("finding_id","evidence_id")
);
--> statement-breakpoint
CREATE TABLE "findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_id" uuid NOT NULL,
	"attacker_run_id" uuid NOT NULL,
	"finding_key" text NOT NULL,
	"section" "finding_section" NOT NULL,
	"condition_id" text,
	"category" text NOT NULL,
	"severity" text NOT NULL,
	"claim" text NOT NULL,
	"rationale" text NOT NULL,
	"novelty_explanation" text,
	"fingerprint" text,
	"review_status" "review_status" DEFAULT 'SUBMITTED' NOT NULL,
	"evidence_status" "evidence_status",
	"reproducibility_status" "reproducibility_status",
	"policy_disqualifier_rule_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attacker_id" text NOT NULL,
	"provider" text NOT NULL,
	"model_id" text NOT NULL,
	"model_family" text NOT NULL,
	"model_vendor" text NOT NULL,
	"is_open_weight" boolean DEFAULT false NOT NULL,
	"requires_tee" boolean DEFAULT false NOT NULL,
	"tee_status" text DEFAULT 'WAIVED_BUDGET_CONSTRAINT' NOT NULL,
	"assignment_version" text NOT NULL,
	"active_from" timestamp with time zone DEFAULT now() NOT NULL,
	"active_to" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "reputation_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attacker_id" text NOT NULL,
	"audit_id" uuid NOT NULL,
	"finding_id" uuid,
	"event_type" text NOT NULL,
	"event_value" numeric(20, 6),
	"policy_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_id" uuid NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" uuid NOT NULL,
	"reviewer_type" text NOT NULL,
	"result" text NOT NULL,
	"reason_code" text,
	"details" jsonb,
	"reviewer_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tee_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attacker_run_id" uuid NOT NULL,
	"model_id" text NOT NULL,
	"signature_kind" text,
	"signer_identity" text,
	"attestation_hash" text,
	"verifier_version" text,
	"trust_root_version" text,
	"result" text NOT NULL,
	"reason" text,
	"verified_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "theses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_id" uuid NOT NULL,
	"chain" text NOT NULL,
	"asset_id" text NOT NULL,
	"symbol" text,
	"action" text NOT NULL,
	"direction" text,
	"rationale" text NOT NULL,
	"position_amount" text NOT NULL,
	"position_unit" text NOT NULL,
	"notional_usd" text,
	"time_horizon_value" integer NOT NULL,
	"time_horizon_unit" text NOT NULL,
	"execution_venue" text,
	"canonical_payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"account_id" text NOT NULL,
	"session_hash" text NOT NULL,
	"nonce_hash" text NOT NULL,
	"status" "session_status" DEFAULT 'ACTIVE' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"workspace_id" uuid NOT NULL,
	"account_id" text NOT NULL,
	"role" text DEFAULT 'READ_ONLY' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_members_workspace_id_account_id_pk" PRIMARY KEY("workspace_id","account_id")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "adjudications" ADD CONSTRAINT "adjudications_audit_id_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attacker_runs" ADD CONSTRAINT "attacker_runs_audit_id_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attacker_runs" ADD CONSTRAINT "attacker_runs_model_assignment_id_model_assignments_id_fk" FOREIGN KEY ("model_assignment_id") REFERENCES "public"."model_assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attacker_runs" ADD CONSTRAINT "attacker_runs_input_snapshot_id_data_snapshots_id_fk" FOREIGN KEY ("input_snapshot_id") REFERENCES "public"."data_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_audit_id_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audits" ADD CONSTRAINT "audits_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bounty_allocations" ADD CONSTRAINT "bounty_allocations_audit_id_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bounty_allocations" ADD CONSTRAINT "bounty_allocations_finding_id_findings_id_fk" FOREIGN KEY ("finding_id") REFERENCES "public"."findings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bounty_settlements" ADD CONSTRAINT "bounty_settlements_allocation_id_bounty_allocations_id_fk" FOREIGN KEY ("allocation_id") REFERENCES "public"."bounty_allocations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_audit_id_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_api_keys" ADD CONSTRAINT "client_api_keys_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_audit_id_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "condition_assessments" ADD CONSTRAINT "condition_assessments_attacker_run_id_attacker_runs_id_fk" FOREIGN KEY ("attacker_run_id") REFERENCES "public"."attacker_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_snapshots" ADD CONSTRAINT "data_snapshots_audit_id_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_records" ADD CONSTRAINT "evidence_records_audit_id_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_records" ADD CONSTRAINT "evidence_records_attacker_run_id_attacker_runs_id_fk" FOREIGN KEY ("attacker_run_id") REFERENCES "public"."attacker_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "failure_conditions" ADD CONSTRAINT "failure_conditions_audit_id_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_audit_id_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_quote_id_fee_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."fee_quotes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_quotes" ADD CONSTRAINT "fee_quotes_audit_id_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finding_evidence_links" ADD CONSTRAINT "finding_evidence_links_finding_id_findings_id_fk" FOREIGN KEY ("finding_id") REFERENCES "public"."findings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finding_evidence_links" ADD CONSTRAINT "finding_evidence_links_evidence_id_evidence_records_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_audit_id_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_attacker_run_id_attacker_runs_id_fk" FOREIGN KEY ("attacker_run_id") REFERENCES "public"."attacker_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_events" ADD CONSTRAINT "reputation_events_audit_id_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_events" ADD CONSTRAINT "reputation_events_finding_id_findings_id_fk" FOREIGN KEY ("finding_id") REFERENCES "public"."findings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_records" ADD CONSTRAINT "review_records_audit_id_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tee_verifications" ADD CONSTRAINT "tee_verifications_attacker_run_id_attacker_runs_id_fk" FOREIGN KEY ("attacker_run_id") REFERENCES "public"."attacker_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theses" ADD CONSTRAINT "theses_audit_id_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "adjudications_audit_uidx" ON "adjudications" USING btree ("audit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "attacker_runs_unique_idx" ON "attacker_runs" USING btree ("audit_id","attacker_id","run_generation");--> statement-breakpoint
CREATE INDEX "attacker_runs_audit_status_idx" ON "attacker_runs" USING btree ("audit_id","status");--> statement-breakpoint
CREATE INDEX "audit_events_audit_created_idx" ON "audit_events" USING btree ("audit_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "audits_public_id_uidx" ON "audits" USING btree ("public_audit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "audits_workspace_idempotency_uidx" ON "audits" USING btree ("workspace_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "audits_workspace_created_idx" ON "audits" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "audits_status_idx" ON "audits" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_nonces_hash_uidx" ON "auth_nonces" USING btree ("nonce_hash");--> statement-breakpoint
CREATE INDEX "auth_nonces_account_idx" ON "auth_nonces" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "bounty_allocations_audit_idx" ON "bounty_allocations" USING btree ("audit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bounty_settlements_settlement_uidx" ON "bounty_settlements" USING btree ("settlement_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bounty_settlements_tx_uidx" ON "bounty_settlements" USING btree ("tx_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "certificates_audit_uidx" ON "certificates" USING btree ("audit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "certificates_hash_uidx" ON "certificates" USING btree ("certificate_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "client_api_keys_hash_uidx" ON "client_api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "client_api_keys_workspace_idx" ON "client_api_keys" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "commitments_audit_uidx" ON "commitments" USING btree ("audit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "commitments_tx_uidx" ON "commitments" USING btree ("network_id","transaction_hash");--> statement-breakpoint
CREATE INDEX "commitments_contract_idx" ON "commitments" USING btree ("contract_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "condition_assessments_run_condition_uidx" ON "condition_assessments" USING btree ("attacker_run_id","condition_id");--> statement-breakpoint
CREATE INDEX "data_snapshots_audit_idx" ON "data_snapshots" USING btree ("audit_id");--> statement-breakpoint
CREATE INDEX "evidence_audit_adapter_idx" ON "evidence_records" USING btree ("audit_id","source_adapter");--> statement-breakpoint
CREATE INDEX "evidence_payload_hash_idx" ON "evidence_records" USING btree ("payload_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "failure_conditions_audit_condition_uidx" ON "failure_conditions" USING btree ("audit_id","condition_id");--> statement-breakpoint
CREATE INDEX "failure_conditions_audit_severity_idx" ON "failure_conditions" USING btree ("audit_id","severity");--> statement-breakpoint
CREATE UNIQUE INDEX "fee_payments_tx_uidx" ON "fee_payments" USING btree ("tx_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "fee_payments_audit_uidx" ON "fee_payments" USING btree ("audit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fee_quotes_hash_uidx" ON "fee_quotes" USING btree ("quote_hash");--> statement-breakpoint
CREATE INDEX "fee_quotes_audit_idx" ON "fee_quotes" USING btree ("audit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "findings_run_key_uidx" ON "findings" USING btree ("attacker_run_id","finding_key");--> statement-breakpoint
CREATE INDEX "findings_audit_review_idx" ON "findings" USING btree ("audit_id","review_status","severity");--> statement-breakpoint
CREATE INDEX "findings_audit_fingerprint_idx" ON "findings" USING btree ("audit_id","fingerprint");--> statement-breakpoint
CREATE INDEX "model_assignments_attacker_idx" ON "model_assignments" USING btree ("attacker_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reputation_events_unique_idx" ON "reputation_events" USING btree ("attacker_id","audit_id","event_type","finding_id");--> statement-breakpoint
CREATE INDEX "review_records_audit_type_idx" ON "review_records" USING btree ("audit_id","reviewer_type");--> statement-breakpoint
CREATE UNIQUE INDEX "tee_verifications_run_uidx" ON "tee_verifications" USING btree ("attacker_run_id");--> statement-breakpoint
CREATE UNIQUE INDEX "theses_audit_uidx" ON "theses" USING btree ("audit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_sessions_session_id_uidx" ON "wallet_sessions" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_sessions_hash_uidx" ON "wallet_sessions" USING btree ("session_hash");--> statement-breakpoint
CREATE INDEX "wallet_sessions_account_idx" ON "wallet_sessions" USING btree ("account_id");