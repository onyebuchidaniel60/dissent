import "server-only";

import { executionConfigFromEnv, executionReadiness } from "../../../packages/execution/src/index";

export type VenueStatus = {
  available: boolean;
  checkedAt: string;
  reason?: string;
  sample?: unknown;
};

const BASE = process.env.TIDEPOOL_BASE_URL ?? "https://www.usetidepool.tech";
const HEALTH_URL = `${BASE}/v0/health`;
const TOKENS_URL = `${BASE}/v0/tokens`;
const QUOTE_URL = `${BASE}/v0/quote`;
const STATUS_URL = `${BASE}/v0/status`;
const API_KEY = "dissent-demo";

export type TidepoolQuoteResponse = {
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
    deadline: string;
    timeWhenInactive: string;
  };
  signature: string;
};

export type TidepoolStatus = {
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

export async function fetchTidepoolLiveQuote(input?: {
  amountYocto?: string;
  recipient?: string;
  refundTo?: string;
  deadlineMinutes?: number;
}): Promise<TidepoolQuoteResponse> {
  const amountYocto = input?.amountYocto ?? process.env.PROPRIETARY_THESIS_AMOUNT_YOCTO ?? "10000000000000000000000";
  const recipient =
    input?.recipient ?? process.env.PROPRIETARY_RECIPIENT ?? process.env.DEMO_CLIENT_ACCOUNT_ID ?? "dissent-demo.testnet";
  const refundTo = input?.refundTo ?? process.env.NEAR_VAULT_ACCOUNT_ID ?? "vault.dissent-demo.testnet";
  const deadline = new Date(Date.now() + (input?.deadlineMinutes ?? 120) * 60_000).toISOString();

  const response = await fetch(QUOTE_URL, {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
      "User-Agent": "Dissent/1.0 (Tidepool proprietary loop)",
    },
    body: JSON.stringify({
      dry: false,
      swapType: "EXACT_INPUT",
      slippageTolerance: 100,
      originAsset: "nep141:wnear.tidepool-sandbox.testnet",
      depositType: "ORIGIN_CHAIN",
      depositMode: "SIMPLE",
      destinationAsset: "nep141:usdc.tidepool-sandbox.testnet",
      amount: amountYocto,
      refundTo,
      refundType: "ORIGIN_CHAIN",
      recipient,
      recipientType: "DESTINATION_CHAIN",
      deadline,
    }),
  });
  if (!response.ok) {
    throw new Error(`TIDEPOOL_QUOTE_HTTP_${response.status}`);
  }
  const data = (await response.json()) as TidepoolQuoteResponse;
  if (!data.quote?.depositAddress || !/^[0-9a-f]{64}$/i.test(data.quote.depositAddress)) {
    throw new Error("TIDEPOOL_QUOTE_MISSING_DEPOSIT_ADDRESS");
  }
  if (data.quote.amountIn !== amountYocto) {
    throw new Error("TIDEPOOL_QUOTE_AMOUNT_MISMATCH");
  }
  if (new Date(data.quote.deadline).getTime() <= Date.now()) {
    throw new Error("TIDEPOOL_QUOTE_EXPIRED");
  }
  return data;
}

export async function fetchTidepoolStatus(depositAddress: string): Promise<TidepoolStatus | null> {
  const response = await fetch(`${STATUS_URL}?depositAddress=${encodeURIComponent(depositAddress)}`, {
    redirect: "error",
    signal: AbortSignal.timeout(20_000),
    headers: {
      Accept: "application/json",
      "X-API-Key": API_KEY,
      "User-Agent": "Dissent/1.0 (Tidepool status)",
    },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`TIDEPOOL_STATUS_HTTP_${response.status}`);
  return (await response.json()) as TidepoolStatus;
}

async function probeJson(url: string, init?: RequestInit): Promise<{ ok: boolean; sample?: unknown; reason?: string }> {
  try {
    const response = await fetch(url, {
      ...init,
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
      headers: {
        Accept: "application/json",
        "User-Agent": "Dissent/1.0 (Tidepool venue precheck)",
        ...(init?.headers ?? {}),
      },
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

export async function checkTidepoolVenue(): Promise<VenueStatus> {
  const quote = await probeJson(QUOTE_URL, {
    method: "POST",
    headers: { "content-type": "application/json", "X-API-Key": API_KEY },
    body: JSON.stringify({
      dry: true,
      swapType: "EXACT_INPUT",
      slippageTolerance: 100,
      originAsset: "nep141:wnear.tidepool-sandbox.testnet",
      depositType: "ORIGIN_CHAIN",
      depositMode: "SIMPLE",
      destinationAsset: "nep141:usdc.tidepool-sandbox.testnet",
      amount: "10000000000000000000000",
      refundTo: "demo-client.testnet",
      refundType: "ORIGIN_CHAIN",
      recipient: "demo-client.testnet",
      recipientType: "DESTINATION_CHAIN",
      deadline: "2030-01-01T00:00:00.000Z",
    }),
  });
  const health = await probeJson(HEALTH_URL);
  const tokens = await probeJson(TOKENS_URL);
  const available = quote.ok && health.ok && tokens.ok;
  return {
    available,
    checkedAt: new Date().toISOString(),
    reason: available
      ? undefined
      : `quote:${quote.reason ?? "UNKNOWN"}; health:${health.reason ?? "UNKNOWN"}; tokens:${tokens.reason ?? "UNKNOWN"}`,
    sample: available ? quote.sample : undefined,
  };
}

export async function currentExecutionReadiness(verdict: "TRADE" | "REFUSE" | "ABSTAIN") {
  const venue = await checkTidepoolVenue();
  const config = executionConfigFromEnv();
  const readiness = executionReadiness({ verdict, config, venueAvailable: venue.available });
  return {
    ...readiness,
    venue,
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
