import "server-only";

import policy from "../../config/adjudication-policy-v1.0.json";
import { canonicalJson, sha256Hex } from "@/lib/canonical";

export const POLICY = policy;
export const POLICY_VERSION = policy.policy_id;
export const POLICY_HASH = sha256Hex(canonicalJson(policy));
export const AUDIT_FEE_YOCTO = BigInt(policy.audit_fee.amount_yocto);
export const BOUNTY_POOL_YOCTO = BigInt(policy.bounty.audit_pool_yocto);
export const QUOTE_EXPIRY_SECONDS = policy.audit_fee.quote_expiry_seconds;
export const DIVERGENCE_THRESHOLD = policy.divergence_threshold;

export type Severity = keyof typeof policy.severity_weights;
export type EvidenceFactorKey = keyof typeof policy.evidence_factors;
export type ReproducibilityFactorKey = keyof typeof policy.reproducibility_factors;
export type ConditionSeverity = keyof typeof policy.condition_criticality_weights;

export function severityWeight(severity: string): number {
  return policy.severity_weights[severity as Severity] ?? 0;
}

export function evidenceFactor(result: string): number {
  return policy.evidence_factors[result as EvidenceFactorKey] ?? 0;
}

export function reproducibilityFactor(result: string): number {
  return policy.reproducibility_factors[result as ReproducibilityFactorKey] ?? 0;
}

export function conditionWeight(severity: string): number {
  return policy.condition_criticality_weights[severity as ConditionSeverity] ?? 0;
}

export function sectionMultiplier(section: "A" | "B" | "INVALID_TEST"): number {
  return policy.section_multipliers[section];
}

/** Integer yoctoNEAR only; callers cap against the funded pool. */
export function bountyPoints(input: {
  severity: string;
  reproducibility: string;
  section: "A" | "B" | "INVALID_TEST";
}): number {
  return severityWeight(input.severity) * reproducibilityFactor(input.reproducibility) * sectionMultiplier(input.section);
}

export function rawBountyYocto(input: {
  severity: string;
  reproducibility: string;
  section: "A" | "B" | "INVALID_TEST";
}): bigint {
  const base = BigInt(policy.bounty.base_unit_yocto);
  const points = bountyPoints(input);
  // Points are quarter increments; multiply by 1000 and divide to keep integer math exact.
  return (base * BigInt(Math.round(points * 1000))) / 1000n;
}
