import "server-only";

import { desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { dataSnapshots, evidenceRecords, failureConditions } from "@/db/schema";
import { canonicalJson, sha256Hex } from "@/lib/canonical";
import {
  fetchFastNearStatus,
  fetchMarketPrices,
  fetchNearBlocksStats,
  type MarketPriceObservation,
  type NearBlocksStats,
  type RpcStatus,
} from "@/lib/evidence/adapters";

export type CapturedEvidence = {
  id: string;
  source: string;
  resourceType: string;
  summary: string;
  observedAt: string | null;
  freshness: string;
  limitations: string[];
  value: unknown;
};

export type SnapshotBundle = {
  snapshotId: string;
  market: MarketPriceObservation | null;
  nearBlocks: NearBlocksStats | null;
  rpc: RpcStatus | null;
  evidence: CapturedEvidence[];
};

function evidenceRow(input: {
  auditId: string;
  attackerRunId?: string | null;
  sourceAdapter: string;
  resourceType: string;
  resourceId: string;
  typedLocator: unknown;
  observedAt: string | null;
  normalizedValue: unknown;
  evidenceType: string;
  payloadHash: string;
  freshnessStatus: string;
  limitations: string[];
}) {
  return {
    auditId: input.auditId,
    attackerRunId: input.attackerRunId ?? null,
    sourceAdapter: input.sourceAdapter,
    adapterVersion: "v1",
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    typedLocator: input.typedLocator,
    observationAt: input.observedAt ? new Date(input.observedAt) : null,
    retrievedAt: new Date(),
    normalizedValue: input.normalizedValue,
    evidenceType: input.evidenceType,
    payloadHash: input.payloadHash,
    freshnessStatus: input.freshnessStatus,
    limitations: input.limitations,
  };
}

export async function captureAuditSnapshot(auditId: string): Promise<SnapshotBundle> {
  const [marketResult, nearBlocksResult, rpcResult] = await Promise.allSettled([
    fetchMarketPrices(),
    fetchNearBlocksStats(),
    fetchFastNearStatus(),
  ]);

  const market = marketResult.status === "fulfilled" ? marketResult.value : null;
  const nearBlocks = nearBlocksResult.status === "fulfilled" ? nearBlocksResult.value : null;
  const rpc = rpcResult.status === "fulfilled" ? rpcResult.value : null;

  const payload = {
    captured_at: new Date().toISOString(),
    market,
    nearblocks: nearBlocks,
    rpc,
    errors: [
      ...(marketResult.status === "rejected" ? ["market_price_unavailable"] : []),
      ...(nearBlocksResult.status === "rejected" ? ["nearblocks_unavailable"] : []),
      ...(rpcResult.status === "rejected" ? ["fastnear_rpc_unavailable"] : []),
    ],
    disclaimer: "Market observations are external data, not a NEAR oracle. Demo fixtures are labelled separately.",
  };
  const payloadHash = sha256Hex(canonicalJson(payload));

  const db = getDb();
  const [snapshot] = await db
    .insert(dataSnapshots)
    .values({
      auditId,
      sourceAdapter: "composite:coingecko+nearblocks+fastnear",
      adapterVersion: "v1",
      snapshotAt: new Date(),
      blockHeight: rpc?.latestBlockHeight ?? null,
      blockHash: rpc?.latestBlockHash ?? null,
      normalizedPayload: payload,
      payloadHash,
    })
    .returning();

  if (!snapshot) throw new Error("Could not persist data snapshot");

  const rows: Array<ReturnType<typeof evidenceRow>> = [];

  const committedConditions = await db
    .select({
      conditionId: failureConditions.conditionId,
      description: failureConditions.description,
      metric: failureConditions.metric,
      operator: failureConditions.operator,
      threshold: failureConditions.threshold,
      unit: failureConditions.unit,
      severity: failureConditions.severity,
    })
    .from(failureConditions)
    .where(eq(failureConditions.auditId, auditId));

  const conditionPreimage = committedConditions.map((condition) => ({
    condition_id: condition.conditionId,
    description: condition.description,
    metric: condition.metric,
    operator: condition.operator,
    threshold: condition.threshold,
    unit: condition.unit,
    severity: condition.severity,
  }));

  rows.push(
    evidenceRow({
      auditId,
      sourceAdapter: "dissent-commitment",
      resourceType: "CONDITION_PREIMAGE",
      resourceId: `conditions:${auditId}`,
      typedLocator: {
        adapter: "dissent-db",
        operation: "committed_conditions",
        audit_id: auditId,
      },
      observedAt: new Date().toISOString(),
      normalizedValue: {
        conditions: conditionPreimage,
      },
      evidenceType: "HISTORICAL_RECORD",
      payloadHash: sha256Hex(canonicalJson(conditionPreimage)),
      freshnessStatus: "COMMITTED",
      limitations: ["The condition preimage is the committed test, not an external observation."],
    }),
  );

  if (market) {
    rows.push(
      evidenceRow({
        auditId,
        sourceAdapter: "coingecko",
        resourceType: "MARKET_PRICE",
        resourceId: "near,usd-coin",
        typedLocator: {
          adapter: "coingecko",
          operation: "simple_price",
          ids: ["near", "usd-coin"],
          vs_currencies: ["usd"],
        },
        observedAt: market.observedAt,
        normalizedValue: {
          near_usd: market.nearUsd,
          usdc_usd: market.usdcUsd,
          usdc_depeg_bps: Math.round(Math.abs(1 - market.usdcUsd) * 10_000),
        },
        evidenceType: "DIRECT_OBSERVATION",
        payloadHash: sha256Hex(canonicalJson(market)),
        freshnessStatus: "FRESH",
        limitations: ["External market data; not a NEAR-native oracle."],
      }),
    );

    rows.push(
      evidenceRow({
        auditId,
        sourceAdapter: "dissent-derived",
        resourceType: "DERIVED_CALCULATION",
        resourceId: "usdc-depeg-bps",
        typedLocator: {
          adapter: "dissent-derived",
          operation: "depeg_bps",
          input: "coingecko:usd-coin",
        },
        observedAt: market.observedAt,
        normalizedValue: {
          usdc_depeg_bps: Math.round(Math.abs(1 - market.usdcUsd) * 10_000),
        },
        evidenceType: "DERIVED_CALCULATION",
        payloadHash: sha256Hex(canonicalJson({ usdc_depeg_bps: Math.abs(1 - market.usdcUsd) })),
        freshnessStatus: "FRESH",
        limitations: ["Derived from the external USDC/USD observation."],
      }),
    );
  }

  if (nearBlocks) {
    rows.push(
      evidenceRow({
        auditId,
        sourceAdapter: "nearblocks",
        resourceType: "CHAIN_STATS",
        resourceId: "nearblocks:stats",
        typedLocator: {
          adapter: "nearblocks",
          operation: "stats",
        },
        observedAt: nearBlocks.observedAt,
        normalizedValue: nearBlocks,
        evidenceType: "DIRECT_OBSERVATION",
        payloadHash: sha256Hex(canonicalJson(nearBlocks)),
        freshnessStatus: "FRESH",
        limitations: ["Indexer observation; finality and indexing lag may apply."],
      }),
    );
  }

  if (rpc) {
    rows.push(
      evidenceRow({
        auditId,
        sourceAdapter: "fastnear-rpc",
        resourceType: "NETWORK_STATUS",
        resourceId: "fastnear:status",
        typedLocator: {
          adapter: "fastnear-rpc",
          operation: "status",
          endpoint: "https://free.rpc.fastnear.com",
        },
        observedAt: rpc.observedAt,
        normalizedValue: rpc,
        evidenceType: "DIRECT_OBSERVATION",
        payloadHash: sha256Hex(canonicalJson(rpc)),
        freshnessStatus: "FRESH",
        limitations: ["Read-only RPC observation of the current chain head."],
      }),
    );
  }

  const inserted = rows.length ? await db.insert(evidenceRecords).values(rows).returning() : [];

  const evidence: CapturedEvidence[] = inserted.map((row) => ({
    id: row.id,
    source: row.sourceAdapter,
    resourceType: row.resourceType,
    summary: JSON.stringify(row.normalizedValue),
    observedAt: row.observationAt?.toISOString() ?? null,
    freshness: row.freshnessStatus ?? "UNKNOWN",
    limitations: (row.limitations as string[]) ?? [],
    value: row.normalizedValue,
  }));

  return {
    snapshotId: snapshot.id,
    market,
    nearBlocks,
    rpc,
    evidence,
  };
}

export async function getAuditEvidence(auditId: string): Promise<CapturedEvidence[]> {
  const rows = await getDb()
    .select()
    .from(evidenceRecords)
    .where(eq(evidenceRecords.auditId, auditId))
    .orderBy(desc(evidenceRecords.retrievedAt));

  return rows.map((row) => ({
    id: row.id,
    source: row.sourceAdapter,
    resourceType: row.resourceType,
    summary: JSON.stringify(row.normalizedValue),
    observedAt: row.observationAt?.toISOString() ?? null,
    freshness: row.freshnessStatus ?? "UNKNOWN",
    limitations: (row.limitations as string[]) ?? [],
    value: row.normalizedValue,
  }));
}
