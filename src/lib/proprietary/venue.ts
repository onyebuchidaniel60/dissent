import "server-only";

import {
  ONECLICK_BASE_URL,
  ONECLICK_DESTINATION_ASSET,
  ONECLICK_ORIGIN_ASSET,
  executionVenue,
} from "@/lib/network";
import { executionConfigFromEnv, executionReadiness } from "../../../packages/execution/src/index";

export type VenueStatus = {
  available: boolean;
  checkedAt: string;
  reason?: string;
  sample?: unknown;
  venue: "ONECLICK" | "TIDEPOOL";
};

const VENUE = executionVenue();
const IS_TIDEPOOL = VENUE === "TIDEPOOL";

const BASE = IS_TIDEPOOL
  ? process.env.TIDEPOOL_BASE_URL ?? "https://www.usetidepool.tech"
  : ONECLICK_BASE_URL;
const HEALTH_URL = `${BASE}/v0/health`;
const TOKENS_URL = `${BASE}/v0/tokens`;
const QUOTE_URL = `${BASE}/v0/quote`;
const STATUS_URL = `${BASE}/v0/status`;
const API_KEY = process.env.ONECLICK_API_KEY ?? (IS_TIDEPOOL ? "dissent-demo" : "");

const ORIGIN_ASSET = IS_TIDEPOOL
  ? process.env.TIDEPOOL_ORIGIN_ASSET ?? "nep141:wnear.tidepool-sandbox.testnet"
  : ONECLICK_ORIGIN_ASSET;
const DESTINATION_ASSET = IS_TIDEPOOL
  ? process.env.TIDEPOOL_DESTINATION_ASSET ?? "nep141:usdc.tidepool-sandbox.testnet"
  : ONECLICK_DESTINATION_ASSET;
const RECIPIENT = (
  process.env.PROPRIETARY_RECIPIENT ??
  (IS_TIDEPOOL ? process.env.DEMO_CLIENT_ACCOUNT_ID : "")
)?.trim() || "";
const REFUND_TO = (
  process.env.PROPRIETARY_REFUND_TO ??
  process.env.NEAR_VAULT_ACCOUNT_ID
)?.trim() || "";

export type ExecutionVenueQuoteResponse = {
  correlationId: string;
  timestamp: string;
  quoteRequest: {
    originAsset: string;
    destinationAsset: string;
    amount: string;
    depositType: string;
    recipient: string;
    refundTo: string;
  };
  quote: {
    amountIn: string;
    amountInFormatted: string;
    amountInUsd: string;
    amountOut: string;
    amountOutFormatted: string;
    amountOutUsd: string;
    minAmountOut: string;
    depositAddress: string;
    depositMemo?: string;
    deadline: string;
    timeWhenInactive: string;
  };
  signature: string;
};

/** Backwards-compatible alias for the testnet staging code. */
export type TidepoolQuoteResponse = ExecutionVenueQuoteResponse;

export type ExecutionVenueStatus = {
  status:
    | "KNOWN_DEPOSIT_TX"
    | "PENDING_DEPOSIT"
    | "INCOMPLETE_DEPOSIT"
    | "PROCESSING"
    | "SUCCESS"
    | "REFUNDED"
    | "FAILED";
  updatedAt: string;
  swapDetails?: {
    nearTxHashes?: string[];
    originChainTxHashes?: Array<{ hash: string; explorerUrl?: string }>;
    destinationChainTxHashes?: Array<{ hash: string; explorerUrl?: string }>;
    amountOut?: string;
    amountOutFormatted?: string;
    amountOutUsd?: string;
  };
};

export type TidepoolStatus = ExecutionVenueStatus;

function venueHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    Accept: "application/json",
    "User-Agent": `Dissent/1.0 (${VENUE === "TIDEPOOL" ? "Tidepool staging" : "1Click mainnet"} venue)`,
    ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
    ...extra,
  };
}

export async function fetchExecutionVenueQuote(input?: {
  amountYocto?: string;
  recipient?: string;
  refundTo?: string;
  deadlineMinutes?: number;
  originAsset?: string;
  destinationAsset?: string;
}): Promise<ExecutionVenueQuoteResponse> {
  const amountYocto =
    input?.amountYocto ?? process.env.PROPRIETARY_THESIS_AMOUNT_YOCTO ?? "10000000000000000000000";
  const recipient = input?.recipient ?? RECIPIENT;
  const refundTo = input?.refundTo ?? REFUND_TO;
  const originAsset = input?.originAsset ?? ORIGIN_ASSET;
  const destinationAsset = input?.destinationAsset ?? DESTINATION_ASSET;
  if (!recipient || !refundTo) throw new Error("VENUE_ACCOUNT_NOT_CONFIGURED");
  const deadline = new Date(Date.now() + (input?.deadlineMinutes ?? 120) * 60_000).toISOString();

  const response = await fetch(QUOTE_URL, {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
    headers: venueHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      dry: false,
      swapType: "EXACT_INPUT",
      slippageTolerance: 100,
      originAsset,
      depositType: "ORIGIN_CHAIN",
      depositMode: "SIMPLE",
      destinationAsset,
      amount: amountYocto,
      refundTo,
      refundType: "ORIGIN_CHAIN",
      recipient,
      recipientType: "DESTINATION_CHAIN",
      deadline,
    }),
  });
  if (!response.ok) throw new Error(`VENUE_QUOTE_HTTP_${response.status}`);
  const data = (await response.json()) as ExecutionVenueQuoteResponse;
  if (!data.quote?.depositAddress || !/^[0-9a-f]{64}$/i.test(data.quote.depositAddress)) {
    throw new Error("VENUE_QUOTE_MISSING_DEPOSIT_ADDRESS");
  }
  if (data.quote.amountIn !== amountYocto) throw new Error("VENUE_QUOTE_AMOUNT_MISMATCH");
  if (new Date(data.quote.deadline).getTime() <= Date.now()) throw new Error("VENUE_QUOTE_EXPIRED");
  return data;
}

/** Backwards-compatible alias for the testnet staging code. */
export const fetchTidepoolLiveQuote = fetchExecutionVenueQuote;

export async function fetchExecutionVenueStatus(
  depositAddress: string,
): Promise<ExecutionVenueStatus | null> {
  const response = await fetch(`${STATUS_URL}?depositAddress=${encodeURIComponent(depositAddress)}`, {
    redirect: "error",
    signal: AbortSignal.timeout(20_000),
    headers: venueHeaders(),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`VENUE_STATUS_HTTP_${response.status}`);
  return (await response.json()) as ExecutionVenueStatus;
}

/** Backwards-compatible alias for the testnet staging code. */
export const fetchTidepoolStatus = fetchExecutionVenueStatus;

async function probeJson(
  url: string,
  init?: RequestInit,
): Promise<{ ok: boolean; sample?: unknown; reason?: string }> {
  try {
    const response = await fetch(url, {
      ...init,
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
      headers: venueHeaders(init?.headers as Record<string, string> | undefined),
    });
    if (!response.ok) return { ok: false, reason: `HTTP_${response.status}` };
    const data = (await response.json()) as unknown;
    const empty =
      data === null ||
      (Array.isArray(data) && data.length === 0) ||
      (typeof data === "object" && data !== null && Object.keys(data).length === 0);
    return empty ? { ok: false, reason: "EMPTY_RESPONSE" } : { ok: true, sample: data };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.name : "NETWORK_ERROR" };
  }
}

export async function checkExecutionVenue(): Promise<VenueStatus> {
  const tokens = await probeJson(TOKENS_URL);
  const health = IS_TIDEPOOL ? await probeJson(HEALTH_URL) : { ok: true as const };

  let quote: { ok: boolean; sample?: unknown; reason?: string } = {
    ok: true,
    reason: "QUOTE_SKIPPED_ACCOUNT_NOT_CONFIGURED",
  };
  if (RECIPIENT && REFUND_TO) {
    quote = await probeJson(QUOTE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dry: true,
        swapType: "EXACT_INPUT",
        slippageTolerance: 100,
        originAsset: ORIGIN_ASSET,
        depositType: "ORIGIN_CHAIN",
        depositMode: "SIMPLE",
        destinationAsset: DESTINATION_ASSET,
        amount: process.env.PROPRIETARY_THESIS_AMOUNT_YOCTO ?? "10000000000000000000000",
        refundTo: REFUND_TO,
        refundType: "ORIGIN_CHAIN",
        recipient: RECIPIENT,
        recipientType: "DESTINATION_CHAIN",
        deadline: new Date(Date.now() + 5 * 60_000).toISOString(),
      }),
    });
  }

  const available = tokens.ok && health.ok && quote.ok;
  return {
    available,
    checkedAt: new Date().toISOString(),
    reason: available
      ? quote.reason
      : `${VENUE}_UNAVAILABLE: quote:${quote.reason ?? "UNKNOWN"}; health:${health.ok ? "ok" : health.reason ?? "UNKNOWN"}; tokens:${tokens.reason ?? "UNKNOWN"}`,
    sample: quote.sample ?? tokens.sample,
    venue: VENUE,
  };
}

/** Backwards-compatible alias for the testnet staging code. */
export const checkTidepoolVenue = checkExecutionVenue;

export async function currentExecutionReadiness(verdict: "TRADE" | "REFUSE" | "ABSTAIN") {
  const venue = await checkExecutionVenue();
  const config = executionConfigFromEnv();
  const readiness = executionReadiness({ verdict, config, venueAvailable: venue.available });
  return {
    ...readiness,
    venue,
    venue_name: VENUE,
    vault_configured: Boolean(
      config.vaultAccountId && config.agentAccountId && config.agentKey && config.recipientId,
    ),
    vault_supports_nep141: config.vaultSupportsNep141,
    execution_enabled: config.enabled,
  };
}

export function proprietaryLoopEnabled(): boolean {
  return process.env.PROPRIETARY_LOOP_ENABLED === "true";
}
