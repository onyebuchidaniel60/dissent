/**
 * Live Phase 10 proprietary run.
 *
 * This is an operator script, not a web route. It:
 *   1. originates a real Tidepool wNEAR/USDC quote;
 *   2. prepares the same eight-attacker audit used for client theses;
 *   3. commits and funds the audit on the testnet registry;
 *   4. approves the deterministic certificate and quote deposit address on the vault;
 *   5. dispatches the audit, adjudicates it, executes only on TRADE, and anchors the certificate.
 *
 * Required environment: DATABASE_URL, NEAR_DEPLOYER_KEY, DEMO_CLIENT_KEY,
 * NEAR_VAULT_AGENT_KEY, OPENROUTER_API_KEY, GROQ_API_KEY.
 *
 * Run with:
 *   set -a; . ./.env.local; set +a
 *   NODE_OPTIONS=--conditions=react-server pnpm exec tsx scripts/proprietary-live.ts
 */

import { randomUUID } from "node:crypto";

import { Account, JsonRpcProvider, actions, type KeyPairString } from "near-api-js";
import { Client } from "pg";

import { canonicalJson, sha256Hex } from "@/lib/canonical";
import { reviewAndAdjudicate } from "@/lib/finalize";
import { dispatchAudit } from "@/lib/orchestrator";
import { AUDIT_FEE_YOCTO, POLICY_HASH, QUOTE_EXPIRY_SECONDS } from "@/lib/policy";
import { runProprietaryLoop } from "@/lib/proprietary/loop";
import { fetchTidepoolStatus } from "@/lib/proprietary/venue";

const RPC_URL = process.env.NEAR_RPC_URL ?? "https://rpc.testnet.near.org";
const REGISTRY = process.env.NEAR_REGISTRY_ACCOUNT_ID ?? "registry.dissent-demo.testnet";
const VAULT = process.env.NEAR_VAULT_ACCOUNT_ID ?? "vault.dissent-demo.testnet";
const WNEAR = process.env.TIDEPOOL_WNEAR_TOKEN_ID ?? "wnear.tidepool-sandbox.testnet";
const USDC = "usdc.tidepool-sandbox.testnet";
const STORAGE_DEPOSIT = 1_250_000_000_000_000_000_000n;

type NearAccount = InstanceType<typeof Account>;
type SendResult = { transactionHash: string; blockHeight: number | null; blockHash: string | null };

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`MISSING_ENV:${name}`);
  return value;
}

function provider(): JsonRpcProvider {
  return new JsonRpcProvider({ url: RPC_URL });
}

function accountFor(accountId: string, key: string): NearAccount {
  return new Account(accountId, provider(), key as KeyPairString);
}

function deployer(): NearAccount {
  return accountFor(process.env.NEAR_DEPLOYER_ACCOUNT_ID ?? "dissent-demo.testnet", required("NEAR_DEPLOYER_KEY"));
}

function demoClient(): NearAccount {
  return accountFor(process.env.DEMO_CLIENT_ACCOUNT_ID ?? "demo-client.testnet", required("DEMO_CLIENT_KEY"));
}

async function send(
  account: NearAccount,
  receiverId: string,
  method: string,
  args: Record<string, unknown>,
  gas = 100_000_000_000_000n,
  deposit = 0n,
): Promise<SendResult> {
  const outcome = await account.signAndSendTransaction({
    receiverId,
    actions: [actions.functionCall(method, args, gas, deposit)],
    waitUntil: "FINAL",
    throwOnFailure: true,
  });
  const transaction = outcome.transaction_outcome as {
    id: string;
    block_height?: number;
    block_hash?: string;
  };
  return {
    transactionHash: transaction.id,
    blockHeight: transaction.block_height ?? null,
    blockHash: transaction.block_hash ?? null,
  };
}

async function ensureStorage(token: string, accountId: string): Promise<string | null> {
  const rpc = provider();
  const current = (await rpc.callFunction({
    contractId: token,
    method: "storage_balance_of",
    args: { account_id: accountId },
  })) as { total?: string } | null;
  if (current?.total) return null;
  const result = await send(
    deployer(),
    token,
    "storage_deposit",
    { account_id: accountId, registration_only: true },
    30_000_000_000_000n,
    STORAGE_DEPOSIT,
  );
  return result.transactionHash;
}

async function main() {
  process.env.PROPRIETARY_LOOP_ENABLED = "true";
  process.env.EXECUTION_ENABLED = "true";
  process.env.VAULT_SUPPORTS_NEP141 = "true";
  process.env.PROPRIETARY_THESIS_AMOUNT_YOCTO = "10000000000000000000000";
  process.env.TIDEPOOL_WNEAR_TOKEN_ID = WNEAR;
  process.env.PROPRIETARY_RECIPIENT =
    process.env.PROPRIETARY_RECIPIENT ?? process.env.DEMO_CLIENT_ACCOUNT_ID ?? "demo-client.testnet";

  if (!process.env.DATABASE_URL) throw new Error("MISSING_ENV:DATABASE_URL");
  if (!process.env.NEAR_VAULT_AGENT_KEY) throw new Error("MISSING_ENV:NEAR_VAULT_AGENT_KEY");

  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  try {
    console.log("[1/8] Originating a real Tidepool wNEAR/USDC quote and preparing the audit…");
    const loop = await runProprietaryLoop();
    if (loop.status !== "ORIGINATED") {
      throw new Error(`PROPRIETARY_LOOP_${loop.status}:${loop.status === "BLOCKED_VENUE" ? loop.reason : ""}`);
    }

    const { auditId, publicAuditId, quote } = loop;
    const depositAddress = quote.quote.depositAddress;
    const amountYocto = quote.quote.amountIn;
    console.log("audit_id", auditId);
    console.log("public_audit_id", publicAuditId);
    console.log("quote", {
      in: quote.quote.amountInFormatted,
      out: quote.quote.amountOutFormatted,
      out_usd: quote.quote.amountOutUsd,
      deposit_address: depositAddress,
      deadline: quote.quote.deadline,
    });

    const quoteDeadline = new Date(quote.quote.deadline).getTime();
    if (quoteDeadline <= Date.now()) throw new Error("QUOTE_EXPIRED_BEFORE_PIPELINE");

    const vaultBalance = (await provider().callFunction({
      contractId: WNEAR,
      method: "ft_balance_of",
      args: { account_id: VAULT },
    })) as string;
    if (BigInt(vaultBalance) < BigInt(amountYocto)) {
      throw new Error(`VAULT_WNEAR_BALANCE_TOO_LOW:${vaultBalance}:${amountYocto}`);
    }
    console.log("vault_wNEAR_balance", vaultBalance);

    console.log("[2/8] Approving the certificate and quote deposit address on the vault…");
    const certificateTx = await send(deployer(), VAULT, "approve_certificate", { certificate_id: auditId });
    const recipientTx = await send(deployer(), VAULT, "set_recipient", {
      recipient_id: depositAddress,
      allowed: true,
    });
    console.log("certificate_tx", certificateTx.transactionHash);
    console.log("recipient_tx", recipientTx.transactionHash);

    console.log("[3/8] Registering token storage for the deposit address and USDC recipient…");
    const wnearStorageTx = await ensureStorage(WNEAR, depositAddress);
    const usdcStorageTx = await ensureStorage(
      USDC,
      process.env.PROPRIETARY_RECIPIENT ?? "demo-client.testnet",
    );
    console.log("wnear_storage_tx", wnearStorageTx ?? "already-registered");
    console.log("usdc_storage_tx", usdcStorageTx ?? "already-registered");

    console.log("[4/8] Committing and funding the audit on the testnet registry…");
    const audit = (
      await db.query<{
        id: string;
        thesis_hash: string;
        conditions_hash: string;
        canonicalization_version: string;
        conditions_version: string;
        policy_version: string;
        client_account_id: string;
      }>("select id, thesis_hash, conditions_hash, canonicalization_version, conditions_version, policy_version, client_account_id from audits where id=$1", [auditId])
    ).rows[0];
    if (!audit) throw new Error("AUDIT_NOT_FOUND");

    const commitmentTx = await send(demoClient(), REGISTRY, "commit_audit", {
      audit_id: auditId,
      thesis_hash: audit.thesis_hash,
      conditions_hash: audit.conditions_hash,
      canonicalization_version: audit.canonicalization_version,
      conditions_version: audit.conditions_version,
      policy_hash: POLICY_HASH,
    });
    await db.query(
      "insert into commitments (audit_id, network_id, contract_account_id, client_account_id, transaction_hash, block_height, block_hash, thesis_hash, conditions_hash, policy_hash, status, committed_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'FINAL',now())",
      [
        auditId,
        "testnet",
        REGISTRY,
        audit.client_account_id,
        commitmentTx.transactionHash,
        commitmentTx.blockHeight,
        commitmentTx.blockHash,
        audit.thesis_hash,
        audit.conditions_hash,
        POLICY_HASH,
      ],
    );
    await db.query("update audits set status='COMMITTED', committed_at=now(), updated_at=now() where id=$1", [auditId]);
    await db.query(
      "insert into audit_events (audit_id, actor_type, actor_id, event_type, from_status, to_status, metadata_redacted) values ($1,'CLIENT',$2,'COMMITMENT_VERIFIED','AWAITING_COMMITMENT','COMMITTED',$3)",
      [auditId, "proprietary-loop", JSON.stringify({ transaction_hash: commitmentTx.transactionHash })],
    );

    const quoteId = randomUUID();
    const expiresAt = new Date(Date.now() + QUOTE_EXPIRY_SECONDS * 1000);
    const amount = AUDIT_FEE_YOCTO.toString();
    const quoteHash = sha256Hex(
      canonicalJson({
        quote_id: quoteId,
        audit_id: auditId,
        amount_yocto: amount,
        expires_at: expiresAt.toISOString(),
        contract_id: REGISTRY,
        policy_hash: POLICY_HASH,
      }),
    );
    const quoteTx = await send(deployer(), REGISTRY, "issue_quote", {
      audit_id: auditId,
      quote_id: quoteId,
      amount_yocto: amount,
      quote_hash: quoteHash,
      expires_at_ns: expiresAt.getTime() * 1_000_000,
    });
    await db.query(
      "insert into fee_quotes (id, audit_id, amount_yocto, quote_hash, expires_at, status) values ($1,$2,$3,$4,$5,'OPEN')",
      [quoteId, auditId, amount, quoteHash, expiresAt],
    );
    console.log("quote_tx", quoteTx.transactionHash);

    const fundingTx = await send(
      demoClient(),
      REGISTRY,
      "fund_audit",
      { audit_id: auditId, quote_id: quoteId, quote_hash: quoteHash },
      100_000_000_000_000n,
      AUDIT_FEE_YOCTO,
    );
    await db.query(
      "insert into fee_payments (audit_id, quote_id, tx_hash, amount_yocto, status, verified_at) values ($1,$2,$3,$4,'VERIFIED',now())",
      [auditId, quoteId, fundingTx.transactionHash, amount],
    );
    await db.query("update fee_quotes set status='USED' where id=$1", [quoteId]);
    await db.query("update audits set status='FUNDED', funded_at=now(), updated_at=now() where id=$1", [auditId]);
    await db.query(
      "insert into audit_events (audit_id, actor_type, actor_id, event_type, from_status, to_status, metadata_redacted) values ($1,'CLIENT',$2,'FUNDING_VERIFIED','COMMITTED','FUNDED',$3)",
      [auditId, "proprietary-loop", JSON.stringify({ transaction_hash: fundingTx.transactionHash, quote_id: quoteId })],
    );
    console.log("funding_tx", fundingTx.transactionHash);

    process.env.PROPRIETARY_EXECUTION_AUDIT_ID = auditId;
    process.env.TIDEPOOL_DEPOSIT_ADDRESS = depositAddress;
    process.env.PROPRIETARY_THESIS_AMOUNT_YOCTO = amountYocto;

    console.log("[5/8] Dispatching eight isolated attackers…");
    const dispatchStarted = Date.now();
    const dispatched = await dispatchAudit(auditId);
    console.log("dispatch", dispatched, "elapsed_ms", Date.now() - dispatchStarted);

    console.log("[6/8] Evidence review, sycophancy review and deterministic adjudication…");
    const adjudicated = await reviewAndAdjudicate(auditId);
    console.log("adjudication", adjudicated);

    console.log("[7/8] Reading the anchored certificate and execution receipt…");
    const certificate = (
      await db.query<{
        id: string;
        certificate_hash: string;
        anchor_status: string;
        chain_tx_hash: string | null;
        public_certificate_json: Record<string, unknown>;
        certificate_json: Record<string, unknown>;
      }>("select id, certificate_hash, anchor_status, chain_tx_hash, public_certificate_json, certificate_json from certificates where audit_id=$1", [auditId])
    ).rows[0];
    const receipt = (
      await db.query<{
        id: string;
        status: string;
        tx_hash: string | null;
        reason: string | null;
        recipient_account_id: string | null;
        amount_yocto: string | null;
      }>("select id, status, tx_hash, reason, recipient_account_id, amount_yocto from execution_receipts where audit_id=$1 order by created_at desc limit 1", [auditId])
    ).rows[0];

    console.log("certificate", certificate ? {
      id: certificate.id,
      hash: certificate.certificate_hash,
      anchor_status: certificate.anchor_status,
      anchor_tx: certificate.chain_tx_hash,
      execution_readiness: (certificate.certificate_json as { execution_readiness?: { status?: string } }).execution_readiness?.status,
    } : null);
    console.log("execution_receipt", receipt ?? null);

    console.log("[8/8] Waiting for the Tidepool maker to settle the swap…");
    let status = null as Awaited<ReturnType<typeof fetchTidepoolStatus>>;
    for (let attempt = 0; attempt < 60; attempt += 1) {
      try {
        status = await fetchTidepoolStatus(depositAddress);
      } catch {
        status = null;
      }
      if (status && ["SUCCESS", "REFUNDED", "FAILED"].includes(status.status)) break;
      await new Promise((resolve) => setTimeout(resolve, 3_000));
    }
    console.log("tidepool_status", status?.status ?? "NOT_AVAILABLE");
    console.log("tidepool_swap_tx_hashes", status?.swapDetails?.nearTxHashes ?? []);
    console.log("tidepool_amount_out", status?.swapDetails?.amountOutFormatted ?? null);

    if (receipt && status) {
      await db.query("update execution_receipts set reason=$1 where id=$2", [
        `TIDEPOOL_${status.status}${
          status.swapDetails?.nearTxHashes?.length
            ? `:${status.swapDetails.nearTxHashes.join(",")}`
            : ""
        }`,
        receipt.id,
      ]);
    }
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error("PROPRIETARY_LIVE_FAILED", error instanceof Error ? error.message : error);
  process.exit(1);
});
