import "server-only";

import canonicalize from "canonicalize";
import { createHash } from "node:crypto";

export const CANONICALIZATION_VERSION = "RFC8785-v1";

export type ThesisPayload = {
  asset: { chain: string; asset_id: string; symbol: string | null };
  action: string;
  direction: string | null;
  rationale: string;
  position: { amount: string; unit: string; notional_usd: string | null };
  time_horizon: { value: number; unit: string };
  execution_venue: string | null;
};

export type ConditionPayload = {
  condition_id: string;
  description: string;
  metric: string;
  operator: string;
  threshold: string;
  unit: string;
  evaluation_window: { value: number; unit: string };
  severity: string;
};

export type NormalizedAudit = {
  thesis: ThesisPayload;
  conditions: ConditionPayload[];
};

export type AuditHashes = {
  thesisHash: string;
  conditionsHash: string;
  requestHash: string;
  thesisCanonical: string;
  conditionsCanonical: string;
  requestCanonical: string;
};

export function canonicalJson(value: unknown): string {
  const result = canonicalize(value);
  if (result === undefined) {
    throw new Error("Value cannot be canonicalized");
  }
  return result;
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function sha256Base64(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("base64");
}

export function normalizeThesis(input: {
  asset: { chain: string; asset_id: string; symbol?: string | null };
  action: string;
  direction?: string | null;
  rationale: string;
  position: { amount: string; unit: string; notional_usd?: string | null };
  time_horizon: { value: number; unit: string };
  execution_venue?: string | null;
}): ThesisPayload {
  return {
    asset: {
      chain: input.asset.chain.toLowerCase(),
      asset_id: input.asset.asset_id.trim(),
      symbol: input.asset.symbol?.trim() || null,
    },
    action: input.action,
    direction: input.direction ?? null,
    rationale: input.rationale.trim(),
    position: {
      amount: input.position.amount.trim(),
      unit: input.position.unit.trim(),
      notional_usd: input.position.notional_usd?.trim() || null,
    },
    time_horizon: {
      value: input.time_horizon.value,
      unit: input.time_horizon.unit,
    },
    execution_venue: input.execution_venue?.trim() || null,
  };
}

export function normalizeCondition(input: {
  condition_id: string;
  description: string;
  metric: string;
  operator: string;
  threshold: string;
  unit: string;
  evaluation_window?: { value: number; unit: string } | null;
  severity: string;
}): ConditionPayload {
  return {
    condition_id: input.condition_id.trim(),
    description: input.description.trim(),
    metric: input.metric.trim(),
    operator: input.operator,
    threshold: input.threshold.trim(),
    unit: input.unit.trim(),
    evaluation_window: {
      value: input.evaluation_window?.value ?? 1,
      unit: input.evaluation_window?.unit ?? "DAY",
    },
    severity: input.severity,
  };
}

export function computeAuditHashes(normalized: NormalizedAudit): AuditHashes {
  const thesisCanonical = canonicalJson(normalized.thesis);
  const conditionsCanonical = canonicalJson(normalized.conditions);
  const requestCanonical = canonicalJson(normalized);

  return {
    thesisHash: sha256Hex(thesisCanonical),
    conditionsHash: sha256Hex(conditionsCanonical),
    requestHash: sha256Hex(requestCanonical),
    thesisCanonical,
    conditionsCanonical,
    requestCanonical,
  };
}
