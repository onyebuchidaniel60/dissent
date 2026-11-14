/**
 * Verify the live x402 compute-procurement loop.
 *
 * Sends one minimal chat-completion request per configured provider through the
 * x402 shim, prints the settled payment, and reports the USDC balance delta of
 * the procurement agent. This script never prints keys or provider credentials.
 *
 * Required environment: OPENROUTER_X402_PROXY_URL / GROQ_X402_PROXY_URL,
 * X402_AGENT_ACCOUNT_ID, X402_AGENT_KEY, NEAR_RPC_URL and
 * X402_USDC_TOKEN_ID.
 *
 * Run with:
 *   set -a; . ./.env.local; set +a
 *   pnpm exec tsx scripts/x402-live-check.ts
 */

import { JsonRpcProvider } from "near-api-js";

import { formatUsdcAtomic, payAndRequest } from "../packages/execution/x402-payment-client";

const RPC_URL =
  process.env.NEAR_RPC_URL ??
  (process.env.NEAR_NETWORK?.toLowerCase() === "testnet"
    ? "https://rpc.testnet.fastnear.com"
    : "https://rpc.mainnet.fastnear.com");
const TOKEN = process.env.X402_USDC_TOKEN_ID?.trim() || "usdc.tidepool-sandbox.testnet";

type Provider = "openrouter" | "groq";

const allTargets: Array<{ provider: Provider; url: string; model: string }> = [
  {
    provider: "openrouter",
    url: process.env.OPENROUTER_X402_PROXY_URL?.trim() ?? "",
    model: process.env.X402_CHECK_OPENROUTER_MODEL?.trim() || "z-ai/glm-5.3-flash",
  },
  {
    provider: "groq",
    url: process.env.GROQ_X402_PROXY_URL?.trim() ?? "",
    model: process.env.X402_CHECK_GROQ_MODEL?.trim() || "openai/gpt-oss-120b",
  },
];

const targets = allTargets.filter((target) => target.url.length > 0);

async function balanceOf(accountId: string): Promise<bigint> {
  const raw = await new JsonRpcProvider({ url: RPC_URL }).callFunction<string>({
    contractId: TOKEN,
    method: "ft_balance_of",
    args: { account_id: accountId },
  });
  if (typeof raw !== "string") throw new Error("INVALID_BALANCE");
  return BigInt(raw);
}

async function main(): Promise<void> {
  const accountId = process.env.X402_AGENT_ACCOUNT_ID?.trim();
  if (!accountId) throw new Error("MISSING_ENV:X402_AGENT_ACCOUNT_ID");
  if (targets.length === 0) throw new Error("NO_X402_PROXY_URL_CONFIGURED");

  const before = await balanceOf(accountId);
  console.info(
    `[x402-check] agent ${accountId} balance before: ${formatUsdcAtomic(before.toString())} USDC`,
  );

  for (const target of targets) {
    const { response, payment } = await payAndRequest(
      target.url,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: target.model,
          messages: [
            {
              role: "user",
              content: "Reply with exactly the word: pong",
            },
          ],
          max_tokens: 16,
          temperature: 0,
        }),
      },
      { provider: target.provider, requirePayment: true },
    );

    const text = await response.text();
    console.info("[x402-check] result", {
      provider: target.provider,
      status: response.status,
      payment,
      body: text.slice(0, 300),
    });

    if (!response.ok || !payment) {
      throw new Error(`X402_CHECK_FAILED:${target.provider}:${response.status}`);
    }
  }

  const after = await balanceOf(accountId);
  const spent = before - after;
  console.info(
    `[x402-check] agent ${accountId} balance after: ${formatUsdcAtomic(after.toString())} USDC (spent ${formatUsdcAtomic(spent.toString())})`,
  );
  if (spent <= 0n) throw new Error("NO_USDC_DEDUCTED");
}

main().catch((error: unknown) => {
  console.error("[x402-check] failed", error instanceof Error ? error.message : error);
  process.exit(1);
});
