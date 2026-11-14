/**
 * Generic x402 payment client for Dissent's autonomous compute procurement.
 *
 * The agent holds a NEAR testnet account and a full-access key. When a paid
 * resource answers `402 Payment Required`, this client selects the NEAR exact
 * requirement, asks the local-key signer for a NEP-366 `SignedDelegate`
 * authorising exactly one NEP-141 `ft_transfer`, retries with the
 * `PAYMENT-SIGNATURE` header, and reports the settled payment so the caller can
 * log it.
 *
 * No provider key, wallet key or payment material is ever logged.
 */

import { createNearX402Client, type ClientNearSigner } from "@fastnear/x402";
import { createLocalNearSigner } from "@fastnear/x402/node";
import {
  decodePaymentRequiredHeader,
  decodePaymentResponseHeader,
  encodePaymentSignatureHeader,
} from "@x402/core/http";
import type { PaymentRequired, PaymentRequirements } from "@x402/core/types";

export type X402Network = "near:testnet" | "near:mainnet";

export type X402Settlement = {
  provider: string;
  network: string;
  asset: string;
  payTo: string;
  amountAtomic: string;
  amountUsdc: string;
  payer: string | null;
  transaction: string;
};

export type PayAndRequestResult = {
  response: Response;
  payment: X402Settlement | null;
};

export type PayAndRequestOptions = {
  /** Human label used in the payment log, e.g. `openrouter`. */
  provider: string;
  /** Injected for tests; defaults to global fetch. */
  fetch?: typeof globalThis.fetch;
  /** Injected for tests; defaults to the local-key signer from env. */
  signer?: ClientNearSigner;
  network?: X402Network;
  /** Fail if the resource answers without an x402 challenge or settlement. */
  requirePayment?: boolean;
  /** Injected for tests; defaults to console.info. */
  log?: (line: string) => void;
};

export class X402PaymentError extends Error {
  readonly code:
    | "NOT_CONFIGURED"
    | "CHALLENGE_MISSING"
    | "REQUIREMENT_MISSING"
    | "SETTLEMENT_MISSING"
    | "SETTLEMENT_FAILED"
    | "NOT_ENFORCED";

  constructor(code: X402PaymentError["code"], message: string) {
    super(message);
    this.name = "X402PaymentError";
    this.code = code;
  }
}

const USDC_DECIMALS = 6;

function defaultRpc(network: X402Network): string {
  return network === "near:testnet"
    ? "https://rpc.testnet.fastnear.com"
    : "https://rpc.mainnet.fastnear.com";
}

export function x402NetworkFromEnv(): X402Network {
  return process.env.NEAR_NETWORK?.trim().toLowerCase() === "mainnet"
    ? "near:mainnet"
    : "near:testnet";
}

export function x402SignerFromEnv(network: X402Network = x402NetworkFromEnv()): ClientNearSigner {
  const accountId = process.env.X402_AGENT_ACCOUNT_ID?.trim();
  const secretKey = process.env.X402_AGENT_KEY?.trim();
  if (!accountId || !secretKey) {
    throw new X402PaymentError(
      "NOT_CONFIGURED",
      "X402_AGENT_ACCOUNT_ID and X402_AGENT_KEY are required for paid compute",
    );
  }

  return createLocalNearSigner({
    accountId,
    secretKey: secretKey as `ed25519:${string}`,
    rpcUrls: { [network]: process.env.NEAR_RPC_URL?.trim() || defaultRpc(network) },
  });
}

export function formatUsdcAtomic(atomic: string, decimals = USDC_DECIMALS): string {
  const value = BigInt(atomic);
  const scale = 10n ** BigInt(decimals);
  const whole = value / scale;
  const fraction = (value % scale).toString().padStart(decimals, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

function selectRequirement(challenge: PaymentRequired, network: X402Network): PaymentRequirements {
  const candidates = challenge.accepts.filter(
    (requirement) => requirement.scheme === "exact" && requirement.network === network,
  );
  if (candidates.length === 0) {
    throw new X402PaymentError(
      "REQUIREMENT_MISSING",
      `x402 challenge does not accept exact payments on ${network}`,
    );
  }

  return candidates.reduce((cheapest, candidate) =>
    BigInt(candidate.amount) < BigInt(cheapest.amount) ? candidate : cheapest,
  );
}

const clients = new Map<string, ReturnType<typeof createNearX402Client>>();

function clientFor(network: X402Network, signer: ClientNearSigner, injected: boolean) {
  if (injected) return createNearX402Client({ signer, network });
  const key = `${network}:${process.env.X402_AGENT_ACCOUNT_ID ?? "agent"}`;
  const cached = clients.get(key);
  if (cached) return cached;
  const client = createNearX402Client({ signer, network });
  clients.set(key, client);
  return client;
}

/**
 * Perform an HTTP request and settle a NEAR x402 `exact` challenge if one is
 * returned. The body must be replayable (string/Buffer), because the request is
 * sent once to obtain the challenge and once with the signed payment.
 *
 * Paid requests are serialised per process. NEAR NEP-366 delegates consume the
 * payer's access-key nonce, so two concurrent signatures can race. The agent
 * deliberately trades a little latency for deterministic nonce ordering.
 */
let paymentQueue: Promise<unknown> = Promise.resolve();

export async function payAndRequest(
  url: string | URL,
  init: RequestInit = {},
  options: PayAndRequestOptions,
): Promise<PayAndRequestResult> {
  const run = () => payAndRequestOnce(url, init, options);
  const pending = paymentQueue.then(run, run);
  paymentQueue = pending.then(
    () => undefined,
    () => undefined,
  );
  return pending;
}

async function payAndRequestOnce(
  url: string | URL,
  init: RequestInit,
  options: PayAndRequestOptions,
): Promise<PayAndRequestResult> {
  const network = options.network ?? x402NetworkFromEnv();
  const fetchImpl = options.fetch ?? globalThis.fetch;
  const injectedSigner = Boolean(options.signer);
  const signer = options.signer ?? x402SignerFromEnv(network);
  const log = options.log ?? ((line: string) => console.info(line));

  const first = await fetchImpl(url, init);
  if (first.status !== 402) {
    if (options.requirePayment) {
      throw new X402PaymentError(
        "NOT_ENFORCED",
        `${options.provider} answered ${first.status} without an x402 challenge`,
      );
    }
    return { response: first, payment: null };
  }

  const challengeHeader = first.headers.get("payment-required");
  if (!challengeHeader) {
    throw new X402PaymentError(
      "CHALLENGE_MISSING",
      `${options.provider} returned 402 without a PAYMENT-REQUIRED header`,
    );
  }

  const challenge = decodePaymentRequiredHeader(challengeHeader);
  await first.body?.cancel();
  const requirement = selectRequirement(challenge, network);
  const client = clientFor(network, signer, injectedSigner);
  const payload = await client.createPaymentPayload(challenge);

  const headers = new Headers(init.headers);
  headers.set("PAYMENT-SIGNATURE", encodePaymentSignatureHeader(payload));

  const second = await fetchImpl(url, { ...init, headers });
  const settlementHeader = second.headers.get("payment-response");
  if (!settlementHeader) {
    if (second.status === 402) {
      const reason = second.headers.get("payment-required");
      throw new X402PaymentError(
        "SETTLEMENT_FAILED",
        `${options.provider} rejected the x402 payment${reason ? `: ${reason}` : ""}`,
      );
    }
    throw new X402PaymentError(
      "SETTLEMENT_MISSING",
      `${options.provider} answered ${second.status} without a PAYMENT-RESPONSE header`,
    );
  }

  const settlement = decodePaymentResponseHeader(settlementHeader);
  if (!settlement.success) {
    throw new X402PaymentError(
      "SETTLEMENT_FAILED",
      `${options.provider} settlement failed: ${settlement.errorReason ?? "unknown"}${
        settlement.errorMessage ? ` (${settlement.errorMessage})` : ""
      }`,
    );
  }

  const payment: X402Settlement = {
    provider: options.provider,
    network: settlement.network,
    asset: requirement.asset,
    payTo: requirement.payTo,
    amountAtomic: requirement.amount,
    amountUsdc: formatUsdcAtomic(requirement.amount),
    payer: settlement.payer ?? null,
    transaction: settlement.transaction,
  };

  log(
    `[x402] Paid ${payment.amountUsdc} USDC to ${payment.payTo} for ${options.provider} inference.`,
  );

  return { response: second, payment };
}
