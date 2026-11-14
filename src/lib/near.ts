import "server-only";

import { Account, JsonRpcProvider, actions, type KeyPairString } from "near-api-js";
import { createHash } from "node:crypto";

import { NEAR_NETWORK, NEAR_RPC_URL } from "@/lib/network";

export { NEAR_NETWORK, NEAR_RPC_URL };

async function rpc<T>(method: string, params: unknown): Promise<T> {
  const response = await fetch(NEAR_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "dissent", method, params }),
    signal: AbortSignal.timeout(30_000),
    redirect: "error",
  });
  if (!response.ok) throw new Error(`NEAR RPC returned ${response.status}`);
  const data = (await response.json()) as { result?: T; error?: { message?: string } };
  if (data.error) throw new Error(data.error.message ?? "NEAR RPC error");
  if (!data.result) throw new Error("NEAR RPC returned no result");
  return data.result;
}

export function registryAccountId(): string | null {
  return process.env.NEAR_REGISTRY_ACCOUNT_ID?.trim() || null;
}

export function escrowAccountId(): string | null {
  return process.env.NEAR_ESCROW_ACCOUNT_ID?.trim() || registryAccountId();
}

export function payoutAccountId(): string | null {
  return process.env.NEAR_PAYOUT_ACCOUNT_ID?.trim() || null;
}

function requireRegistryAccountId(): string {
  const accountId = registryAccountId();
  if (!accountId) throw new Error("REGISTRY_NOT_CONFIGURED");
  return accountId;
}

export function canonicalHashHex(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(value), "utf8")
    .digest("hex");
}

function provider(): JsonRpcProvider {
  return new JsonRpcProvider({ url: NEAR_RPC_URL });
}

function deployerAccount(): Account {
  const accountId = process.env.NEAR_DEPLOYER_ACCOUNT_ID;
  const key = process.env.NEAR_DEPLOYER_KEY;
  if (!accountId || !key) throw new Error("NEAR deployer credentials are not configured");
  return new Account(accountId, provider(), key as KeyPairString);
}

export async function viewRegistry<T>(method: string, args: Record<string, unknown>): Promise<T | null> {
  const argsBase64 = Buffer.from(JSON.stringify(args), "utf8").toString("base64");
  const result = await rpc<{
    result: number[];
  }>("query", {
    request_type: "call_function",
    finality: "final",
    account_id: requireRegistryAccountId(),
    method_name: method,
    args_base64: argsBase64,
  });
  if (!result.result?.length) return null;
  const text = Buffer.from(result.result).toString("utf8");
  return JSON.parse(text) as T;
}

export async function callRegistry(
  method: string,
  args: Record<string, unknown>,
  options?: { gas?: bigint; deposit?: bigint },
): Promise<{ transactionHash: string; blockHash: string }> {
  const account = deployerAccount();
  const outcome = await account.signAndSendTransaction({
    receiverId: requireRegistryAccountId(),
    actions: [
      actions.functionCall(
        method,
        args,
        options?.gas ?? BigInt("100000000000000"),
        options?.deposit ?? 0n,
      ),
    ],
    waitUntil: "FINAL",
    throwOnFailure: true,
  });

  return {
    transactionHash: outcome.transaction_outcome.id,
    blockHash: outcome.transaction_outcome.block_hash,
  };
}

type TransactionAction = {
  FunctionCall?: { method_name?: string; args?: string; deposit?: string; gas?: number };
};

type TransactionView = {
  final_execution_status?: string;
  transaction?: {
    signer_id?: string;
    receiver_id?: string;
    actions?: TransactionAction[];
  };
  transaction_outcome?: { block_hash?: string; block_height?: number };
  status?: { SuccessValue?: string; Failure?: unknown };
};

export async function fetchTransaction(txHash: string, senderAccountId: string): Promise<TransactionView> {
  return rpc<TransactionView>("tx", {
    tx_hash: txHash,
    sender_account_id: senderAccountId,
    wait_until: "FINAL",
  });
}

function decodeFunctionCall(action: TransactionAction): {
  method: string;
  args: Record<string, unknown>;
  deposit: bigint;
} | null {
  const call = action.FunctionCall;
  if (!call?.method_name || !call.args) return null;
  try {
    const decoded = Buffer.from(call.args, "base64").toString("utf8");
    return {
      method: call.method_name,
      args: JSON.parse(decoded) as Record<string, unknown>,
      deposit: BigInt(call.deposit ?? "0"),
    };
  } catch {
    return null;
  }
}

export type CommitmentExpectation = {
  auditId: string;
  clientAccountId: string;
  thesisHash: string;
  conditionsHash: string;
  canonicalizationVersion: string;
  conditionsVersion: string;
  policyHash: string;
};

export async function verifyCommitmentTransaction(
  txHash: string,
  expected: CommitmentExpectation,
): Promise<{ blockHeight: number | null; blockHash: string | null }> {
  const tx = await fetchTransaction(txHash, expected.clientAccountId);
  if (tx.final_execution_status !== "FINAL") throw new Error("COMMITMENT_NOT_FINAL");
  if (tx.transaction?.signer_id !== expected.clientAccountId) throw new Error("WRONG_SIGNER");
  if (tx.transaction?.receiver_id !== requireRegistryAccountId()) throw new Error("WRONG_CONTRACT");
  if (!tx.status || !("SuccessValue" in tx.status)) throw new Error("TRANSACTION_FAILED");

  const call = (tx.transaction.actions ?? []).map(decodeFunctionCall).find(Boolean);
  if (!call || call.method !== "commit_audit") throw new Error("WRONG_METHOD");
  if (call.args.audit_id !== expected.auditId) throw new Error("WRONG_AUDIT_ID");
  if (call.args.thesis_hash !== expected.thesisHash) throw new Error("WRONG_THESIS_HASH");
  if (call.args.conditions_hash !== expected.conditionsHash) throw new Error("WRONG_CONDITIONS_HASH");
  if (call.args.canonicalization_version !== expected.canonicalizationVersion) {
    throw new Error("WRONG_CANONICALIZATION");
  }
  if (call.args.conditions_version !== expected.conditionsVersion) throw new Error("WRONG_CONDITIONS_VERSION");
  if (call.args.policy_hash !== expected.policyHash) throw new Error("WRONG_POLICY_HASH");

  const stored = await viewRegistry<{
    audit_id?: string;
    client_id?: string;
    thesis_hash?: string;
    conditions_hash?: string;
    policy_hash?: string;
  }>("get_commitment", { audit_id: expected.auditId });

  if (!stored) throw new Error("COMMITMENT_NOT_STORED");
  if (stored.client_id !== expected.clientAccountId) throw new Error("STORED_CLIENT_MISMATCH");
  if (stored.thesis_hash !== expected.thesisHash) throw new Error("STORED_THESIS_MISMATCH");
  if (stored.conditions_hash !== expected.conditionsHash) throw new Error("STORED_CONDITIONS_MISMATCH");
  if (stored.policy_hash !== expected.policyHash) throw new Error("STORED_POLICY_MISMATCH");

  const blockHash = tx.transaction_outcome?.block_hash ?? null;
  let blockHeight: number | null = tx.transaction_outcome?.block_height ?? null;
  if (!blockHeight && blockHash) {
    try {
      const block = await rpc<{ header?: { height?: number } }>("block", { block_id: blockHash });
      blockHeight = block.header?.height ?? null;
    } catch {
      blockHeight = null;
    }
  }

  return { blockHeight, blockHash };
}

export type FundingExpectation = {
  auditId: string;
  clientAccountId: string;
  quoteId: string;
  quoteHash: string;
  amountYocto: string;
};

export async function verifyFundingTransaction(
  txHash: string,
  expected: FundingExpectation,
): Promise<{ blockHeight: number | null; blockHash: string | null }> {
  const tx = await fetchTransaction(txHash, expected.clientAccountId);
  if (tx.final_execution_status !== "FINAL") throw new Error("FUNDING_NOT_FINAL");
  if (tx.transaction?.signer_id !== expected.clientAccountId) throw new Error("WRONG_SIGNER");
  if (tx.transaction?.receiver_id !== requireRegistryAccountId()) throw new Error("WRONG_CONTRACT");
  if (!tx.status || !("SuccessValue" in tx.status)) throw new Error("TRANSACTION_FAILED");

  const call = (tx.transaction.actions ?? []).map(decodeFunctionCall).find(Boolean);
  if (!call || call.method !== "fund_audit") throw new Error("WRONG_METHOD");
  if (call.args.audit_id !== expected.auditId) throw new Error("WRONG_AUDIT_ID");
  if (call.args.quote_id !== expected.quoteId) throw new Error("WRONG_QUOTE_ID");
  if (call.args.quote_hash !== expected.quoteHash) throw new Error("WRONG_QUOTE_HASH");
  if (call.deposit.toString() !== expected.amountYocto) throw new Error("WRONG_DEPOSIT");

  const stored = await viewRegistry<{
    audit_id?: string;
    client_id?: string;
    amount_yocto?: string;
    quote_id?: string;
  }>("get_funding", { audit_id: expected.auditId });

  if (!stored) throw new Error("FUNDING_NOT_STORED");
  if (stored.client_id !== expected.clientAccountId) throw new Error("STORED_CLIENT_MISMATCH");
  if (stored.quote_id !== expected.quoteId) throw new Error("STORED_QUOTE_MISMATCH");
  if (stored.amount_yocto !== expected.amountYocto) throw new Error("STORED_AMOUNT_MISMATCH");

  return {
    blockHeight: tx.transaction_outcome?.block_height ?? null,
    blockHash: tx.transaction_outcome?.block_hash ?? null,
  };
}
