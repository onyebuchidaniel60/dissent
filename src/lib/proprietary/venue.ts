import "server-only";

import { executionConfigFromEnv, executionReadiness } from "../../../packages/execution/src/index";

export type VenueStatus = {
  available: boolean;
  checkedAt: string;
  reason?: string;
  sample?: unknown;
};

const BASE = "https://www.usetidepool.tech";
const HEALTH_URL = `${BASE}/v0/health`;
const TOKENS_URL = `${BASE}/v0/tokens`;
const QUOTE_URL = `${BASE}/v0/quote`;

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
    headers: { "content-type": "application/json", "X-API-Key": "dissent-demo" },
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
