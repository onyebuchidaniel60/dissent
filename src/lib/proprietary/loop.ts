import "server-only";

import { and, asc, desc, eq, inArray, like } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { getDb } from "@/db";
import {
  auditEvents,
  audits,
  commitments,
  feePayments,
  feeQuotes,
  workspaces,
  type Audit,
} from "@/db/schema";
import { prepareAudit } from "@/lib/audit-service";
import { canonicalJson, sha256Hex } from "@/lib/canonical";
import {
  callContractAs,
  callRegistry,
  callRegistryAs,
  deployerSigner,
  verifyCommitmentTransaction,
  verifyFundingTransaction,
  viewContract,
  type NearSigner,
} from "@/lib/near";
import { executionVenue, NEAR_NETWORK } from "@/lib/network";
import { AUDIT_FEE_YOCTO, POLICY_HASH, QUOTE_EXPIRY_SECONDS } from "@/lib/policy";
import {
  checkExecutionVenue,
  fetchExecutionVenueQuote,
  proprietaryLoopEnabled,
  type ExecutionVenueQuoteResponse,
} from "@/lib/proprietary/venue";

const PROPRIETARY_IDEMPOTENCY_PREFIX = "proprietary-";
const ACTIVE_AUDIT_STATUSES = [
  "AWAITING_COMMITMENT",
  "COMMITTED",
  "FUNDED",
  "QUEUED",
  "ATTACKING",
  "EVIDENCE_REVIEW",
  "CERTIFICATE_PENDING",
] as const;
const STORAGE_DEPOSIT = 1_250_000_000_000_000_000_000n;

type TxReceipt = {
  transactionHash: string;
  blockHeight: number | null;
  blockHash: string | null;
};

type FeeQuote = {
  id: string;
  quoteHash: string;
  amountYocto: string;
  expiresAt: Date;
};

export type ProprietaryLoopResult =
  | { status: "DISABLED" }
  | { status: "BLOCKED_VENUE"; reason: string }
  | { status: "BUSY"; auditId: string; publicAuditId: string; state: string }
  | {
      status: "ORIGINATED";
      auditId: string;
      publicAuditId: string;
      quote: ExecutionVenueQuoteResponse;
    }
  | {
      status: "FUNDED";
      auditId: string;
      publicAuditId: string;
      quote: ExecutionVenueQuoteResponse | null;
      commitment?: TxReceipt;
      funding?: TxReceipt;
      resumed: boolean;
    }
  | {
      status: "FAILED";
      stage: "PREFLIGHT" | "COMMIT" | "QUOTE" | "FUND" | "DISPATCH";
      reason: string;
      auditId?: string;
      publicAuditId?: string;
    };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function proprietaryClientSigner(accountId: string): NearSigner {
  const privateKey =
    process.env.PROPRIETARY_CLIENT_KEY?.trim() || process.env.DEMO_CLIENT_KEY?.trim();
  if (!privateKey) throw new Error("PROPRIETARY_CLIENT_KEY_MISSING");
  return { accountId, privateKey: privateKey as NearSigner["privateKey"] };
}

function signingPreflight(): string | null {
  if (!process.env.NEAR_DEPLOYER_ACCOUNT_ID?.trim() || !process.env.NEAR_DEPLOYER_KEY?.trim()) {
    return "NEAR_DEPLOYER_KEY_MISSING";
  }
  if (!process.env.PROPRIETARY_CLIENT_KEY?.trim() && !process.env.DEMO_CLIENT_KEY?.trim()) {
    return "PROPRIETARY_CLIENT_KEY_MISSING";
  }
  if (!process.env.NEAR_REGISTRY_ACCOUNT_ID?.trim()) {
    return "REGISTRY_NOT_CONFIGURED";
  }
  return null;
}

async function findActiveProprietaryAudit(workspaceId: string): Promise<Audit | null> {
  const [active] = await getDb()
    .select()
    .from(audits)
    .where(
      and(
        eq(audits.workspaceId, workspaceId),
        like(audits.idempotencyKey, `${PROPRIETARY_IDEMPOTENCY_PREFIX}%`),
        inArray(audits.status, [...ACTIVE_AUDIT_STATUSES]),
      ),
    )
    .orderBy(asc(audits.createdAt))
    .limit(1);
  return active ?? null;
}

async function commitAudit(audit: Audit, signer: NearSigner): Promise<TxReceipt> {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(commitments)
    .where(eq(commitments.auditId, audit.id))
    .limit(1);

  if (existing) {
    if (audit.status === "AWAITING_COMMITMENT") {
      await db
        .update(audits)
        .set({ status: "COMMITTED", committedAt: existing.committedAt ?? new Date(), updatedAt: new Date() })
        .where(and(eq(audits.id, audit.id), eq(audits.status, "AWAITING_COMMITMENT")));
    }
    return {
      transactionHash: existing.transactionHash,
      blockHeight: existing.blockHeight,
      blockHash: existing.blockHash,
    };
  }

  const chain = await callRegistryAs(signer, "commit_audit", {
    audit_id: audit.id,
    thesis_hash: audit.thesisHash,
    conditions_hash: audit.conditionsHash,
    canonicalization_version: audit.canonicalizationVersion,
    conditions_version: audit.conditionsVersion,
    policy_hash: POLICY_HASH,
  });

  const verified = await verifyCommitmentTransaction(chain.transactionHash, {
    auditId: audit.id,
    clientAccountId: audit.clientAccountId,
    thesisHash: audit.thesisHash,
    conditionsHash: audit.conditionsHash,
    canonicalizationVersion: audit.canonicalizationVersion,
    conditionsVersion: audit.conditionsVersion,
    policyHash: POLICY_HASH,
  });

  await db.transaction(async (tx) => {
    await tx.insert(commitments).values({
      auditId: audit.id,
      networkId: NEAR_NETWORK,
      contractAccountId: process.env.NEAR_REGISTRY_ACCOUNT_ID?.trim() ?? "",
      clientAccountId: audit.clientAccountId,
      transactionHash: chain.transactionHash,
      blockHeight: verified.blockHeight,
      blockHash: verified.blockHash,
      thesisHash: audit.thesisHash,
      conditionsHash: audit.conditionsHash,
      policyHash: POLICY_HASH,
      status: "FINAL",
      committedAt: new Date(),
    });
    await tx
      .update(audits)
      .set({ status: "COMMITTED", committedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(audits.id, audit.id), eq(audits.status, "AWAITING_COMMITMENT")));
    await tx.insert(auditEvents).values({
      auditId: audit.id,
      actorType: "CLIENT",
      actorId: "proprietary-loop",
      eventType: "COMMITMENT_VERIFIED",
      fromStatus: "AWAITING_COMMITMENT",
      toStatus: "COMMITTED",
      metadataRedacted: {
        transaction_hash: chain.transactionHash,
        block_height: verified.blockHeight,
      },
    });
  });

  console.info(
    "[proprietary] committed",
    JSON.stringify({
      auditId: audit.id,
      publicAuditId: audit.publicAuditId,
      transactionHash: chain.transactionHash,
      blockHeight: verified.blockHeight,
    }),
  );

  return {
    transactionHash: chain.transactionHash,
    blockHeight: verified.blockHeight,
    blockHash: verified.blockHash,
  };
}

async function issueFeeQuote(audit: Audit): Promise<FeeQuote> {
  const db = getDb();
  const [open] = await db
    .select()
    .from(feeQuotes)
    .where(and(eq(feeQuotes.auditId, audit.id), eq(feeQuotes.status, "OPEN")))
    .orderBy(desc(feeQuotes.createdAt))
    .limit(1);

  if (open && open.expiresAt > new Date()) {
    return {
      id: open.id,
      quoteHash: open.quoteHash,
      amountYocto: String(open.amountYocto),
      expiresAt: open.expiresAt,
    };
  }

  const quoteId = randomUUID();
  const expiresAt = new Date(Date.now() + QUOTE_EXPIRY_SECONDS * 1000);
  const amount = AUDIT_FEE_YOCTO.toString();
  const quoteHash = sha256Hex(
    canonicalJson({
      quote_id: quoteId,
      audit_id: audit.id,
      amount_yocto: amount,
      expires_at: expiresAt.toISOString(),
      contract_id: process.env.NEAR_REGISTRY_ACCOUNT_ID?.trim() ?? "",
      policy_hash: POLICY_HASH,
    }),
  );

  const chain = await callRegistry("issue_quote", {
    audit_id: audit.id,
    quote_id: quoteId,
    amount_yocto: amount,
    quote_hash: quoteHash,
    expires_at_ns: expiresAt.getTime() * 1_000_000,
  });

  await db.insert(feeQuotes).values({
    id: quoteId,
    auditId: audit.id,
    amountYocto: amount,
    quoteHash,
    expiresAt,
    status: "OPEN",
  });
  await db.insert(auditEvents).values({
    auditId: audit.id,
    actorType: "SYSTEM",
    actorId: "quote-service",
    eventType: "FEE_QUOTE_ISSUED",
    metadataRedacted: {
      quote_id: quoteId,
      amount_yocto: amount,
      transaction_hash: chain.transactionHash,
    },
  });

  console.info(
    "[proprietary] quote_issued",
    JSON.stringify({
      auditId: audit.id,
      quoteId,
      amountYocto: amount,
      transactionHash: chain.transactionHash,
    }),
  );

  return { id: quoteId, quoteHash, amountYocto: amount, expiresAt };
}

async function fundAudit(audit: Audit, signer: NearSigner, quote: FeeQuote): Promise<TxReceipt> {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(feePayments)
    .where(eq(feePayments.auditId, audit.id))
    .limit(1);

  if (existing) {
    if (audit.status === "COMMITTED") {
      await db.transaction(async (tx) => {
        await tx
          .update(feeQuotes)
          .set({ status: "USED" })
          .where(and(eq(feeQuotes.id, existing.quoteId), eq(feeQuotes.status, "OPEN")));
        await tx
          .update(audits)
          .set({ status: "FUNDED", fundedAt: existing.verifiedAt, updatedAt: new Date() })
          .where(and(eq(audits.id, audit.id), eq(audits.status, "COMMITTED")));
      });
    }
    return { transactionHash: existing.txHash, blockHeight: null, blockHash: null };
  }

  const chain = await callRegistryAs(
    signer,
    "fund_audit",
    {
      audit_id: audit.id,
      quote_id: quote.id,
      quote_hash: quote.quoteHash,
    },
    { deposit: BigInt(quote.amountYocto) },
  );

  const verified = await verifyFundingTransaction(chain.transactionHash, {
    auditId: audit.id,
    clientAccountId: audit.clientAccountId,
    quoteId: quote.id,
    quoteHash: quote.quoteHash,
    amountYocto: quote.amountYocto,
  });

  await db.transaction(async (tx) => {
    await tx.insert(feePayments).values({
      auditId: audit.id,
      quoteId: quote.id,
      txHash: chain.transactionHash,
      amountYocto: quote.amountYocto,
      status: "VERIFIED",
      verifiedAt: new Date(),
    });
    await tx
      .update(feeQuotes)
      .set({ status: "USED" })
      .where(and(eq(feeQuotes.id, quote.id), eq(feeQuotes.status, "OPEN")));
    await tx
      .update(audits)
      .set({ status: "FUNDED", fundedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(audits.id, audit.id), eq(audits.status, "COMMITTED")));
    await tx.insert(auditEvents).values({
      auditId: audit.id,
      actorType: "CLIENT",
      actorId: "proprietary-loop",
      eventType: "FUNDING_VERIFIED",
      fromStatus: "COMMITTED",
      toStatus: "FUNDED",
      metadataRedacted: {
        transaction_hash: chain.transactionHash,
        quote_id: quote.id,
        amount_yocto: quote.amountYocto,
        block_height: verified.blockHeight,
      },
    });
  });

  console.info(
    "[proprietary] funded",
    JSON.stringify({
      auditId: audit.id,
      publicAuditId: audit.publicAuditId,
      transactionHash: chain.transactionHash,
      quoteId: quote.id,
      amountYocto: quote.amountYocto,
      blockHeight: verified.blockHeight,
    }),
  );

  return {
    transactionHash: chain.transactionHash,
    blockHeight: verified.blockHeight,
    blockHash: verified.blockHash,
  };
}

async function ensureStorage(
  tokenId: string,
  accountId: string,
  signer: NearSigner,
): Promise<string | null> {
  const current = await viewContract<{ total?: string } | null>(tokenId, "storage_balance_of", {
    account_id: accountId,
  });
  if (current) return null;

  const result = await callContractAs(
    signer,
    tokenId,
    "storage_deposit",
    { account_id: accountId, registration_only: true },
    { gas: 30_000_000_000_000n, deposit: STORAGE_DEPOSIT },
  );
  return result.transactionHash;
}

async function prepareExecution(audit: Audit, quote: ExecutionVenueQuoteResponse | null): Promise<void> {
  if (executionVenue() !== "TIDEPOOL") {
    console.info(
      "[proprietary] execution_prep_skipped",
      JSON.stringify({ auditId: audit.id, reason: "NON_TIDEPOOL_VENUE" }),
    );
    return;
  }

  if (!quote) {
    console.warn(
      "[proprietary] execution_prep_skipped",
      JSON.stringify({ auditId: audit.id, reason: "QUOTE_UNAVAILABLE" }),
    );
    return;
  }

  const vault = process.env.NEAR_VAULT_ACCOUNT_ID?.trim();
  const wnear = process.env.TIDEPOOL_WNEAR_TOKEN_ID?.trim() || "wnear.tidepool-sandbox.testnet";
  const usdc = process.env.TIDEPOOL_USDC_TOKEN_ID?.trim() || "usdc.tidepool-sandbox.testnet";
  const recipient = process.env.PROPRIETARY_RECIPIENT?.trim();
  const depositAddress = quote.quote.depositAddress;

  if (!vault || !recipient || !depositAddress) {
    console.warn(
      "[proprietary] execution_prep_skipped",
      JSON.stringify({
        auditId: audit.id,
        reason: "EXECUTION_CONFIG_MISSING",
        vault: Boolean(vault),
        recipient: Boolean(recipient),
        depositAddress: Boolean(depositAddress),
      }),
    );
    return;
  }

  const deployer = deployerSigner();
  const certificateTx = await callContractAs(deployer, vault, "approve_certificate", {
    certificate_id: audit.id,
  });
  const recipientTx = await callContractAs(deployer, vault, "set_recipient", {
    recipient_id: depositAddress,
    allowed: true,
  });
  const wnearStorageTx = await ensureStorage(wnear, depositAddress, deployer);
  const usdcStorageTx = await ensureStorage(usdc, recipient, deployer);
  const vaultBalance = await viewContract<string>(wnear, "ft_balance_of", { account_id: vault });

  process.env.PROPRIETARY_EXECUTION_AUDIT_ID = audit.id;
  process.env.TIDEPOOL_DEPOSIT_ADDRESS = depositAddress;

  console.info(
    "[proprietary] execution_prepared",
    JSON.stringify({
      auditId: audit.id,
      vault,
      depositAddress,
      wnear,
      usdc,
      recipient,
      vaultWnearBalance: vaultBalance,
      certificateTx: certificateTx.transactionHash,
      recipientTx: recipientTx.transactionHash,
      wnearStorageTx,
      usdcStorageTx,
    }),
  );
}

async function enqueueDispatch(auditId: string): Promise<void> {
  const { getQueue, startQueue } = await import("@/lib/queue");
  await startQueue();
  const queue = getQueue();
  if (!queue) throw new Error("QUEUE_UNAVAILABLE");
  await queue.send("audit.dispatch", { auditId });
}

async function advanceAudit(
  audit: Audit,
  quote: ExecutionVenueQuoteResponse | null,
  signer: NearSigner,
  resumed: boolean,
): Promise<ProprietaryLoopResult> {
  let current = audit;
  let commitment: TxReceipt | undefined;
  let funding: TxReceipt | undefined;

  if (current.status === "AWAITING_COMMITMENT") {
    try {
      commitment = await commitAudit(current, signer);
      current = { ...current, status: "COMMITTED" };
    } catch (error) {
      return {
        status: "FAILED",
        stage: "COMMIT",
        reason: errorMessage(error),
        auditId: current.id,
        publicAuditId: current.publicAuditId,
      };
    }
  }

  if (current.status === "COMMITTED") {
    let feeQuote: FeeQuote;
    try {
      feeQuote = await issueFeeQuote(current);
    } catch (error) {
      return {
        status: "FAILED",
        stage: "QUOTE",
        reason: errorMessage(error),
        auditId: current.id,
        publicAuditId: current.publicAuditId,
      };
    }

    try {
      funding = await fundAudit(current, signer, feeQuote);
      current = { ...current, status: "FUNDED" };
    } catch (error) {
      return {
        status: "FAILED",
        stage: "FUND",
        reason: errorMessage(error),
        auditId: current.id,
        publicAuditId: current.publicAuditId,
      };
    }
  }

  if (current.status !== "FUNDED" && current.status !== "QUEUED") {
    return {
      status: "BUSY",
      auditId: current.id,
      publicAuditId: current.publicAuditId,
      state: current.status,
    };
  }

  try {
    await prepareExecution(current, quote);
  } catch (error) {
    // Execution preparation is best-effort. The audit and certificate still run.
    console.warn(
      "[proprietary] execution_prep_failed",
      JSON.stringify({ auditId: current.id, error: errorMessage(error) }),
    );
  }

  try {
    await enqueueDispatch(current.id);
  } catch (error) {
    return {
      status: "FAILED",
      stage: "DISPATCH",
      reason: errorMessage(error),
      auditId: current.id,
      publicAuditId: current.publicAuditId,
    };
  }

  console.info(
    "[proprietary] dispatched",
    JSON.stringify({ auditId: current.id, publicAuditId: current.publicAuditId, resumed }),
  );

  return {
    status: "FUNDED",
    auditId: current.id,
    publicAuditId: current.publicAuditId,
    quote,
    commitment,
    funding,
    resumed,
  };
}

/**
 * Proprietary loop: originate → commit → fund → prepare execution → dispatch.
 *
 * The cron worker calls this with autoCommit enabled. The explicit operator script
 * (`scripts/proprietary-live.ts`) passes `autoCommit: false` so it can perform vault
 * approvals in its own order before dispatching.
 */
export async function runProprietaryLoop(
  options: { autoCommit?: boolean } = {},
): Promise<ProprietaryLoopResult> {
  const autoCommit = options.autoCommit ?? true;
  if (!proprietaryLoopEnabled()) return { status: "DISABLED" };

  if (autoCommit) {
    const preflight = signingPreflight();
    if (preflight) return { status: "FAILED", stage: "PREFLIGHT", reason: preflight };
  }

  const db = getDb();
  const configuredClientAccountId =
    process.env.PROPRIETARY_CLIENT_ACCOUNT_ID?.trim() ??
    process.env.DEMO_CLIENT_ACCOUNT_ID?.trim() ??
    "";
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.clientAccountId, configuredClientAccountId))
    .limit(1);

  if (!workspace) return { status: "BLOCKED_VENUE", reason: "CLIENT_WORKSPACE_MISSING" };

  const clientAccountId =
    workspace.clientAccountId ??
    process.env.PROPRIETARY_CLIENT_ACCOUNT_ID?.trim() ??
    process.env.DEMO_CLIENT_ACCOUNT_ID?.trim() ??
    "";
  if (!clientAccountId) {
    return { status: "BLOCKED_VENUE", reason: "CLIENT_ACCOUNT_NOT_CONFIGURED" };
  }

  const signer = autoCommit ? proprietaryClientSigner(clientAccountId) : null;

  if (autoCommit) {
    const active = await findActiveProprietaryAudit(workspace.id);
    if (active) {
      if (
        active.status === "ATTACKING" ||
        active.status === "EVIDENCE_REVIEW" ||
        active.status === "CERTIFICATE_PENDING"
      ) {
        return {
          status: "BUSY",
          auditId: active.id,
          publicAuditId: active.publicAuditId,
          state: active.status,
        };
      }

      let resumeQuote: ExecutionVenueQuoteResponse | null = null;
      try {
        resumeQuote = await fetchExecutionVenueQuote();
      } catch (error) {
        console.warn(
          "[proprietary] resume_quote_unavailable",
          JSON.stringify({ auditId: active.id, error: errorMessage(error) }),
        );
      }
      return advanceAudit(active, resumeQuote, signer!, true);
    }
  }

  const venue = await checkExecutionVenue();
  if (!venue.available) {
    return { status: "BLOCKED_VENUE", reason: venue.reason ?? "VENUE_UNAVAILABLE" };
  }

  let quote: ExecutionVenueQuoteResponse;
  try {
    quote = await fetchExecutionVenueQuote();
  } catch (error) {
    return {
      status: "BLOCKED_VENUE",
      reason: errorMessage(error),
    };
  }

  const prepared = await prepareAudit(
    {
      keyId: "proprietary-loop",
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      clientAccountId,
      scopes: ["audit:create", "audit:read:own"],
    },
    {
      thesis: {
        asset: {
          chain: "near",
          asset_id:
            executionVenue() === "TIDEPOOL"
              ? "nep141:wnear.tidepool-sandbox.testnet"
              : process.env.ONECLICK_ORIGIN_ASSET ?? "nep141:wrap.near",
          symbol: "wNEAR",
        },
        action: "SELL",
        direction: "SHORT",
        rationale: `${executionVenue() === "TIDEPOOL" ? "Tidepool staging" : "1Click mainnet"} quote at ${quote.timestamp}: ${quote.quote.amountInFormatted} wNEAR (${quote.quote.amountInUsd} USD) swaps to ${quote.quote.amountOutFormatted} USDC. The proprietary arm takes a small defensive wNEAR/USDC position and will execute only if the eight-attacker audit returns TRADE. The thesis is invalidated if NEAR spot rises above the committed ceiling or USDC depegs beyond the committed bound.`,
        position: {
          amount: quote.quote.amountInFormatted,
          unit: "wNEAR",
          notional_usd: quote.quote.amountInUsd,
        },
        time_horizon: { value: 1, unit: "DAY" },
        execution_venue: executionVenue(),
      },
      conditions: [
        {
          condition_id: "PROP-001",
          description: "NEAR spot price is above USD 5.00 at the evaluation snapshot",
          metric: "PRICE_USD",
          operator: "GT",
          threshold: "5.00",
          unit: "USD",
          evaluation_window: { value: 1, unit: "DAY" },
          severity: "CRITICAL",
        },
        {
          condition_id: "PROP-002",
          description: "USDC depeg exceeds 200 basis points on the independent observation",
          metric: "USDC_DEPEG_BPS",
          operator: "GT",
          threshold: "200",
          unit: "BPS",
          evaluation_window: { value: 1, unit: "DAY" },
          severity: "HIGH",
        },
      ],
    },
    `${PROPRIETARY_IDEMPOTENCY_PREFIX}${Math.floor(Date.now() / 300_000)}`,
  );

  if (!autoCommit) {
    return {
      status: "ORIGINATED",
      auditId: prepared.audit.id,
      publicAuditId: prepared.audit.publicAuditId,
      quote,
    };
  }

  const advanced = await advanceAudit(prepared.audit, quote, signer!, false);
  if (advanced.status !== "FUNDED") return advanced;
  return {
    ...advanced,
    quote,
  };
}
