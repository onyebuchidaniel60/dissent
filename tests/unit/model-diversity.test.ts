import { describe, expect, it } from "vitest";

import { MODEL_ASSIGNMENTS, MODEL_POLICY, TEE_POLICY } from "../../src/lib/model-assignments";

describe("pinned model diversity", () => {
  const attackers = MODEL_ASSIGNMENTS.attackers;

  it("has the frozen eight attacker identities", () => {
    expect(attackers.map((attacker) => attacker.attacker_id)).toEqual([
      "A01",
      "A02",
      "A03",
      "A04",
      "A05",
      "A06",
      "A07",
      "A08",
    ]);
  });

  it("satisfies the family, vendor and open-weight gates", () => {
    const families = new Set(attackers.map((attacker) => attacker.model_family));
    const vendors = new Set(attackers.map((attacker) => attacker.provider));
    const openWeight = attackers.filter((attacker) => attacker.open_weight);

    expect(families.size).toBeGreaterThanOrEqual(MODEL_POLICY.minimum_distinct_model_families);
    expect(vendors.size).toBeGreaterThanOrEqual(MODEL_POLICY.minimum_distinct_inference_vendors);
    expect(openWeight.length).toBeGreaterThanOrEqual(MODEL_POLICY.minimum_open_weight_attackers);
  });

  it("pins a model for every attacker and records the TEE waiver", () => {
    for (const attacker of attackers) {
      expect(attacker.model_id.length).toBeGreaterThan(0);
      expect(attacker.requires_tee).toBe(false);
      expect(attacker.tee_status).toBe("WAIVED_BUDGET_CONSTRAINT");
    }
    expect(TEE_POLICY.verification_enabled).toBe(false);
    expect(TEE_POLICY.display_badge).toBe(false);
  });
});
