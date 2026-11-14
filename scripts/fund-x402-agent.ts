/**
 * Fund the autonomous x402 compute agent with testnet USDC.
 *
 * This operator script:
 *   1. registers NEP-145 storage for the agent and the x402 payee on the
 *      configured testnet USDC token;
 *   2. transfers USDC from the funding account to the agent until the agent
 *      holds at least the target balance;
 *   3. prints transaction hashes and final balances.
 *
 * It intentionally uses the Tidepool test USDC token
 * (`usdc.tidepool-sandbox.testnet`) because the public x402 reference
 * facilitator's canonical Circle USDC faucet cannot be automated. The
 * self-hosted facilitator accepts the same token explicitly as its route
 * asset. These tokens have no value.
 *
 * Required environment: NEAR_RPC_URL, DEMO_CLIENT_KEY, X402_AGENT_KEY,
 * NEAR_DEPLOYER_KEY and the corresponding account IDs.
 *
 * Run with:
 *   set -a; . ./.env.local; set +a
 *   pnpm exec tsx scripts/fund-x402-agent.ts
 */

import { Account, JsonRpcProvider, actions, type KeyPairString } from "near-api-js";

const RPC_URL =
  process.env.NEAR_RPC_URL ??
  (process.env.NEAR_NETWORK?.toLowerCase() === "testnet"
    ? "https://rpc.testnet.fastnear.com"
    : "https://rpc.mainnet.fastnear.com");

const TOKEN = process.env.X402_USDC_TOKEN_ID?.trim() || "usdc.tidepool-sandbox.testnet";
const SOURCE_ACCOUNT = process.env.X402_FUNDING_ACCOUNT_ID?.trim() || "demo-client.testnet";
const AGENT_ACCOUNT = process.env.X402_AGENT_ACCOUNT_ID?.trim() || "x402-agent.testnet";
const PAY_TO_ACCOUNT = process.env.X402_PAY_TO_ACCOUNT_ID?.trim() || "dissent-demo.testnet";

/** 10 USDC at six decimals. */
const TARGET_BALANCE = BigInt(process.env.X402_FUND_AMOUNT_ATOMIC?.trim() || "10000000");
/** Tidepool test USDC fixes storage at 0.00125 NEAR. */
const STORAGE_DEPOSIT = 1_250_000_000_000_000_000_000n;
const FT_TRANSFER_GAS = 30_000_000_000_000n;
const STORAGE_GAS = 30_000_000_000_000n;

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`MISSING_ENV:${name}`);
  return value;
}

function provider(): JsonRpcProvider {
  return new JsonRpcProvider({ url: RPC_URL });
}

function accountFor(accountId: string, key: string): Account {
  return new Account(accountId, provider(), key as KeyPairString);
}

function formatUsdc(atomic: bigint): string {
  const whole = atomic / 1_000_000n;
  const fraction = (atomic % 1_000_000n).toString().padStart(6, "0");
  return `${whole}.${fraction}`;
}

async function balanceOf(accountId: string): Promise<bigint> {
  const raw = await provider().callFunction<string>({
    contractId: TOKEN,
    method: "ft_balance_of",
    args: { account_id: accountId },
  });
  if (typeof raw !== "string") throw new Error(`INVALID_BALANCE:${accountId}`);
  return BigInt(raw);
}

async function storageOf(accountId: string): Promise<boolean> {
  const raw = await provider().callFunction<{ total?: string }>({
    contractId: TOKEN,
    method: "storage_balance_of",
    args: { account_id: accountId },
  });
  return Boolean(raw?.total && BigInt(raw.total) > 0n);
}

async function ensureStorage(accountId: string, key: string): Promise<string | null> {
  if (await storageOf(accountId)) {
    console.info(`[fund-x402] storage already registered for ${accountId}`);
    return null;
  }

  const account = accountFor(accountId, key);
  const outcome = await account.signAndSendTransaction({
    receiverId: TOKEN,
    actions: [
      actions.functionCall(
        "storage_deposit",
        { account_id: accountId, registration_only: true },
        STORAGE_GAS,
        STORAGE_DEPOSIT,
      ),
    ],
    waitUntil: "FINAL",
    throwOnFailure: true,
  });

  const hash = outcome.transaction_outcome.id;
  console.info(`[fund-x402] registered storage for ${accountId}: ${hash}`);
  return hash;
}

async function transfer(sourceKey: string, amount: bigint): Promise<string | null> {
  if (amount <= 0n) {
    console.info(`[fund-x402] ${AGENT_ACCOUNT} already holds the target balance or more`);
    return null;
  }

  const source = accountFor(SOURCE_ACCOUNT, sourceKey);
  const outcome = await source.signAndSendTransaction({
    receiverId: TOKEN,
    actions: [
      actions.functionCall(
        "ft_transfer",
        { receiver_id: AGENT_ACCOUNT, amount: amount.toString() },
        FT_TRANSFER_GAS,
        1n,
      ),
    ],
    waitUntil: "FINAL",
    throwOnFailure: true,
  });

  const hash = outcome.transaction_outcome.id;
  console.info(
    `[fund-x402] transferred ${formatUsdc(amount)} USDC from ${SOURCE_ACCOUNT} to ${AGENT_ACCOUNT}: ${hash}`,
  );
  return hash;
}

async function main(): Promise<void> {
  const sourceKey = required("DEMO_CLIENT_KEY");
  const agentKey = required("X402_AGENT_KEY");
  const payToKey = required("NEAR_DEPLOYER_KEY");

  if (!(await storageOf(SOURCE_ACCOUNT))) {
    throw new Error(`SOURCE_NOT_REGISTERED:${SOURCE_ACCOUNT}`);
  }

  await ensureStorage(AGENT_ACCOUNT, agentKey);
  if (PAY_TO_ACCOUNT !== AGENT_ACCOUNT) {
    await ensureStorage(PAY_TO_ACCOUNT, payToKey);
  }

  const current = await balanceOf(AGENT_ACCOUNT);
  const sourceBalance = await balanceOf(SOURCE_ACCOUNT);
  const shortfall = TARGET_BALANCE > current ? TARGET_BALANCE - current : 0n;

  if (shortfall > sourceBalance) {
    throw new Error(
      `INSUFFICIENT_FUNDING_SOURCE:${SOURCE_ACCOUNT} needs ${formatUsdc(shortfall)} USDC, holds ${formatUsdc(sourceBalance)}`,
    );
  }

  const transferHash = await transfer(sourceKey, shortfall);

  const finalAgent = await balanceOf(AGENT_ACCOUNT);
  const finalSource = await balanceOf(SOURCE_ACCOUNT);
  const finalPayTo = await balanceOf(PAY_TO_ACCOUNT);

  console.info("[fund-x402] summary", {
    token: TOKEN,
    agent: AGENT_ACCOUNT,
    agentUsdc: formatUsdc(finalAgent),
    source: SOURCE_ACCOUNT,
    sourceUsdc: formatUsdc(finalSource),
    payTo: PAY_TO_ACCOUNT,
    payToUsdc: formatUsdc(finalPayTo),
    transferHash,
  });

  if (finalAgent < TARGET_BALANCE) {
    throw new Error(`TARGET_NOT_REACHED:${formatUsdc(finalAgent)}`);
  }
}

main().catch((error: unknown) => {
  console.error("[fund-x402] failed", error instanceof Error ? error.message : error);
  process.exit(1);
});
