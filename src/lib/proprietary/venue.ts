import "server-only";

import { executionConfigFromEnv, executionReadiness } from "../../../packages/execution/src/index";

export type VenueStatus = {
  available: boolean;
  checkedAt: string;
  reason?: string;
  sample?: unknown;
};

const STABLE_URL = "https://api.testnet.ref-finance.com/v1/stable-pools";
const LIST_URL = "https://api.testnet.ref-finance.com/v1/list-pools";

async function probe(url: string): Promise<{ ok: boolean; sample?: unknown; reason?: string }> {
  try {
    const response = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
      headers: { Accept: "application/json", "User-Agent": "Dissent/1.0 (venue precheck)" },
    });
    if (!response.ok) return { ok: false, reason: `HTTP_${response.status}` };
    const data = (await response.json()) as unknown;
    const empty =
      data === null ||
      (Array.isArray(data) && data.length === 0) ||
      (typeof data === "object" && data !== null && Object.keys(data).length === 0);
    return empty ? { ok: false, reason: "EMPTY_RESPONSE" } : { ok: true, sample: data };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.name : "NETWORK_ERROR",
    };
  }
}

export async function checkRefTestnetVenue(): Promise<VenueStatus> {
  const [stable, list] = await Promise.all([probe(STABLE_URL), probe(LIST_URL)]);
  if (!stable.ok && !list.ok) {
    return {
      available: false,
      checkedAt: new Date().toISOString(),
      reason: `stable-pools:${stable.reason ?? "UNKNOWN"}; list-pools:${list.reason ?? "UNKNOWN"}`,
    };
  }
  return {
    available: true,
    checkedAt: new Date().toISOString(),
    sample: stable.sample ?? list.sample,
  };
}

export async function currentExecutionReadiness(verdict: "TRADE" | "REFUSE" | "ABSTAIN") {
  const venue = await checkRefTestnetVenue();
  const config = executionConfigFromEnv();
  const readiness = executionReadiness({ verdict, config, venueAvailable: venue.available });
  return {
    ...readiness,
    venue,
    vault_configured: Boolean(
      config.vaultAccountId && config.agentAccountId && config.agentKey && config.recipientId,
    ),
    execution_enabled: config.enabled,
  };
}

export function proprietaryLoopEnabled(): boolean {
  return process.env.PROPRIETARY_LOOP_ENABLED === "true";
}
