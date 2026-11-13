import assignments from "../../config/model_assignments.json";

export type AttackerAssignment = (typeof assignments.attackers)[number];

export const MODEL_ASSIGNMENTS = assignments;

export function getAttackerAssignment(attackerId: string): AttackerAssignment | undefined {
  return assignments.attackers.find((attacker) => attacker.attacker_id === attackerId);
}

export const MODEL_POLICY = assignments.policy;
export const TEE_POLICY = assignments.tee;
export const PROVIDER_CONFIG = assignments.providers;
