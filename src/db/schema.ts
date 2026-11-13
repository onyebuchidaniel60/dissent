import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const auditStatusEnum = pgEnum("audit_status", [
  "DRAFT",
  "VALIDATING",
  "AWAITING_COMMITMENT",
  "COMMITTED",
  "AWAITING_FUNDING",
  "FUNDED",
  "QUEUED",
  "ATTACKING",
  "EVIDENCE_REVIEW",
  "SYCOPHANCY_REVIEW",
  "REPRODUCIBILITY_CHECK",
  "ADJUDICATING",
  "CERTIFICATE_PENDING",
  "COMPLETED",
  "VALIDATION_FAILED",
  "COMMITMENT_FAILED",
  "ATTACKER_FAILED",
  "REVIEW_FAILED",
  "ADJUDICATION_FAILED",
  "CERTIFICATE_FAILED",
  "CANCELLED_BEFORE_COMMIT",
  "CANCEL_REQUESTED",
]);

export const verdictEnum = pgEnum("verdict", ["TRADE", "REFUSE", "ABSTAIN"]);
export const runStatusEnum = pgEnum("run_status", [
  "QUEUED",
  "RUNNING",
  "COMPLETED",
  "PARTIAL",
  "FAILED",
  "TEE_UNVERIFIED",
  "INVALID_OUTPUT",
]);
export const sectionEnum = pgEnum("finding_section", ["A", "B"]);
export const reviewStatusEnum = pgEnum("review_status", [
  "SUBMITTED",
  "ACCEPTED",
  "NEEDS_REVIEW",
  "REJECTED",
]);
export const evidenceStatusEnum = pgEnum("evidence_status", [
  "VERIFIED",
  "PARTIALLY_VERIFIED",
  "UNVERIFIABLE",
  "CONTRADICTED",
]);
export const reproducibilityStatusEnum = pgEnum("reproducibility_status", [
  "REPRODUCED",
  "PARTIALLY_REPRODUCED",
  "NOT_REPRODUCED",
  "NOT_REPLAYABLE_SOURCE_LIMITATION",
  "CONTRADICTED_ON_REPLAY",
  "NOT_ATTEMPTED",
]);
export const assessmentStatusEnum = pgEnum("assessment_status", ["EVALUABLE", "UNVERIFIABLE"]);
export const conditionStatusEnum = pgEnum("condition_status", [
  "HIT",
  "PARTIAL",
  "NOT_HIT",
  "INVALID_TEST",
]);
export const anchorStatusEnum = pgEnum("anchor_status", ["PENDING", "ANCHORED", "FAILED"]);
export const sessionStatusEnum = pgEnum("session_status", ["ACTIVE", "REVOKED", "EXPIRED"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  clientAccountId: text("client_account_id"),
  status: text("status").notNull().default("ACTIVE"),
  ...timestamps,
});

export const walletSessions = pgTable(
  "wallet_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: text("session_id").notNull(),
    accountId: text("account_id").notNull(),
    sessionHash: text("session_hash").notNull(),
    nonceHash: text("nonce_hash").notNull(),
    status: sessionStatusEnum("status").notNull().default("ACTIVE"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("wallet_sessions_session_id_uidx").on(table.sessionId),
    uniqueIndex("wallet_sessions_hash_uidx").on(table.sessionHash),
    index("wallet_sessions_account_idx").on(table.accountId),
  ],
);

export const authNonces = pgTable(
  "auth_nonces",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: text("account_id").notNull(),
    nonceHash: text("nonce_hash").notNull(),
    message: text("message").notNull(),
    recipient: text("recipient").notNull(),
    callbackUrl: text("callback_url"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("auth_nonces_hash_uidx").on(table.nonceHash),
    index("auth_nonces_account_idx").on(table.accountId),
  ],
);

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    role: text("role").notNull().default("READ_ONLY"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.workspaceId, table.accountId] })],
);

export const clientApiKeys = pgTable(
  "client_api_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    keyPrefix: text("key_prefix").notNull(),
    keyHash: text("key_hash").notNull(),
    scopes: text("scopes").array().notNull(),
    status: text("status").notNull().default("ACTIVE"),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdByAccountId: text("created_by_account_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("client_api_keys_hash_uidx").on(table.keyHash),
    index("client_api_keys_workspace_idx").on(table.workspaceId),
  ],
);

export const modelAssignments = pgTable(
  "model_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    attackerId: text("attacker_id").notNull(),
    provider: text("provider").notNull(),
    modelId: text("model_id").notNull(),
    modelFamily: text("model_family").notNull(),
    modelVendor: text("model_vendor").notNull(),
    isOpenWeight: boolean("is_open_weight").notNull().default(false),
    requiresTee: boolean("requires_tee").notNull().default(false),
    teeStatus: text("tee_status").notNull().default("WAIVED_BUDGET_CONSTRAINT"),
    assignmentVersion: text("assignment_version").notNull(),
    activeFrom: timestamp("active_from", { withTimezone: true }).notNull().defaultNow(),
    activeTo: timestamp("active_to", { withTimezone: true }),
  },
  (table) => [index("model_assignments_attacker_idx").on(table.attackerId)],
);

export const attackerProfiles = pgTable("attacker_profiles", {
  attackerId: text("attacker_id").primaryKey(),
  name: text("name").notNull(),
  method: text("method").notNull(),
  promptVersion: text("prompt_version").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  toolProfileId: text("tool_profile_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const audits = pgTable(
  "audits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    publicAuditId: text("public_audit_id").notNull(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "restrict" }),
    clientAccountId: text("client_account_id").notNull(),
    status: auditStatusEnum("status").notNull().default("AWAITING_COMMITMENT"),
    verdict: verdictEnum("verdict"),
    idempotencyKey: text("idempotency_key").notNull(),
    requestHash: text("request_hash").notNull(),
    thesisHash: text("thesis_hash").notNull(),
    conditionsHash: text("conditions_hash").notNull(),
    canonicalizationVersion: text("canonicalization_version").notNull(),
    conditionsVersion: text("conditions_version").notNull(),
    policyVersion: text("policy_version").notNull(),
    marketSnapshotAt: timestamp("market_snapshot_at", { withTimezone: true }),
    committedAt: timestamp("committed_at", { withTimezone: true }),
    fundedAt: timestamp("funded_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    supersedesAuditId: uuid("supersedes_audit_id"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("audits_public_id_uidx").on(table.publicAuditId),
    uniqueIndex("audits_workspace_idempotency_uidx").on(table.workspaceId, table.idempotencyKey),
    index("audits_workspace_created_idx").on(table.workspaceId, table.createdAt),
    index("audits_status_idx").on(table.status),
  ],
);

export const theses = pgTable(
  "theses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    auditId: uuid("audit_id")
      .notNull()
      .references(() => audits.id, { onDelete: "cascade" }),
    chain: text("chain").notNull(),
    assetId: text("asset_id").notNull(),
    symbol: text("symbol"),
    action: text("action").notNull(),
    direction: text("direction"),
    rationale: text("rationale").notNull(),
    positionAmount: text("position_amount").notNull(),
    positionUnit: text("position_unit").notNull(),
    notionalUsd: text("notional_usd"),
    timeHorizonValue: integer("time_horizon_value").notNull(),
    timeHorizonUnit: text("time_horizon_unit").notNull(),
    executionVenue: text("execution_venue"),
    canonicalPayload: jsonb("canonical_payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("theses_audit_uidx").on(table.auditId)],
);

export const failureConditions = pgTable(
  "failure_conditions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    auditId: uuid("audit_id")
      .notNull()
      .references(() => audits.id, { onDelete: "cascade" }),
    conditionId: text("condition_id").notNull(),
    description: text("description").notNull(),
    metric: text("metric").notNull(),
    operator: text("operator").notNull(),
    threshold: text("threshold").notNull(),
    unit: text("unit").notNull(),
    evaluationWindowValue: integer("evaluation_window_value"),
    evaluationWindowUnit: text("evaluation_window_unit"),
    severity: text("severity").notNull(),
    canonicalPayload: jsonb("canonical_payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("failure_conditions_audit_condition_uidx").on(table.auditId, table.conditionId),
    index("failure_conditions_audit_severity_idx").on(table.auditId, table.severity),
  ],
);

export const commitments = pgTable(
  "commitments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    auditId: uuid("audit_id")
      .notNull()
      .references(() => audits.id, { onDelete: "restrict" }),
    networkId: text("network_id").notNull(),
    contractAccountId: text("contract_account_id").notNull(),
    clientAccountId: text("client_account_id").notNull(),
    transactionHash: text("transaction_hash").notNull(),
    blockHeight: bigint("block_height", { mode: "number" }),
    blockHash: text("block_hash"),
    thesisHash: text("thesis_hash").notNull(),
    conditionsHash: text("conditions_hash").notNull(),
    policyHash: text("policy_hash").notNull(),
    status: text("status").notNull().default("PENDING"),
    committedAt: timestamp("committed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("commitments_audit_uidx").on(table.auditId),
    uniqueIndex("commitments_tx_uidx").on(table.networkId, table.transactionHash),
    index("commitments_contract_idx").on(table.contractAccountId),
  ],
);

export const feeQuotes = pgTable(
  "fee_quotes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    auditId: uuid("audit_id")
      .notNull()
      .references(() => audits.id, { onDelete: "restrict" }),
    amountYocto: numeric("amount_yocto", { precision: 78, scale: 0 }).notNull(),
    quoteHash: text("quote_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    status: text("status").notNull().default("OPEN"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("fee_quotes_hash_uidx").on(table.quoteHash),
    index("fee_quotes_audit_idx").on(table.auditId),
  ],
);

export const feePayments = pgTable(
  "fee_payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    auditId: uuid("audit_id")
      .notNull()
      .references(() => audits.id, { onDelete: "restrict" }),
    quoteId: uuid("quote_id")
      .notNull()
      .references(() => feeQuotes.id, { onDelete: "restrict" }),
    txHash: text("tx_hash").notNull(),
    amountYocto: numeric("amount_yocto", { precision: 78, scale: 0 }).notNull(),
    status: text("status").notNull().default("VERIFIED"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("fee_payments_tx_uidx").on(table.txHash),
    uniqueIndex("fee_payments_audit_uidx").on(table.auditId),
  ],
);

export const dataSnapshots = pgTable(
  "data_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    auditId: uuid("audit_id")
      .notNull()
      .references(() => audits.id, { onDelete: "cascade" }),
    sourceAdapter: text("source_adapter").notNull(),
    adapterVersion: text("adapter_version").notNull(),
    snapshotAt: timestamp("snapshot_at", { withTimezone: true }).notNull(),
    blockHeight: bigint("block_height", { mode: "number" }),
    blockHash: text("block_hash"),
    normalizedPayload: jsonb("normalized_payload").notNull(),
    payloadHash: text("payload_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("data_snapshots_audit_idx").on(table.auditId)],
);

export const attackerRuns = pgTable(
  "attacker_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    auditId: uuid("audit_id")
      .notNull()
      .references(() => audits.id, { onDelete: "cascade" }),
    attackerId: text("attacker_id").notNull(),
    runGeneration: integer("run_generation").notNull().default(1),
    modelAssignmentId: uuid("model_assignment_id").references(() => modelAssignments.id),
    status: runStatusEnum("status").notNull().default("QUEUED"),
    inputSnapshotId: uuid("input_snapshot_id").references(() => dataSnapshots.id),
    promptHash: text("prompt_hash"),
    schemaVersion: text("schema_version").notNull().default("1.0"),
    providerRequestId: text("provider_request_id"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    estimatedCostMicrounits: bigint("estimated_cost_microunits", { mode: "number" }),
    rawOutputRef: text("raw_output_ref"),
    rawOutput: text("raw_output"),
    parsedOutput: jsonb("parsed_output"),
    validationReport: jsonb("validation_report"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("attacker_runs_unique_idx").on(
      table.auditId,
      table.attackerId,
      table.runGeneration,
    ),
    index("attacker_runs_audit_status_idx").on(table.auditId, table.status),
  ],
);

export const evidenceRecords = pgTable(
  "evidence_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    auditId: uuid("audit_id")
      .notNull()
      .references(() => audits.id, { onDelete: "cascade" }),
    attackerRunId: uuid("attacker_run_id").references(() => attackerRuns.id, {
      onDelete: "set null",
    }),
    sourceAdapter: text("source_adapter").notNull(),
    adapterVersion: text("adapter_version").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id").notNull(),
    typedLocator: jsonb("typed_locator").notNull(),
    observationAt: timestamp("observation_at", { withTimezone: true }),
    retrievedAt: timestamp("retrieved_at", { withTimezone: true }).notNull().defaultNow(),
    blockHeight: bigint("block_height", { mode: "number" }),
    blockHash: text("block_hash"),
    normalizedValue: jsonb("normalized_value"),
    evidenceType: text("evidence_type").notNull(),
    payloadHash: text("payload_hash").notNull(),
    payloadRef: text("payload_ref"),
    freshnessStatus: text("freshness_status"),
    limitations: jsonb("limitations").notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("evidence_audit_adapter_idx").on(table.auditId, table.sourceAdapter),
    index("evidence_payload_hash_idx").on(table.payloadHash),
  ],
);

export const findings = pgTable(
  "findings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    auditId: uuid("audit_id")
      .notNull()
      .references(() => audits.id, { onDelete: "cascade" }),
    attackerRunId: uuid("attacker_run_id")
      .notNull()
      .references(() => attackerRuns.id, { onDelete: "cascade" }),
    findingKey: text("finding_key").notNull(),
    section: sectionEnum("section").notNull(),
    conditionId: text("condition_id"),
    category: text("category").notNull(),
    severity: text("severity").notNull(),
    claim: text("claim").notNull(),
    rationale: text("rationale").notNull(),
    noveltyExplanation: text("novelty_explanation"),
    fingerprint: text("fingerprint"),
    reviewStatus: reviewStatusEnum("review_status").notNull().default("SUBMITTED"),
    evidenceStatus: evidenceStatusEnum("evidence_status"),
    reproducibilityStatus: reproducibilityStatusEnum("reproducibility_status"),
    policyDisqualifierRuleId: text("policy_disqualifier_rule_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("findings_run_key_uidx").on(table.attackerRunId, table.findingKey),
    index("findings_audit_review_idx").on(table.auditId, table.reviewStatus, table.severity),
    index("findings_audit_fingerprint_idx").on(table.auditId, table.fingerprint),
  ],
);

export const conditionAssessments = pgTable(
  "condition_assessments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    attackerRunId: uuid("attacker_run_id")
      .notNull()
      .references(() => attackerRuns.id, { onDelete: "cascade" }),
    conditionId: text("condition_id").notNull(),
    assessmentStatus: assessmentStatusEnum("assessment_status").notNull(),
    status: conditionStatusEnum("status"),
    rationale: text("rationale").notNull(),
    confidence: numeric("confidence", { precision: 4, scale: 3 }),
    invalidTestAnalysis: jsonb("invalid_test_analysis"),
    evidenceRefs: jsonb("evidence_refs").notNull().default([]),
    limitations: jsonb("limitations").notNull().default([]),
    reviewStatus: text("review_status").notNull().default("SUBMITTED"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("condition_assessments_run_condition_uidx").on(
      table.attackerRunId,
      table.conditionId,
    ),
  ],
);

export const findingEvidenceLinks = pgTable(
  "finding_evidence_links",
  {
    findingId: uuid("finding_id")
      .notNull()
      .references(() => findings.id, { onDelete: "cascade" }),
    evidenceId: uuid("evidence_id")
      .notNull()
      .references(() => evidenceRecords.id, { onDelete: "cascade" }),
    claimFragment: text("claim_fragment"),
  },
  (table) => [primaryKey({ columns: [table.findingId, table.evidenceId] })],
);

export const reviewRecords = pgTable(
  "review_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    auditId: uuid("audit_id")
      .notNull()
      .references(() => audits.id, { onDelete: "cascade" }),
    subjectType: text("subject_type").notNull(),
    subjectId: uuid("subject_id").notNull(),
    reviewerType: text("reviewer_type").notNull(),
    result: text("result").notNull(),
    reasonCode: text("reason_code"),
    details: jsonb("details"),
    reviewerVersion: text("reviewer_version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("review_records_audit_type_idx").on(table.auditId, table.reviewerType)],
);

export const teeVerifications = pgTable(
  "tee_verifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    attackerRunId: uuid("attacker_run_id")
      .notNull()
      .references(() => attackerRuns.id, { onDelete: "cascade" }),
    modelId: text("model_id").notNull(),
    signatureKind: text("signature_kind"),
    signerIdentity: text("signer_identity"),
    attestationHash: text("attestation_hash"),
    verifierVersion: text("verifier_version"),
    trustRootVersion: text("trust_root_version"),
    result: text("result").notNull(),
    reason: text("reason"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("tee_verifications_run_uidx").on(table.attackerRunId)],
);

export const adjudications = pgTable(
  "adjudications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    auditId: uuid("audit_id")
      .notNull()
      .references(() => audits.id, { onDelete: "restrict" }),
    policyVersion: text("policy_version").notNull(),
    policyHash: text("policy_hash").notNull(),
    verdict: verdictEnum("verdict").notNull(),
    divergenceIndex: numeric("divergence_index", { precision: 8, scale: 6 }),
    gateResults: jsonb("gate_results").notNull(),
    decisionTrace: jsonb("decision_trace").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("adjudications_audit_uidx").on(table.auditId)],
);

export const certificates = pgTable(
  "certificates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    auditId: uuid("audit_id")
      .notNull()
      .references(() => audits.id, { onDelete: "restrict" }),
    certificateHash: text("certificate_hash").notNull(),
    canonicalizationVersion: text("canonicalization_version").notNull(),
    certificateJson: jsonb("certificate_json").notNull(),
    publicCertificateJson: jsonb("public_certificate_json").notNull(),
    chainTxHash: text("chain_tx_hash"),
    anchorStatus: anchorStatusEnum("anchor_status").notNull().default("PENDING"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("certificates_audit_uidx").on(table.auditId),
    uniqueIndex("certificates_hash_uidx").on(table.certificateHash),
  ],
);

export const bountyAllocations = pgTable(
  "bounty_allocations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    auditId: uuid("audit_id")
      .notNull()
      .references(() => audits.id, { onDelete: "restrict" }),
    findingId: uuid("finding_id")
      .notNull()
      .references(() => findings.id, { onDelete: "restrict" }),
    attackerId: text("attacker_id").notNull(),
    settlementId: text("settlement_id").notNull(),
    recipientAccountId: text("recipient_account_id").notNull(),
    amountYocto: numeric("amount_yocto", { precision: 78, scale: 0 }).notNull(),
    policyVersion: text("policy_version").notNull(),
    status: text("status").notNull().default("RECORDED"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("bounty_allocations_audit_idx").on(table.auditId)],
);

export const bountySettlements = pgTable(
  "bounty_settlements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    allocationId: uuid("allocation_id")
      .notNull()
      .references(() => bountyAllocations.id, { onDelete: "restrict" }),
    settlementId: text("settlement_id").notNull(),
    txHash: text("tx_hash"),
    status: text("status").notNull().default("PENDING"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("bounty_settlements_settlement_uidx").on(table.settlementId),
    uniqueIndex("bounty_settlements_tx_uidx").on(table.txHash),
  ],
);

export const reputationEvents = pgTable(
  "reputation_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    attackerId: text("attacker_id").notNull(),
    auditId: uuid("audit_id")
      .notNull()
      .references(() => audits.id, { onDelete: "cascade" }),
    findingId: uuid("finding_id").references(() => findings.id, { onDelete: "set null" }),
    eventType: text("event_type").notNull(),
    eventValue: numeric("event_value", { precision: 20, scale: 6 }),
    policyVersion: text("policy_version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("reputation_events_unique_idx").on(
      table.attackerId,
      table.auditId,
      table.eventType,
      table.findingId,
    ),
  ],
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    auditId: uuid("audit_id")
      .notNull()
      .references(() => audits.id, { onDelete: "cascade" }),
    actorType: text("actor_type").notNull(),
    actorId: text("actor_id"),
    eventType: text("event_type").notNull(),
    fromStatus: text("from_status"),
    toStatus: text("to_status"),
    metadataRedacted: jsonb("metadata_redacted").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("audit_events_audit_created_idx").on(table.auditId, table.createdAt)],
);

export type Audit = typeof audits.$inferSelect;
export type AuditInsert = typeof audits.$inferInsert;
export type FailureCondition = typeof failureConditions.$inferSelect;
export type Thesis = typeof theses.$inferSelect;
export type AttackerRun = typeof attackerRuns.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
