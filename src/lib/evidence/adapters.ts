import "server-only";

const MAX_BYTES = 256 * 1024;

async function requestJson(url: string, init: RequestInit): Promise<unknown> {
  const response = await fetch(url, {
    ...init,
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
    headers: {
      Accept: "application/json",
      "User-Agent": "Dissent/1.0 (evidence adapter)",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Adapter returned HTTP ${response.status}`);
  }

  const text = await response.text();
  if (text.length > MAX_BYTES) {
    throw new Error("Adapter payload exceeded the 256 KB cap");
  }
  return JSON.parse(text) as unknown;
}

export type MarketPriceObservation = {
  nearUsd: number;
  usdcUsd: number;
  observedAt: string;
  source: "coingecko";
};

export async function fetchMarketPrices(): Promise<MarketPriceObservation> {
  const payload = (await requestJson(
    "https://api.coingecko.com/api/v3/simple/price?ids=near,usd-coin&vs_currencies=usd",
    { method: "GET" },
  )) as {
    near?: { usd?: number };
    "usd-coin"?: { usd?: number };
  };

  const nearUsd = payload.near?.usd;
  const usdcUsd = payload["usd-coin"]?.usd;
  if (typeof nearUsd !== "number" || typeof usdcUsd !== "number") {
    throw new Error("CoinGecko response missing near/usd-coin prices");
  }

  return {
    nearUsd,
    usdcUsd,
    observedAt: new Date().toISOString(),
    source: "coingecko",
  };
}

export type NearBlocksStats = {
  totalSupply: string;
  circulatingSupply: string;
  avgBlockTime: string;
  gasPrice: string;
  nodesOnline: number;
  observedAt: string;
};

export async function fetchNearBlocksStats(): Promise<NearBlocksStats> {
  const payload = (await requestJson("https://api.nearblocks.io/v1/stats", {
    method: "GET",
  })) as {
    stats?: Array<{
      total_supply?: string;
      circulating_supply?: string;
      avg_block_time?: string;
      gas_price?: string;
      nodes_online?: number;
    }>;
  };

  const stats = payload.stats?.[0];
  if (!stats?.total_supply || !stats.circulating_supply) {
    throw new Error("NearBlocks stats response is missing required fields");
  }

  return {
    totalSupply: stats.total_supply,
    circulatingSupply: stats.circulating_supply,
    avgBlockTime: stats.avg_block_time ?? "unknown",
    gasPrice: stats.gas_price ?? "unknown",
    nodesOnline: stats.nodes_online ?? 0,
    observedAt: new Date().toISOString(),
  };
}

export type RpcStatus = {
  chainId: string;
  latestBlockHeight: number;
  latestBlockHash: string;
  observedAt: string;
};

export async function fetchFastNearStatus(): Promise<RpcStatus> {
  const payload = (await requestJson("https://free.rpc.fastnear.com", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "dissent-evidence",
      method: "status",
      params: [],
    }),
  })) as {
    result?: {
      chain_id?: string;
      sync_info?: { latest_block_height?: number; latest_block_hash?: string };
    };
  };

  const result = payload.result;
  const height = result?.sync_info?.latest_block_height;
  const hash = result?.sync_info?.latest_block_hash;
  if (!result?.chain_id || typeof height !== "number" || !hash) {
    throw new Error("FastNEAR status response is missing required fields");
  }

  return {
    chainId: result.chain_id,
    latestBlockHeight: height,
    latestBlockHash: hash,
    observedAt: new Date().toISOString(),
  };
}
